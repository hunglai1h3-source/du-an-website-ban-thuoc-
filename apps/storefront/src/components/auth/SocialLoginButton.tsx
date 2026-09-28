"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialLoginButtonProps {
  onGoogleClick?: () => void;
  dividerText?: string;
  className?: string;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  onGoogleClick,
  dividerText = "hoặc tiếp tục bằng",
  className = "",
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const handleClick = () => {
    if (onGoogleClick) {
      onGoogleClick();
      return;
    }
    // Polite simulation for prototype
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowNote(true);
      setTimeout(() => setShowNote(false), 4000);
    }, 600);
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Divider */}
      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs text-slate-400 font-medium whitespace-nowrap absolute select-none">
          {dividerText}
        </span>
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isSimulating}
        className="w-full h-12 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold shadow-xs transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
      >
        {isSimulating ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>Tiếp tục với Google</span>
      </button>

      {/* Prototype Notice */}
      {showNote && (
        <p className="text-[11px] text-center text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 animate-fadeIn">
          Chức năng Đăng nhập Google đang ở chế độ UI prototype và sẽ được liên kết ở giai đoạn Backend OAuth.
        </p>
      )}
    </div>
  );
};
