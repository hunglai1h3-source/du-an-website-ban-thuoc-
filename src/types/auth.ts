export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: "Hội viên" | "Hội viên Thân thiết" | "Hội viên VIP";
  points?: number;
  createdAt?: string;
}

export interface LoginFormState {
  identifier: string; // Email or phone number
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterFormState {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: boolean;
}

export interface ForgotPasswordFormState {
  identifier: string; // Email or phone number
}

export interface ResetPasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: "Rất yếu" | "Yếu" | "Trung bình" | "Mạnh" | "Rất an toàn";
  color: string;
  checks: {
    length: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumberOrSpecial: boolean;
  };
}

export interface FormErrorState {
  [key: string]: string | undefined;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Partial<RegisterFormState>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}
