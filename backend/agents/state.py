from typing import TypedDict, Optional

class InsightState(TypedDict):
    query: str
    subtasks: list[str]
    retrieved_docs: list[str]
    raw_data: str
    generated_code: str
    code_output: str
    chart_json: Optional[dict]
    error: Optional[str]
    retry_count: int
    sources: list[str]
