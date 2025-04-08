from flask import Blueprint, jsonify, request, current_app
from db.firestore import get_document_by_collection_and_id


ds_routes = Blueprint("ds_routes", __name__)


@ds_routes.route("/v1/canvases/<canvas_id>", methods=["GET"])
def get_canvas(canvas_id):
    """Get a canvas document from datastore"""
    fs = current_app.config['FIRESTORE']

    try:
        canvas_doc = get_document_by_collection_and_id(fs, "canvases", canvas_id)
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal Server Error"}), 500
    
    return jsonify({"document": canvas_doc}), 200
