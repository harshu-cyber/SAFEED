import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { institutionApi } from '../../api/apiServices';
import {
  FiSearch, FiShield, FiCheckCircle, FiPhone, FiAlertTriangle,
  FiFileText, FiAward, FiLock, FiClock, FiArrowRight, FiCheck,
  FiUsers, FiMapPin, FiDownload, FiExternalLink, FiHelpCircle, FiCamera, FiRadio, FiPhoneCall,
  FiChevronLeft, FiChevronRight, FiMaximize2, FiX
} from 'react-icons/fi';
import { MdVerified, MdLocalFireDepartment, MdLocalPolice, MdOutlineSchool, MdSecurity, MdShield, MdQrCode2, MdOutlineSecurity } from 'react-icons/md';
import { CameraQrScanner } from '../../components/scanner/CameraQrScanner';
import { IndianFlag3DBackground } from '../../components/common/IndianFlag3DBackground';

export const Landing = () => {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const dk = theme === 'dark';
  // dk = dark mode; use it to switch classes: dk ? 'dark-class' : 'light-class'
  const [safeIdInput, setSafeIdInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const navigate = useNavigate();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Automatic Horizontal Swiping Slides Carousel Data & State
  const slides = [
    {
      id: 1,
      src: '/slides/slide-1.jpg',
      title: 'SAFEED-UP Digital Revolution Platform',
      subtitle: 'Building a Safer Uttar Pradesh — Safe Education & Facility Environment',
      badge: 'OFFICIAL PLATFORM INFOGRAPHIC',
    },
    {
      id: 2,
      src: '/slides/slide-2.jpg',
      title: 'Aliganj Coaching Tragedy — Wake-Up Call & Prevention Workflow',
      subtitle: 'How SAFEED-UP Ensures Institutional Safety Compliance & Expiry Alerts',
      badge: 'SAFETY TRAGEDY & SOLUTION WORKFLOW',
    },
    {
      id: 3,
      src: '/slides/slide-3.jpg',
      title: 'Uttar Pradesh Police Headquarters — Signature Building Lucknow',
      subtitle: 'State Command Control Centre for 75 District Police Commissionerates',
      badge: 'STATE POLICE HQ LUCKNOW',
    },
    {
      id: 4,
      src: '/slides/slide-4.jpg',
      title: 'UP Police Tactical & Counter-Terror Security Commandos',
      subtitle: '24x7 High-Priority Security & Emergency Preparedness Response',
      badge: 'TACTICAL SECURITY FORCE',
    },
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Auto-slide effect every 3.5 seconds
  useEffect(() => {
    if (isPaused || lightboxImage) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, lightboxImage, slides.length]);

  const [liveStats, setLiveStats] = useState({
    totalInstitutions: 39261,
    policeVerified: 38903,
    fireCertified: 34120,
    safeIdIssued: 38903,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchRealTimeStats = async () => {
      try {
        const res = await institutionApi.getPublicStats();
        if (res.data?.data && isMounted) {
          const data = res.data.data;
          setLiveStats({
            totalInstitutions: data.totalInstitutions || 39261,
            policeVerified: data.policeVerified || 38903,
            fireCertified: data.fireCertified || 34120,
            safeIdIssued: data.safeIdIssued || 38903,
            loading: false,
          });
        }
      } catch (err) {
        console.warn('Real-time stats fetch fallback to local cache:', err);
        if (isMounted) setLiveStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 15000); // 15s real-time refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (safeIdInput.trim()) {
      navigate(`/verify/${safeIdInput.trim()}`);
    }
  };

  return (
    <div className={`relative space-y-12 pb-20 min-h-screen ${dk ? 'bg-[#071A2F]' : 'bg-[#F4F6F9]'}`}>
      {/* 3D Real-Time Waving Indian Flag Background Watermark */}
      <IndianFlag3DBackground />

      {/* 1. HERO SECTION WITH POLICE EMBLEMS */}
      <section className={`${dk ? 'bg-[#071A2F]/85 text-white' : 'bg-gradient-to-br from-[#E8F0FF] to-[#F4F6F9] text-[#071A2F]'} backdrop-blur-md py-12 sm:py-16 px-4 sm:px-6 text-center shadow-md relative overflow-hidden border-b-4 border-[#D4AF37] z-10`}>
        {/* Top Indian Government Tricolor Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 z-50 flex shadow-md">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-[#FFFFFF]" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>
        {/* Background Watermarks (Side Seals) */}
        <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block pointer-events-none rounded-full p-2 z-0">
          <img src="/up-govt-seal.png" alt="UP Seal Watermark" className="w-72 h-72 xl:w-96 xl:h-96 object-contain rounded-full pointer-events-none" />
        </div>
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block pointer-events-none rounded-full p-2 z-0">
          <img src="/up-police-logo.png" alt="UP Police Watermark" className="w-72 h-72 xl:w-96 xl:h-96 object-contain rounded-full pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 relative z-20">
          {/* Official Seals Header Row */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/up-govt-seal.png" alt="UP Govt Seal" className="w-14 h-14 sm:w-16 sm:h-16 object-contain bg-[#0B223D]/90 backdrop-blur-md rounded-full p-1 border-2 border-[#D4AF37] shadow-xl" />
            <img src="/up-police-logo.png" alt="UP Police Crest" className="w-14 h-14 sm:w-16 sm:h-16 object-contain bg-[#0B223D]/90 backdrop-blur-md rounded-full p-1 border-2 border-[#D4AF37] shadow-xl" />
          </div>

          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 bg-[#071A2F]/95 backdrop-blur-md border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
            <img src="/up-police-logo.png" alt="UP Police Badge" className="w-5 h-5 object-contain bg-[#0B223D] rounded-full p-0.5" />
            {t('badgeTitle')}
          </div>

          {/* Main Hero Headline */}
          <h1 className={`text-3xl sm:text-6xl font-black tracking-wider leading-tight uppercase font-serif ${dk ? 'text-white' : 'text-[#071A2F]'}`}>
            {t('heroHeading')}
          </h1>
          <p className="text-xl sm:text-3xl font-black text-[#D4AF37] font-sans tracking-wide">
            {t('heroTagline')}
          </p>
          <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-semibold ${dk ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('heroDesc')}
          </p>

          {/* Institution Registration CTA inside Hero — HIGH OPACITY (85%) & STRONG BLUR (3xl) */}
          <div className="pt-4 sm:pt-6 max-w-3xl mx-auto relative z-30">
            <div className={`${dk ? 'bg-[#0B223D]/85 text-white ring-1 ring-white/20 shadow-[0_12px_40px_0_rgba(0,0,0,0.7)]' : 'bg-white text-[#071A2F] shadow-xl'} backdrop-blur-3xl border-2 border-[#D4AF37] rounded-3xl p-5 sm:p-6 relative z-30`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">UP Government — Home Department</p>
                  <h2 className="text-base sm:text-xl font-black font-serif uppercase text-white">Register Your Institution</h2>
                  <p className="text-[11px] text-slate-300 font-bold mt-0.5">संस्थान पंजीकरण — सुरक्षा प्रमाण पत्र प्राप्त करें</p>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-emerald-800 bg-emerald-100/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Open FY 2026–27
                </span>
              </div>

              {/* 4 Steps inline — FROSTED GLASS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {[
                  { n: '01', icon: MdOutlineSchool, label: 'Create Account', sub: 'खाता बनाएं', color: 'text-[#D4AF37] bg-[#071A2F]/80 border-[#D4AF37]/80' },
                  { n: '02', icon: FiFileText, label: 'Upload Docs', sub: 'दस्तावेज़ अपलोड', color: 'text-sky-300 bg-[#071A2F]/80 border-sky-600/80' },
                  { n: '03', icon: MdLocalPolice, label: 'Inspector Visits', sub: 'निरीक्षण', color: 'text-emerald-300 bg-[#071A2F]/80 border-emerald-600/80' },
                  { n: '04', icon: MdVerified, label: 'Get SafeID & QR', sub: 'प्रमाण पत्र', color: 'text-rose-300 bg-[#071A2F]/80 border-rose-600/80' },
                ].map(({ n, icon: Icon, label, sub, color }) => (
                  <div key={n} className={`rounded-xl border-2 p-2.5 flex flex-col gap-1 shadow-inner backdrop-blur-md transition-transform hover:-translate-y-0.5 ${color}`}>
                    <div className="flex items-center justify-between">
                      <Icon size={16} />
                      <span className="text-lg font-black opacity-30 font-mono leading-none">{n}</span>
                    </div>
                    <p className="text-[11px] font-black text-white text-left">{label}</p>
                    <p className="text-[9px] font-bold text-left opacity-80">{sub}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons — EXPLICIT RELATIVE Z-30 POINTER-EVENTS-AUTO */}
              <div className="flex flex-col sm:flex-row gap-2 relative z-30">
                <Link
                  to="/auth/register"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#071A2F] text-[#D4AF37] font-black text-xs px-5 py-3 rounded-xl shadow-xl hover:bg-[#1E3A5F] hover:scale-[1.01] transition-all uppercase tracking-wider cursor-pointer border-2 border-[#D4AF37] relative z-30 pointer-events-auto"
                >
                  <MdOutlineSchool size={16} />
                  Register Institution — अभी पंजीकरण करें
                  <FiArrowRight size={14} />
                </Link>
                <Link
                  to="/auth/login"
                  className="flex items-center justify-center gap-1.5 text-[#D4AF37] hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer px-4 py-3 rounded-xl border-2 border-[#D4AF37]/60 hover:border-[#D4AF37] bg-[#162B44] hover:bg-[#1E3A5F] relative z-30 pointer-events-auto"
                >
                  Already registered? Login →
                </Link>
              </div>
              <p className={`text-[9px] mt-2 text-center font-medium ${dk ? 'text-slate-300' : 'text-slate-500'}`}>🔒 FREE Registration • School / Coaching / College Admins • Verified by UP Police</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LEADERSHIP BANNER — PM / CM / DGP — GLASSMORPHISM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-20">
        <div className={`${dk ? 'bg-[#0B223D]/80 text-white ring-1 ring-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]' : 'bg-white text-[#071A2F] shadow-xl'} backdrop-blur-3xl rounded-3xl border-2 border-[#D4AF37] overflow-hidden`}>

          {/* Top Label */}
          <div className="bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/up-govt-seal.png" alt="UP Govt" className="w-6 h-6 object-contain bg-[#0B223D] rounded-full p-0.5 border border-[#D4AF37]" />
              <span className="text-[10px] font-black text-[#07111E] uppercase tracking-widest">Under the Vision of Our Leaders — SafeED-UP Mission</span>
            </div>
            <img src="/up-police-logo.png" alt="UP Police" className="w-6 h-6 object-contain bg-[#0B223D] rounded-full p-0.5 border border-[#D4AF37]" />
          </div>

          {/* 3 Leader Cards — Horizontal */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x ${dk ? 'divide-[#1E3A5F] bg-[#0B223D]/60' : 'divide-slate-200 bg-white'} backdrop-blur-xl`}>

            {/* PM Modi */}
            <div className={`flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0 p-5 sm:p-6 text-center group ${dk ? 'hover:bg-[#162B44]/80' : 'hover:bg-slate-50'} backdrop-blur-md transition-all`}>
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-lg mx-auto">
                  <img src="/pm-modi.jpg" alt="PM Modi" className="w-full h-full object-cover object-top" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center border-2 border-[#0B223D] text-[8px] font-black text-[#07111E]">
                  PM
                </div>
              </div>
              <div className="sm:mt-4 text-left sm:text-center">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest sm:text-center">Hon'ble Prime Minister</p>
                <h3 className={`text-base sm:text-xl font-black font-serif mt-0.5 ${dk ? 'text-white' : 'text-[#071A2F]'}`}>Shri Narendra Modi</h3>
                <p className={`text-[10px] font-bold mt-0.5 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>Government of India</p>
                <div className="hidden sm:block mt-2 w-8 h-0.5 bg-[#D4AF37] mx-auto" />
                <p className={`text-[9px] font-medium mt-2 hidden sm:block max-w-[180px] leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  "Every child deserves a safe school. SafeED-UP ensures institutions meet safety standards."
                </p>
              </div>
            </div>

            {/* CM Yogi — CENTER (highlighted) */}
            <div className={`flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0 p-5 sm:p-6 text-center group backdrop-blur-md transition-all relative ${dk ? 'hover:bg-[#1A2B20]/70 bg-[#D4AF37]/10' : 'hover:bg-amber-50 bg-amber-50/60'}`}>
              <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0 w-16 h-0.5 bg-[#D4AF37]" />
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-xl mx-auto ring-4 ring-amber-400/30">
                  <img src="/cm-yogi.jpg" alt="CM Yogi Adityanath" className="w-full h-full object-cover object-top" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center border-2 border-[#0B223D] text-[7px] font-black text-[#07111E]">
                  CM
                </div>
              </div>
              <div className="sm:mt-4 text-left sm:text-center">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Hon'ble Chief Minister</p>
                <h3 className={`text-base sm:text-xl font-black font-serif mt-0.5 ${dk ? 'text-white' : 'text-[#071A2F]'}`}>Yogi Adityanath</h3>
                <p className={`text-[10px] font-bold mt-0.5 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>Uttar Pradesh</p>
                <div className="hidden sm:block mt-2 w-8 h-0.5 bg-[#D4AF37] mx-auto" />
                <p className={`text-[9px] font-medium mt-2 hidden sm:block max-w-[180px] leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  "SafeED-UP — a landmark initiative to secure every educational institution in UP."
                </p>
              </div>
            </div>

            {/* DGP Rajeev Krishna */}
            <div className={`flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0 p-5 sm:p-6 text-center group ${dk ? 'hover:bg-[#162B44]/80' : 'hover:bg-slate-50'} backdrop-blur-md transition-all`}>
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-lg mx-auto">
                  <img src="/dgp-rajeev.jpg" alt="DGP Rajeev Krishna" className="w-full h-full object-cover object-top" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center border-2 border-[#0B223D] text-[6px] font-black text-[#07111E]">
                  DGP
                </div>
              </div>
              <div className="sm:mt-4 text-left sm:text-center">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Director General of Police</p>
                <h3 className={`text-base sm:text-xl font-black font-serif mt-0.5 ${dk ? 'text-white' : 'text-[#071A2F]'}`}>Rajeev Krishna IPS</h3>
                <p className={`text-[10px] font-bold mt-0.5 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>D.G.P. Uttar Pradesh</p>
                <div className="hidden sm:block mt-2 w-8 h-0.5 bg-[#D4AF37] mx-auto" />
                <p className={`text-[9px] font-medium mt-2 hidden sm:block max-w-[180px] leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                  "UP Police leads safety inspections of all schools & coaching institutes statewide."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. UTTAR PRADESH POLICE OFFICIAL SAFETY GALLERY & AUTO-SWIPING CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="text-center mb-6 sm:mb-8">
          <span className={`${dk ? 'bg-[#071A2F]/90' : 'bg-white'} backdrop-blur-md text-[#D4AF37] font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest border-2 border-[#D4AF37] shadow-lg`}>
            {t('galleryBadge')}
          </span>
          <h2 className={`text-2xl sm:text-4xl font-black mt-3 font-serif uppercase tracking-tight ${dk ? 'text-white' : 'text-[#071A2F]'}`}>
            {t('galleryHeading')}
          </h2>
          <p className={`text-xs sm:text-sm max-w-2xl mx-auto mt-1.5 font-medium ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('gallerySub')}
          </p>
        </div>

        {/* HORIZONTAL SWIPING CAROUSEL FRAME */}
        <div
          className={`relative ${dk ? 'bg-gradient-to-b from-[#07111E]/80 via-[#071A2F]/70 to-[#0A182B]/90' : 'bg-white'} backdrop-blur-3xl rounded-3xl border-4 border-[#D4AF37] shadow-2xl overflow-hidden group select-none`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top Tricolor Bar Accent */}
          <div className="h-1.5 w-full flex">
            <div className="h-full w-1/3 bg-[#FF9933]" />
            <div className="h-full w-1/3 bg-[#FFFFFF]" />
            <div className="h-full w-1/3 bg-[#138808]" />
          </div>

          {/* Carousel Top HUD */}
          <div className={`px-5 py-3 ${dk ? 'bg-[#07111E]/90 text-white' : 'bg-slate-100 text-[#071A2F]'} backdrop-blur-md border-b border-[#D4AF37]/30 flex items-center justify-between text-xs z-20 relative`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-wider font-serif">
                {slides[currentSlideIndex].badge}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isPaused && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                  PAUSED (HOVERING)
                </span>
              )}
              <span className="font-mono text-[11px] font-bold text-[#D4AF37] bg-[#071A2F]/90 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/40">
                0{currentSlideIndex + 1} / 0{slides.length}
              </span>
              <button
                onClick={() => setLightboxImage(slides[currentSlideIndex].src)}
                className="inline-flex items-center gap-1 text-[10px] font-black bg-[#D4AF37] text-[#07111E] px-2.5 py-1 rounded-md hover:bg-amber-300 transition cursor-pointer shadow relative z-30 pointer-events-auto"
                title="Click to view full screen"
              >
                <FiMaximize2 size={12} />
                <span className="hidden sm:inline">FULLSCREEN ZOOM</span>
              </button>
            </div>
          </div>

          {/* MAIN SLIDES TRACK CONTAINER */}
          <div className={`relative w-full overflow-hidden min-h-[380px] sm:min-h-[500px] flex items-center ${dk ? 'bg-[#050C15]/90' : 'bg-slate-100'}`}>
            <div
              className="flex w-full h-full transition-transform duration-700 ease-in-out cursor-pointer"
              style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
              onClick={() => setLightboxImage(slides[currentSlideIndex].src)}
            >
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="w-full flex-shrink-0 relative flex items-center justify-center p-2 sm:p-4 min-h-[380px] sm:min-h-[500px]"
                >
                  <img
                    src={slide.src}
                    alt={slide.title}
                    className="max-h-[380px] sm:max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                  />
                  {/* Subtle Gradient Overlay — dark mode only */}
                  {dk && <div className="absolute inset-0 bg-gradient-to-t from-[#07111E]/80 via-transparent to-transparent pointer-events-none rounded-xl" />}

                  {/* Slide Caption Bar */}
                  <div className={`absolute bottom-4 left-6 right-6 ${dk ? 'bg-[#07111E]/90 text-white' : 'bg-white/95 text-[#071A2F]'} border border-[#D4AF37]/50 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl pointer-events-none`}>
                    <h3 className="text-sm sm:text-lg font-black text-[#D4AF37] font-serif uppercase tracking-wide">
                      {slide.title}
                    </h3>
                    <p className={`text-[11px] sm:text-xs font-medium mt-0.5 ${dk ? 'text-slate-200' : 'text-slate-600'}`}>
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PREVIOUS SLIDE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#07111E]/90 backdrop-blur-md text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-[#D4AF37] hover:text-[#07111E] transition-all cursor-pointer pointer-events-auto"
              title="Previous Slide"
            >
              <FiChevronLeft size={24} />
            </button>

            {/* NEXT SLIDE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#07111E]/90 backdrop-blur-md text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-[#D4AF37] hover:text-[#07111E] transition-all cursor-pointer pointer-events-auto"
              title="Next Slide"
            >
              <FiChevronRight size={24} />
            </button>
          </div>

          {/* SLIDE DOT INDICATORS FOOTER */}
          <div className={`py-3 ${dk ? 'bg-[#07111E]/95' : 'bg-slate-100'} backdrop-blur-md border-t border-[#D4AF37]/30 flex items-center justify-center gap-2`}>
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer pointer-events-auto ${
                  currentSlideIndex === idx
                    ? 'w-8 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]'
                    : 'w-2.5 bg-slate-600 hover:bg-slate-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* FULLSCREEN LIGHTBOX MODAL */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md select-none"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-5 right-5 z-50 text-white bg-rose-600 hover:bg-rose-700 p-3 rounded-full border-2 border-white shadow-2xl cursor-pointer pointer-events-auto"
            >
              <FiX size={24} />
            </button>

            <div className="relative max-w-6xl max-h-[92vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxImage}
                alt="Enlarged Infographic"
                className="max-w-full max-h-[90vh] object-contain rounded-xl border-4 border-[#D4AF37] shadow-2xl"
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. MANDATORY WORKFLOW */}
      <section className={`${dk ? 'bg-[#071A2F]/90' : 'bg-white'} backdrop-blur-sm py-12 sm:py-14 px-4 sm:px-6 border-y ${dk ? 'border-[#1E3A5F]' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <span className="bg-amber-100/90 backdrop-blur-md text-amber-900 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest border border-amber-300">
              {t('auditSectionTitle')}
            </span>
            <h2 className={`text-xl sm:text-3xl font-black mt-3 font-serif ${dk ? 'text-white' : 'text-[#071A2F]'}`}>
              {t('auditSectionHeading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {[
              { step: '01', title: t('step1Title'), desc: t('step1Desc') },
              { step: '02', title: t('step2Title'), desc: t('step2Desc') },
              { step: '03', title: t('step3Title'), desc: t('step3Desc') },
              { step: '04', title: t('step4Title'), desc: t('step4Desc') },
              { step: '05', title: t('step5Title'), desc: t('step5Desc') },
            ].map((item) => (
              <div key={item.step} className={`${dk ? 'bg-[#0B223D]/80 border-[#1E3A5F]' : 'bg-white border-slate-200'} backdrop-blur-xl p-4 sm:p-5 rounded-2xl border text-center shadow-lg hover:border-[#D4AF37] transition-colors`}>
                <span className="text-2xl sm:text-3xl font-black text-[#D4AF37] font-mono block mb-1">{item.step}</span>
                <h4 className={`text-xs sm:text-sm font-black mb-1 font-serif ${dk ? 'text-white' : 'text-[#071A2F]'}`}>{item.title}</h4>
                <p className={`text-[11px] leading-snug ${dk ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. EMERGENCY DIRECTORY */}
      <section className={`${dk ? 'bg-gradient-to-r from-[#07111E]/95 via-[#071A2F]/90 to-[#07111E]/95 text-white' : 'bg-[#EEF2FF] text-[#071A2F]'} backdrop-blur-md py-10 sm:py-12 px-4 sm:px-6 border-y-4 border-[#D4AF37]`}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-xl sm:text-3xl font-black font-serif">{t('emergencyTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">{t('emergencySub')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {[
              { label: t('policeEmergency'), number: '112', bg: 'bg-rose-950/80 border-rose-600' },
              { label: t('fireHelpline'), number: '101', bg: 'bg-amber-950/80 border-amber-600' },
              { label: t('womenPowerline'), number: '1090', bg: 'bg-purple-950/80 border-purple-600' },
              { label: t('cyberCrime'), number: '1930', bg: 'bg-sky-950/80 border-sky-600' },
            ].map(({ label, number, bg }) => (
              <div key={number} className={`${bg} backdrop-blur-md p-3 sm:p-4 rounded-xl border-2 text-center text-white shadow-lg`}>
                <FiPhone size={18} className="mx-auto mb-1 text-[#D4AF37] animate-pulse" />
                <p className="text-[9px] font-bold text-slate-300 uppercase">{label}</p>
                <p className="text-lg sm:text-2xl font-black font-mono mt-0.5">{number}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Device Camera Scanner Modal */}
      <CameraQrScanner isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} />

      {/* QR MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B223D]/95 backdrop-blur-3xl rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-[#D4AF37] relative z-50">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-black bg-[#071A2F] rounded-full w-7 h-7 flex items-center justify-center cursor-pointer pointer-events-auto"
            >
              ✕
            </button>
            <div className="w-[#071A2F] h-14 bg-[#071A2F] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#D4AF37]">
              <MdQrCode2 size={30} />
            </div>
            <h3 className="text-base font-black text-white font-serif">Safe ID QR Code Simulator</h3>
            <div className="my-4 p-4 bg-[#07111E]/95 rounded-2xl border-2 border-[#D4AF37] text-white space-y-2">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=SAFE-UP-LKO-000001"
                alt="Safe ID QR"
                className="w-32 h-32 bg-white p-2 rounded-xl mx-auto border-2 border-[#D4AF37]"
              />
              <p className="font-mono text-xs font-black text-[#D4AF37]">SAFE-UP-LKO-000001</p>
              <span className="inline-block bg-emerald-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                ✓ VERIFIED SAFE INSTITUTION
              </span>
            </div>
            <Link
              to="/verify/SAFE-UP-LKO-000001"
              onClick={() => setShowQrModal(false)}
              className="w-full bg-[#071A2F] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs py-3 rounded-xl block hover:bg-[#1E3A5F] transition-colors uppercase tracking-wider pointer-events-auto"
            >
              Open Full Verification Report →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
