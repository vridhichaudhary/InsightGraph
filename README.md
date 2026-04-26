# InsightGraph

InsightGraph is a production-grade Technical Intelligence Dashboard that leverages a Multi-Agent RAG (Retrieval-Augmented Generation) pipeline to research, analyze, and visualize complex technical data. Powered by Google Gemini 1.5 Flash and LangGraph, it autonomously decomposes queries, retrieves relevant documentation, executes sandboxed code for data extraction, and generates interactive charts.

## Core Features

- **Agentic RAG Pipeline**: Uses a four-agent state machine (Supervisor, Researcher, Analyst, Visualizer) to handle complex research tasks.
- **Document Ingestion**: Supports uploading and indexing `.txt`, `.md`, `.pdf`, and `.csv` files into a ChromaDB vector store.
- **Sandboxed Analysis**: The Analyst agent writes and executes Python code in a restricted environment to extract structured data from unstructured research.
- **Real-time Thought Stream**: Monitor the agents' step-by-step progress through a live SSE (Server-Sent Events) sidebar.
- **Interactive Visualizations**: Dynamic bar and line charts built with Recharts, featuring confidence scoring and source attribution.
- **Human-in-the-Loop**: Pipeline pauses after data extraction for user approval before generating the final visualization.
- **CSV Export**: Download the raw structured data extracted by the Analyst for external use.

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS 4, Framer Motion, Recharts.
- **Backend**: FastAPI, LangGraph, LangChain, sse-starlette.
- **AI/ML**: Google Gemini 1.5 Flash, Google Generative AI Embeddings.
- **Database**: ChromaDB (Vector Store).

## Multi-Agent Architecture

1. **Supervisor**: Decomposes the user query into specific research subtasks.
2. **Researcher**: Queries the ChromaDB vector store for relevant document chunks.
3. **Analyst**: Writes Python code to extract numeric data from the research findings. Executes code in a restricted sandbox.
4. **Visualizer**: Transforms the structured data into a valid JSON schema for Recharts.

## Setup Instructions

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in a `.env` file:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` | Required for AI agents and embeddings. |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | The URL of your running backend. |

## Deployment

- **Backend**: Deployed on Render using the `uvicorn main:app --host 0.0.0.0 --port $PORT` command.
- **Frontend**: Deployed on Vercel, pointing to the Render backend via `NEXT_PUBLIC_API_URL`.

## License

This project is licensed under the MIT License.