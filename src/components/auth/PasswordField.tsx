"use client";

import React, { useState, forwardRef } from "react";
import { FormField, FormFieldProps } from "./FormField";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordFieldProps extends Omit<FormFieldProps, "type" | "trailingAction"> {
  showToggle?: boolean;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Mật khẩu", id = "password", leadingIcon = <Lock className="w-4 h-4" />, showToggle = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    const trailingAction = showToggle ? (
      <button
        type="button"
        onClick={toggleVisibility}
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
        aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        tabIndex={0}
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : undefined;

    return (
      <FormField
        ref={ref}
        id={id}
        label={label}
        type={isVisible ? "text" : "password"}
        leadingIcon={leadingIcon}
        trailingAction={trailingAction}
        {...props}
      />
    );
  }
);

PasswordField.displayName = "PasswordField";
