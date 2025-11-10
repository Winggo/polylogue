# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Polylogue is a Figma-like canvas editor for visualizing and engaging in branching conversations across multiple LLMs. Each prompt and completion is represented as a node on an infinite canvas, with support for creating conversation trees where different models can respond to the same prompts.

**Tech Stack:**
- Frontend: Next.js 15 with React 19, TypeScript, Tailwind CSS, @xyflow/react for canvas
- Backend: Flask with LangChain, Flask-SocketIO for WebSockets
- Storage: Google Firestore for persistence, Redis for real-time features (optional)
- AI Providers: Together.ai (Qwen, Mixtral, Llama), OpenAI (GPT-4o), Anthropic (Claude)
- Deployment: Google App Engine

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
yarn dev              # Start development server (uses Turbopack)
yarn build           # Production build
yarn start           # Start production server
yarn lint            # Run ESLint
```

The frontend dev server runs on http://localhost:3000

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt   # Install dependencies

# Set up environment
# Create .env.local with required variables (see Deployment section)

# Run development server
python -m src.app    # Runs Flask with SocketIO support
```

Environment files:
- `.env.local` for local development
- `.env.production` for production
- Set `FLASK_ENV=local` or `FLASK_ENV=production`

## Architecture

### Frontend Architecture

**Component Structure:**
- `src/app/canvas/` - Main canvas route and page
- `src/components/Flow/Flow.tsx` - Core canvas component using ReactFlow
- `src/components/LLMNode/LLMNode.tsx` - Individual conversation node component

**State Management:**
- ReactFlow manages node and edge state via `useNodesState` and `useEdgesState`
- Node data includes: model, prompt, prompt_response, parent_ids, canvasId
- Each node is assigned a unique ID via nanoid(10)

**Node Lifecycle:**
1. Nodes are created via `createNewLlmTextNode()` with position and data
2. On creation, nodes fetch a prompt suggestion from `/api/v1/prompt`
3. User enters prompt and selects model (Qwen 2.5 7B is default)
4. Submission sends to `/api/v1/completion` with model, prompt, nodeId, parentNodes
5. Response is displayed, new child node is auto-created to the right
6. Edges connect parent nodes to child nodes automatically

**Canvas Persistence:**
- Save operation posts to `/ds/v1/canvases` with canvasId, title, and nodes array
- Load operation fetches from `/ds/v1/canvases/<canvas_id>`
- Nodes are transformed between array format (frontend) and map format (Firestore)

