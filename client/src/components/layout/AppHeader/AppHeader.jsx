import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { FiUser, FiLogOut, FiSearch, FiMenu, FiShield, FiSun, FiMoon, FiRefreshCw } from 'react-icons/fi';
import { ROLE_LABELS } from '../../../constants/roles';
import { cloudSync } from '../../../api/cloudSync';

export const AppHeader = ({ onToggleSidebar, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    try {
      await cloudSync.pull();
      window.location.reload();
    } catch (err) {
      console.warn('Sync refresh warning:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  return (
    <header className="relative h-16 bg-[#0B223D] text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs border-b-2 border-[#D4AF37]">
      {/* Top Indian Government Tricolor Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-[#FFFFFF]" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#162B44] transition cursor-pointer border border-[#1E3A5F]"
          title="Toggle Navigation Sidebar"
        >
          <FiMenu className="text-xl" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/up-govt-seal.png"
            alt="UP Govt Seal"
            className="w-9 h-9 object-contain bg-[#071A2F] rounded-full p-0.5 border border-[#D4AF37]"
          />
          <img
            src="/up-police-logo.png"
            alt="UP Police Logo"
            className="w-9 h-9 object-contain bg-[#071A2F] rounded-full p-0.5 border border-[#D4AF37]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-wider text-white leading-tight font-serif uppercase">SafeED-UP</h1>
              <span className="bg-[#D4AF37] text-[#071A2F] font-black text-[8px] px-1.5 py-0.2 rounded uppercase">UP POLICE</span>
            </div>
            <p className="text-[10px] text-[#D4AF37] tracking-wide uppercase font-bold">"{t('motto')}"</p>
          </div>
        </div>
      </div>

      {/* Center Search Bar trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <button
          onClick={onOpenSearch}
          className="w-full bg-[#162B44] hover:bg-[#1E3A5F] text-slate-300 text-xs px-3 py-2 rounded-lg border border-[#1E3A5F] flex items-center justify-between cursor-pointer transition shadow-xs"
        >
          <span className="flex items-center gap-2">
            <FiSearch className="text-[#D4AF37]" />
            <span>{t('searchPlaceholder')}</span>
          </span>
          <kbd className="bg-[#071A2F] px-1.5 py-0.5 rounded text-[10px] text-[#D4AF37] font-mono border border-[#D4AF37]/40">Ctrl + K</kbd>
        </button>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh / Sync Data Button */}
        <button
          onClick={handleGlobalSync}
          disabled={isSyncing}
          title="Refresh & Sync Data with MongoDB Atlas"
          className="p-2 rounded-lg border border-[#1E3A5F] text-[#D4AF37] hover:bg-[#162B44] hover:border-[#D4AF37] transition cursor-pointer flex items-center justify-center disabled:opacity-60"
        >
          <FiRefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="p-2 rounded-lg border border-[#1E3A5F] text-amber-300 hover:bg-[#162B44] transition cursor-pointer"
        >
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#162B44] cursor-pointer text-left border border-[#1E3A5F]"
          >
            <div className="w-8 h-8 rounded-full bg-[#071A2F] text-[#D4AF37] flex items-center justify-center font-black text-xs border border-[#D4AF37] shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
              <p className="text-[10px] text-[#D4AF37] font-semibold mt-0.5">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-[#0B223D] text-white rounded-xl shadow-2xl border-t-4 border-t-[#D4AF37] border-x border-b border-[#1E3A5F] py-1 z-50">
              <div className="px-4 py-2.5 border-b border-[#1E3A5F] bg-[#162B44]">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-block text-[9px] font-black px-2 py-0.5 rounded bg-[#071A2F] text-[#D4AF37] uppercase">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-bold"
              >
                <FiLogOut /> {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
