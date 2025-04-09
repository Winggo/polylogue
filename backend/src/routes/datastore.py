import datetime
from flask import Blueprint, jsonify, request, current_app
from db.firestore import (
    get_document_by_collection_and_id,
    save_document_in_collection,
    update_document_in_collection,
)
from routes.validation.validate import validate_json


ds_routes = Blueprint("ds_routes", __name__)


@ds_routes.route("/v1/canvases", methods=["POST"])
def canvases_operations():
    """
    Routes to read/write to canvases collection
    """
    db = current_app.config['FIRESTORE']

    @validate_json({
        'canvasId': str,
        'title': str,
        'description': str,
        'nodes': list[dict],
        'createdBy': str,
    })
    def save_canvas():
        """
        Save a canvas document to datastore
        Expect request.json to be in format:
        {
            canvasId: str,
            title: str,
            description?: str,
            nodes: Node[],
            createdBy?: str,
        }
        """
        data = request.json
        try:
            doc_id = save_document_in_collection(
                db,
                "canvases",
                {
                    "canvas_id": data["canvasId"],
                    "title": data["title"],
                    "description": data["description"],
                    "nodes": data["nodes"],
                    "created_by": data["createdBy"],
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                },
                doc_id=data["canvasId"]
            )
        except Exception as e:
            return jsonify({"error": "Internal Server Error"}), 500
        
        return jsonify({"id": doc_id}), 200


    if request.method == "POST":
        return save_canvas()
    else:
        return jsonify({"error": "Internal Server Error"}), 500


@ds_routes.route("/v1/canvases/<canvas_id>", methods=["GET", "PUT"])
def canvas_operations(canvas_id):
    """
    Routes to read/write to single canvas in collection
    """
    db = current_app.config['FIRESTORE']

    def get_canvas(id):
        """Get a canvas document from datastore"""
        try:
            canvas_doc = get_document_by_collection_and_id(db, "canvases", id)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": "Internal Server Error"}), 500
        
        return jsonify({"document": canvas_doc}), 200
    
    
    @validate_json({
        'title': str,
        'description': str,
        'nodes': list[dict],
    })
    def update_canvas(id):
        """
        Update a canvas document in datastore
        Expect request.json to be in format:
        {
            title: str,
            description?: str,
            nodes: Node[],
        }
        """
        data = request.json
        try:
            data["updated_at"] = datetime.now()
            doc_id = update_document_in_collection(db, "canvases", data, doc_id=id)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": "Internal Server Error"}), 500
        
        return jsonify({"id": doc_id}), 200
    

    if request.method == "GET":
        return get_canvas(canvas_id)
    elif request.method == "PUT":
        return update_canvas(canvas_id)
    else:
        return jsonify({"error": "Internal Server Error"}), 500
