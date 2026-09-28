"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, AuthContextType, RegisterFormState } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "h4care_auth_session";

const DEMO_USER: AuthUser = {
  id: "usr_h4care_01",
  fullName: "Nguyễn Văn An",
  phone: "0901234567",
  email: "khachhang@h4care.vn",
  role: "Hội viên Thân thiết",
  points: 150,
  createdAt: "2024-01-15",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage on mount (SSR safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read auth session from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (userData: AuthUser) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn("Failed to persist auth session", e);
    }
  };

  const sendPhoneOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, error: "Số điện thoại chưa hợp lệ (tối thiểu 9-10 chữ số)." };
    }
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true };
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      return { success: false, error: "Vui lòng nhập đầy đủ mã xác thực OTP." };
    }

    // Simulate server verification
    await new Promise((resolve) => setTimeout(resolve, 400));

    const loggedUser: AuthUser = {
      ...DEMO_USER,
      phone: cleanPhone || DEMO_USER.phone,
    };
    saveSession(loggedUser);
    return { success: true };
  };

  const loginWithPassword = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!identifier.trim()) {
      return { success: false, error: "Vui lòng nhập email hoặc số điện thoại." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Mật khẩu tối thiểu 6 ký tự." };
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const isEmail = identifier.includes("@");
    const loggedUser: AuthUser = {
      ...DEMO_USER,
      email: isEmail ? identifier.trim() : DEMO_USER.email,
      phone: !isEmail ? identifier.trim() : DEMO_USER.phone,
    };
    saveSession(loggedUser);
    return { success: true };
  };

  const register = async (data: Partial<RegisterFormState>): Promise<{ success: boolean; error?: string }> => {
    if (!data.phone || data.phone.trim().length < 9) {
      return { success: false, error: "Số điện thoại không hợp lệ." };
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const newUser: AuthUser = {
      id: "usr_" + Date.now(),
      fullName: data.fullName?.trim() || "Thành viên H4CARE",
      phone: data.phone.trim(),
      email: data.email?.trim() || "thanhvien@h4care.vn",
      role: "Hội viên",
      points: 50,
      createdAt: new Date().toISOString().split("T")[0],
    };
    saveSession(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear auth session", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithPhone,
        loginWithPassword,
        sendPhoneOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
