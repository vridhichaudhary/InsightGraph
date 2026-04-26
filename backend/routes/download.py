"""
CSV download route.

FIXES:
  - BUG 6: ast.literal_eval was fragile — analyst may print multi-line output,
            non-dict values, or repr() of complex types. Now uses json.loads first,
            then ast.literal_eval as fallback, with a safe catch-all.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from session_store import store
import pandas as pd
import io
import json
import ast

router = APIRouter()


def parse_analyst_output(raw: str) -> pd.DataFrame:
    """
    Parse the analyst's stdout into a DataFrame.
    Tries JSON first, then ast.literal_eval, then raw fallback.
    """
    raw = raw.strip()

    # Attempt 1: JSON parse (if analyst printed JSON-compatible dict)
    try:
        data = json.loads(raw)
        return dict_to_dataframe(data)
    except (json.JSONDecodeError, ValueError):
        pass

    # Attempt 2: Python literal eval (handles Python dict repr)
    try:
        data = ast.literal_eval(raw)
        if isinstance(data, dict):
            return dict_to_dataframe(data)
    except (ValueError, SyntaxError):
        pass

    # Attempt 3: Try to find the last line that looks like a dict
    for line in reversed(raw.splitlines()):
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                data = ast.literal_eval(line)
                if isinstance(data, dict):
                    return dict_to_dataframe(data)
            except Exception:
                pass

    # Fallback: return raw output as single-column CSV
    return pd.DataFrame([{"Raw Output": raw}])


def dict_to_dataframe(data: dict) -> pd.DataFrame:
    """Convert a dict (flat or nested with labels/datasets) to a DataFrame."""
    if "labels" in data and "datasets" in data:
        # Visualizer-style nested structure
        df = pd.DataFrame()
        df["Label"] = data["labels"]
        for ds in data.get("datasets", []):
            df[ds["name"]] = ds["data"]
        return df
    else:
        # Simple key-value mapping: {"GPT-4o": 88.7, "Llama 3": 82.0}
        return pd.DataFrame(list(data.items()), columns=["Category", "Value"])


@router.get("/download")
async def download_csv(session_id: str):
    """Download the raw analyst output as a CSV file."""
    raw_data = store.get_raw_data(session_id)
    if not raw_data:
        raise HTTPException(status_code=404, detail="No data found for this session.")

    df = parse_analyst_output(raw_data)

    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)

    return PlainTextResponse(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=insightgraph_{session_id}.csv"
        }
    )