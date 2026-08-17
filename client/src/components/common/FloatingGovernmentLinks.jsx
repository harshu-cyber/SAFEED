import React from 'react';
import { MdLocalFireDepartment, MdSecurity } from 'react-icons/md';
import { FiShield } from 'react-icons/fi';

export const FloatingGovernmentLinks = () => {
  const govLinks = [
    {
      id: 'uppolice',
      title: 'UP Police Official Portal (uppolice.gov.in)',
      href: 'https://uppolice.gov.in',
      imgSrc: '/up-police-logo.png',
      borderColor: 'border-[#D4AF37]',
      bgColor: 'bg-[#071A2F]',
    },
    {
      id: 'upgovt',
      title: 'Government of Uttar Pradesh (up.gov.in)',
      href: 'https://up.gov.in',
      imgSrc: '/up-govt-seal.png',
      borderColor: 'border-[#D4AF37]',
      bgColor: 'bg-[#071A2F]',
    },
    {
      id: 'ashok',
      title: 'National Portal of India (india.gov.in)',
      href: 'https://india.gov.in',
      imgSrc: '/ashok-stambh.png',
      borderColor: 'border-[#D4AF37]',
      bgColor: 'bg-[#071A2F]',
    },
    {
      id: 'fire',
      title: 'UP Fire Service 101 NOC Portal',
      href: 'https://uppolice.gov.in',
      icon: MdLocalFireDepartment,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500',
      bgColor: 'bg-[#071A2F]',
    },
    {
      id: 'women1090',
      title: 'Women Power Line 1090 (1090.up.gov.in)',
      href: 'https://1090.up.gov.in',
      icon: FiShield,
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500',
      bgColor: 'bg-[#071A2F]',
    },
    {
      id: 'cyber1930',
      title: 'Cyber Crime Helpline 1930 (cybercrime.gov.in)',
      href: 'https://cybercrime.gov.in',
      icon: MdSecurity,
      iconColor: 'text-sky-400',
      borderColor: 'border-sky-500',
      bgColor: 'bg-[#071A2F]',
    },
  ];

  return (
    <div className="fixed left-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5 select-none pointer-events-auto">
      {govLinks.map((link) => {
        const IconComponent = link.icon;
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center"
          >
            {/* Clean Circular Icon Button */}
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${link.bgColor} border-2 ${link.borderColor} flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] cursor-pointer`}>
              {link.imgSrc ? (
                <img src={link.imgSrc} alt={link.title} className="w-7 h-7 sm:w-8 sm:h-8 object-contain p-0.5" />
              ) : (
                <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${link.iconColor}`} />
              )}
            </div>

            {/* Clean Hover Tooltip on Right */}
            <div className="absolute left-14 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
              <span className="bg-[#07111E]/95 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg border border-[#D4AF37] shadow-2xl backdrop-blur-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" />
                {link.title}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
};
