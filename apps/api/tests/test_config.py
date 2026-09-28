from app.core.config import Settings


def test_cors_origins_accepts_comma_separated_env(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

    settings = Settings(_env_file=None)

    assert settings.cors_origins == ["http://localhost:5173", "http://localhost:3000"]


def test_cors_origins_accepts_json_env(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", '["http://localhost:5173","http://localhost:3000"]')

    settings = Settings(_env_file=None)

    assert settings.cors_origins == ["http://localhost:5173", "http://localhost:3000"]
