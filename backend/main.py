"""
InsightGraph — FastAPI entry point
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.stream import router as stream_router
from routes.resume import router as resume_router
from routes.download import router as download_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="InsightGraph API",
    description="Technical intelligence dashboard backend — Gemini-powered chart data API",
    version="1.0.0",
)

# Allow Next.js dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stream_router)
app.include_router(resume_router)
app.include_router(download_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "InsightGraph API"}
