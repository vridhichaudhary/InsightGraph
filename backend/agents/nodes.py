"""
Agent nodes for InsightGraph LangGraph pipeline.

FIXES:
  - BUG 4: exec() now uses a restricted builtins dict — only safe builtins allowed.
            pandas and json still work via __import__ being permitted.
  - BUG 7: retry_count now only increments on FAILURE, not on success.
            On success, we leave retry_count unchanged so confidence is accurate.
  - BUG 5: raw_data field removed from node returns — it is handled by session_store only.
  - FEATURE: Researcher has a fallback message when no ChromaDB docs are found,
             making it clear the system is working with no indexed data.
"""

import os
import json
import logging
import traceback
import contextlib
import io
import signal
import ast
import re
from google import genai
from google.genai import types

from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from agents.state import InsightState

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

# Safe builtins for exec sandbox — allows imports and basic operations
SAFE_BUILTINS = {
    "__import__": __import__,
    "print": print,
    "len": len,
    "range": range,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "sorted": sorted,
    "list": list,
    "dict": dict,
    "set": set,
    "tuple": tuple,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "round": round,
    "sum": sum,
    "min": min,
    "max": max,
    "abs": abs,
    "isinstance": isinstance,
    "type": type,
    "repr": repr,
    "Exception": Exception,
    "ValueError": ValueError,
    "KeyError": KeyError,
    "IndexError": IndexError,
}


def invoke_gemini(system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=GEMINI_API_KEY)

    config_args = {
        "system_instruction": system_prompt,
        "temperature": 0.2,
    }
    if json_mode:
        config_args["response_mime_type"] = "application/json"

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(**config_args)
    )
    return response.text


def strip_code_fences(text: str) -> str:
    """Remove markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()
    if text.startswith("json"):
        text = text[4:].strip()
    if text.startswith("python"):
        text = text[6:].strip()
    return text


# ── Node 1: Supervisor ─────────────────────────────────────────────────────────
def supervisor_node(state: InsightState) -> InsightState:
    logger.info("Running Supervisor...")
    query = state["query"]

    system_prompt = """You are a Supervisor agent for a technical research system.
Your job is to break down the user's technical query into 3-5 focused research subtasks.
Each subtask should target a specific measurable data point (benchmark score, metric, date range, etc.).
Return ONLY a valid JSON array of strings. No markdown, no explanation."""

    user_prompt = f"Query: {query}"

    try:
        response_text = invoke_gemini(system_prompt, user_prompt, json_mode=True)
        response_text = strip_code_fences(response_text)
        subtasks = json.loads(response_text)
        if not isinstance(subtasks, list):
            subtasks = [query]
        logger.info(f"Supervisor generated {len(subtasks)} subtasks: {subtasks}")
    except Exception as e:
        logger.error(f"Supervisor error: {e}")
        subtasks = [query]

    return {"subtasks": subtasks}


# ── Node 2: Researcher ─────────────────────────────────────────────────────────
def researcher_node(state: InsightState) -> InsightState:
    logger.info("Running Researcher...")
    subtasks = state.get("subtasks", [state["query"]])
    query = state["query"]

    docs = []
    sources = set()
    chroma_available = os.path.exists(CHROMA_DIR) and bool(GEMINI_API_KEY)

    # Primary: ChromaDB vector search
    if chroma_available:
        try:
            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=GEMINI_API_KEY
            )
            vectorstore = Chroma(
                persist_directory=CHROMA_DIR,
                embedding_function=embeddings
            )

            search_queries = [query] + subtasks
            for sq in search_queries[:3]:
                results = vectorstore.similarity_search(sq, k=3)
                for doc in results:
                    source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
                    sources.add(source_name)
                    entry = f"--- Source: {source_name} ---\n{doc.page_content}"
                    if entry not in docs:  # deduplicate properly
                        docs.append(entry)

            logger.info(f"ChromaDB returned {len(docs)} unique chunks from {len(sources)} source(s).")

        except Exception as e:
            logger.error(f"ChromaDB search error: {e}")

    # Fallback notice if no documents found
    if not docs:
        logger.warning("No documents retrieved from ChromaDB. Analyst will rely on LLM knowledge only.")
        # Add a synthetic context note so the analyst knows what happened
        docs = [
            f"--- Note: No indexed documents found for this query. ---\n"
            f"The system has no uploaded documents in its knowledge base for: '{query}'. "
            f"The Analyst agent will attempt to generate data from its internal knowledge. "
            f"Confidence will be lower. To improve results, upload relevant .txt, .pdf, or .csv files."
        ]

    return {
        "retrieved_docs": docs,
        "sources": list(sources),
    }


# ── Node 3: Analyst ────────────────────────────────────────────────────────────
def analyst_node(state: InsightState) -> InsightState:
    logger.info("Running Analyst...")
    query = state["query"]
    docs = "\n\n".join(state.get("retrieved_docs", []))
    # FIX BUG 7: Don't increment on success — only on failure paths.
    # We read current retry_count but do NOT increment it here on success.
    retry_count = state.get("retry_count", 0)
    prev_error = state.get("error", "")

    system_prompt = """You are an expert Python Data Analyst.
