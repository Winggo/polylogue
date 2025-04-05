import json
from flask import Blueprint, jsonify, request, current_app

from ai_models import generate_response_with_context


api_routes = Blueprint("api_routes", __name__)

@api_routes.route("/generate", methods=["POST"])
def generate():
    r = current_app.config['REDIS']

    data = request.json
    model, prompt, node_id = data["model"], data["prompt"], data["nodeId"]
    for key in ["model", "prompt", "nodeId"]:
        if key not in data:
            return jsonify({"error": f"{key} is required"}), 400

    try:
        parent_node_ids = [parent["id"] for parent in data.get("parentNodes", [])]
        prompt_response = generate_response_with_context(
            model=model,
            prompt=prompt,
            redis=r,
            parent_node_ids=parent_node_ids
        )

        r.hset(f"node:{node_id}", mapping={
            "model": model,
            "prompt": prompt,
            "prompt_response": prompt_response["text"],
            "parent_ids": json.dumps(parent_node_ids or []),
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"response": prompt_response["text"]})