import json
import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda
from functools import partial


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
Keep this question no longer than 10 non-very long words. Always end with a question mark.
*Context:*
{context}"""
)


context_prompt_template = PromptTemplate(
    input_variables=["context", "prompt"],
    template="""Given the following context and prompt, reply thoughtfully in less than 180 words.
There may be no context provided. Do not mention the response name or the context name in your response.
For better readability, divide your response into paragraphs, use bullet points or numbered lists, and use markdown where appropriate.
Add newlines between each bullet point. Try ending the response with a question to encourage discussion.
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

    chain = context_prompt_question_template | gpt_4o_model
    prompt_question = chain.invoke({ "context": context })
    
    return prompt_question.content if hasattr(prompt_question, 'content') else str(prompt_question)


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

    chain = context_prompt_template | llm

    response_with_context = chain.invoke({
        "context": context,
        "prompt": prompt
    })
        
    return response_with_context.content if hasattr(response_with_context, 'content') else str(response_with_context)


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

    initial_inputs = {}
    output_keys = []

    node_operations = []
    for node in ancestor_nodes:
        if node["model"] == "claude-sonnet":
            llm = claude_sonnet_model
        else:
            llm = gpt_4o_model

        prompt_input_key = f"node-input-prompt-{node['id']}"
        output_key = f"node-output-{node['id']}"
        parent_outputs = [f"node-output-{parent_id}" for parent_id in node['parent_ids']]

        initial_inputs[prompt_input_key] = node["prompt"]
        output_keys.append(output_key)

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

        def process_node(inputs, node_llm, node_prompt_template, node_output_key):
            # Gather all required inputs
            prompt_input = inputs[node_prompt_template.input_variables[-1]]  # Last variable is the prompt
            parent_outputs = {
                k: inputs[k] 
                for k in node_prompt_template.input_variables 
                if k != node_prompt_template.input_variables[-1]
            }
            
            # Format the prompt
            formatted_prompt = node_prompt_template.format(
                **parent_outputs,
                **{node_prompt_template.input_variables[-1]: prompt_input}
            )
            
            # Get LLM response
            result = node_llm.invoke(formatted_prompt)
            
            # Return the output with our key
            return {node_output_key: result}
        
        node_operation = RunnableLambda(
            partial(
                process_node,
                node_llm=llm,
                node_prompt_template=prompt_template,
                node_output_key=output_key
            )
        )
        node_operations.append(node_operation)
        

    print(f"Chain Prompt Input Values: {initial_inputs}")

    current_result = initial_inputs
    for operation in node_operations:
        current_result.update(operation.invoke(current_result))

    return {k: current_result[k] for k in output_keys}
