import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import {
  FiUser, FiMapPin, FiPhone, FiMail, FiShield, FiCheck,
  FiAlertCircle, FiUsers, FiBookOpen, FiSave, FiLock
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

const inputClass = 'w-full text-xs px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white font-semibold';
const labelClass = 'block text-xs font-black text-[#0F2038] mb-1';

export const InstitutionProfile = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [isProfileDone, setIsProfileDone] = useState(false);
  const [toast, setToast] = useState('');
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm();

  const loadInst = () => {
    const inst = institutionStore.getInstitutionByIdOrEmail(user?.institutionId || user?.email);
    if (inst) {
      setInstitution(inst);
      setIsProfileDone(institutionStore.isProfileComplete(inst._id));
      reset({
        name: inst.name || '',
        type: inst.type || 'SCHOOL',
        affiliationBoard: inst.affiliationBoard || '',
        affiliationCode: inst.affiliationCode || '',
        totalStudents: inst.totalStudents || '',
        totalTeachers: inst.staffCount || inst.totalTeachers || '',
        staffCount: inst.staffCount || inst.totalTeachers || '',
        totalClassrooms: inst.classroomCount || inst.totalClassrooms || '',
        classroomCount: inst.classroomCount || inst.totalClassrooms || '',
        buildingFloors: inst.floorCount || inst.buildingFloors || '',
        floorCount: inst.floorCount || inst.buildingFloors || '',
        exitGateCount: inst.exitGateCount || 2,
        nearestPoliceStation: inst.nearestPoliceStation || '',
        yearEstablished: inst.yearEstablished || '',
        address: inst.address || '',
        district: inst.district || '',
        state: inst.state || 'Uttar Pradesh',
        principal: inst.principal || '',
        phone: inst.contact || '',
        email: inst.email || '',
        safeId: inst.safeId || '',
        zone: inst.zone || '',
        emergencyContact: inst.emergencyContact || '',
      });
    }
  };

  useEffect(() => {
    loadInst();
  }, [user]);

  const onSubmit = async (data) => {
    if (!institution) return;

    // Save all profile updates to institutionStore
    institutionStore.updateInstitutionProfile(institution._id, {
      name: data.name,
      type: data.type,
      affiliationBoard: data.affiliationBoard,
      affiliationCode: data.affiliationCode,
      totalStudents: parseInt(data.totalStudents) || 0,
      totalTeachers: parseInt(data.staffCount || data.totalTeachers) || 0,
      staffCount: parseInt(data.staffCount || data.totalTeachers) || 0,
      totalClassrooms: parseInt(data.classroomCount || data.totalClassrooms) || 0,
      classroomCount: parseInt(data.classroomCount || data.totalClassrooms) || 0,
      buildingFloors: parseInt(data.floorCount || data.buildingFloors) || 1,
      floorCount: parseInt(data.floorCount || data.buildingFloors) || 1,
      exitGateCount: parseInt(data.exitGateCount) || 2,
      nearestPoliceStation: data.nearestPoliceStation || `${data.district || 'Hazratganj'} Police Station`,
      yearEstablished: data.yearEstablished,
      address: data.address,
      district: data.district,
      principal: data.principal,
      contact: data.phone,
      emergencyContact: data.emergencyContact,
      profileCompleted: true,
      profileCompletedAt: new Date().toISOString(),
    });

    loadInst();
    setToast('✅ Institution Profile saved & submitted! Profile is now marked COMPLETE.');
    setTimeout(() => setToast(''), 5000);
  };

  if (!institution) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-black text-[#0F2038]">Loading Institution Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-800 text-emerald-100 border-2 border-emerald-400 font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="ml-4 font-black hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-6 h-6 object-contain" />
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Official Institution Profile
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0F2038] font-serif">{institution.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your full institution profile. This is <strong>mandatory</strong> — Safe ID & QR Certificate remains locked until profile is submitted.
          </p>
        </div>

        {/* Profile Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs font-black flex-shrink-0 ${
          isProfileDone
            ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
            : 'bg-amber-50 text-amber-800 border-amber-400 animate-pulse'
        }`}>
          {isProfileDone ? <FiCheck size={14} /> : <FiAlertCircle size={14} />}
          {isProfileDone ? '✓ Profile Complete' : '⚠ Profile Incomplete — Certificate Locked'}
        </div>
      </div>

      {/* Lock Warning Banner */}
      {!isProfileDone && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex items-start gap-3">
          <FiLock size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-rose-900">Profile Submission Required — Safe ID Locked 🔒</p>
            <p className="text-[11px] text-rose-800 font-semibold mt-0.5">
              Fill all mandatory fields (marked <span className="text-rose-600 font-black">*</span>) and submit this profile form. <strong>Total Students is mandatory</strong> — this is used by the DCP Inspector to check for over-strength violations.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── SECTION 1: Basic Info ── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FiBookOpen className="text-[#D4AF37]" />
            <h2 className="text-xs font-black text-[#0F2038] uppercase tracking-wider">1. Basic Institution Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className={labelClass}>Institution Full Name <span className="text-rose-500">*</span></label>
              <input type="text" {...register('name', { required: 'Required' })} className={inputClass} />
              {errors.name && <p className="text-[10px] text-rose-600 mt-0.5">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Safe ID (Auto-generated)</label>
              <input type="text" {...register('safeId')} disabled className="w-full text-xs px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-slate-100 font-mono font-bold text-[#0F2038]" />
            </div>
            <div>
              <label className={labelClass}>Institution Type <span className="text-rose-500">*</span></label>
              <select {...register('type', { required: true })} className={inputClass}>
                <option value="SCHOOL">School (विद्यालय)</option>
                <option value="COACHING">Coaching Institute (कोचिंग)</option>
                <option value="COLLEGE">College (महाविद्यालय)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Year Established</label>
              <input type="number" placeholder="e.g. 1998" {...register('yearEstablished')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Affiliation Board <span className="text-rose-500">*</span></label>
              <select {...register('affiliationBoard', { required: 'Required' })} className={inputClass}>
                <option value="">Select Board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE / CISCE">ICSE / CISCE</option>
                <option value="UP Board (UPMSP)">UP Board (UPMSP)</option>
                <option value="NIOS">NIOS</option>
                <option value="IB (International)">IB (International)</option>
                <option value="Other">Other</option>
              </select>
              {errors.affiliationBoard && <p className="text-[10px] text-rose-600 mt-0.5">{errors.affiliationBoard.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Affiliation / Registration Code <span className="text-rose-500">*</span></label>
              <input type="text" placeholder="e.g. CBSE-124251" {...register('affiliationCode', { required: 'Required' })} className={inputClass} />
              {errors.affiliationCode && <p className="text-[10px] text-rose-600 mt-0.5">{errors.affiliationCode.message}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Strength Details (CRITICAL) ── */}
        <div className="bg-white border-2 border-[#D4AF37] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D4AF37]/30">
            <FiUsers className="text-[#D4AF37]" />
            <h2 className="text-xs font-black text-[#0F2038] uppercase tracking-wider">2. Student & Staff Strength (Inspector Monitoring)</h2>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full">MANDATORY FOR INSPECTOR AUDIT</span>
          </div>
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 font-semibold">
            ⚠️ <strong>Important:</strong> This data is monitored by the DCP Inspector to prevent over-strength violations. Providing false data is a punishable offence under UP Education Regulations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className={labelClass}>Total Enrolled Students <span className="text-rose-500">*</span></label>
              <input
                type="number"
                placeholder="e.g. 850"
                {...register('totalStudents', {
                  required: 'Total students is mandatory',
                  min: { value: 1, message: 'Must be at least 1' },
                  max: { value: 50000, message: 'Exceeds maximum limit' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500 font-black text-base`}
              />
              {errors.totalStudents && <p className="text-[10px] text-rose-600 mt-0.5 font-black">{errors.totalStudents.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Total Teaching Staff <span className="text-rose-500">*</span></label>
              <input
                type="number"
                placeholder="e.g. 42"
                {...register('totalTeachers', {
                  required: 'Teaching staff count is mandatory',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500`}
              />
              {errors.totalTeachers && <p className="text-[10px] text-rose-600 mt-0.5">{errors.totalTeachers.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Total Classrooms / Halls <span className="text-rose-500">*</span></label>
              <input
                type="number"
                placeholder="e.g. 24"
                {...register('totalClassrooms', {
                  required: 'Classroom count is mandatory',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500`}
              />
              {errors.totalClassrooms && <p className="text-[10px] text-rose-600 mt-0.5">{errors.totalClassrooms.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className={labelClass}>Number of Building Floors <span className="text-rose-500">*</span></label>
              <input
                type="number"
                placeholder="e.g. 3"
                {...register('floorCount', {
                  required: 'Building floors count is mandatory',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500`}
              />
              {errors.floorCount && <p className="text-[10px] text-rose-600 mt-0.5">{errors.floorCount.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Emergency Exit Gates <span className="text-rose-500">*</span></label>
              <input
                type="number"
                placeholder="e.g. 4"
                {...register('exitGateCount', {
                  required: 'Exit gates count is mandatory',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500 font-bold`}
              />
              {errors.exitGateCount && <p className="text-[10px] text-rose-600 mt-0.5">{errors.exitGateCount.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Emergency Contact Number <span className="text-rose-500">*</span></label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('emergencyContact', {
                  required: 'Emergency contact is mandatory',
                  pattern: { value: /^[0-9]{10}$/, message: '10-digit number required' }
                })}
                className={`${inputClass} border-2 border-rose-300 focus:border-rose-500 font-mono`}
              />
              {errors.emergencyContact && <p className="text-[10px] text-rose-600 mt-0.5">{errors.emergencyContact.message}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Contact & Address ── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FiMapPin className="text-[#D4AF37]" />
            <h2 className="text-xs font-black text-[#0F2038] uppercase tracking-wider">3. Principal & Address Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className={labelClass}>Principal / Director Name <span className="text-rose-500">*</span></label>
              <input type="text" {...register('principal', { required: 'Required' })} className={inputClass} />
              {errors.principal && <p className="text-[10px] text-rose-600 mt-0.5">{errors.principal.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Registered Mobile (Password)</label>
              <input type="text" {...register('phone')} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={labelClass}>Official Email ID (Username)</label>
              <input type="email" {...register('email')} disabled className="w-full text-xs px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-slate-100 font-mono" />
            </div>
            <div>
              <label className={labelClass}>DCP Inspection Zone</label>
              <input type="text" value={institution.zone || 'CENTRAL'} disabled className="w-full text-xs px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-slate-100 font-black uppercase" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Nearest Police Station (संबंधित थाना) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Hazratganj Police Station, Lucknow (थाना हज़रतगंज)"
                  {...register('nearestPoliceStation', { required: 'Nearest police station is required for emergency dispatch' })}
                  className={`${inputClass} pl-8 border-2 border-blue-300 focus:border-blue-500 font-bold`}
                />
                <MdLocalPolice size={16} className="absolute left-2.5 top-3 text-blue-800" />
              </div>
              {errors.nearestPoliceStation && <p className="text-[10px] text-rose-600 mt-0.5">{errors.nearestPoliceStation.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Full Building Address <span className="text-rose-500">*</span></label>
              <input type="text" {...register('address', { required: 'Required' })} className={inputClass} />
              {errors.address && <p className="text-[10px] text-rose-600 mt-0.5">{errors.address.message}</p>}
            </div>
            <div>
              <label className={labelClass}>District <span className="text-rose-500">*</span></label>
              <input type="text" {...register('district', { required: 'Required' })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" {...register('state')} disabled className="w-full text-xs px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-slate-100 font-bold" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-2 border-[#D4AF37] rounded-2xl p-4">
          <div className="text-xs text-slate-600 font-semibold">
            <strong className="text-[#0F2038]">⚠ Important:</strong> Once you submit, the DCP Inspector can view your total student strength in the Institutions Registry for compliance monitoring.
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-8 py-3.5 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow-lg disabled:opacity-60 flex-shrink-0"
          >
            {isSubmitting
              ? <><span className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" /> Saving...</>
              : <><FiSave size={14} /> Submit Institution Profile</>
            }
          </button>
        </div>
      </form>
    </div>
  );
};
