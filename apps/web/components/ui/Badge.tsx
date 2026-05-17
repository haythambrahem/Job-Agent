"use client";

import React from "react";

interface BadgeProps {
  variant?: "primary" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "primary",
  children,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-cyan-100 text-cyan-800",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
