import React from 'react';
import { Card } from '../../components/common/Card/Card';
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';

export const ContactPage = () => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2038]">Department Contact Directory &amp; Helpdesk</h1>
        <p className="text-xs text-[#5A6A7E]">Official helpline directory for Uttar Pradesh Disaster Management &amp; Safety Compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 border-t-4 border-t-rose-600">
          <FiPhone className="text-3xl text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1A2332]">Police Emergency</h3>
          <p className="text-xl font-black text-rose-700 mt-1">DIAL 112</p>
          <p className="text-[11px] text-[#5A6A7E] mt-2">24/7 UP Police Control Room</p>
        </Card>

        <Card className="text-center p-6 border-t-4 border-t-amber-500">
          <FiPhone className="text-3xl text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1A2332]">Fire Service Helpline</h3>
          <p className="text-xl font-black text-amber-600 mt-1">DIAL 101</p>
          <p className="text-[11px] text-[#5A6A7E] mt-2">UP Fire Service Control Room</p>
        </Card>

        <Card className="text-center p-6 border-t-4 border-t-[#1E3A5F]">
          <FiMail className="text-3xl text-[#1E3A5F] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1A2332]">SafeED Technical Support</h3>
          <p className="text-xs font-bold text-[#1E3A5F] mt-1">support@safeedup.gov.in</p>
          <p className="text-[11px] text-[#5A6A7E] mt-2">NIC Portal Desk (Mon-Sat 9AM-6PM)</p>
        </Card>
      </div>
    </div>
  );
};
