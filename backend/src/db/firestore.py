from google.cloud import firestore


def start_firestore_project_client(project):
    ds = firestore.Client(project=project)
    return ds


def get_document_by_collection_and_id(ds, collection_name, doc_id):
    collection = ds.collection(collection_name)
    doc_ref = collection.document(doc_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        raise ValueError(f"Document {doc_id} does not exist in {collection_name}")
