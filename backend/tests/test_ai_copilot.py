from types import SimpleNamespace

from app.services.ai_copilot import EMBEDDING_DIMENSION, local_embedding


def test_local_embedding_is_normalized_and_deterministic():
    first = local_embedding("supplier risk and landed cost")
    second = local_embedding("supplier risk and landed cost")
    assert first == second
    assert len(first) == EMBEDDING_DIMENSION
    assert round(sum(value * value for value in first), 6) == 1.0


def test_different_procurement_questions_produce_different_embeddings():
    risk = local_embedding("Which supplier has the lowest risk?")
    inventory = local_embedding("How much current inventory is available?")
    assert risk != inventory


def test_llm_status_uses_gemini_environment(monkeypatch):
    from app.services.ai_copilot import llm_status

    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    status = llm_status()
    assert status["llm_configured"] is True
    assert status["provider"] == "Google Gemini"
    assert status["model"] == "gemini-2.5-flash-lite"
