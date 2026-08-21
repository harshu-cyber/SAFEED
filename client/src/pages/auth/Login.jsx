import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/common/Button/Button';
import { ROLES } from '../../constants/roles';
import { FiChevronDown, FiChevronUp, FiUser, FiShield, FiArrowLeft, FiImage, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useLoginSound } from '../../hooks/useLoginSound';



const generateCaptchaCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { playLoginSuccess } = useLoginSound();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const canvasRef = useRef(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (window.location.search.includes('session_expired=1')) {
      setError('Your session has expired. Please log in again.');
    }
  }, []);

  const drawCaptcha = useCallback((code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Fill background (white/off-white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Fine Grid Pattern
    ctx.strokeStyle = '#88a0e0';
    ctx.lineWidth = 0.6;

    for (let x = 0; x <= width; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Noise dots/pixels
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? '#000080' : '#1e3a8a';
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    // Random noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // Draw CAPTCHA characters
    ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
    ctx.textBaseline = 'middle';

    const charWidth = width / (code.length + 0.8);
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = (i + 0.6) * charWidth;
      const y = height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 0.25 - 0.12);

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#000080';
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    // Outer border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, []);

  useEffect(() => {
    drawCaptcha(captchaCode);
  }, [captchaCode, drawCaptcha]);

  const refreshCaptcha = useCallback(() => {
    const newCode = generateCaptchaCode();
    setCaptchaCode(newCode);
    setCaptchaInput('');
    setCaptchaError('');
  }, []);

  const onSubmit = async (data) => {
    setError('');
    setCaptchaError('');

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('Invalid CAPTCHA code. Please try again.');
      refreshCaptcha();
      return;
    }

    try {
      const user = await login(data);

      // 🔊 Command-center confirmation chime — plays once on success
      playLoginSuccess();

      const portalTarget = user.assignedPortal || user.role;

      if (portalTarget === 'SUPER_ADMIN' || user.role === ROLES.SUPER_ADMIN) {
        navigate('/dashboard/super-admin');
      } else if (portalTarget === 'DISTRICT_ADMIN' || user.role === ROLES.DISTRICT_ADMIN) {
        navigate('/dashboard/district-admin');
      } else if (portalTarget === 'INSPECTION_OFFICER' || user.role === ROLES.INSPECTION_OFFICER || user.role === ROLES.POLICE_OFFICER) {
        navigate('/dashboard/inspector');
      } else {
        switch (user.role) {
          case ROLES.STATE_ADMIN:
            navigate('/dashboard/state-admin');
            break;
          case ROLES.SCHOOL_ADMIN:
          case ROLES.COACHING_ADMIN:
            navigate('/dashboard/institution');
            break;
          case ROLES.FIRE_OFFICER:
            navigate('/dashboard/fire');
            break;
          default:
            navigate('/dashboard/inspector');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials or register your institution first.');
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-600 text-rose-300 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* USERNAME FIELD */}
        <div className="flex items-center border border-slate-300 rounded overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <div className="bg-[#162B44] px-3 py-2.5 border-r border-[#1E3A5F] flex items-center justify-center text-[#D4AF37]">
            <FiUser size={16} />
          </div>
          <input
            type="email"
            {...register('email', { required: 'Email / Username is required' })}
            autoComplete="off"
            placeholder={t('usernameLabel')}
            className="w-full text-xs px-3 py-2 text-white bg-[#0B223D] outline-none font-semibold tracking-wider placeholder:text-slate-500 placeholder:font-normal"
          />
        </div>
        {errors.email && <p className="text-[10px] text-rose-600 font-medium -mt-2">{errors.email.message}</p>}

        {/* PASSWORD FIELD WITH EYE TOGGLE */}
        <div className="flex items-center border border-slate-300 rounded overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 relative">
          <div className="bg-[#162B44] px-3 py-2.5 border-r border-[#1E3A5F] flex items-center justify-center text-[#D4AF37]">
            <FiLock size={16} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required' })}
            autoComplete="current-password"
            placeholder={t('passwordLabel')}
            className="w-full text-xs px-3 py-2 pr-9 text-white bg-[#0B223D] outline-none tracking-wider placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#071A2F] transition-colors p-1 cursor-pointer"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-[10px] text-rose-600 font-medium -mt-2">{errors.password.message}</p>}

        {/* VISUAL IMAGE CAPTCHA */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center border border-slate-300 rounded overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <div className="bg-[#162B44] px-3 py-2.5 border-r border-[#1E3A5F] flex items-center justify-center text-[#D4AF37]">
              <FiImage size={16} />
            </div>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
              placeholder={t('captchaLabel')}
              className="w-full text-xs px-3 py-2 text-white bg-[#0B223D] outline-none"
            />
          </div>

          {/* Distorted Canvas Image + refresh link */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <canvas
              ref={canvasRef}
              width={150}
              height={40}
              onClick={refreshCaptcha}
              title="Click to refresh Captcha"
              className="cursor-pointer shadow-sm"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              className="text-[#3b82f6] hover:text-blue-700 text-sm italic font-serif cursor-pointer hover:underline"
            >
              {t('refreshCaptcha')}
            </button>
          </div>

          {captchaError && (
            <p className="text-[10px] text-rose-600 font-bold text-center">
              {captchaError}
            </p>
          )}
        </div>

        {/* ACTION BUTTONS (DYNAMIC LOGIN & RESET) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#ff9900] hover:bg-[#e68a00] text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow cursor-pointer uppercase tracking-wide"
          >
            {isSubmitting ? '...' : t('loginBtn')}
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', '');
              setValue('password', '');
              setCaptchaInput('');
              setCaptchaError('');
              refreshCaptcha();
            }}
            className="bg-[#ff4d4d] hover:bg-[#e63939] text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow cursor-pointer uppercase tracking-wide"
          >
            {t('resetBtn')}
          </button>
        </div>

        {/* FORGOT PASSWORD LINK */}
        <div className="text-center pt-2">
          <Link to="/auth/forgot-password" className="text-xs text-slate-400 hover:text-[#D4AF37] font-semibold hover:underline">
            {t('forgotPasswordBtn')}
          </Link>
        </div>
      </form>

      <div className="mt-4 pt-3 border-t border-[#1E3A5F] text-center">
        <p className="text-xs text-[#CBD5E1]">
          {t('newInstitutionAdmin')}{' '}
          <Link to="/auth/register" className="text-[#D4AF37] font-bold hover:underline">
            {t('registerAccountLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};
