from fastapi import APIRouter
from pydantic import BaseModel
from session_store import store
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class ResumeRequest(BaseModel):
    session_id: str

@router.post("/resume")
async def resume_session(request: ResumeRequest):
    """
    Resume a paused LangGraph execution by setting the session's asyncio Event.
    """
    logger.info(f"Resuming session: {request.session_id}")
    store.set_event(request.session_id)
    return {"status": "resumed"}
