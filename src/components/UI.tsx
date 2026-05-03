import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90",
    secondary: "bg-secondary text-primary hover:bg-secondary/80",
    outline: "border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-gray-100", className)} {...props}>
    {children}
  </div>
);

export const SectionTitle: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h2>
    {subtitle && <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>}
  </div>
);
