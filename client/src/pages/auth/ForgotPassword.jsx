import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

export const ForgotPassword = () => {
  return (
    <div className="space-y-5 py-2">
      {/* Header Info */}
      <div className="flex items-start gap-3.5 pb-3 border-b border-[#1E3A5F]">
        <div className="p-3 bg-rose-950/50 text-rose-400 rounded-2xl border border-rose-600/50 flex-shrink-0 shadow-sm">
          <FiShield size={26} />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight font-serif">
            Police Cyber Cell Emergency Reset
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Official Government Personnel Assistance
          </p>
        </div>
      </div>

      {/* Main Notice Box */}
      <div className="bg-[#0B223D] p-4 rounded-2xl border border-[#1E3A5F] space-y-3">
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          For official DCP Inspection Officers, District Admins, or Police Personnel who lost access to their registered government email:
        </p>

        <ul className="space-y-2.5 pt-1 text-xs text-slate-200 font-semibold">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
            <span>
              Contact UP Police Cyber Desk:{' '}
              <a href="mailto:cybercell@safeedup.gov.in" className="text-[#D4AF37] hover:underline font-bold">
                cybercell@safeedup.gov.in
              </a>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
            <span>
              Super Admin Control Room:{' '}
              <span className="font-mono font-bold text-[#D4AF37]">0522-2200112</span>
            </span>
          </li>
        </ul>
      </div>

      {/* Action Button: Return to Login */}
      <div className="pt-2">
        <Link
          to="/auth/login"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#071A2F] text-[#D4AF37] border-2 border-[#D4AF37] font-black py-3 rounded-xl hover:bg-[#1E3A5F] transition-all uppercase tracking-wider text-xs shadow-lg cursor-pointer"
        >
          <FiArrowLeft size={14} />
          <span>Return to Official Login</span>
        </Link>
      </div>
    </div>
  );
};
