/**
 * H4CARE Storefront API Client & Token Management
 * 
 * Cung cấp giải pháp xác thực và refresh token tập trung cho Storefront:
 * 1. Tự động gắn Bearer Token vào header Authorization.
 * 2. Tự động phục hồi phiên khi Access Token hết hạn bằng Refresh Token (POST /api/v1/auth/refresh).
 * 3. Chống lặp song song (Mutex Promise) khi nhiều request cùng gặp 401.
 * 4. Đồng bộ xóa phiên và kích hoạt sự kiện khi phiên hết hạn hoàn toàn.
 */

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("pharmatrust_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("pharmatrust_token") ||
    localStorage.getItem("h4care_auth_token")
  );
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("pharmatrust_refresh_token") ||
    localStorage.getItem("refresh_token")
  );
};

export const setStoredTokens = (access: string, refresh?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("pharmatrust_access_token", access);
  localStorage.setItem("access_token", access);
  if (refresh) {
    localStorage.setItem("pharmatrust_refresh_token", refresh);
    localStorage.setItem("refresh_token", refresh);
  }
};

export const clearStoredTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pharmatrust_access_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("pharmatrust_token");
  localStorage.removeItem("h4care_auth_token");
  localStorage.removeItem("pharmatrust_refresh_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("h4care_auth_session");

  // Phát tín hiệu toàn cục để AuthContext và Header đồng bộ về trạng thái chưa đăng nhập
  window.dispatchEvent(new CustomEvent("h4care-session-expired"));
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearStoredTokens();
    return null;
  }

  // Nếu đang có một tiến trình refresh đang chạy, dùng chung Promise để tránh race condition
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearStoredTokens();
        return null;
      }

      const data = await res.json();
      if (data && data.access_token) {
        setStoredTokens(data.access_token, data.refresh_token);
        return data.access_token as string;
      }

      clearStoredTokens();
      return null;
    } catch (e) {
      console.warn("[Token Refresh Failed]:", e);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper có xác thực Bearer token và tự động refresh token khi gặp HTTP 401
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getStoredAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return fetch(input, { ...init, headers: retryHeaders });
    }
  }

  return response;
}
