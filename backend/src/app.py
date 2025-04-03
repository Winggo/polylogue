from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from langchain_openai import OpenAI
from langchain_anthropic import AnthropicLLM
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins='*')

# Mock LLM Integration
def generate_response(model: str, prompt: str):
    if model == "chatgpt":
        llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    elif model == "claude":
        llm = AnthropicLLM(api_key=os.getenv("ANTHROPIC_API_KEY"))
    else:
        raise ValueError(f"Invalid model: {model}")
    return llm(prompt)


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json
    response = generate_response(data["model"], data["prompt"])
    return jsonify({"response": response})


@socketio.on("update_node")
def handle_update(data):
    emit("node_updated", data, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, debug=True)
