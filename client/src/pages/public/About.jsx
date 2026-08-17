import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiCheckCircle, FiAward, FiUsers, FiMapPin, FiPhone, FiLock } from 'react-icons/fi';
import { MdVerified, MdSecurity, MdLocalPolice, MdLocalFireDepartment } from 'react-icons/md';

export const AboutPage = () => {
  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#07111E] via-[#0F2038] to-[#07111E] text-white py-14 px-6 text-center border-b-4 border-[#D4AF37]">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/up-govt-seal.png" alt="UP Govt" className="w-12 h-12 object-contain bg-white rounded-full p-0.5 border border-[#D4AF37]" />
            <img src="/up-police-logo.png" alt="UP Police" className="w-12 h-12 object-contain bg-white rounded-full p-0.5 border border-[#D4AF37]" />
          </div>
          <span className="bg-[#D4AF37] text-[#0F2038] font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
            पोर्टल परिचय / ABOUT PORTAL
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-serif">SafeED-UP Digital Safety Authority</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            उत्तर प्रदेश सरकार एवं उत्तर प्रदेश पुलिस द्वारा संचालित राज्य स्तरीय शैक्षणिक संस्थान सुरक्षा एवं आपातकालीन तत्परता प्राधिकरण।
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        <div className="gov-card-white p-8 space-y-4">
          <h2 className="text-2xl font-black text-[#0F2038] font-serif border-b border-slate-100 pb-3 flex items-center gap-2">
            <MdSecurity className="text-[#D4AF37]" /> उद्देश्य एवं संकल्प (Mission &amp; Vision)
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            SafeED-UP पोर्टल का मुख्य उद्देश्य उत्तर प्रदेश के समस्त विद्यालयों, महाविद्यालयों एवं कोचिंग संस्थानों में अध्ययनरत छात्र-छात्राओं की सुरक्षा सुनिश्चित करना है। यह प्रणाली अग्निशमन एनओसी, भवन सुरक्षा प्रमाण पत्र, विद्युत ऑडिट, तथा पुलिस सत्यापन की रियल-टाइम निगरानी प्रदान करती है।
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#07111E] text-white p-6 rounded-2xl border-2 border-[#D4AF37] space-y-3">
            <MdLocalPolice size={32} className="text-[#D4AF37]" />
            <h3 className="text-base font-black font-serif text-[#D4AF37]">पुलिस सत्यापन (Police Verification)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              संस्थान के सुरक्षा कर्मियों, शिक्षकों एवं चालक दल का पुलिस सत्यापन तथा सुरक्षा रिकॉर्ड प्रबंधन।
            </p>
          </div>

          <div className="bg-[#07111E] text-white p-6 rounded-2xl border-2 border-[#D4AF37] space-y-3">
            <MdLocalFireDepartment size={32} className="text-[#D4AF37]" />
            <h3 className="text-base font-black font-serif text-[#D4AF37]">फायर एनओसी ऑडिट (Fire NOC Audit)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              अग्निशमन विभाग द्वारा स्प्रिंकलर, अलार्म एवं अग्निशामक यंत्रों का प्रत्यक्ष निरीक्षण तथा एनओसी निर्गमन।
            </p>
          </div>

          <div className="bg-[#07111E] text-white p-6 rounded-2xl border-2 border-[#D4AF37] space-y-3">
            <MdVerified size={32} className="text-[#D4AF37]" />
            <h3 className="text-base font-black font-serif text-[#D4AF37]">Safe ID QR प्रमाणीकरण</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              प्रत्येक मान्यता प्राप्त संस्थान हेतु विशिष्ट डिजिटल क्यूआर कोड जो जनसामान्य हेतु सार्वजनिक रूप से उपलब्ध है।
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
