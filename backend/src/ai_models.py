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


prompt_template = PromptTemplate(
    input_variables=["context", "prompt"],
    template="""Given the following context and prompt, please provide a response in less than 120 words.
    Do not mention the response name or the context name in your response.
    *Context:*
    {context}

    ----------------------------------------------------------------------------
    *Prompt:*
    {prompt}"""
)


gpt_4o_chain = LLMChain(llm=gpt_4o_model, prompt=prompt_template)
sonnet_chain = LLMChain(llm=claude_sonnet_model, prompt=prompt_template)


def create_chained_response(
        model: str,
        prev_chat_responses: list,
        prompt: str,
) -> str:
    context = "\n\n".join(prev_chat_responses)

    if model == "gpt-4o":
        chained_response = gpt_4o_chain.invoke({
            "context": context,
            "prompt": prompt
        })
    elif model == "claude-sonnet":
        chained_response = sonnet_chain.invoke({
            "context": context,
            "prompt": prompt
        })
    else:
        raise ValueError(f"Unsupported model type: {model}")
        
    return chained_response
