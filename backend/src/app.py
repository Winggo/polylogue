import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import redis
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins='*')

r = redis.Redis(host='localhost', port=6379, db=0)
def check_redis_connection():
    try:
        r.ping()
        return True
    except redis.ConnectionError as err:
        raise Exception(f"Failed to connect to Redis: {err}")
    

# Initialize LLMs
chatgpt_model = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    model="gpt-4o",
)
claude_model = ChatAnthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    model="claude-3-5-sonnet-20240620",
)

prompt_template = PromptTemplate(
    input_variables=["context", "prompt"],
    template="""Given the following dialog context and prompt, please provide a response in less than 120 words.
    *Context:*
    {context}

    ----------------------------------------------------------------------------
    *Prompt:*
    {prompt}"""
)

claude_chain = LLMChain(llm=claude_model, prompt=prompt_template)
chatgpt_chain = LLMChain(llm=chatgpt_model, prompt=prompt_template)

def create_chained_response(
        model: str,
        prev_chat_responses: list,
        prompt: str,
) -> str:
    context = "\n\n".join(prev_chat_responses)

    if model == "chatgpt":
        chained_response = chatgpt_chain.invoke({
            "context": context,
            "prompt": prompt
        })
    elif model == "claude":
        chained_response = claude_chain.invoke({
            "context": context,
            "prompt": prompt
        })
    else:
        raise ValueError(f"Unsupported model type: {model}")
        
    return chained_response


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json
    model, prompt, node_id = data["model"], data["prompt"], data["nodeId"]
    for key in ["model", "prompt", "nodeId"]:
        if key not in data:
            return jsonify({"error": f"{key} is required"}), 400
        
    prev_chat_responses = []
    parent_node_ids = [node["id"] for node in data.get("parentNodes", [])]
    for index, parent_node_id in enumerate(parent_node_ids):
        if r.exists(f"node:{parent_node_id}"):
            prev_chat_response = r.hget(f"node:{parent_node_id}", "prompt_response").decode('utf-8')
            prev_chat_responses.append(f"Response {index+1}: {prev_chat_response}")

    
    try:
        prompt_response = create_chained_response(
            model=model,
            prev_chat_responses=prev_chat_responses,
            prompt=prompt,
        )

        r.hset(f"node:{node_id}", "model", model)
        r.hset(f"node:{node_id}", "prompt", prompt)
        r.hset(f"node:{node_id}", "prompt_response", prompt_response["text"])
        r.hset(f"node:{node_id}", "parent_ids", json.dumps(parent_node_ids))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"response": prompt_response["text"]})


@socketio.on("update_node")
def handle_update(data):
    emit("node_updated", data, broadcast=True)


if __name__ == "__main__":
    check_redis_connection()
    socketio.run(app, debug=True)
