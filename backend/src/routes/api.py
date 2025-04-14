from flask import Blueprint, jsonify, request, current_app

from ai_models import (
    generate_prompt_question,
    generate_response_with_context,
)


api_routes = Blueprint("api_routes", __name__)


@api_routes.route("/v1/prompt", methods=["POST"])
def generate_prompt():
    """Generate a prompt, given context"""
    data = request.json

    try:
        prompt_question = generate_prompt_question(data.get("parentNodes", []))
    except Exception as e:
        return jsonify({"error": "Internal Server Error"}), 500
    
    return jsonify({"prompt": prompt_question}), 200


@api_routes.route("/v1/completion", methods=["POST"])
def generate():
    """Generate prompt response, given a prompt"""

    data = request.json
    model, prompt = data["model"], data["prompt"]
    for key in ["model", "prompt", "nodeId"]:
        if key not in data:
            return jsonify({"error": f"{key} is required"}), 400

    try:
        prompt_completion = generate_response_with_context(
            model=model,
            prompt=prompt,
            parent_nodes=data.get("parentNodes", []),
        )
    except ValueError as e:
        return jsonify({"error": "Input Error"}), 400
    except Exception as e:
        return jsonify({"error": "Internal Server Error"}), 500
    
    return jsonify({"response": prompt_completion}), 200


# @api_routes.route("/v1/chain-completion", methods=["POST"])
# def generate_chain():
#     """Given chain prompt responses, given a prompt"""
#     r = current_app.config['REDIS']

#     data = request.json
#     model, prompt, node_id = data["model"], data["prompt"], data["nodeId"]
#     for key in ["model", "prompt", "nodeId"]:
#         if key not in data:
#             return jsonify({"error": f"{key} is required"}), 400
    
#     try:
#         parent_node_ids = [parent["id"] for parent in data.get("parentNodes", [])]
#         chained_responses = generate_chained_responses(redis=r, cur_node={
#             "id": node_id,
#             "model": model,
#             "prompt": prompt,
#             "parent_ids": parent_node_ids,
#         })
        
#         pipe = r.pipeline()
#         for output_key, response in chained_responses.items():
#             if output_key.startswith("node-output-"):
#                 key = output_key.replace("node-output-", "node:")
#                 if key == f"node:{node_id}":
#                     pipe.hset(f"node:{node_id}", mapping={
#                         "model": model,
#                         "prompt": prompt,
#                         "parent_ids": json.dumps(parent_node_ids or []),
#                         "prompt_response": response,
#                     })
#                 else:
#                     pipe.hset(key, "prompt_response", response)
#         pipe.execute()

#     except ValueError as e:
#         return jsonify({"error": "Input Error"}), 400
#     except Exception as e:
#         return jsonify({"error": "Internal Server Error"}), 500

#     return jsonify({"response": chained_responses[f"node-output-{node_id}"]}), 200
