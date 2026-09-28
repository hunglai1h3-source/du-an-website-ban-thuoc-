from app.services.url_safety import validate_public_url


def test_ssrf_blocks_localhost_and_private_ip():
    assert validate_public_url("http://localhost:8000")[0] is False
    assert validate_public_url("http://127.0.0.1/secret")[0] is False
    assert validate_public_url("file:///etc/passwd")[0] is False

