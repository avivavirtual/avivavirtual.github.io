from sqlalchemy.ext.asyncio import AsyncSession

from models import AuditLog


async def audit(
    db: AsyncSession,
    action: str,
    organization_id: str | None = None,
    actor_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata_json: str = "{}",
) -> AuditLog:
    log = AuditLog(
        organization_id=organization_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=metadata_json,
    )
    db.add(log)
    return log
