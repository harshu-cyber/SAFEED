import React from 'react';

export const Card = ({ children, title, subtitle, action, className = '' }) => {
  return (
    <div className={`gov-card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#DDE3ED] pb-3 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-[#1A2332]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#5A6A7E] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`animate-spin rounded-full border-2 border-t-[#1E3A5F] border-slate-200 ${sizes[size]}`}></div>
    </div>
  );
};
