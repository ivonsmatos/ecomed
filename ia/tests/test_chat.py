"""Testes básicos do microserviço EcoMed IA."""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app
from app.routers.chat import set_rag


@pytest.fixture(autouse=True)
def mock_rag():
    rag = MagicMock()
    rag.perguntar = AsyncMock(
        return_value="Você deve descartar medicamentos vencidos em pontos de coleta autorizados."
    )
    set_rag(rag)
    yield rag
    set_rag(None)  # type: ignore


@pytest.fixture
def token():
    return "test-token-secret"


@pytest.fixture(autouse=True)
def set_env(monkeypatch, token):
    monkeypatch.setenv("IA_SERVICE_TOKEN", token)


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_chat_ok(token):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/chat",
            json={"pergunta": "Como descartar medicamentos vencidos?"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert "resposta" in resp.json()


@pytest.mark.asyncio
async def test_chat_sem_token():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/chat",
            json={"pergunta": "Como descartar medicamentos vencidos?"},
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_chat_token_invalido():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/chat",
            json={"pergunta": "Como descartar medicamentos vencidos?"},
            headers={"Authorization": "Bearer token-errado"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_chat_pergunta_muito_curta(token):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/chat",
            json={"pergunta": "oi"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 422
