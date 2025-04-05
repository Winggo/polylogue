import json
import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


gpt_4o_model = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    model="gpt-4o",
)
claude_sonnet_model = ChatAnthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    model="claude-3-5-sonnet-20240620",
)


context_prompt_template = PromptTemplate(
    input_variables=["context", "prompt"],
    template="""Given the following context and prompt, please provide a response in less than 120 words.
    Do not mention the response name or the context name in your response.
    *Context:*
    {context}

    ----------------------------------------------------------------------------
    *Prompt:*
    {prompt}"""
)


def get_parent_responses(redis, parent_node_ids) -> list:
    prev_chat_responses = []
    for index, node_id in enumerate(parent_node_ids):
        if redis.exists(f"node:{node_id}"):
            prompt_response = redis.hget(f"node:{node_id}", "prompt_response").decode('utf-8')
            prev_chat_responses.append(f"Response {index+1}: {prompt_response}")
    return prev_chat_responses


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


def generate_chained_responses():
    pass
