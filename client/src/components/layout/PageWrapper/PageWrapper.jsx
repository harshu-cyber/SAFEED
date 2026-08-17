import React from 'react';

export const PageWrapper = ({ title, subtitle, actions, children }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE3ED] pb-4">
          <div>
            {title && <h1 className="text-xl sm:text-2xl font-bold text-[#1A2332] tracking-tight">{title}</h1>}
            {subtitle && <p className="text-xs sm:text-sm text-[#5A6A7E] mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
