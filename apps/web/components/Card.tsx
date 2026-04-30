import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline';
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200';

  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md p-6',
    elevated: 'bg-white border border-gray-200 shadow-md hover:shadow-lg p-6',
    outline: 'bg-white border-2 border-gray-200 p-6 hover:border-gray-300',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
