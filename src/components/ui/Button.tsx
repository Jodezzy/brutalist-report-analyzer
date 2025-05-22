import React from 'react';
import { cn } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
        'disabled:opacity-50 disabled:pointer-events-none',
        
        // Variants
        variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700',
        variant === 'outline' && 'border border-gray-600 text-gray-200 hover:bg-gray-700',
        variant === 'ghost' && 'text-gray-200 hover:bg-gray-700',
        
        // Sizes
        size === 'sm' && 'text-xs px-2.5 py-1.5',
        size === 'md' && 'text-sm px-4 py-2',
        size === 'lg' && 'text-base px-6 py-3',
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;