import ipaddress
import socket
from urllib.parse import urlparse


BLOCKED_HOSTS = {"localhost", "metadata.google.internal"}


def validate_public_url(url: str) -> tuple[bool, str]:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False, "Chỉ cho phép URL HTTP hoặc HTTPS"
    if not parsed.hostname:
        return False, "URL không có hostname"
    hostname = parsed.hostname.lower()
    if hostname in BLOCKED_HOSTS or hostname.endswith(".local"):
        return False, "Hostname nội bộ không được phép"
    try:
        default_port = 443 if parsed.scheme == "https" else 80
        addresses = {item[4][0] for item in socket.getaddrinfo(hostname, parsed.port or default_port)}
    except socket.gaierror:
        return False, "Không phân giải được hostname"
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return False, "Địa chỉ mạng nội bộ không được phép"
    return True, "OK"
