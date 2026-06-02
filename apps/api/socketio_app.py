import socketio
from jose import JWTError, jwt

from config import settings

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origins_list,
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None) -> bool | None:
    token = (auth or {}).get("token")
    if not token:
        return False
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        return False

    user_id = payload.get("sub")
    org_id = payload.get("orgId")
    if not user_id or not org_id:
        return False
    await sio.save_session(sid, {"userId": user_id, "orgId": org_id, "role": payload.get("role")})
    await sio.enter_room(sid, f"org:{org_id}")
    await sio.enter_room(sid, f"user:{user_id}")
    return None


@sio.event
async def disconnect(sid: str) -> None:
    return None


@sio.event
async def join_conversation(sid: str, data: dict | None) -> None:
    conv_id = (data or {}).get("conversationId")
    if conv_id:
        await sio.enter_room(sid, f"conversation:{conv_id}")


@sio.event
async def leave_conversation(sid: str, data: dict | None) -> None:
    conv_id = (data or {}).get("conversationId")
    if conv_id:
        await sio.leave_room(sid, f"conversation:{conv_id}")


@sio.event
async def typing_start(sid: str, data: dict | None) -> None:
    session = await sio.get_session(sid)
    conv_id = (data or {}).get("conversationId")
    if conv_id:
        await sio.emit(
            "user_typing",
            {"userId": session["userId"], "conversationId": conv_id},
            room=f"conversation:{conv_id}",
            skip_sid=sid,
        )


@sio.event
async def typing_stop(sid: str, data: dict | None) -> None:
    session = await sio.get_session(sid)
    conv_id = (data or {}).get("conversationId")
    if conv_id:
        await sio.emit(
            "user_stopped_typing",
            {"userId": session["userId"], "conversationId": conv_id},
            room=f"conversation:{conv_id}",
            skip_sid=sid,
        )


async def emit_new_message(conversation_id: str, message: dict) -> None:
    await sio.emit("new_message", message, room=f"conversation:{conversation_id}")


async def emit_conversation_updated(org_id: str, conversation: dict) -> None:
    await sio.emit("conversation_updated", conversation, room=f"org:{org_id}")


async def emit_ticket_updated(org_id: str, ticket: dict) -> None:
    await sio.emit("ticket_updated", ticket, room=f"org:{org_id}")


async def emit_notification(user_id: str, notification: dict) -> None:
    await sio.emit("notification", notification, room=f"user:{user_id}")


async def emit_agent_status_changed(org_id: str, agent_id: str, status_val: str) -> None:
    await sio.emit("agent_status_changed", {"agentId": agent_id, "status": status_val}, room=f"org:{org_id}")


async def emit_call_transcript_ready(user_id: str, data: dict) -> None:
    await sio.emit("call_transcript_ready", data, room=f"user:{user_id}")
