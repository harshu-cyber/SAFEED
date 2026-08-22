import React, { useState, useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';

const GlobalSecurityProtection = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      setShowWarning(true);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => setShowWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  return (
    <>
      {showWarning && (
        <div className="fixed top-5 right-5 z-[99999] animate-bounce bg-[#0F2038] text-white border-2 border-[#D4AF37] p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm pointer-events-none select-none">
          <div className="p-2 bg-rose-600 rounded-full text-white text-xl flex-shrink-0">
            🚨
          </div>
          <div>
            <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
              Security Notice / सुरक्षा चेतावनी
            </p>
            <p className="text-[11px] text-slate-200 font-medium leading-tight mt-0.5">
              Right-click is disabled on UP Police Official Portal.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalSecurityProtection />
      <AppRouter />
    </ErrorBoundary>
  );
}
