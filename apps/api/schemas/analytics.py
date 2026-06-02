from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: float | int | str
    trend: str = "0%"


class OverviewOut(BaseModel):
    metrics: list[MetricCard]
