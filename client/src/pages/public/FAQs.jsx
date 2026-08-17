import React, { useState } from 'react';
import { Card } from '../../components/common/Card/Card';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export const FAQsPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'What is a Safe ID and how is it generated?',
      a: 'A Safe ID is a unique, immutable government identity code (e.g. SAFE-UP-LKO-000001) assigned to every verified school and coaching institute upon approval by the District Admin.',
    },
    {
      q: 'How can citizens verify the safety status of a school?',
      a: 'Citizens can scan the physical QR code displayed at the school entrance or enter the Safe ID on the SafeED-UP public portal to view real-time NOC verification status.',
    },
    {
      q: 'What happens if a Fire NOC document expires?',
      a: 'The system automatically flags expired documents, lowers the institution compliance score, sends automated email/dashboard alerts, and alerts the Fire Department.',
    },
    {
      q: 'Are citizen safety concern submissions anonymous?',
      a: 'Yes. Citizens can optionally submit safety concerns anonymously. Submissions are routed directly to the District Magistrate and Police Officers.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2038]">Frequently Asked Questions</h1>
        <p className="text-xs text-[#5A6A7E]">Public guidance on SafeED-UP digital safety platform</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <Card key={index} className="p-4 cursor-pointer" onClick={() => setOpenIndex(openIndex === index ? -1 : index)}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1A2332]">{faq.q}</h3>
              {openIndex === index ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {openIndex === index && (
              <p className="text-xs text-[#5A6A7E] mt-3 pt-3 border-t border-[#DDE3ED] leading-relaxed">
                {faq.a}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
