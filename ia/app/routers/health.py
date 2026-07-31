from fastapi import APIRouter
from app.routers.chat import get_rag

router = APIRouter()


@router.get("/health")
async def health():
    try:
        active_sessions = get_rag().active_session_count
    except Exception:
        active_sessions = 0
    return {"status": "ok", "service": "ecomed-ia", "active_sessions": active_sessions}
