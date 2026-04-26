import os
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
import logging
from scripts.ingest import run_ingestion

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Accept a document upload, save it to the data directory, 
    and run the ingestion pipeline in the background.
    """
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    file_path = os.path.join(DATA_DIR, file.filename)
    
    try:
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        logger.info(f"Saved uploaded document: {file.filename}")
        
        # Run ingestion in the background so we don't block the UI
        background_tasks.add_task(run_ingestion)
        
        return {"status": "success", "filename": file.filename, "message": "Document uploaded and ingestion started."}
        
    except Exception as e:
        logger.error(f"Failed to process upload: {e}")
        return {"status": "error", "message": str(e)}
