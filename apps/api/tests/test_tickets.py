from datetime import datetime

from models import TicketPriority
from services.ticket_service import ticket_prefix


def test_create_ticket_correct_number_format_prefix() -> None:
    assert ticket_prefix(datetime(2026, 6, 1)).startswith("TKT-202606")


def test_ticket_priority_values_match_sla_mapping() -> None:
    assert {item.value for item in TicketPriority} == {"LOW", "MEDIUM", "HIGH", "URGENT"}
