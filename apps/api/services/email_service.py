from email.message import EmailMessage

import aiosmtplib

from config import settings


async def send_email(to_email: str, subject: str, html: str, text: str | None = None) -> dict:
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        return {"queued": False, "reason": "SMTP not configured"}
    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text or subject)
    message.add_alternative(html, subtype="html")
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        start_tls=True,
    )
    return {"queued": True}