**Keyboard Shortcuts:**
- `Cmd/Ctrl + '` - Create new node at cursor position
- `Cmd/Ctrl + \` - Fit view to show all nodes
- `Enter` - Submit prompt in selected node
- `Tab` - Accept suggested prompt placeholder

### Backend Architecture

**Flask App Structure (`src/app.py`):**
- Environment-based config loading (.env.local, .env.production)
- CORS configuration for frontend origin
- SocketIO with WebSocket transport
- Optional Redis client and pub/sub (controlled by env vars)
- Three blueprint routes: `/api`, `/ds`, `/sockets`

**Route Blueprints:**

1. **API Routes (`src/routes/api.py`):**
   - `POST /api/v1/prompt` - Generate prompt suggestion using Qwen 2.5 7B
   - `POST /api/v1/completion` - Generate LLM completion with parent context
   - Commented chain-completion endpoint for future Redis-based chaining

2. **Datastore Routes (`src/routes/datastore.py`):**
   - `POST /ds/v1/canvases` - Save canvas with nodes
   - `GET /ds/v1/canvases/<canvas_id>` - Fetch canvas by ID
   - `PUT /ds/v1/canvases/<canvas_id>` - Update canvas
   - Transforms nodes between array (API) and map (Firestore) formats

3. **Socket Routes (`src/routes/sockets.py`):**
   - `connect` - Handle client connection
   - `disconnect` - Clean up subscriptions
   - `subscribe` - Subscribe to Redis channel
   - `unsubscribe` - Unsubscribe from Redis channel
   - Tracks client subscriptions in memory

**AI Model Integration (`src/ai_models.py`):**

Available models via `get_model(model_name)`:
- `qwen-2.5-7b` - Together.ai (default, free)
- `mixtral-8x7b` - Together.ai
- `llama-3.3-70b` - Together.ai
- `gpt-4o` - OpenAI (requires API key)
- `claude-sonnet` - Anthropic Claude 3.5 (requires API key)

**Context Handling:**
- `get_parent_responses()` - Extracts responses from parent nodes
- `generate_response_with_context()` - Uses context_prompt_template to include parent responses
- Context is formatted as "Response 1: ..., Response 2: ..." and injected into prompt
- Responses limited to <150 words via prompt template

**Advanced Features (Partially Implemented):**
- `generate_chained_responses()` - Generates responses for entire ancestor chain using RunnableLambda
- `get_ancestor_nodes()` - Traverses parent_ids to build full conversation tree
- Currently used for experimental chain-completion endpoint

**Firestore Integration (`src/db/firestore.py`):**
- `start_firestore_project_client()` - Initialize Firestore client
- `get_document_by_collection_and_id()` - Fetch document
- `save_document_in_collection()` - Create/update document
- `update_document_in_collection()` - Update specific fields

**Redis Integration (`src/redis_listener.py`):**
- Optional feature enabled via `ENABLE_REDIS=true`
- Pub/sub for real-time collaboration (planned feature)
- Client subscriptions tracked per WebSocket session

### Data Flow

**Creating a completion:**
1. Frontend: User types prompt in LLMNode, selects model
2. Frontend: On Enter, calls `POST /api/v1/completion` with:
   - model, prompt, nodeId, parentNodes (with their prompt_response)
3. Backend: `generate_response_with_context()` extracts parent responses
4. Backend: Formats context_prompt_template with context and prompt
5. Backend: Invokes LangChain model (e.g., ChatTogether, ChatOpenAI)
6. Backend: Returns response JSON
7. Frontend: Updates node with prompt_response, auto-creates next node

**Saving a canvas:**
1. Frontend: Calls `POST /ds/v1/canvases` with canvasId, title, nodes array
2. Backend: Transforms nodes array to map (keyed by node.id)
3. Backend: Saves to Firestore with timestamps
4. Frontend: Shows save modal with shareable link

**Loading a canvas:**
1. Frontend: Routes to `/canvas/<canvas_id>`
2. Frontend: Calls `GET /ds/v1/canvases/<canvas_id>`
3. Backend: Fetches from Firestore, transforms nodes map to array
4. Frontend: Creates edges from parent_ids, initializes ReactFlow

## Deployment

This app deploys to Google App Engine with separate frontend and backend services.

**Environment Variables Required:**

Backend (`backend/app.yaml`):
- `GCP_PROJECT` - Google Cloud project ID
- `CORS_ORIGIN` - Frontend URL for CORS
- `TOGETHER_API_KEY` - Together.ai API key (required)
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `ENABLE_REDIS` - Set to "true" to enable Redis
- `ENABLE_REDIS_PUBSUB` - Set to "true" to enable pub/sub

Frontend (`frontend/app.yaml`):
- `NEXT_PUBLIC_BACKEND_ROOT_URL` - Backend URL (also set during build)

**Deployment Order:**
1. Deploy backend first: `cd backend && gcloud app deploy`
2. Build frontend with backend URL: `NEXT_PUBLIC_BACKEND_ROOT_URL=<backend_url> yarn build`
3. Deploy frontend: `cd frontend && gcloud app deploy`

**Debugging:**
- Backend logs: `gcloud app logs tail -s backend`
- Frontend logs: `gcloud app logs tail -s frontend`

## Code Patterns

**Adding a new LLM model:**
1. Add model instance in `backend/src/ai_models.py` (e.g., using ChatTogether, ChatOpenAI)
2. Add case to `get_model()` function
3. Add to models array in `frontend/src/components/LLMNode/LLMNode.tsx`
4. Add to modelMapping object
5. Set `apiKeyRequired: true` if API key needed

**Modifying prompt templates:**
- Edit `context_prompt_template` for completion prompt format
- Edit `context_prompt_question_template` for suggestion prompt format
- Templates use LangChain PromptTemplate with input_variables

**Node data structure:**
```typescript
{
  id: string (nanoid),
  type: 'llmText',
  position: { x: number, y: number },
  data: {
    model: string,
    prompt: string,
    prompt_response: string,
    parent_ids: string[],
    canvasId: string,
    setNode: function,
    createNextNode: function,
  },
  selected: boolean,
  measured: { width: 650, height: 700 },
  origin: [number, number]
}
```

**API request/response formats:**

Generate prompt:
```json
POST /api/v1/prompt
{ "parentNodes": [{ "data": { "prompt_response": "..." } }] }
→ { "prompt": "suggested question?" }
```

Generate completion:
```json
POST /api/v1/completion
{
  "model": "qwen-2.5-7b",
  "prompt": "user prompt",
  "nodeId": "abc123",
  "parentNodes": [{ "id": "xyz", "data": { "prompt_response": "..." } }]
}
→ { "response": "AI generated response" }
```
