from google.cloud import firestore


def start_firestore_project_client(project):
    db = firestore.Client(project=project)
    return db


def get_document_by_collection_and_id(db, collection_name, doc_id):
    collection = db.collection(collection_name)
    doc_ref = collection.document(doc_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    else:
        raise ValueError(f"Document {doc_id} does not exist in {collection_name}")


def save_document_in_collection(db, collection_name, document, doc_id=None):
    collection = db.collection(collection_name)
    
    if doc_id:
        doc_ref = collection.document(doc_id)
        doc_ref.set(document)
        return doc_id
    else:
        doc_ref = collection.add(document)[0]
        return doc_ref.id


def update_document_in_collection(db, collection_name, document, doc_id):
    collection = db.collection(collection_name)
    
    try:
        doc_ref = collection.document(doc_id)
        doc_ref.update(document)
        return doc_id
    except:
        raise ValueError(f"Document {doc_id} does not exist in {collection_name}")
