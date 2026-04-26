# InsightGraph 🔍📊

**Technical Intelligence Dashboard** — Ask any technical question and get AI-generated, interactive data visualizations powered by **Google Gemini 1.5 Flash**.

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Backend  | FastAPI, Pydantic                  |
| LLM      | Google Gemini 1.5 Flash            |

---

## Folder Structure

```
InsightGraph/
├── backend/
│   ├── main.py
│   ├── routes/query.py
│   ├── services/
│   │   ├── llm_service.py     ← Gemini API + fallback
│   │   └── mock_service.py    ← Hardcoded demo data
│   ├── models/schemas.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── QueryInput.tsx
│   │   ├── ChartDisplay.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ErrorCard.tsx
│   ├── lib/api.ts
│   └── .env.local.example
└── .gitignore
```

---

## Setup

### 1. Clone & Enter Repo

```bash
git clone <your-repo-url>
cd InsightGraph
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — mock fallback works without it)

# Start server
uvicorn main:app --reload --port 8000
```

Backend will be live at **http://localhost:8000**
Swagger docs at **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000 (default, no changes needed)

# Start dev server
npm run dev
```

Frontend will be live at **http://localhost:3000**

---

## API

### `POST /query`

**Request:**
```json
{ "query": "Compare Llama 3 vs GPT-4o" }
```

**Response:**
```json
{
  "chartType": "bar",
  "title": "Llama 3 vs GPT-4o — Benchmark Comparison",
  "labels": ["MMLU", "HumanEval", "GSM8K", "HellaSwag"],
  "datasets": [
    { "name": "Llama 3 (70B)", "data": [82, 81.7, 93, 88], "color": "#38BDF8" },
    { "name": "GPT-4o",        "data": [88.7, 90.2, 97.1, 95.3], "color": "#818CF8" }
  ]
}
```

---

## Example Queries

| Query | Chart Type |
|---|---|
| Compare Llama 3 vs GPT-4o benchmarks | Bar |
| Python GitHub stars trend 2019–2024 | Line |
| React vs Vue vs Svelte popularity | Bar |
| AI model parameter growth over time | Line |

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key (optional) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend URL (default: `http://localhost:8000`) |