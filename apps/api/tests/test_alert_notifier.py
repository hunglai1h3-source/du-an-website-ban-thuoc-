import unittest
from unittest.mock import MagicMock, patch

from app.core.config import settings
from app.services.alert_notifier import (
    dispatch_alert,
    format_telegram_alert,
    send_telegram_message,
    send_webhook_alert,
    test_telegram_connection as call_test_telegram_connection,
)


class TestAlertNotifier(unittest.TestCase):
    def test_01_format_telegram_alert(self):
        """Kiểm tra định dạng tin nhắn Telegram HTML đẹp và an toàn."""
        text = format_telegram_alert(
            title="Long Châu bị chặn (SOURCE_BLOCKED)",
            message="Phát hiện Cloudflare CAPTCHA trên trang công khai.",
            severity="CRITICAL",
            details={"Nguồn": "Long Châu", "Mã lỗi": "403"},
        )
        self.assertIn("🚨 <b>PHARMATRUST SYSTEM ALERT</b>", text)
        self.assertIn("<b>Tiêu đề:</b> Long Châu bị chặn (SOURCE_BLOCKED)", text)
        self.assertIn("<code>CRITICAL</code>", text)
        self.assertIn("<b>Nguồn:</b> <code>Long Châu</code>", text)
        self.assertIn("<b>Mã lỗi:</b> <code>403</code>", text)

    @patch("httpx.Client.post")
    def test_02_send_telegram_message_success(self, mock_post):
        """Kiểm tra gửi tin nhắn thành công qua Telegram Bot API."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = '{"ok": true}'
        mock_post.return_value = mock_resp

        result = send_telegram_message(
            token="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
            chat_id="987654321",
            text="<b>Test Message</b>",
        )
        self.assertTrue(result)
        mock_post.assert_called_once()

    @patch("httpx.Client.post")
    def test_03_send_telegram_failure_handles_gracefully(self, mock_post):
        """Khi Telegram API trả về lỗi hoặc timeout, hàm trả về False an toàn."""
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.text = '{"ok": false, "description": "Unauthorized"}'
        mock_post.return_value = mock_resp

        res = send_telegram_message("invalid_token", "123", "Test")
        self.assertFalse(res)

        # Kiểm tra khi ném exception kết nối
        mock_post.side_effect = Exception("Connection timeout to telegram.org")
        res2 = send_telegram_message("token", "123", "Test")
        self.assertFalse(res2)

    @patch("app.services.alert_notifier.send_telegram_message")
    def test_04_dispatch_alert_with_custom_credentials(self, mock_send):
        """Kiểm tra hàm dispatch_alert gửi đúng thông tin khi cấu hình token và chat_id."""
        mock_send.return_value = True

        res = dispatch_alert(
            title="Cảnh báo kiểm thử",
            message="Nội dung kiểm tra hệ thống",
            severity="WARNING",
            alert_type="TEST_ALERT",
            bot_token="test_token",
            chat_id="test_chat",
        )
        self.assertTrue(res["telegram_sent"])
        self.assertEqual(res["severity"], "WARNING")
        mock_send.assert_called_once()

    @patch("app.services.alert_notifier.send_telegram_message")
    def test_05_test_telegram_connection_success(self, mock_send):
        """Kiểm tra gửi tin thử nghiệm thành công."""
        mock_send.return_value = True
        res = call_test_telegram_connection("bot_token_123", "chat_id_456")
        self.assertTrue(res["success"])
        self.assertIn("thành công", res["message"])

    @patch("httpx.Client.post")
    def test_06_send_webhook_alert_success(self, mock_post):
        """Kiểm tra gửi thông báo tới Generic Webhook."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_post.return_value = mock_resp

        res = send_webhook_alert("https://webhook.site/test-uuid", {"event": "crawl_done"})
        self.assertTrue(res)


if __name__ == "__main__":
    unittest.main()
