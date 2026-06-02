import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "apps" / "api"))

from database import AsyncSessionLocal, create_tables  # noqa: E402
from models import (  # noqa: E402
    AISettings,
    ArticleStatus,
    ChatWidget,
    ClientSettings,
    Conversation,
    ConversationChannel,
    ConversationStatus,
    Customer,
    KnowledgeBaseArticle,
    Language,
    Message,
    Organization,
    SLAConfig,
    SenderType,
    Ticket,
    TicketPriority,
    TicketStatus,
    User,
    UserRole,
)
from services.auth_service import hash_password  # noqa: E402
from sqlmodel import select  # noqa: E402


KB_TOPICS = [
    ("Billing cycle", "Invoices are issued monthly in Canadian dollars. Clients can request billing help through support."),
    ("Password reset", "Users can reset passwords from the login screen using a time-limited reset link."),
    ("Privacy", "Avivavirtual uses consent-based processing and stores customer support data according to PIPEDA principles."),
    ("Support hours", "Standard support hours are Monday to Friday, 9:00 AM to 5:00 PM America/Toronto."),
    ("Refund policy", "Refund requests are reviewed by the client business according to its approved policy."),
    ("French support", "Customers may request English or French support. Conversations preserve the selected language."),
    ("Callback requests", "Customers can request a callback with preferred time, phone number, and reason."),
    ("Escalations", "Low-confidence AI answers are handed to a human support specialist with a conversation summary."),
    ("Call recordings", "Call recordings are retained for 90 days by default and may be deleted earlier on request."),
    ("Ticket SLA", "Urgent tickets receive a one-hour response target. Lower priority tickets follow configured SLA windows."),
]


async def seed() -> None:
    await create_tables()
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == "admin@avivavirtual.ca"))).scalar_one_or_none()
        if existing:
            print("Seed data already exists.")
            return

        org = Organization(name="Demo Business", slug="demo-business", billing_email="manager@demobusiness.ca", phone="+14165550100")
        db.add(org)
        await db.flush()

        db.add(ClientSettings(organization_id=org.id, support_email="support@demobusiness.ca"))
        db.add(SLAConfig(organization_id=org.id, urgent_response_minutes=60, high_response_minutes=240, medium_response_minutes=480, low_response_minutes=1440))
        db.add(AISettings(organization_id=org.id, confidence_threshold=0.75, enabled_languages="EN,FR"))
        db.add(ChatWidget(organization_id=org.id, title="Demo Business Support", primary_color="#0EA5E9"))

        users = [
            User(email="admin@avivavirtual.ca", password_hash=hash_password("SuperAdmin@123!"), first_name="Super", last_name="Admin", role=UserRole.SUPER_ADMIN),
            User(email="manager@demobusiness.ca", password_hash=hash_password("ClientAdmin@123!"), first_name="Maya", last_name="Manager", role=UserRole.CLIENT_ADMIN, organization_id=org.id),
            User(email="agent1@demobusiness.ca", password_hash=hash_password("Agent@123!"), first_name="Avery", last_name="Agent", role=UserRole.AGENT, organization_id=org.id),
            User(email="agent2@demobusiness.ca", password_hash=hash_password("Agent@123!"), first_name="Remi", last_name="Agent", role=UserRole.AGENT, organization_id=org.id, language=Language.FR),
        ]
        db.add_all(users)
        await db.flush()

        customers = [
            Customer(organization_id=org.id, first_name="Jordan", last_name="Lee", email="jordan@example.ca", phone="+14165550111", consent_given=True, consent_at=datetime.utcnow()),
            Customer(organization_id=org.id, first_name="Camille", last_name="Roy", email="camille@example.ca", phone="+15145550112", language=Language.FR, consent_given=True, consent_at=datetime.utcnow()),
            Customer(organization_id=org.id, first_name="Priya", last_name="Singh", email="priya@example.ca", phone="+19055550113", consent_given=True, consent_at=datetime.utcnow()),
        ]
        db.add_all(customers)
        await db.flush()

        for title, content in KB_TOPICS:
            db.add(
                KnowledgeBaseArticle(
                    organization_id=org.id,
                    title=title,
                    slug=title.lower().replace(" ", "-"),
                    content=content,
                    excerpt=content[:200],
                    tags="support,policy",
                    status=ArticleStatus.APPROVED,
                    published_at=datetime.utcnow(),
                    created_by_id=users[1].id,
                )
            )

        for idx in range(5):
            conv = Conversation(
                organization_id=org.id,
                customer_id=customers[idx % len(customers)].id,
                assigned_agent_id=users[2].id if idx in (1, 3) else None,
                channel=ConversationChannel.WIDGET,
                status=ConversationStatus.CLOSED if idx == 4 else ConversationStatus.OPEN,
                is_handed_off=idx in (1, 2),
                rating=5 if idx == 4 else None,
                language=customers[idx % len(customers)].language,
                ai_summary="Customer asked about support policy. Agent follow-up may be required." if idx in (1, 2) else None,
            )
            db.add(conv)
            await db.flush()
            db.add(Message(organization_id=org.id, conversation_id=conv.id, sender_type=SenderType.CUSTOMER, content="I need help with my account.", language=conv.language))
            db.add(Message(organization_id=org.id, conversation_id=conv.id, sender_type=SenderType.AI, content="I can help using our approved support information.", confidence=0.82, language=conv.language))

        priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT]
        statuses = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED]
        for idx in range(10):
            status = statuses[idx % len(statuses)]
            db.add(
                Ticket(
                    organization_id=org.id,
                    ticket_number=f"TKT-{datetime.utcnow():%Y%m}-{idx + 1:04d}",
                    customer_id=customers[idx % len(customers)].id,
                    assigned_agent_id=users[2 + (idx % 2)].id,
                    subject=f"Demo support request {idx + 1}",
                    description="Seeded ticket for dashboards, filters, and SLA testing.",
                    status=status,
                    priority=priorities[idx % len(priorities)],
                    due_at=datetime.utcnow() + timedelta(hours=1 + idx),
                    resolved_at=datetime.utcnow() if status in (TicketStatus.RESOLVED, TicketStatus.CLOSED) else None,
                    closed_at=datetime.utcnow() if status == TicketStatus.CLOSED else None,
                )
            )

        await db.commit()
        print("Seed data created.")


if __name__ == "__main__":
    asyncio.run(seed())
