import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#1E3A5F] hover:bg-[#2D5F9E] text-white focus:ring-[#1E3A5F]',
    secondary: 'bg-[#2C7A4B] hover:bg-[#23613b] text-white focus:ring-[#2C7A4B]',
    danger: 'bg-[#C0392B] hover:bg-[#a02f23] text-white focus:ring-[#C0392B]',
    outline: 'border border-[#DDE3ED] bg-white text-[#1A2332] hover:bg-slate-50 focus:ring-[#1E3A5F]',
    ghost: 'text-[#5A6A7E] hover:bg-slate-100 hover:text-[#1A2332]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="mr-2 text-base" />
      ) : null}
      {children}
    </button>
  );
};
