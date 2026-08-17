import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiFileText,
  FiShield, FiCheck, FiCopy, FiEye, FiEyeOff, FiAlertCircle
} from 'react-icons/fi';
import { MdOutlineSchool, MdVerified, MdLocalPolice } from 'react-icons/md';

const DISTRICTS = [
  'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Ghaziabad',
  'Meerut', 'Noida (Gautam Buddha Nagar)', 'Bareilly', 'Aligarh',
  'Moradabad', 'Saharanpur', 'Gorakhpur', 'Mathura', 'Jhansi',
];

const BOARDS = ['CBSE', 'ICSE / CISCE', 'UP Board (UPMSP)', 'NIOS', 'IB (International)', 'Other'];

// DCP Zone options — must match DCP officer zones exactly
const DCP_ZONES = [
  { value: 'WEST',    label: 'West Zone  (DCP West)    — पश्चिम क्षेत्र' },
  { value: 'CENTRAL', label: 'Central Zone (DCP Central) — केंद्रीय क्षेत्र' },
  { value: 'NORTH',   label: 'North Zone  (DCP North)   — उत्तर क्षेत्र' },
  { value: 'EAST',    label: 'East Zone   (DCP East)    — पूर्व क्षेत्र' },
  { value: 'SOUTH',   label: 'South Zone  (DCP South)   — दक्षिण क्षेत्र' },
];

