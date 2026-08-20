import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { evidenceStore } from '../../../api/evidenceStore';
import { complaintStore } from '../../../api/complaintStore';
import { institutionStore } from '../../../api/institutionStore';
import { documentApi } from '../../../api/apiServices';
import {
  FiShield, FiMapPin, FiUsers, FiCheckCircle, FiXCircle,
  FiCamera, FiClock, FiFileText, FiLock, FiUnlock, FiPhone,
  FiMail, FiAlertTriangle, FiBookOpen, FiUserCheck, FiMaximize2,
  FiAlertOctagon, FiSend, FiCheck, FiX
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice, MdQrCode2, MdMeetingRoom, MdLayers, MdDoorSliding } from 'react-icons/md';

export const InstitutionFullDetailModal = ({ institution, onClose, onAssignInspector }) => {
  const { user } = useAuth();
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [localInst, setLocalInst] = useState(institution || {});
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [unlockNotes, setUnlockNotes] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [apiDocs, setApiDocs] = useState([]);

  useEffect(() => {
    if (institution) {
      setLocalInst(institution);
    }
  }, [institution]);

  const currentInst = localInst._id || localInst.id ? localInst : (institution || {});
  const instId = currentInst._id || currentInst.id;

  useEffect(() => {
    const targetId = instId || currentInst.email || currentInst.safeId;
    if (targetId) {
      documentApi.getForInstitution(targetId)
        .then(res => {
          if (res?.data?.data?.documents && Array.isArray(res.data.data.documents)) {
            setApiDocs(res.data.data.documents);
          }
        })
        .catch(() => {});
    }
  }, [instId, currentInst.email, currentInst.safeId]);

  if (!institution && !localInst?._id && !localInst?.id) return null;

  const handleLockSubmit = (e) => {
    e.preventDefault();
    setActionErr('');
    if (!lockReason.trim()) {
      setActionErr('Please enter a detailed notice / problem reason for locking the QR code.');
      return;
    }
    const issuerRole = user?.role === 'DISTRICT_ADMIN' ? 'District Authority Admin' :
                       user?.role === 'INSPECTION_OFFICER' ? `Safety Inspector (${user.name || 'DCP Officer'})` :
                       user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Safety Inspection Officer';
    
    const updated = institutionStore.lockInstitutionQR(instId, {
      reason: lockReason.trim(),
      issuedBy: issuerRole,
    });
    if (updated) setLocalInst(updated);
    setShowLockModal(false);
    setLockReason('');
  };

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    const issuerRole = user?.role === 'DISTRICT_ADMIN' ? 'District Authority Admin' :
                       user?.role === 'INSPECTION_OFFICER' ? `Safety Inspector (${user.name || 'DCP Officer'})` :
                       user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Safety Inspection Officer';

    const updated = institutionStore.unlockInstitutionQR(instId, {
      notes: unlockNotes.trim() || 'Issues resolved and verified upon physical re-inspection.',
      issuedBy: issuerRole,
    });
    if (updated) setLocalInst(updated);
    setShowUnlockModal(false);
    setUnlockNotes('');
  };

  // Safe store calls — each wrapped to prevent any crash from corrupted localStorage
  let isUnlocked = false;
  let instEvidence = [];
  let instComplaints = [];
  let localDocs = [];
  try { localDocs = (instId || currentInst.email || currentInst.safeId) ? (institutionStore.getDocumentsForInstitution(instId || currentInst.email || currentInst.safeId) || []) : []; } catch {}
  const embeddedDocs = Array.isArray(currentInst.documents) ? currentInst.documents : [];

  const mergedDocMap = new Map();
  [...embeddedDocs, ...localDocs, ...apiDocs].forEach(d => {
    if (d) {
      const typeKey = d.documentType || d.type || d.name;
      if (typeKey) mergedDocMap.set(typeKey, d);
    }
  });
  const docs = Array.from(mergedDocMap.values());

  const staffCount = parseInt(currentInst.staffCount || currentInst.totalTeachers || 0) || 0;
  const classroomCount = parseInt(currentInst.classroomCount || currentInst.totalClassrooms || 0) || 0;
  const floorCount = parseInt(currentInst.floorCount || currentInst.buildingFloors || 1) || 1;
  const exitGateCount = parseInt(currentInst.exitGateCount || 2) || 2;
  const totalStudents = parseInt(currentInst.totalStudents || 0) || 0;
  const densityRatio = classroomCount > 0 ? Math.round(totalStudents / classroomCount) : 0;

  const requiredDocs = [
    { type: 'FIRE_NOC', label: 'Fire Safety NOC Certificate', icon: '🔥' },
    { type: 'STRUCTURAL_SAFETY', label: 'Building Structural Safety', icon: '🏢' },
    { type: 'ELECTRICAL_SAFETY', label: 'Electrical Audit Clearance', icon: '⚡' },
    { type: 'EMERGENCY_PLAN', label: 'Emergency Evacuation Plan', icon: '🚨' },
    { type: 'SCHOOL_PHOTO', label: 'School / Institution Front Photo', icon: '🏫' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#F8FAFC] max-w-5xl w-full rounded-3xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
        
        {/* ── HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-[#07111E] via-[#0F2038] to-[#1E3A5F] text-white p-5 border-b-4 border-[#D4AF37] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src="/up-police-logo.png" alt="UP Police" className="w-12 h-12 object-contain bg-white rounded-full p-1 border-2 border-[#D4AF37] shadow-md" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-[#D4AF37] bg-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]/40">
                  DCP {localInst.zone || 'CENTRAL'} ZONE — SAFE ID: {localInst.safeId}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                  localInst.qrLocked ? 'bg-rose-600 text-white animate-pulse' :
                  isUnlocked ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950 font-bold'
                }`}>
                  {localInst.qrLocked ? <><FiLock size={11} /> 🚨 QR CODE REVOKED / LOCKED</> :
                   isUnlocked ? <><FiUnlock size={11} /> 🔓 QR UNLOCKED &amp; ISSUED</> :
                   <><FiLock size={11} /> 🔒 QR CODE LOCKED (PENDING)</>}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-serif mt-1">
                {localInst.name}
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-rose-600 text-white rounded-full font-black text-lg flex items-center justify-center transition-all cursor-pointer border border-white/20"
          >
            ✕
          </button>
        </div>

        {/* ── MODAL BODY SCROLLABLE ── */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">

          {/* 🚨 SAFETY ENFORCEMENT & QR LOCKING CONTROL PANEL */}
          {localInst.qrLocked ? (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 text-rose-950 shadow-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FiAlertOctagon className="text-rose-600 text-xl" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">Official Enforcement Action</span>
                    <h4 className="text-sm font-black text-rose-900">🚨 QR Code Currently Revoked / Locked by Authorities</h4>
                  </div>
                </div>
                <span className="bg-rose-200 text-rose-900 border border-rose-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  REVOKED STATUS
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-rose-200 text-xs space-y-1.5">
                <p className="font-black text-rose-900 uppercase tracking-wider text-[10px]">Issued Notice &amp; Compliance Problem Reason:</p>
                <p className="text-slate-800 font-semibold italic bg-rose-50/60 p-2.5 rounded-lg border border-rose-200 break-words">{localInst.qrLockNotice}</p>
                <p className="text-[10px] text-slate-500 pt-1">
                  Issued by: <strong className="text-slate-700">{localInst.qrLockedBy || 'Authority'}</strong> · Date: {localInst.qrLockedAt}
                </p>
              </div>

              {localInst.rectificationSubmitted && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 text-amber-950 space-y-1.5">
                  <p className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                    <FiSend className="text-amber-700" /> Institution Rectification Report Submitted:
                  </p>
                  <p className="text-xs text-slate-800 font-semibold bg-white p-2.5 rounded-lg border border-amber-200">{localInst.rectificationNotes}</p>
                  <p className="text-[10px] text-amber-800 font-bold">Submitted on: {localInst.rectificationSubmittedAt}</p>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all border border-emerald-400"
                >
                  <FiUnlock size={14} /> Re-Inspect &amp; Unlock QR Code
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 via-[#0F2038] to-slate-900 text-white rounded-2xl p-4 border-2 border-[#D4AF37]/50 shadow-md flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <FiLock className="text-[#D4AF37]" size={15} />
                  <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-wider">Safety Enforcement Oversight</span>
                </div>
                <h4 className="text-xs font-black text-white">QR Code Status: {isUnlocked ? '🔓 UNLOCKED & ACTIVE' : '🔒 PENDING COMPLIANCE'}</h4>
                <p className="text-[10px] text-slate-300">If an issue is found during inspection, authorities can lock/revoke the generated QR code with an official problem notice.</p>
              </div>

              <button
                onClick={() => setShowLockModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all border border-rose-400"
              >
                <FiLock size={14} /> Lock / Revoke QR Code with Notice
              </button>
            </div>
          )}

          {/* 🚨 POLICE STATION & LOCATION BANNER */}
          <div className="bg-gradient-to-r from-blue-900 via-[#0F2038] to-blue-950 text-white rounded-2xl p-4 border-2 border-blue-400 shadow-md space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MdLocalPolice className="text-[#D4AF37] text-xl" />
                  <span className="text-[11px] font-black uppercase text-[#D4AF37] tracking-wider">
                    Designated Emergency Police Jurisdiction
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-serif">
                  👮 {currentInst.nearestPoliceStation || `${currentInst.district || 'Hazratganj'} Police Station`}
                </h3>
              </div>
              <span className="bg-blue-800/80 text-blue-200 border border-blue-400 px-3 py-1 rounded-xl text-[10px] font-bold">
                Emergency Priority Station
              </span>
            </div>

            <div className="pt-2 border-t border-blue-700/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-200">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-[#D4AF37] flex-shrink-0" />
                <span><strong>Building Address:</strong> {typeof currentInst.address === 'string' ? currentInst.address : (currentInst.address?.street || `${currentInst.district || 'Lucknow'}, Uttar Pradesh`)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-emerald-400 flex-shrink-0" />
                <span><strong>Registered Contact:</strong> {currentInst.contact || 'N/A'} ({currentInst.principal || 'Principal'})</span>
              </div>
            </div>
          </div>

          {/* 🏫 FACILITY & BUILDING SECURITY METRICS GRID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider font-serif flex items-center gap-2">
                <FiShield className="text-[#D4AF37]" /> Campus Infrastructure &amp; Safety Capacity
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">Inspector Mandate — Audit Metrics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Students */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-xs space-y-1 text-center">
                <p className="text-xs font-black text-[#0F2038]">👥 Students</p>
                <p className="text-lg font-black text-[#0F2038]">{totalStudents.toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-slate-500 font-semibold">Enrolled</p>
              </div>

              {/* Total Staff */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-xs space-y-1 text-center">
                <p className="text-xs font-black text-blue-900">👨‍🏫 Total Staff</p>
                <p className="text-lg font-black text-blue-900">{staffCount > 0 ? staffCount : 'N/A'}</p>
                <p className="text-[9px] text-slate-500 font-semibold">Teachers &amp; Staff</p>
              </div>

              {/* Classrooms */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-xs space-y-1 text-center">
                <p className="text-xs font-black text-indigo-900">🏫 Classrooms</p>
                <p className="text-lg font-black text-indigo-900">{classroomCount > 0 ? classroomCount : 'N/A'}</p>
                <p className="text-[9px] text-slate-500 font-semibold">Halls &amp; Rooms</p>
              </div>

              {/* Floors */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-xs space-y-1 text-center">
                <p className="text-xs font-black text-purple-900">🏢 Building Floors</p>
                <p className="text-lg font-black text-purple-900">{floorCount} Floors</p>
                <p className="text-[9px] text-slate-500 font-semibold">Vertical Height</p>
              </div>

              {/* Exit Gates */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-xs space-y-1 text-center">
                <p className="text-xs font-black text-emerald-900">🚪 Exit Gates</p>
                <p className="text-lg font-black text-emerald-900">{exitGateCount} Gates</p>
                <p className="text-[9px] text-slate-500 font-semibold">Emergency Exits</p>
              </div>

              {/* Density Ratio */}
              <div className={`border-2 rounded-2xl p-3 shadow-xs space-y-1 text-center ${
                densityRatio > 50 ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-emerald-50 border-emerald-400 text-emerald-900'
              }`}>
                <p className="text-xs font-black">📊 Class Density</p>
                <p className="text-lg font-black">{densityRatio > 0 ? `~${densityRatio}` : 'N/A'}</p>
                <p className="text-[9px] font-bold">{densityRatio > 50 ? '⚠️ Over-Strength' : '✓ Normal Ratio'}</p>
              </div>
            </div>
          </div>

          {/* 📋 BASIC INFO & CONTACT DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institution Metadata */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
              <h4 className="text-xs font-black text-[#0F2038] uppercase tracking-wider border-b border-slate-100 pb-2">
                🏛️ Governance &amp; Registration Profile
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <p><strong>Institution Type:</strong> {currentInst.type || 'SCHOOL'}</p>
                <p><strong>Affiliation Board:</strong> {currentInst.affiliationBoard || 'CBSE'} {currentInst.affiliationCode ? `(${currentInst.affiliationCode})` : ''}</p>
                <p><strong>District &amp; State:</strong> {currentInst.district}, {currentInst.state || 'Uttar Pradesh'}</p>
                <p><strong>Principal / Director:</strong> {currentInst.principal || 'N/A'}</p>
                <p><strong>Official Email:</strong> {currentInst.email || 'N/A'}</p>
              </div>
            </div>

            {/* DCP Inspector & Enforcement Info */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
              <h4 className="text-xs font-black text-[#0F2038] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>👮 Assigned DCP Inspector</span>
                <span className="text-[9px] font-black text-[#D4AF37] bg-[#0F2038] px-2 py-0.5 rounded uppercase">
                  DCP {currentInst.zone || 'CENTRAL'}
                </span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <p><strong>Inspector Name:</strong> {currentInst.assignedInspector || `DCP ${currentInst.zone || 'CENTRAL'}`}</p>
                <p><strong>Inspector Email:</strong> {currentInst.assignedInspectorEmail || `dcp${(currentInst.zone || 'central').toLowerCase()}@safeedup.gov.in`}</p>
                <p><strong>Last Inspection Audit:</strong> {currentInst.lastInspectionDate || 'Awaiting Physical Audit'}</p>
                <p><strong>District Risk Level:</strong> <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                  currentInst.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800' : currentInst.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>{currentInst.riskLevel || 'UNDER_REVIEW'}</span></p>
              </div>
            </div>
          </div>

          {/* 📜 NOC SAFETY CLEARANCES AUDIT */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center justify-between">
              <span>📜 Safety Clearance Certificates &amp; NOC Audit (4 Required)</span>
              <span className="text-[10px] font-bold text-slate-500">Compliance Score: {currentInst.complianceScore || 0}%</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {requiredDocs.map(req => {
                const doc = docs.find(d => 
                  d.type === req.type || 
                  d.documentType === req.type || 
                  (d.name && d.name.toLowerCase().includes(req.label.toLowerCase()))
                );
                const isVerified = doc?.status === 'VERIFIED';

                return (
                  <div key={req.type} className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                    isVerified ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-amber-50/70 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{req.icon}</span>
                      <div>
                        <p className="font-black text-xs">{req.label}</p>
                        <p className="text-[9px] opacity-80">{doc ? `Uploaded: ${doc.uploadedAt || 'Recently'}` : 'Not Uploaded'}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${
                      isVerified ? 'bg-emerald-600 text-white' : doc ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {isVerified ? '✓ VERIFIED' : doc ? '⏳ UPLOADED (PENDING AUDIT)' : '🔒 PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📂 ALL UPLOADED INSTITUTION DOCUMENTS & SCHOOL PHOTO VAULT */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FiFileText className="text-[#D4AF37]" /> All Uploaded Institution Safety Documents &amp; Photos ({docs.length})
              </span>
              <span className="text-[10px] font-bold text-slate-500">Live Verification Vault</span>
            </h4>

            {docs.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                📁 No safety documents or school photos uploaded by this institution yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docs.map(doc => {
                  const isImage = doc.fileDataUrl && (doc.fileDataUrl.startsWith('data:image') || doc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i));
                  return (
                    <div key={doc._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {isImage ? (
                          <img
                            src={doc.fileDataUrl}
                            alt={doc.name}
                            onClick={() => setZoomPhoto({ title: doc.name, url: doc.fileDataUrl })}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300 cursor-pointer flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0">
                            📄
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-black text-xs text-[#0F2038] truncate">{doc.name}</p>
                          <p className="text-[9px] text-slate-500 truncate">{doc.fileName} · {doc.uploadedAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                          doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.status}
                        </span>
                        {doc.fileDataUrl && (
                          <button
                            onClick={() => setZoomPhoto({ title: doc.name, url: doc.fileDataUrl })}
                            className="p-1.5 bg-[#0F2038] text-[#D4AF37] rounded-lg text-[10px] font-bold hover:bg-[#1E3A5F] cursor-pointer"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📷 SITE INSPECTION EVIDENCE PHOTOS GALLERY */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center gap-2">
              <FiCamera className="text-[#D4AF37]" /> On-Site Evidence Photos Posted by DCP Inspector ({instEvidence.reduce((a, e) => a + (e.photos?.length || 0), 0)} Photos)
            </h4>

            {instEvidence.length === 0 || instEvidence.every(e => !e.photos || e.photos.length === 0) ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                📷 No site inspection evidence photos uploaded by the DCP Inspector yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {instEvidence.flatMap(e => (e.photos || []).map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setZoomPhoto(photo)}
                    className="group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-[#D4AF37] cursor-pointer shadow-sm bg-slate-900 h-28"
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-90 group-hover:opacity-100 p-2 flex flex-col justify-end text-white">
                      <span className="text-[8px] font-black text-[#D4AF37] uppercase">{photo.category}</span>
                      <p className="text-[10px] font-bold truncate">{photo.title}</p>
                    </div>
                  </div>
                )))}
              </div>
            )}
          </div>

          {/* 💬 PUBLIC SAFETY COMPLAINTS (IF ANY) */}
          {instComplaints.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 text-rose-950 shadow-xs">
              <h4 className="text-xs font-black uppercase text-rose-900 tracking-wider flex items-center gap-1.5">
                <FiAlertTriangle className="text-rose-600" /> Public Complaints Registered ({instComplaints.length})
              </h4>
              <div className="space-y-2">
                {instComplaints.map(c => (
                  <div key={c._id} className="bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                    <div className="flex justify-between font-black text-rose-900">
                      <span>Ticket #{c.complaintTicket} — {c.safetyHazardType}</span>
                      <span className="text-[9px] uppercase bg-rose-100 px-2 py-0.5 rounded">{c.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-700">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500">
            SafeED-UP Digital Portal • Official State Records
          </span>
          <button
            onClick={onClose}
            className="bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-6 py-2.5 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow-md"
          >
            Close Full Details
          </button>
        </div>

      </div>

      {/* Lightbox Zoom Photo */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]">
            <div className="bg-[#0F2038] p-3 text-white flex justify-between items-center">
              <p className="text-xs font-black text-[#D4AF37]">{zoomPhoto.title}</p>
              <button onClick={() => setZoomPhoto(null)} className="text-white font-black cursor-pointer">✕</button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center">
              <img src={zoomPhoto.url} alt={zoomPhoto.title} className="max-h-[60vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* 🔒 LOCK QR CODE NOTICE MODAL */}
      {showLockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-rose-500 overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiLock className="text-rose-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider">Lock / Revoke QR Code Notice</h3>
              </div>
              <button onClick={() => setShowLockModal(false)} className="text-white/60 hover:text-white p-1 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleLockSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1 font-semibold">
                <p className="font-black text-rose-950">⚠️ WARNING: Formal Enforcement Notice</p>
                <p>Locking this institution's QR code will immediately revoke their QR certificate and display a prominent warning banner on their institution portal with your notice reason.</p>
              </div>

              {actionErr && (
                <p className="text-rose-600 font-bold bg-rose-100 p-2 rounded-lg border border-rose-300">{actionErr}</p>
              )}

              <div className="space-y-1">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block">
                  Detailed Notice / Problem Reason *
                </label>
                <textarea
                  rows="4"
                  required
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="e.g. Fire safety extinguishers expired during physical audit. Emergency exit blocked by classroom furniture."
                  className="w-full p-3 border-2 border-slate-300 rounded-xl text-xs focus:border-rose-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FiLock size={13} /> Confirm &amp; Lock QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔓 UNLOCK QR CODE RE-INSPECTION MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-emerald-500 overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiUnlock className="text-emerald-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider">Re-Inspect &amp; Unlock QR Certificate</h3>
              </div>
              <button onClick={() => setShowUnlockModal(false)} className="text-white/60 hover:text-white p-1 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 space-y-1 font-semibold">
                <p className="font-black text-emerald-950">✓ Re-Inspection &amp; Verification Clearance</p>
                <p>This action will restore the institution's QR Code certificate to active status and clear the enforcement lock notice.</p>
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block">
                  Re-Inspection Approval Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  value={unlockNotes}
                  onChange={(e) => setUnlockNotes(e.target.value)}
                  placeholder="e.g. Physical re-inspection conducted. Fire extinguishers replaced and verified. All safety compliance cleared."
                  className="w-full p-3 border-2 border-slate-300 rounded-xl text-xs focus:border-emerald-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FiUnlock size={13} /> Unlock &amp; Issue QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
