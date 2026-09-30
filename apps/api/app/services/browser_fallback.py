import logging
from dataclasses import dataclass
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class BrowserFetchResult:
    success: bool
    html: str | None
    status_code: int
    is_blocked: bool
    captcha_detected: bool
    error_message: str | None


def is_cloudflare_or_captcha(content: str, status_code: int) -> bool:
    """
    Kiểm tra xem trang có bị Cloudflare chặn hoặc xuất hiện thử thách CAPTCHA / Bot hay không.
    """
    if status_code in {403, 503}:
        return True
    content_lower = content.lower() if content else ""
    signatures = [
        "just a moment...",
        "attention required! | cloudflare",
        "cf-challenge",
        "challenge-running",
        "cf-browser-verification",
        "recaptcha",
        "hcaptcha",
        "turnstile",
        "access denied",
        "enable javascript and cookies to continue",
    ]
    return any(sig in content_lower for sig in signatures)


def fetch_with_browser_fallback(url: str, timeout_seconds: int = 15) -> BrowserFetchResult:
    """
    Thử nghiệm truy cập trang sản phẩm công khai bằng Browser Automation (Playwright).
    TUYỆT ĐỐI TUÂN THỦ NGUYÊN TẮC:
    1. Không vượt CAPTCHA, không giải CAPTCHA tự động.
    2. Không dùng kỹ thuật né chống bot hoặc đánh lừa máy chủ.
    3. Nếu phát hiện CAPTCHA hoặc vẫn bị 403, lập tức dừng lại và báo hiệu để kích hoạt SOURCE_BLOCKED.
    """
    if not settings.public_browser_fallback_enabled:
        return BrowserFetchResult(
            success=False,
            html=None,
            status_code=403,
            is_blocked=True,
            captcha_detected=False,
            error_message="Chế độ Public Browser Fallback đang tắt theo cấu hình (PUBLIC_BROWSER_FALLBACK_ENABLED=False).",
        )

    # Kiểm tra xem Playwright có sẵn trong môi trường Python không
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except ImportError:
        # Playwright chưa được cài đặt trong môi trường hiện tại
        return BrowserFetchResult(
            success=False,
            html=None,
            status_code=403,
            is_blocked=True,
            captcha_detected=False,
            error_message="Thư viện Playwright chưa được cài đặt trong môi trường. Máy chủ dừng nguồn an toàn khi gặp 403.",
        )

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()

            try:
                response = page.goto(url, wait_until="domcontentloaded", timeout=timeout_seconds * 1000)
                status = response.status if response else 0
                content = page.content()

                # Kiểm tra chặn bot hoặc CAPTCHA
                if is_cloudflare_or_captcha(content, status):
                    browser.close()
                    return BrowserFetchResult(
                        success=False,
                        html=None,
                        status_code=status or 403,
                        is_blocked=True,
                        captcha_detected=True,
                        error_message="Phát hiện trang chặn bảo vệ Cloudflare/CAPTCHA trên trang công khai. Dừng nguồn an toàn.",
                    )

                # Chờ theo điều kiện tiêu đề hoặc nội dung chính
                try:
                    page.wait_for_selector("h1, title", timeout=5000)
                except Exception:
                    pass

                final_content = page.content()
                browser.close()

                return BrowserFetchResult(
                    success=True,
                    html=final_content,
                    status_code=200,
                    is_blocked=False,
                    captcha_detected=False,
                    error_message=None,
                )
            except Exception as nav_err:
                browser.close()
                return BrowserFetchResult(
                    success=False,
                    html=None,
                    status_code=403,
                    is_blocked=True,
                    captcha_detected=False,
                    error_message=f"Lỗi khi tải trang công khai bằng browser: {nav_err}",
                )
    except Exception as exc:
        return BrowserFetchResult(
            success=False,
            html=None,
            status_code=500,
            is_blocked=True,
            captcha_detected=False,
            error_message=f"Không thể khởi động browser automation: {exc}",
        )
