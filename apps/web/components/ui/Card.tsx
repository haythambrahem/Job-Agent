"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = false,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all duration-200 ${
        hover ? "hover:shadow-md hover:-translate-y-1" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