// ✅ Credentials Popup Modal
const CredentialsPopup = ({ credentials, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCopy = () => {
    const text = `SafeED-UP Login Credentials\nUsername (Email): ${credentials.username}\nPassword (Mobile): ${credentials.password}\nSafe ID: ${credentials.safeId}\nPortal: http://localhost:5173/auth/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToLogin = async () => {
    try {
      await login({ email: credentials.username, password: credentials.password });
      navigate('/dashboard/institution');
    } catch {
      navigate('/auth/login');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B223D] max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-[#D4AF37] animate-fade-in text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07111E] to-[#071A2F] p-6 text-center text-white border-b-4 border-[#D4AF37]">
          <div className="flex justify-center gap-3 mb-3">
            <img src="/up-govt-seal.png" alt="UP Govt" className="w-10 h-10 object-contain bg-[#071A2F] rounded-full p-0.5 border-2 border-[#D4AF37]" />
            <img src="/up-police-logo.png" alt="UP Police" className="w-10 h-10 object-contain bg-[#071A2F] rounded-full p-0.5 border-2 border-[#D4AF37]" />
          </div>
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border-4 border-[#0B223D] shadow-lg">
            🎉
          </div>
          <h2 className="text-lg font-black text-white font-serif">Registration Successful!</h2>
          <p className="text-xs text-[#D4AF37] font-bold mt-0.5">आपका संस्थान सफलतापूर्वक पंजीकृत हो गया है</p>
        </div>

        {/* Credentials */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-4 text-center space-y-1">
            <p className="text-[11px] font-black text-amber-300 uppercase tracking-widest">⚠️ इन्हें अभी सेव करें — इन्हीं से लॉगिन होगा</p>
            <p className="text-[11px] font-black text-amber-300 uppercase tracking-widest">Save Credentials for Future Login</p>
          </div>

          <div className="space-y-2.5">
            <div className="bg-[#071A2F] rounded-2xl p-3.5 border-2 border-[#1E3A5F]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Registered Institution Name
              </p>
              <p className="text-sm font-black text-white">
                {credentials.institutionName}
              </p>
              <p className="text-[10px] font-mono text-[#D4AF37] bg-[#162B44] px-2 py-0.5 rounded inline-block mt-1 border border-[#D4AF37]/30">
                Safe ID: {credentials.safeId}
              </p>
            </div>

            <div className="bg-[#071A2F] rounded-2xl p-3.5 border-2 border-[#1E3A5F]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Username / लॉगिन ईमेल (Email ID)
              </p>
              <p className="text-sm font-black text-white font-mono break-all">
                {credentials.username}
              </p>
            </div>

            <div className="bg-[#071A2F] rounded-2xl p-3.5 border-2 border-[#1E3A5F]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                Password / पासवर्ड (Registered Mobile)
              </p>
              <p className="text-lg font-black text-[#D4AF37] font-mono tracking-widest">
                {credentials.password}
              </p>
            </div>

            {/* Zone / Assigned Inspector Info */}
            <div className="bg-sky-950/40 border-2 border-sky-600/60 rounded-2xl p-3.5 flex items-center gap-3">
              <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black text-sky-300 uppercase tracking-wider">
                  Assigned DCP Inspector
                </p>
                <p className="text-sm font-black text-white">
                  DCP {credentials.zone?.charAt(0) + (credentials.zone?.slice(1).toLowerCase() || 'Central')}
                </p>
                <p className="text-[10px] text-sky-200 font-semibold">
                  Your safety documents will go directly to this inspector. Upload them in Document Vault to get verified.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/40 border border-rose-600/60 rounded-xl p-3 text-xs text-rose-300 font-semibold leading-relaxed">
            <span className="font-black">🔒 Certificate Status: LOCKED</span><br/>
            Please upload all 4 required safety documents in Document Vault. Once verified by the District Inspector, your Safe ID & QR Code Certificate will automatically unlock.
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-[#071A2F] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs py-3 rounded-xl hover:bg-[#1E3A5F] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleProceedToLogin}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] font-black text-xs py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <MdVerified size={15} /> Enter My Dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Register = () => {
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null); // triggers popup
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { state: 'Uttar Pradesh', institutionType: 'SCHOOL', role: 'SCHOOL_ADMIN' }
  });

  const onSubmit = async (data) => {
    setError('');

    // ✅ Create real-time institution record in client store!
    const newInst = institutionStore.registerInstitution(data);

    const generatedCredentials = {
      username: data.email.toLowerCase(),
      password: data.phone,
      institutionName: data.institutionName || data.name,
      institutionId: newInst._id,
      safeId: newInst.safeId,
      zone: newInst.zone,  // e.g. 'CENTRAL', 'WEST', etc.
    };

    // Save to localStorage for instant real-time login session
    localStorage.setItem('registeredSchoolUser', JSON.stringify(generatedCredentials));

    // Try backend call asynchronously (non-blocking)
    fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        password: data.phone,
        role: data.institutionType === 'COACHING' ? 'COACHING_ADMIN' : 'SCHOOL_ADMIN',
      }),
    }).catch(console.warn);

    // Show popup modal!
    setCredentials(generatedCredentials);
  };

  const inputClass = "w-full text-xs px-3 py-2.5 border border-[#1E3A5F] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-[#0B223D] text-white placeholder:text-slate-500";
  const labelClass = "block text-xs font-black text-slate-200 mb-1";

  return (
    <>
      {/* Show Credentials Popup if registration successful */}
      {credentials && (
        <CredentialsPopup
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}

      <div>
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MdOutlineSchool size={20} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#071A2F] px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]/30">
              School / Coaching Registration Only
            </span>
          </div>
          <h3 className="text-base font-black text-white font-serif">Institution Admin Registration</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            संस्थान पंजीकरण • Register your School or Coaching Institute
          </p>
        </div>



        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-600 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FiAlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
          {/* Institution Type */}
          <div>
            <label className={labelClass}>Institution Type <span className="text-rose-500">*</span></label>
            <select {...register('institutionType', { required: true })} className={inputClass}>
              <option value="SCHOOL" className="bg-[#0B223D] text-white">School (विद्यालय)</option>
              <option value="COACHING" className="bg-[#0B223D] text-white">Coaching Institute (कोचिंग)</option>
              <option value="COLLEGE" className="bg-[#0B223D] text-white">College (महाविद्यालय)</option>
            </select>
          </div>

          {/* Institution Name */}
          <div>
            <label className={labelClass}>Institution Full Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('institutionName', { required: 'Institution name is required' })}
              placeholder="e.g. SR Education / St. Mary Convent School"
              className={inputClass}
            />
            {errors.institutionName && <p className="text-[10px] text-rose-400 mt-0.5">{errors.institutionName.message}</p>}
          </div>

          {/* Principal / Director Name */}
          <div>
            <label className={labelClass}>Principal / Director Full Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('principalName', { required: 'Principal / Director name is required' })}
              placeholder="e.g. Dr. Ramesh Chandra"
              className={inputClass}
            />
            {errors.principalName && <p className="text-[10px] text-rose-400 mt-0.5">{errors.principalName.message}</p>}
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Official Email (Username) <span className="text-rose-500">*</span></label>
              <input
                type="email"
                {...register('email', { required: 'Official email is required' })}
                placeholder="school@domain.com"
                className={inputClass}
              />
              {errors.email && <p className="text-[10px] text-rose-400 mt-0.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Mobile Number (Password) <span className="text-rose-500">*</span></label>
              <input
                type="tel"
                {...register('phone', { required: 'Mobile number is required', pattern: { value: /^[0-9]{10}$/, message: '10-digit mobile number' } })}
                placeholder="9876543210"
                className={inputClass}
              />
              {errors.phone && <p className="text-[10px] text-rose-400 mt-0.5">{errors.phone.message}</p>}
            </div>
          </div>

          {/* District & Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>District (उत्तर प्रदेश जिला) <span className="text-rose-500">*</span></label>
              <select {...register('district', { required: 'District is required' })} className={inputClass}>
                <option value="" className="bg-[#0B223D] text-white">-- Select UP District --</option>
                {DISTRICTS.map(d => (
                  <option key={d} value={d} className="bg-[#0B223D] text-white">{d}</option>
                ))}
              </select>
              {errors.district && <p className="text-[10px] text-rose-400 mt-0.5">{errors.district.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Affiliated Board / Council <span className="text-rose-500">*</span></label>
              <select {...register('board', { required: 'Board is required' })} className={inputClass}>
                <option value="" className="bg-[#0B223D] text-white">-- Select Board --</option>
                {BOARDS.map(b => (
                  <option key={b} value={b} className="bg-[#0B223D] text-white">{b}</option>
                ))}
              </select>
              {errors.board && <p className="text-[10px] text-rose-400 mt-0.5">{errors.board.message}</p>}
            </div>
          </div>

          {/* POLICE JURISDICTION DCP ZONE SELECTOR */}
          <div className="bg-gradient-to-r from-[#07111E] to-[#162B44] border-2 border-[#D4AF37]/50 rounded-2xl p-3.5 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <MdLocalPolice size={18} className="text-[#D4AF37]" />
              <label className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                Police Jurisdiction Zone (उत्तर प्रदेश पुलिस क्षेत्र) <span className="text-rose-400">*</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-300">
              Select your institution's police zone. Your safety certificate approval request will be routed directly to the designated DCP Inspector of this zone.
            </p>
            <select
              {...register('zone', { required: 'Police Zone selection is mandatory for inspection routing' })}
              className="w-full text-xs px-3 py-2 border-2 border-[#D4AF37] rounded-xl outline-none font-bold bg-[#071A2F] text-white focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="" className="bg-[#071A2F] text-white">-- Choose Police Zone (क्षेत्र चुनें) --</option>
              {DCP_ZONES.map(z => (
                <option key={z.value} value={z.value} className="bg-[#071A2F] text-white font-mono">
                  {z.label}
                </option>
              ))}
            </select>
            {errors.zone && <p className="text-[10px] text-rose-400 font-bold">{errors.zone.message}</p>}
          </div>

          {/* Nearest Police Station */}
          <div>
            <label className={labelClass}>Nearest Police Station (थाना) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('nearestPoliceStation', { required: 'Nearest police station is required' })}
              placeholder="e.g. Hazratganj Police Station, Lucknow (थाना हज़रतगंज)"
              className={`${inputClass} border-[#D4AF37]/40 font-bold text-white`}
            />
            {errors.nearestPoliceStation && <p className="text-[10px] text-rose-400 font-bold">{errors.nearestPoliceStation.message}</p>}
          </div>

          {/* Quick Facility Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelClass}>Total Staff</label>
              <input type="number" placeholder="e.g. 45" {...register('staffCount')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Classrooms</label>
              <input type="number" placeholder="e.g. 24" {...register('classroomCount')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Floors</label>
              <input type="number" placeholder="e.g. 3" {...register('floorCount')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Exit Gates</label>
              <input type="number" placeholder="e.g. 4" {...register('exitGateCount')} className={inputClass} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Full Institution Address <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...register('address', { required: 'Address is required' })}
              placeholder="e.g. 12 Mall Road, Kanpur, Uttar Pradesh"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] font-black py-3.5 rounded-xl hover:brightness-110 disabled:opacity-60 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-1"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#071A2F] border-t-transparent rounded-full animate-spin" /> Registering...</span>
            ) : (
              <><MdOutlineSchool size={16} /> Register Institution with SafeED-UP</>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#1E3A5F] text-center">
          <p className="text-[11px] text-slate-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-[#D4AF37] font-black hover:underline transition-colors">
              Login to Dashboard →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};
