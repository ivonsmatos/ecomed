from unittest.mock import patch

from app.services.session_store import TTLSessionStore


def test_session_expires_after_ttl(monkeypatch):
    monkeypatch.setenv("ECOBOT_SESSION_TTL_SECONDS", "60")
    service = TTLSessionStore(60, 10)
    with patch("app.services.session_store.time.monotonic", side_effect=[0, 0, 61]):
        service.save_turn("s1", "pergunta", "resposta")
        assert service.get("s1") == []


def test_session_lru_respects_max(monkeypatch):
    monkeypatch.setenv("ECOBOT_MAX_SESSIONS", "2")
    service = TTLSessionStore(60, 2)
    service.save_turn("s1", "p", "r")
    service.save_turn("s2", "p", "r")
    service.save_turn("s3", "p", "r")
    assert len(service) == 2
    assert service.get("s1") == []
