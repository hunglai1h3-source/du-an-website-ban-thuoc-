import { PasswordStrengthResult } from "@/types/auth";

export const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
};

export const isValidVietnamesePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s.-]/g, "");
  // Standard Vietnamese phone formats: 10 digits starting with 03, 05, 07, 08, 09 or +84 prefix
  const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return phoneRegex.test(cleanPhone);
};

export const isValidIdentifier = (identifier: string): boolean => {
  const trimmed = identifier.trim();
  return isValidEmail(trimmed) || isValidVietnamesePhone(trimmed);
};

export const evaluatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return {
      score: 0,
      label: "Rất yếu",
      color: "bg-slate-200",
      checks: {
        length: false,
        hasLower: false,
        hasUpper: false,
        hasNumberOrSpecial: false,
      },
    };
  }

  const length = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let score = 0;
  if (length) score++;
  if (hasLower) score++;
  if (hasUpper) score++;
  if (hasNumberOrSpecial) score++;

  let label: PasswordStrengthResult["label"] = "Rất yếu";
  let color = "bg-rose-500";

  switch (score) {
    case 1:
      label = "Yếu";
      color = "bg-rose-500";
      break;
    case 2:
      label = "Trung bình";
      color = "bg-amber-500";
      break;
    case 3:
      label = "Mạnh";
      color = "bg-brand-blue-500";
      break;
    case 4:
      label = "Rất an toàn";
      color = "bg-emerald-500";
      break;
    default:
      label = "Rất yếu";
      color = "bg-slate-200";
  }

  return {
    score,
    label,
    color,
    checks: {
      length,
      hasLower,
      hasUpper,
      hasNumberOrSpecial,
    },
  };
};
