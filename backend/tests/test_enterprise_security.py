from app.config import Settings
from app.security import create_token, decode_token, hash_password, verify_password
from app.services.s3_storage import s3_storage


def test_password_hash_round_trip():
    hashed = hash_password("A-strong-test-password-123!")
    assert hashed != "A-strong-test-password-123!"
    assert verify_password("A-strong-test-password-123!", hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_round_trip():
    token, jti, expires_at = create_token(
        user_id=7,
        email="buyer@example.com",
        role="manager",
        token_type="access",
    )
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "7"
    assert payload["jti"] == jti
    assert payload["role"] == "manager"
    assert expires_at.timestamp() > payload["iat"]


def test_neon_url_uses_psycopg3_driver():
    settings = Settings(database_url="postgresql://user:password@example.neon.tech/sourcewise")
    assert settings.database_url.startswith("postgresql+psycopg://")


def test_s3_object_key_is_sanitized():
    key = s3_storage.object_key("../../Quarterly BOM (Final).xlsx", 12)
    assert ".." not in key
    assert "products/12" in key
    assert key.endswith("Quarterly-BOM-Final-.xlsx")
