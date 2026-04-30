import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline';
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseStyles = 'rounded-lg transition-all duration-200';

  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm p-6',
    elevated: 'bg-white border border-gray-200 shadow-lg hover:shadow-xl',
    outline: 'bg-white border-2 border-gray-200 p-6',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
