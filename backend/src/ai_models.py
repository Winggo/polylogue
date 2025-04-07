import json
import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain


gpt_4o_model = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    model="gpt-4o",
)
claude_sonnet_model = ChatAnthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    model="claude-3-5-sonnet-20240620",
)


context_prompt_question_template = PromptTemplate(
    input_variables=["context"],
    template="""Given the following context, generate a thoughtful follow up question intended to trigger the user's curisoity.
If there is no context provided, generate a question users may be curious to know the answer to.
Keep this question no longer than 8 non-very long words. Always end with a question mark.
*Context:*
{context}"""
)


context_prompt_template = PromptTemplate(
    input_variables=["context", "prompt"],
    template="""Given the following context and prompt, reply thoughtfully in less than 120 words.
There may be no context provided. Do not mention the response name or the context name in your response.
*Context:*
{context}

----------------------------------------------------------------------------
*Prompt:*
{prompt}"""
)


def get_parent_responses(redis, parent_node_ids=None, parent_nodes=None) -> list:
    parent_node_ids, parent_nodes = parent_node_ids or [], parent_nodes or []
    if not parent_node_ids and parent_nodes:
        parent_node_ids = [parent["id"] for parent in parent_nodes]
    prev_chat_responses = []
    for index, node_id in enumerate(parent_node_ids):
        if redis.exists(f"node:{node_id}"):
            prompt_response = redis.hget(f"node:{node_id}", "prompt_response").decode('utf-8')
            prev_chat_responses.append(f"Response {index+1}: {prompt_response}")
    return prev_chat_responses


def generate_prompt_question(redis, parent_nodes):
    """Generate a prompt suggestion"""
    parent_responses = get_parent_responses(redis, parent_nodes=parent_nodes)
    context = "\n\n".join(parent_responses)

    chain = LLMChain(llm=gpt_4o_model, prompt=context_prompt_question_template)
    prompt_question = chain.invoke({ "context": context })
    
    return prompt_question


def generate_response_with_context(
        model: str,
        prompt: str,
        redis,
        parent_node_ids: list,
):
    parent_responses = get_parent_responses(redis, parent_node_ids)
    context = "\n\n".join(parent_responses)

    if model == "gpt-4o":
        llm = gpt_4o_model
    elif model == "claude-sonnet":
        llm = claude_sonnet_model
    else:
        raise ValueError(f"Unsupported model type: {model}")

    chain = LLMChain(llm=llm, prompt=context_prompt_template)

    response_with_context = chain.invoke({
        "context": context,
        "prompt": prompt
    })
        
    return response_with_context


def get_ancestor_nodes(redis, node_id) -> list:
    """Get all ancestor nodes for a given node_id, including the node itself"""
    def get_parent_nodes(node_id)->None:
        if node_id in visited_node_ids or not redis.exists(f"node:{node_id}"):
            return
        visited_node_ids.add(node_id)
        cur_node = redis.hgetall(f"node:{node_id}")
        decoded_cur_node = {
            k.decode('utf-8') : v.decode('utf-8')
            for k, v in cur_node.items()
            if k.decode('utf-8') in {"model", "prompt", "parent_ids"}
        }
        decoded_cur_node["id"] = node_id
        decoded_cur_node["parent_ids"] = json.loads(decoded_cur_node["parent_ids"])
        for parent_id in decoded_cur_node["parent_ids"]:
            get_parent_nodes(parent_id)
        # append node after so that root node is always first
        ancestor_nodes.append(decoded_cur_node)

    visited_node_ids = set()
    ancestor_nodes = []
    get_parent_nodes(node_id)
    ancestor_nodes.pop()
    return ancestor_nodes
    

def generate_chained_responses(redis, cur_node):
    ancestor_nodes = get_ancestor_nodes(redis, cur_node["id"])
    ancestor_nodes.append(cur_node)

    chains = []
    inputs_per_chain = {}
    output_keys = []
    for node in ancestor_nodes:
        if node["model"] == "claude-sonnet":
            llm = claude_sonnet_model
        else:
            llm = gpt_4o_model

        prompt_input_key = f"node-input-prompt-{node['id']}"
        output_key = f"node-output-{node['id']}"
        parent_outputs = [f"node-output-{parent_id}" for parent_id in node['parent_ids']]

        template = """Given the past dialog and prompt, reply thoughtfully in less than 120 words.
There may be multiple or no past conversations.
*Past Conversations:*\n"""
        for parent_output in parent_outputs:
            template += "Conversation: {" + parent_output + "}\n\n"
        template += """----------------------------------------------------------------------------
*Prompt:*\n""" + "{" + prompt_input_key + "}"

        prompt_template = PromptTemplate(
            input_variables=parent_outputs + [prompt_input_key],
            template=template,
        )
        chains.append(
            LLMChain(
                llm=llm,
                prompt=prompt_template,
                output_key=output_key
            )
        )
        inputs_per_chain[prompt_input_key] = node["prompt"]
        output_keys.append(output_key)

    print(f"Chain Prompt Input Values: {inputs_per_chain}")
    for chain in chains:
        print(f"Chain Prompt Input Names: {chain.prompt.input_variables}")
        print(f"Chain Prompt Template: {chain.prompt.template}")
        print(f"Chain Output Key: {chain.output_key}\n")
    
    sequential_chain = SequentialChain(
        chains=chains,
        input_variables=list(inputs_per_chain.keys()),
        output_variables=output_keys,
    )
    chained_result = sequential_chain.invoke(inputs_per_chain)

    return chained_result
