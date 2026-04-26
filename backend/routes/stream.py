from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from services.llm_service import stream_insights
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/stream")
async def stream_query(request: Request, query: str, session_id: str = "default_session"):
    """
    Accept a natural language query and stream step-by-step progress
    followed by the final chart JSON via Server-Sent Events.
    """
    logger.info(f"Received stream query: {query!r} with session {session_id}")
    return EventSourceResponse(stream_insights(query, session_id))
