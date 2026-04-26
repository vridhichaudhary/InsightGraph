from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from session_store import store
import pandas as pd
import io
import json

router = APIRouter()

@router.get("/download")
async def download_csv(session_id: str):
    """
    Download the raw data of a session as a CSV file.
    """
    raw_data = store.get_raw_data(session_id)
    if not raw_data:
        raise HTTPException(status_code=404, detail="No data found for this session")

    # The Analyst node outputs data via print, usually as a string representation of a dict.
    # We attempt to parse it and convert it to CSV.
    try:
        # Evaluate or parse the raw string data
        import ast
        data_dict = ast.literal_eval(raw_data)
        
        # Convert dictionary to DataFrame. 
        # Assumes structure like {"Label1": 10, "Label2": 20} or {"labels": [...], "data": [...]}
        if isinstance(data_dict, dict):
            # Check if it has 'labels' and 'data' keys (from visualizer)
            if "labels" in data_dict and "datasets" in data_dict:
                df = pd.DataFrame()
                df['Label'] = data_dict['labels']
                for ds in data_dict['datasets']:
                    df[ds['name']] = ds['data']
            else:
                # Simple key-value mapping
                df = pd.DataFrame(list(data_dict.items()), columns=['Category', 'Value'])
        else:
            df = pd.DataFrame([{"Raw Output": raw_data}])
            
    except Exception:
        # Fallback to single column if we can't parse it well
        df = pd.DataFrame([{"Raw Output": raw_data}])

    # Convert to CSV
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    
    return PlainTextResponse(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=insightgraph_{session_id}.csv"
        }
    )
