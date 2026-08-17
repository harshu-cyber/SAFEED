import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiClock, FiPhone, FiAlertCircle, FiShield, FiUserCheck, FiMenu, FiX, FiArrowLeft, FiSun, FiMoon } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IndianFlag3DBackground } from '../components/common/IndianFlag3DBackground';

export const PublicLayout = () => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [dateTime, setDateTime] = useState('');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('safeed_font_size') || 'md'); // sm, md, lg
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('safeed_font_size', fontSize);
    const root = document.documentElement;
    if (fontSize === 'sm') {
      root.style.fontSize = '90%';
    } else if (fontSize === 'lg') {
      root.style.fontSize = '110%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [fontSize]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateTime(now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  const navItems = [
    { label: t('navHome'), path: '/' },
    { label: t('navAbout'), path: '/about' },
    { label: t('navHowItWorks'), path: '/how-it-works' },
    { label: t('navFaqs'), path: '/faqs' },
    { label: t('navReportConcern'), path: '/submit-concern' },
    { label: t('navContact'), path: '/contact' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all ${theme === 'light' ? 'bg-slate-100 text-[#071A2F]' : 'bg-[#071A2F] text-white'}`}>
      {/* 1. TOP UTILITY BAR (Accessibility & Language Switcher Bar) */}
      <div className={`${theme === 'light' ? 'bg-white border-b border-slate-200 text-slate-700' : 'bg-[#07111E] text-slate-300'} text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#D4AF37]/30 flex flex-wrap justify-between items-center gap-2`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-slate-300 font-semibold text-[10px] sm:text-xs">
            <FiClock className="text-[#D4AF37]" /> {dateTime}
          </span>
          <span className="hidden md:inline-block text-slate-600">|</span>
          <span className="hidden lg:inline-block font-bold text-[#D4AF37] tracking-wide text-xs">
            {t('govtTitle')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Enhanced Font Size Adjuster Control (Segmented Pill Design) */}
          <div className="flex items-center bg-[#060D17] border border-[#D4AF37]/40 p-0.5 rounded-lg shadow-inner">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setFontSize('sm')}
                title={lang === 'hi' ? 'छोटा अक्षर (Decrease Text Size)' : 'Decrease Text Size (A-)'}
                className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] transition-all cursor-pointer ${
                  fontSize === 'sm'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('md')}
                title={lang === 'hi' ? 'सामान्य अक्षर (Default Text Size)' : 'Default Text Size (A)'}
                className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] transition-all cursor-pointer ${
                  fontSize === 'md'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                title={lang === 'hi' ? 'बड़ा अक्षर (Increase Text Size)' : 'Increase Text Size (A+)'}
                className={`px-2.5 py-0.5 rounded-md font-extrabold text-[11px] transition-all cursor-pointer ${
                  fontSize === 'lg'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                A+
              </button>
            </div>
          </div>

          {/* Theme Toggle Button — Icon Only */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer border transition-all ${
              theme === 'dark'
                ? 'bg-[#162B44] text-amber-300 border-[#D4AF37]/40 hover:bg-[#1E3A5F]'
                : 'bg-slate-200 text-[#071A2F] border-slate-300 hover:bg-slate-300'
            }`}
          >
            {theme === 'dark' ? <FiSun size={13} /> : <FiMoon size={13} />}
          </button>

          {/* Dynamic Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-[#071A2F] px-3 py-0.5 rounded-md font-black text-[10px] sm:text-xs cursor-pointer shadow-md flex items-center gap-1 border border-amber-300 uppercase tracking-wider"
            title="Switch Language / भाषा बदलें"
          >
            <span className="w-2 h-2 rounded-full bg-[#071A2F] animate-ping" />
            {lang === 'hi' ? 'English Version' : 'हिंदी संस्करण'}
          </button>

          <Link
            to="/auth/login"
            className="bg-[#1E3A5F] hover:bg-[#2D5F9E] text-white px-3 py-0.5 rounded-md font-bold text-[10px] sm:text-xs border border-[#D4AF37]/50 shadow-md flex items-center gap-1"
          >
            <FiUserCheck size={12} /> {t('officialLogin')}
          </Link>
        </div>
      </div>

      {/* 2. OFFICIAL BRANDING HEADER (UP Police & UP Govt Dual Emblem Header) */}
      <header className={`${theme === 'dark' ? 'bg-[#0B223D] text-white' : 'bg-white text-[#071A2F]'} py-3.5 px-4 sm:px-8 shadow-sm border-b-4 border-[#D4AF37] relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative z-10">
          {/* Logo Duo & Brand Title */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-4 text-left group">
              <img
                src="/up-govt-seal.png"
                alt="UP Govt Seal"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain bg-[#071A2F] rounded-full p-1 border-2 border-[#D4AF37] shadow-lg flex-shrink-0"
              />
              <div className="h-10 w-px bg-[#D4AF37]/40 hidden sm:block" />
              <img
                src="/up-police-logo.png"
                alt="UP Police Emblem"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain bg-[#071A2F] rounded-full p-1 border-2 border-[#D4AF37] shadow-lg flex-shrink-0"
              />
              <div className="pl-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`text-xl sm:text-2xl font-black tracking-wider uppercase font-serif ${theme === 'dark' ? 'text-white' : 'text-[#071A2F]'}`}>
                    SafeED-UP
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#D4AF37] font-bold tracking-wide uppercase mt-0.5">
                  "{t('motto')}"
                </p>
                <p className={`text-[10px] hidden sm:block font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('govtSubtitle')}
                </p>
              </div>
            </Link>

            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white bg-[#162B44] rounded-lg border border-[#D4AF37] focus:outline-none"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>

          {/* Right Corner Emblem — Ashok Stambh (State Emblem of India) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-serif">
                सत्यमेव जयते
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                भारत सरकार • GOVT OF INDIA
              </p>
            </div>
            <img
              src="/ashok-stambh.png"
              alt="Ashok Stambh Emblem"
              className="w-12 h-14 sm:w-14 sm:h-16 object-contain bg-[#071A2F] rounded-2xl p-1 border-2 border-[#D4AF37] shadow-xl flex-shrink-0"
            />
          </div>
        </div>
      </header>

      {/* 3. NAVIGATION MENU BAR (Desktop & Mobile Responsive) */}
      <nav className={`${theme === 'dark' ? 'bg-[#0B223D] text-white border-[#1E3A5F]' : 'bg-white text-[#071A2F] border-slate-200'} border-b-2 shadow-xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 text-xs font-semibold">
            {navItems.map((nav) => {
              const isActive = location.pathname === nav.path;
              return (
                <Link
                  key={nav.path}
                  to={nav.path}
                  className={`px-3.5 py-2 rounded-md transition whitespace-nowrap text-xs font-bold ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#071A2F] shadow-sm'
                      : theme === 'dark'
                        ? 'hover:bg-[#162B44] text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {nav.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Collapsible Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 space-y-1 border-t border-slate-800">
              {navItems.map((nav) => {
                const isActive = location.pathname === nav.path;
                return (
                  <Link
                    key={nav.path}
                    to={nav.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#071A2F]'
                        : 'text-slate-300 hover:bg-[#1E3A5F]'
                    }`}
                  >
                    {nav.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 4. LIVE NOTICE TICKER BAR */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] text-[#071A2F] text-xs py-1.5 px-4 font-bold flex items-center gap-3 border-b border-amber-600 shadow-sm">
        <span className="bg-[#071A2F] text-[#D4AF37] px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-widest flex-shrink-0 flex items-center gap-1">
          <FiAlertCircle className="animate-bounce" /> {t('urgentNotice')}
        </span>
        <marquee className="font-bold text-xs text-[#071A2F] tracking-wide">
          {t('tickerMessage')}
        </marquee>
      </div>

      {/* MAIN PUBLIC CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 5. OFFICIAL FOOTER */}
      <footer className={`${theme === 'dark' ? 'bg-[#060D17] text-slate-400' : 'bg-slate-100 text-slate-600'} text-xs pt-10 pb-6 px-6 border-t-4 border-[#D4AF37]`}>
        <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'} pb-8 text-left`}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/up-govt-seal.png" alt="UP Govt" className="w-10 h-10 object-contain bg-[#071A2F] rounded-full p-0.5 border border-[#D4AF37]" />
              <img src="/up-police-logo.png" alt="UP Police" className="w-10 h-10 object-contain bg-[#071A2F] rounded-full p-0.5 border border-[#D4AF37]" />
              <div>
                <h4 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">{t('footerAuthority')}</h4>
                <p className="text-[10px] text-slate-300 font-bold">{t('footerAuthoritySub')}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('footerDesc')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-3">{t('footerQuickLinks')}</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {navItems.map(item => (
                <li key={item.path}><Link to={item.path} className="hover:text-[#D4AF37]">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-3">{t('footerHelplines')}</h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li>{t('policeEmergency')}: <strong className="text-white bg-rose-900/80 px-1.5 py-0.5 rounded border border-rose-600">112</strong></li>
              <li>{t('fireHelpline')}: <strong className="text-white bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-600">101</strong></li>
              <li>{t('womenPowerline')}: <strong className="text-white bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-600">1090</strong></li>
              <li>{t('cyberCrime')}: <strong className="text-white bg-sky-900/80 px-1.5 py-0.5 rounded border border-sky-600">1930</strong></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-3">{t('footerCompliance')}</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><Link to="/faqs" className="hover:text-[#D4AF37]">FAQs &amp; Help</Link></li>
              <li><Link to="/contact" className="hover:text-[#D4AF37]">Support Directory</Link></li>
              <li className="pt-2 text-[11px] text-slate-400">
                {t('motto')}: <strong className="text-[#D4AF37]">"{t('motto')}"</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} {t('footerCopy')}
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#0A1628] border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-[#D4AF37]">NIC Standard Compliant</span>
            <span className="bg-[#0A1628] border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">UP Police Cloud Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const AuthLayout = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#071A2F] text-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* 3D Indian Flag Background */}
      <IndianFlag3DBackground />

      {/* Top Indian Government Tricolor Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 flex shadow-md">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-[#FFFFFF]" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* Floating Return Button */}
      <div className="absolute top-5 left-4 sm:top-7 sm:left-6 z-30">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#071A2F] text-[#D4AF37] font-black text-xs uppercase tracking-wider shadow-lg border-2 border-[#D4AF37] hover:scale-105 hover:bg-[#1E3A5F] transition-all duration-300 cursor-pointer"
        >
          <FiArrowLeft className="text-[#D4AF37] group-hover:-translate-x-1 transition-transform" size={15} />
          <span>Return to Main Portal</span>
        </Link>
      </div>

      {/* Official Government Header — UP Police Emblem & Bilingual Titles */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-4 mt-6">
        <img
          src="/up-police-logo.png"
          alt="UP Police Emblem"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2.5 bg-[#071A2F]/90 rounded-full p-1 border-2 border-[#D4AF37] shadow-xl hover:scale-105 transition-transform duration-300"
        />
        <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest font-serif">
          उत्तर प्रदेश शासन — उत्तर प्रदेश पुलिस
        </p>
        <h2 className="text-xl sm:text-2xl font-black text-[#D4AF37] tracking-wider font-serif uppercase mt-0.5">
          SafeED-UP Security Gateway
        </h2>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">
          Educational Safety &amp; Compliance Portal
        </p>
      </div>

      {/* Main Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md w-full relative z-10">
        <div className="bg-[#0B223D]/90 backdrop-blur-md py-6 px-6 sm:px-8 shadow-2xl rounded-2xl border-t-4 border-t-[#D4AF37] border-x border-b border-[#1E3A5F] relative overflow-hidden">
          <div className="relative z-10">
            <Outlet />
          </div>

          {/* SSL Security Footer Badge */}
          <div className="mt-5 pt-3 border-t border-[#1E3A5F] text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
            <span className="text-emerald-600">🔒</span>
            <span>256-Bit SSL Encrypted Official Government Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};
