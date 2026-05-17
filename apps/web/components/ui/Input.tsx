"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          className={`w-full h-12 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-0 focus:shadow-lg transition-all duration-200 ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {icon && <div className="absolute right-4 text-gray-400">{icon}</div>}
      </div>
      {error && <p className="text-red-600 text-sm font-medium mt-2">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-600 text-sm mt-2">{helperText}</p>
      )}
    </div>
  );
}
