import asyncio
from typing import Dict, Any

class SessionStore:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, session_id: str):
        self.sessions[session_id] = {
            "event": asyncio.Event(),
            "raw_data": "",
            "query": ""
        }

    def set_event(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id]["event"].set()

    def get_event(self, session_id: str) -> asyncio.Event:
        if session_id in self.sessions:
            return self.sessions[session_id]["event"]
        return None

    def store_raw_data(self, session_id: str, data: str):
        if session_id in self.sessions:
            self.sessions[session_id]["raw_data"] = data

    def get_raw_data(self, session_id: str) -> str:
        if session_id in self.sessions:
            return self.sessions[session_id].get("raw_data", "")
        return ""

store = SessionStore()