Write a single Python script that:
1. Extracts numeric data from the provided context documents.
2. Structures it as a Python dictionary (e.g. {"GPT-4o": 88.7, "Llama 3": 82.0}).
3. Calls print() exactly ONCE with the dictionary as the final line.

Rules:
- Use only: json, re, and basic Python built-ins (no pandas, no matplotlib).
- Do NOT use markdown fences or comments.
- The printed value MUST be a valid Python dictionary literal.
- If data cannot be extracted, print an empty dict: {}

Output ONLY the executable Python code. Nothing else."""

    user_prompt = f"Context Documents:\n{docs}\n\nQuery: {query}"
    if prev_error:
        user_prompt += f"\n\nPREVIOUS ATTEMPT FAILED — Fix this error:\n{prev_error}"

    try:
        code = invoke_gemini(system_prompt, user_prompt, json_mode=False)
        code = strip_code_fences(code)

        # Execute in restricted sandbox
        # We pre-import json and re for the analyst to ensure they are available
        import json
        import re
        sandbox_globals = {
            "__builtins__": SAFE_BUILTINS,
            "json": json,
            "re": re,
        }

        output_buffer = io.StringIO()
        with contextlib.redirect_stdout(output_buffer):
            # Use same dict for globals and locals to preserve function definitions/vars
            exec(code, sandbox_globals, sandbox_globals)

        code_output = output_buffer.getvalue().strip()

        # Validate that output looks like a dict
        if not code_output:
            raise ValueError("Analyst code produced no output. Ensure print() is called.")

        # Quick parse check — must be evaluable as dict
        parsed = ast.literal_eval(code_output)
        if not isinstance(parsed, dict):
            raise ValueError(f"Output is not a dict: {type(parsed).__name__}")

        logger.info(f"Analyst success. Output: {code_output[:200]}")

        return {
            "generated_code": code,
            "code_output": code_output,
            "error": None,
            # FIX BUG 7: retry_count is NOT incremented on success
            # so confidence calculation stays accurate
        }

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Analyst error (retry {retry_count}): {error_msg}")
        return {
            "error": error_msg,
            # FIX BUG 7: Only increment on failure
            "retry_count": retry_count + 1,
        }


# ── Node 4: Visualizer ──────────────────────────────────────────────────────────
def visualizer_node(state: InsightState) -> InsightState:
    logger.info("Running Visualizer...")
    query = state["query"]
    code_output = state.get("code_output", "{}")

    system_prompt = """You are a Data Visualization agent.
Convert the provided Python dictionary data into a chart JSON object.

Return ONLY valid JSON matching this exact schema:
{
  "chartType": "bar" or "line",
  "title": "descriptive title",
  "labels": ["label1", "label2", ...],
  "datasets": [
    {"name": "series name", "data": [number, ...], "color": "#hexcolor"}
  ]
}

Rules:
- Use "bar" for comparisons between items, "line" for trends over time.
- Choose distinct hex colors per dataset (use: #38BDF8, #818CF8, #34D399, #F59E0B, #F87171).
- If data is empty or invalid, return an "Insufficient Data" bar chart with a single zero-value dataset.
- Return ONLY the JSON object. No markdown, no explanation."""

    user_prompt = f"Query: {query}\nExtracted Data: {code_output}"

    try:
        response_text = invoke_gemini(system_prompt, user_prompt, json_mode=True)
        response_text = strip_code_fences(response_text)
        chart_data = json.loads(response_text)

        # sources are added by llm_service from accumulated_state — not here
        return {"chart_json": chart_data}

    except Exception as e:
        logger.error(f"Visualizer error: {e}")
        return {"chart_json": None}