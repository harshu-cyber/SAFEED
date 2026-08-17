import React from 'react';
import { Card } from '../../components/common/Card/Card';

export const HowItWorksPage = () => {
  const steps = [
    { num: '01', title: 'Institution Registration', desc: 'School or Coaching admin submits institutional details, UDISE code, and student capacity.' },
    { num: '02', title: 'District Admin Verification', desc: 'District Magistrate / Education Officer reviews registration details and issues official Safe ID.' },
    { num: '03', title: 'QR Identity Generation', desc: 'System generates tamper-evident QR code and printable Safety Certificate for school display.' },
    { num: '04', title: 'Document Vault Upload', desc: 'Institution uploads Fire NOC, Building Plan, and Police Clearance certificates for verification.' },
    { num: '05', title: 'Safety Audit & Inspection', desc: 'Assigned inspection officer conducts digital checklist audit and files risk evaluation.' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2038]">How SafeED-UP Operates</h1>
        <p className="text-xs sm:text-sm text-[#5A6A7E]">Standardized 5-stage workflow for institutional safety compliance</p>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <Card key={s.num} className="border-l-4 border-l-[#0F2038]">
            <div className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-full bg-[#0F2038] text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.num}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1A2332]">{s.title}</h3>
                <p className="text-xs text-[#5A6A7E] mt-0.5">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
