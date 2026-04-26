"""
LangGraph shared state definition.

FIXES:
  - BUG 5: Removed `raw_data` — it was declared but never written by any agent.
            Raw data storage is handled by session_store, not the graph state.
"""

from typing import TypedDict, Optional


class InsightState(TypedDict):
    query: str
    subtasks: list[str]
    retrieved_docs: list[str]
    generated_code: str
    code_output: str
    chart_json: Optional[dict]
    error: Optional[str]
    retry_count: int
    sources: list[str]