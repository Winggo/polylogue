import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from redis_listener import start_redis_client
from ai_models import create_chained_response


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins='*')

r_client, pubsub = start_redis_client(socketio)


client_subscriptions = {}

@socketio.on("connect")
def handle_connect():
    print(f"Client {request.sid} connected")


@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client {request.sid} disconnected")

    channels = client_subscriptions.pop(request.sid, [])
    for channel in channels:
        pubsub.unsubscribe(channel)


@socketio.on("subscribe")
def handle_redis_subscribe(channel):
    print(f"Client {request.sid} subscribed to {channel}")

    if request.sid not in client_subscriptions:
        client_subscriptions[request.sid] = []
    client_subscriptions[request.sid].append(channel)
    pubsub.subscribe(channel)


@socketio.on("unsubscribe")
def handle_redis_unsubscribe(channel):
    print(f"Client {request.sid} unsubscribed from {channel}")
    
    if request.sid in client_subscriptions and channel in client_subscriptions[request.sid]:
        client_subscriptions[request.sid].remove(channel)
        pubsub.unsubscribe(channel)


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
        if r_client.exists(f"node:{parent_node_id}"):
            prev_chat_response = r_client.hget(f"node:{parent_node_id}", "prompt_response").decode('utf-8')
            prev_chat_responses.append(f"Response {index+1}: {prev_chat_response}")

    try:
        prompt_response = create_chained_response(
            model=model,
            prev_chat_responses=prev_chat_responses,
            prompt=prompt,
        )

        r_client.hset(f"node:{node_id}", "model", model)
        r_client.hset(f"node:{node_id}", "prompt", prompt)
        r_client.hset(f"node:{node_id}", "prompt_response", prompt_response["text"])
        r_client.hset(f"node:{node_id}", "parent_ids", json.dumps(parent_node_ids))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"response": prompt_response["text"]})


if __name__ == "__main__":
    socketio.run(app, debug=True)
