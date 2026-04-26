from pydantic import BaseModel, field_validator
from typing import Literal
from enum import Enum


class QueryRequest(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def query_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Query must not be empty")
        return v.strip()


class Dataset(BaseModel):
    name: str
    data: list[float]
    color: str


class ChartResponse(BaseModel):
    chartType: Literal["bar", "line"]
    title: str
    labels: list[str]
    datasets: list[Dataset]
    sources: list[str] = []
    confidence: float = 0.0
