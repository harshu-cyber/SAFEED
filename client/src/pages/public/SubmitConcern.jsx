import React, { useState } from 'react';
import { complaintStore } from '../../api/complaintStore';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiUpload, FiSend, FiFileText } from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

export const SubmitConcernPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [district, setDistrict] = useState('Lucknow');
  const [zone, setZone] = useState('CENTRAL');
  const [institutionName, setInstitutionName] = useState('');
  const [category, setCategory] = useState('Fire Safety Violation (अग्निशमन उपकरणों की कमी)');
  const [description, setDescription] = useState('');

  const registeredInsts = institutionStore.getInstitutions();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Submit complaint to real-time complaintStore & sync to MongoDB Atlas
    const newComplaint = complaintStore.submitComplaint({
      complainantName,
      complainantPhone,
      district,
      zone,
      institutionName,
      category,
      description,
    });

    cloudSync.syncAction('CREATE_COMPLAINT', newComplaint).catch(err => console.warn('[SubmitConcern] Cloud sync failed:', err));

    setTicketId(newComplaint.complaintTicket);
    setSubmitted(true);
  };

  const inputClass = "w-full px-3 py-2.5 border border-[#1E3A5F] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37] bg-[#071A2F] text-white placeholder:text-slate-500 font-semibold";
  const labelClass = "block font-black text-slate-200 mb-1 text-xs";

  return (
    <div className="bg-[#071A2F] min-h-screen pb-16 text-white">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#07111E] via-[#0B223D] to-[#07111E] text-white py-12 px-6 text-center border-b-4 border-[#D4AF37]">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-10 h-10 object-contain bg-[#071A2F] rounded-full p-0.5 border border-[#D4AF37]" />
            <span className="bg-[#D4AF37] text-[#071A2F] font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
              नागरिक जन शिकायत पोर्टल • CITIZEN SAFETY REPORTING
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white">Report Public Safety Complaint / Hazard</h1>
          <p className="text-xs text-slate-300">
            किसी भी विद्यालय या कोचिंग संस्थान की सुरक्षा खामी (अग्निशमन कमी, ओवर-कैपेसिटी, अवैध निर्माण) की शिकायत सीधे District Authorities को दर्ज करें।
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pt-10">
        {submitted ? (
          <div className="bg-[#0B223D] p-8 text-center space-y-4 rounded-3xl border-4 border-emerald-500 shadow-2xl animate-fade-in text-white">
            <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
              ✓
            </div>
            <h3 className="text-xl font-black text-white font-serif">जन शिकायत सफलतापूर्वक दर्ज की गई!</h3>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              आपकी शिकायत <strong className="text-[#D4AF37]">District Authorities ({district})</strong> को प्रेषित कर दी गई है। District Admin तत्काल जांच हेतु संबंधित DCP Inspection Officer को निर्देशित करेंगे।
            </p>
            <div className="bg-[#071A2F] text-[#D4AF37] p-4 rounded-2xl font-mono text-sm font-black border-2 border-[#D4AF37] shadow-inner">
              Complaint Ticket ID: {ticketId}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Keep this ticket ID for future reference and tracking.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setInstitutionName('');
                setDescription('');
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] font-black text-xs px-6 py-3 rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              Submit Another Complaint →
            </button>
          </div>
        ) : (
          <div className="bg-[#0B223D] p-8 space-y-6 rounded-3xl border-2 border-[#1E3A5F] shadow-2xl">
            <div className="border-b border-[#1E3A5F] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-serif">Public Safety Complaint Form</h3>
                <p className="text-xs text-slate-400 font-semibold">उत्तर प्रदेश पुलिस जन शिकायत निवारण प्रणाली</p>
              </div>
              <span className="text-[10px] font-black bg-rose-950/60 text-rose-400 px-3 py-1 rounded-full border border-rose-600/50 uppercase">
                100% Confidential
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Complainant Name (आपका नाम) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={complainantName}
                    onChange={e => setComplainantName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Mobile Number (मोबाइल नंबर) <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={complainantPhone}
                    onChange={e => setComplainantPhone(e.target.value)}
                    placeholder="9876543210"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Target District (जनपद) <span className="text-rose-500">*</span></label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className={`${inputClass} font-bold`}
                  >
                    <option value="Lucknow" className="bg-[#071A2F] text-white">Lucknow (लखनऊ)</option>
                    <option value="Kanpur" className="bg-[#071A2F] text-white">Kanpur (कानपुर)</option>
                    <option value="Varanasi" className="bg-[#071A2F] text-white">Varanasi (वाराणसी)</option>
                    <option value="Agra" className="bg-[#071A2F] text-white">Agra (आगरा)</option>
                    <option value="Prayagraj" className="bg-[#071A2F] text-white">Prayagraj (प्रयागराज)</option>
                    <option value="Noida" className="bg-[#071A2F] text-white">Noida (गौतम बुद्ध नगर)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Campus Direction / Zone <span className="text-rose-500">*</span></label>
                  <select
                    value={zone}
                    onChange={e => setZone(e.target.value)}
                    className={`${inputClass} font-bold`}
                  >
                    <option value="WEST" className="bg-[#071A2F] text-white">West Zone (DCP West)</option>
                    <option value="CENTRAL" className="bg-[#071A2F] text-white">Central Zone (DCP Central)</option>
                    <option value="NORTH" className="bg-[#071A2F] text-white">North Zone (DCP North)</option>
                    <option value="EAST" className="bg-[#071A2F] text-white">East Zone (DCP East)</option>
                    <option value="SOUTH" className="bg-[#071A2F] text-white">South Zone (DCP South)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Institution Name / Safe ID <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  placeholder="Type school name or select registered school e.g. SR Education / DPS Aliganj"
                  className={`${inputClass} font-bold`}
                />

                {registeredInsts.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Or click registered school:</span>
                    {registeredInsts.slice(0, 5).map(inst => (
                      <button
                        type="button"
                        key={inst._id}
                        onClick={() => {
                          setInstitutionName(inst.name);
                          if (inst.zone) setZone(inst.zone);
                          if (inst.district) setDistrict(inst.district);
                        }}
                        className="text-[9px] font-black bg-[#071A2F] text-[#D4AF37] hover:bg-[#1E3A5F] px-2 py-0.5 rounded-lg border border-[#D4AF37]/40 transition-colors cursor-pointer"
                      >
                        {inst.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Concern Category (शिकायत श्रेणी) <span className="text-rose-500">*</span></label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className={`${inputClass} font-bold`}
                >
                  <option value="FIRE_SAFETY_HAZARD" className="bg-[#071A2F] text-white">Fire Safety Hazard (अग्निशमन उपकरणों का न होना/खराब होना)</option>
                  <option value="OVERCROWDING" className="bg-[#071A2F] text-white">Overcrowding &amp; Over-capacity (अत्यधिक छात्र क्षमता/संकीर्ण बेसमेंट)</option>
                  <option value="BLOCKED_EXITS" className="bg-[#071A2F] text-white">Blocked Emergency Staircase &amp; Exits (आपातकालीन निकास बंद होना)</option>
                  <option value="UNSAFE_ELECTRICAL" className="bg-[#071A2F] text-white">Unsafe Electrical Panels &amp; Wiring (विद्युत तारों का खुला होना)</option>
                  <option value="INVALID_CERTIFICATE" className="bg-[#071A2F] text-white">Unverified / Invalid Certificate (फर्जी प्रमाण पत्र की आशंका)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Detailed Complaint Description (शिकायत का विवरण) <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide detailed description of the safety hazard..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] font-black text-xs py-3.5 rounded-xl hover:brightness-110 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <FiSend size={14} /> Submit Public Complaint to District Authority
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};
