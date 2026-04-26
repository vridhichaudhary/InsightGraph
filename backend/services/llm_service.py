"""
LLM service — Integrates LangGraph Multi-Agent system to stream steps back to the frontend.
"""

import os
import json
import logging
import asyncio

from dotenv import load_dotenv

from agents.graph import build_graph
from services.mock_service import stream_mock_response, get_mock_response
from session_store import store

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
graph = build_graph()

def generate_sse_log(agent: str, message: str, is_interrupt: bool = False) -> str:
    payload = {"type": "log", "agent": agent, "message": message}
    if is_interrupt:
        payload["interrupt"] = True
    return json.dumps(payload)

async def stream_insights(query: str, session_id: str):
    """
    Async generator that executes the LangGraph and yields SSE formatted JSON strings.
    """
    if not GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY found — streaming mock response.")
        async for event in stream_mock_response(query, session_id):
            yield event
        return

    # Initialize the session
    store.create_session(session_id)
    
    yield generate_sse_log("System", "Initializing Multi-Agent system...")
    await asyncio.sleep(0.3)
    
    try:
        async for output in graph.astream({"query": query, "retry_count": 0, "subtasks": [], "retrieved_docs": [], "sources": []}):
            for node_name, state_update in output.items():
                logger.info(f"Node '{node_name}' completed.")
                
                if node_name == "supervisor":
                    subtasks = state_update.get("subtasks", [])
                    yield generate_sse_log("Supervisor", f"Generated {len(subtasks)} subtasks.")
                
                elif node_name == "researcher":
                    docs = state_update.get("retrieved_docs", [])
                    yield generate_sse_log("Researcher", f"Retrieved {len(docs)} document chunks.")
                
                elif node_name == "analyst":
                    error = state_update.get("error")
                    if error:
                        yield generate_sse_log("Analyst", f"Code execution failed. Error: {error}. Retrying...")
                    else:
                        code_output = state_update.get("code_output", "")
                        store.store_raw_data(session_id, code_output)
                        yield generate_sse_log("Analyst", "Code executed successfully. Data ready for visualization.")
                        
                        # Human-in-the-Loop: Pause execution
                        yield generate_sse_log("System", "Data processed. Waiting for user confirmation...", is_interrupt=True)
                        
                        # Wait for the /resume endpoint to set the event
                        event = store.get_event(session_id)
                        if event:
                            await event.wait()
                        
                        yield generate_sse_log("System", "User confirmed. Proceeding to Visualizer...")
                        
                elif node_name == "fallback":
                    yield generate_sse_log("System", "Analyst failed max retries. Using fallback visualizer.")
                    
                elif node_name == "visualizer":
                    chart = state_update.get("chart_json")
                    if chart:
                        # Heuristic confidence calculation
                        # Based on whether we found sources, and whether there wasn't an analyst error
                        retries = state_update.get("retry_count", 0)
                        sources_count = len(state_update.get("sources", []))
                        
                        base_confidence = 0.95
                        if sources_count == 0:
                            base_confidence -= 0.40
                        base_confidence -= (retries * 0.10)
                        
                        chart["confidence"] = max(0.1, round(base_confidence, 2))
                        
                        yield json.dumps({"type": "chart", "data": chart})
                    else:
                        yield generate_sse_log("Visualizer", "Failed to generate chart. Using fallback.")
                        mock_chart = get_mock_response(query)
                        mock_chart.confidence = 0.5
                        yield json.dumps({"type": "chart", "data": mock_chart.model_dump()})
                        
                await asyncio.sleep(0.5)

    except Exception as e:
        logger.error(f"LangGraph execution error: {e}")
        yield generate_sse_log("System", f"Pipeline error: {str(e)}. Falling back to mock.")
        chart = get_mock_response(query)
        yield json.dumps({"type": "chart", "data": chart.model_dump()})
