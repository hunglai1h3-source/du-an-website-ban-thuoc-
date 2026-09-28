import datetime
import html
import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("pharmatrust.alert_notifier")


def escape_html(text: str) -> str:
    """Escape các ký tự đặc biệt cho Telegram HTML parse mode."""
    if not text:
        return ""
    return html.escape(str(text))


def send_telegram_message(
    token: str,
    chat_id: str,
    text: str,
    timeout: float = 8.0,
) -> bool:
    """
    Gửi tin nhắn trực tiếp qua Telegram Bot API (chế độ HTML).
    """
    if not token or not chat_id or not text:
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info(f"Đã gửi cảnh báo Telegram thành công đến chat {chat_id}")
                return True
            else:
                logger.warning(f"Telegram API trả về HTTP {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logger.warning(f"Lỗi kết nối khi gửi tin Telegram: {e}")
        return False


def send_webhook_alert(
    webhook_url: str,
    payload: Dict[str, Any],
    timeout: float = 8.0,
) -> bool:
    """
    Gửi thông báo JSON tới Generic Webhook (Slack, Discord, Zalo, hoặc Custom Webhook).
    """
    if not webhook_url:
        return False

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(webhook_url, json=payload)
            return resp.status_code in (200, 201, 204)
    except Exception as e:
        logger.warning(f"Lỗi khi gửi webhook alert tới {webhook_url}: {e}")
        return False


def format_telegram_alert(
    title: str,
    message: str,
    severity: str = "INFO",
    details: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Tạo nội dung tin nhắn Telegram chuyên nghiệp chuẩn HTML.
    """
    icon_map = {
        "CRITICAL": "🚨",
        "ERROR": "❌",
        "WARNING": "⚠️",
        "SUCCESS": "✅",
        "INFO": "ℹ️",
    }
    icon = icon_map.get(severity.upper(), "🔔")
    now_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    lines = [
        f"{icon} <b>PHARMATRUST SYSTEM ALERT</b>",
        f"<b>Tiêu đề:</b> {escape_html(title)}",
        f"<b>Mức độ:</b> <code>{severity.upper()}</code>",
        f"<b>Thời gian:</b> <i>{now_str}</i>",
        "",
        "<b>Chi tiết:</b>",
        f"{escape_html(message)}",
    ]

    if details:
        lines.append("")
        lines.append("<b>Thông số bổ sung:</b>")
        for k, v in details.items():
            lines.append(f"• <b>{escape_html(k)}:</b> <code>{escape_html(str(v))}</code>")

    lines.append("")
    lines.append("<i>Hệ thống giám sát cào dữ liệu PharmaTrust 24/7</i>")

    return "\n".join(lines)


def dispatch_alert(
    title: str,
    message: str,
    severity: str = "INFO",
    alert_type: str = "GENERAL",
    details: Optional[Dict[str, Any]] = None,
    bot_token: Optional[str] = None,
    chat_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Điều phối gửi cảnh báo đến tất cả các kênh được kích hoạt (Telegram, Webhook).
    Hoạt động an toàn, không bao giờ ném Exception làm dừng crawler.
    """
    token = bot_token or settings.telegram_bot_token
    target_chat = chat_id or settings.telegram_chat_id
    telegram_enabled = settings.telegram_alerts_enabled or bool(bot_token and chat_id)

    telegram_sent = False
    webhook_sent = False

    # 1. Gửi Telegram nếu được bật
    if telegram_enabled and token and target_chat:
        formatted_text = format_telegram_alert(
            title=title,
            message=message,
            severity=severity,
            details=details,
        )
        telegram_sent = send_telegram_message(token, target_chat, formatted_text)

    # 2. Gửi Webhook nếu có URL
    if settings.alert_webhook_url:
        webhook_payload = {
            "source": "PharmaTrust",
            "type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "details": details or {},
            "timestamp": datetime.datetime.utcnow().isoformat(),
        }
        webhook_sent = send_webhook_alert(settings.alert_webhook_url, webhook_payload)

    return {
        "telegram_sent": telegram_sent,
        "webhook_sent": webhook_sent,
        "severity": severity,
        "title": title,
    }


def test_telegram_connection(bot_token: str, chat_id: str) -> Dict[str, Any]:
    """
    Kiểm tra kết nối và gửi tin thử nghiệm.
    """
    test_msg = (
        "🔔 <b>KẾT NỐI THÔNG BÁO THÀNH CÔNG!</b>\n\n"
        "Hệ thống PharmaTrust đã kết nối thành công với Telegram của Quản trị viên.\n"
        "Từ bây giờ, bạn sẽ nhận được cảnh báo tự động khi:\n"
        "• Long Châu bị Cloudflare chặn / CAPTCHA (SOURCE_BLOCKED)\n"
        "• Phát hiện thuốc bị Cục Quản lý Dược THU HỒI\n"
        "• Tóm tắt kết quả cào tự động định kỳ mỗi 6 giờ\n\n"
        f"<i>Thời điểm kiểm tra: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</i>"
    )
    success = send_telegram_message(bot_token, chat_id, test_msg)
    return {
        "success": success,
        "message": "Đã gửi tin nhắn thử nghiệm thành công! Vui lòng kiểm tra Telegram." if success else "Không thể gửi tin nhắn. Vui lòng kiểm tra lại Bot Token và Chat ID.",
    }
