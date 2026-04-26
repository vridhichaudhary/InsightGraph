import os
import json
import logging
import traceback
import contextlib
import io
from google import genai
from google.genai import types

from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from agents.state import InsightState
from models.schemas import ChartResponse

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

# Helper function to invoke Gemini safely
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

# Node 1: Supervisor
def supervisor_node(state: InsightState) -> InsightState:
    logger.info("Running Supervisor...")
    query = state["query"]
    
    system_prompt = """You are a Supervisor agent.
Your job is to break down the user's query into 3-5 subtasks to gather data.
Return ONLY a valid JSON array of strings representing the subtasks."""

    user_prompt = f"Query: {query}"
    
    try:
        response_text = invoke_gemini(system_prompt, user_prompt, json_mode=True)
        # Strip markdown fences if present
        if response_text.strip().startswith("```"):
            lines = response_text.splitlines()
            response_text = "\n".join(line for line in lines if not line.strip().startswith("```")).strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
            
        subtasks = json.loads(response_text)
        if not isinstance(subtasks, list):
            subtasks = [query]
    except Exception as e:
        logger.error(f"Supervisor error: {e}")
        subtasks = [query]
        
    return {"subtasks": subtasks}

# Node 2: Researcher
def researcher_node(state: InsightState) -> InsightState:
    logger.info("Running Researcher...")
    subtasks = state.get("subtasks", [state["query"]])
    query = state["query"]
    
    docs = []
    sources = set()
    
    try:
        if os.path.exists(CHROMA_DIR) and GEMINI_API_KEY:
            embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)
            vectorstore = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
            
            # Combine query and subtasks to fetch rich context
            search_queries = [query] + subtasks
            for sq in search_queries[:3]:  # Limit to top 3 to avoid context bloat
                res = vectorstore.similarity_search(sq, k=2)
                for d in res:
                    source_name = os.path.basename(d.metadata.get("source", "Unknown"))
                    sources.add(source_name)
                    docs.append(f"--- Source: {source_name} ---\n{d.page_content}")
    except Exception as e:
        logger.error(f"Researcher error: {e}")
        
    # Remove duplicates
    docs = list(set(docs))
    return {"retrieved_docs": docs, "sources": list(sources)}

# Node 3: Analyst
def analyst_node(state: InsightState) -> InsightState:
    logger.info("Running Analyst...")
    query = state["query"]
    docs = "\n\n".join(state.get("retrieved_docs", []))
    retry_count = state.get("retry_count", 0)
    prev_error = state.get("error", "")
    
    system_prompt = """You are an expert Python Analyst.
Your job is to write a Python script that analyzes the provided text documents.
The python script must print() a structured dictionary mapping categories/labels to values based on the query.
DO NOT use matplotlib or any plotting libraries. Only print data.
If data is missing, print an empty dictionary '{}'.
Output ONLY valid executable python code. No markdown fences. Do NOT write ```python."""

    user_prompt = f"Context:\n{docs}\n\nQuery: {query}"
    if prev_error:
        user_prompt += f"\n\nPREVIOUS ERROR (fix this):\n{prev_error}"
        
    try:
        code = invoke_gemini(system_prompt, user_prompt, json_mode=False)
        code = code.strip()
        if code.startswith("```"):
            lines = code.splitlines()
            code = "\n".join(line for line in lines if not line.strip().startswith("```")).strip()
        if code.startswith("python"):
            code = code[6:].strip()
            
        # Execute the code in a sandbox
        output_buffer = io.StringIO()
        with contextlib.redirect_stdout(output_buffer):
            # Sandbox restrictions: basic global scope
            exec(code, {"__builtins__": __builtins__}, {})
            
        code_output = output_buffer.getvalue().strip()
        
        return {
            "generated_code": code,
            "code_output": code_output,
            "error": None,
            "retry_count": retry_count + 1
        }
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Analyst error: {error_msg}")
        return {
            "error": error_msg,
            "retry_count": retry_count + 1
        }

# Node 4: Visualizer
def visualizer_node(state: InsightState) -> InsightState:
    logger.info("Running Visualizer...")
    query = state["query"]
    code_output = state.get("code_output", "{}")
    
    system_prompt = """You are a Data Visualizer agent.
Convert the provided python output data into a valid JSON object matching this strict schema:
{
  "chartType": "bar" | "line",
  "title": "string",
  "labels": ["string"],
  "datasets": [
    {"name": "string", "data": [number], "color": "#hexcolor"}
  ]
}
If the data is empty, return an "Insufficient Data" chart."""

    user_prompt = f"Query: {query}\nData: {code_output}"
    
    try:
        response_text = invoke_gemini(system_prompt, user_prompt, json_mode=True)
        if response_text.strip().startswith("```"):
            lines = response_text.splitlines()
            response_text = "\n".join(line for line in lines if not line.strip().startswith("```")).strip()
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
            
        chart_data = json.loads(response_text)
        chart_data["sources"] = state.get("sources", [])
        return {"chart_json": chart_data}
    except Exception as e:
        logger.error(f"Visualizer error: {e}")
        return {"chart_json": None}
