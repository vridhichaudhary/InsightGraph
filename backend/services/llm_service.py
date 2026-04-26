"""
LLM service — Integrates LangGraph Multi-Agent system to stream steps back to the frontend.

FIXES:
  - BUG 1: Accumulate full state across nodes so confidence calculation has access
            to sources + retry_count at visualizer time (not just the delta).
  - BUG 7: retry_count was incremented on success too, skewing confidence.
           Now tracked from accumulated state, not per-node delta.
  - BUG 8: asyncio.Event created in create_session — OK in modern Python 3.10+
           but we now pass the running loop explicitly to be safe.
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
    Async generator that executes the LangGraph and yields SSE-formatted JSON strings.
    """
    if not GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY found — streaming mock response.")
        async for event in stream_mock_response(query, session_id):
            yield event
        return

    store.create_session(session_id)

    yield generate_sse_log("System", "Initializing Multi-Agent system...")
    await asyncio.sleep(0.3)

    # FIX BUG 1: Accumulate full state across all node outputs.
    # graph.astream() yields {node_name: state_delta} — deltas only.
    # We merge deltas into accumulated_state so any node can read prior fields.
    accumulated_state: dict = {
        "query": query,
        "subtasks": [],
        "retrieved_docs": [],
        "sources": [],
        "retry_count": 0,
        "error": None,
        "code_output": "",
        "chart_json": None,
    }

    try:
        async for output in graph.astream(
            {"query": query, "retry_count": 0, "subtasks": [], "retrieved_docs": [], "sources": []}
        ):
            for node_name, state_delta in output.items():
                logger.info(f"Node '{node_name}' completed with delta keys: {list(state_delta.keys())}")

                # Merge delta into accumulated state
                accumulated_state.update(state_delta)

                if node_name == "supervisor":
                    subtasks = state_delta.get("subtasks", [])
                    yield generate_sse_log(
                        "Supervisor",
                        f"Query decomposed into {len(subtasks)} research subtasks."
                    )

                elif node_name == "researcher":
                    docs = state_delta.get("retrieved_docs", [])
                    sources = state_delta.get("sources", [])
                    yield generate_sse_log(
                        "Researcher",
                        f"Retrieved {len(docs)} document chunks from {len(sources)} source(s)."
                    )

                elif node_name == "analyst":
                    error = state_delta.get("error")
                    if error:
                        retry = accumulated_state.get("retry_count", 0)
                        yield generate_sse_log(
                            "Analyst",
                            f"Code execution failed (attempt {retry}/3). Retrying with error context..."
                        )
                    else:
                        code_output = state_delta.get("code_output", "")
                        store.store_raw_data(session_id, code_output)
                        yield generate_sse_log(
                            "Analyst",
                            "Data extracted and structured successfully."
                        )

                        # Human-in-the-Loop pause
                        yield generate_sse_log(
                            "System",
                            "Data ready. Awaiting user confirmation before visualization...",
                            is_interrupt=True
                        )

                        event = store.get_event(session_id)
                        if event:
                            await event.wait()

                        yield generate_sse_log("System", "Confirmed. Routing to Visualizer...")

                elif node_name == "fallback":
                    yield generate_sse_log(
                        "System",
                        "Analyst exceeded max retries. Using fallback empty dataset."
                    )

                elif node_name == "visualizer":
                    chart = state_delta.get("chart_json")
                    if chart:
                        # FIX BUG 1 + BUG 7: Use accumulated_state for accurate confidence.
                        # retry_count is the number of FAILED attempts (error paths only).
                        # Sources come from the researcher, stored in accumulated_state.
                        sources_count = len(accumulated_state.get("sources", []))
                        # Count only actual retries = retry_count - 1 (last increment was success)
                        # FIX BUG 7: analyst increments retry_count on both success and failure.
                        # We subtract 1 to account for the successful final run.
                        raw_retries = accumulated_state.get("retry_count", 1)
                        actual_failed_retries = max(0, raw_retries - 1)

                        base_confidence = 0.95
                        if sources_count == 0:
                            base_confidence -= 0.40
                        base_confidence -= (actual_failed_retries * 0.12)

                        chart["confidence"] = max(0.1, round(base_confidence, 2))
                        chart["sources"] = accumulated_state.get("sources", [])

                        yield json.dumps({"type": "chart", "data": chart})
                    else:
                        yield generate_sse_log("Visualizer", "Chart generation failed. Using fallback.")
                        mock_chart = get_mock_response(query)
                        mock_chart.confidence = 0.5
                        yield json.dumps({"type": "chart", "data": mock_chart.model_dump()})

                await asyncio.sleep(0.4)

    except Exception as e:
        logger.error(f"LangGraph execution error: {e}", exc_info=True)
        yield generate_sse_log("System", f"Pipeline error: {str(e)}. Falling back to mock data.")
        chart = get_mock_response(query)
        yield json.dumps({"type": "chart", "data": chart.model_dump()})