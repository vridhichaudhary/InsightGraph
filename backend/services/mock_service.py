from models.schemas import ChartResponse, Dataset

MOCK_RESPONSES = {
    "default_comparison": ChartResponse(
        chartType="bar",
        title="Llama 3 vs GPT-4o — Benchmark Comparison",
        labels=["MMLU", "HumanEval", "GSM8K", "HellaSwag", "ARC-C"],
        datasets=[
            Dataset(
                name="Llama 3 (70B)",
                data=[82.0, 81.7, 93.0, 88.0, 79.5],
                color="#38BDF8",
            ),
            Dataset(
                name="GPT-4o",
                data=[88.7, 90.2, 97.1, 95.3, 96.4],
                color="#818CF8",
            ),
        ],
        sources=["mock_benchmark_data.csv"]
    ),
    "trend": ChartResponse(
        chartType="line",
        title="AI Model Parameter Count Growth (2019–2024)",
        labels=["2019", "2020", "2021", "2022", "2023", "2024"],
        datasets=[
            Dataset(
                name="Transformer Models (B params)",
                data=[1.5, 175, 530, 540, 700, 1800],
                color="#38BDF8",
            ),
        ],
        sources=["mock_history_report.txt"]
    ),
}

import asyncio
import json
from session_store import store

def get_mock_response(query: str) -> ChartResponse:
    """
    Return a relevant mock response based on simple keyword matching.
    Falls back to the default comparison chart.
    """
    q = query.lower()
    if any(kw in q for kw in ["trend", "growth", "over time", "history", "year"]):
        return MOCK_RESPONSES["trend"]
    return MOCK_RESPONSES["default_comparison"]

async def stream_mock_response(query: str, session_id: str):
    """
    Simulate the LLM thinking process, yield events, and store mock data for CSV export.
    """
    store.create_session(session_id)
    
    yield json.dumps({"type": "log", "message": "Understanding query..."})
    await asyncio.sleep(0.5)
    
    yield json.dumps({"type": "log", "message": "Fetching mock data..."})
    await asyncio.sleep(0.5)
    
    yield json.dumps({"type": "log", "message": "Generating insights..."})
    await asyncio.sleep(0.5)
    
    yield json.dumps({"type": "log", "message": "Preparing structured data..."})
    await asyncio.sleep(0.5)
    
    chart_response = get_mock_response(query)
    chart_response.confidence = 0.95  # Set heuristic confidence
    
    # Store mock raw data for CSV export testing
    mock_raw_data = {"labels": chart_response.labels, "datasets": [{"name": ds.name, "data": ds.data} for ds in chart_response.datasets]}
    store.store_raw_data(session_id, json.dumps(mock_raw_data))
    
    # Simulate human-in-the-loop pause
    yield json.dumps({"type": "log", "message": "Data processed. Waiting for user confirmation...", "interrupt": True})
    event = store.get_event(session_id)
    if event:
        await event.wait()
        
    yield json.dumps({"type": "log", "message": "User confirmed. Proceeding to Visualizer..."})
    await asyncio.sleep(0.5)
    
    yield json.dumps({"type": "chart", "data": chart_response.model_dump()})
