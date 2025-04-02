from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from langchain_openai import OpenAI
from langchain_anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}}, 
     supports_credentials=True,
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "OPTIONS"])
socketio = SocketIO(app, cors_allowed_origins='*')

# Mock LLM Integration
def generate_response(model: str, prompt: str):
    if model == "chatgpt":
        llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    elif model == "claude":
        llm = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
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
