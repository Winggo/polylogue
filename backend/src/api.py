import json
from flask import Blueprint, jsonify, request, current_app

from ai_models import create_chained_response


api_routes = Blueprint("api_routes", __name__)

@api_routes.route("/generate", methods=["POST"])
def generate():
    r = current_app.config['REDIS']

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