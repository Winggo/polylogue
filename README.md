# Polylogue 💬
_discussion or speech involving multiple participants, through multiple forms of communication_

A figma-like canvas editor to visualize and engage in branching conversations across various LLMs.
Each prompt & completion is represented as a node, and different models can be selected for each node.

![Initial view](assets/preview.png)

## Goals
- Enable multimodal capabilities such as images
- Enable real-time collaborative editing

## Backlog
- Allow resizing nodes
- Explore templating conversations for different use cases

## Stack
- Next.js & tailwind
- Flask
- Redis
- Firestore
- Langchain
- Together.ai
- GCP

## Deployment
This app is deployed using Google App Engine.
Deploy backend first.
1. Configure `backend/app.yaml` and add any required env variables. Reference `backend/app.example.yaml`.
2. Run `gcloud app deploy` in `backend/`.
    - Run `gcloud app logs tail -s backend` to debug issues.

Deploy frontend second.
1. Configure `frontend/app.yaml` and add any required env variables. Reference `frontend/app.example.yaml`.
2. Run `NEXT_PUBLIC_BACKEND_ROOT_URL=<APP_ENGINE_BACKEND_URL> yarn build`.
3. Run `gcloud app deploy` in `frontend/`.
    - Run `gcloud app logs tail -s frontend` to debug issues.
