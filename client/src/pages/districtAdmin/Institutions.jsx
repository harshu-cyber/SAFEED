import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper/PageWrapper';
import { Card, Badge } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import { FiCheck, FiX, FiDownload, FiUserPlus, FiEye, FiShield } from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

const INSPECTION_OFFICERS = [
  { name: 'DCP WEST', email: 'dcpwest@safeedup.gov.in', zone: 'WEST' },
  { name: 'DCP CENTRAL', email: 'dcpcentral@safeedup.gov.in', zone: 'CENTRAL' },
  { name: 'DCP NORTH', email: 'dcpnorth@safeedup.gov.in', zone: 'NORTH' },
  { name: 'DCP EAST', email: 'dcpeast@safeedup.gov.in', zone: 'EAST' },
  { name: 'DCP SOUTH', email: 'dcpsouth@safeedup.gov.in', zone: 'SOUTH' },
];

export const DistrictInstitutionsPage = () => {
  const { user } = useAuth();
  const districtName = user?.district || 'Lucknow';
  const [institutions, setInstitutions] = useState([]);
  const [assignInst, setAssignInst] = useState(null);
  const [selectedInstModal, setSelectedInstModal] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState('DCP CENTRAL');
  const [toast, setToast] = useState('');

  const loadRealTimeData = () => {
    const all = institutionStore.getInstitutions();
    setInstitutions(all);
  };

  useEffect(() => {
    loadRealTimeData();
    const interval = setInterval(loadRealTimeData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = (e) => {
    e.preventDefault();
    if (!assignInst) return;

    const officer = INSPECTION_OFFICERS.find(o => o.name === selectedOfficer) || INSPECTION_OFFICERS[0];
    institutionStore.assignInspectorToInstitution(assignInst._id, officer);

    loadRealTimeData();
    setAssignInst(null);
    setToast(`✅ Inspection officer assigned to ${officer.name} for ${assignInst.name}`);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <PageWrapper
      title={`District Institution Registry — ${districtName}`}
      subtitle="Monitor digital applications, assign DCP Inspection Officers, and track real-time compliance"
      actions={
        <a href="/api/v1/reports/district/excel" download className="inline-flex">
          <Button icon={FiDownload} variant="outline">
            Export Excel Report
          </Button>
        </a>
      }
    >
      {toast && (
        <div className="mb-4 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white hover:text-[#D4AF37]">✕</button>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          {institutions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                🏫
              </div>
              <p className="text-sm font-black text-[#0F2038]">No Institutions Registered Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When institutions in {districtName} complete registration, they will automatically sync here in real-time.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <th className="text-left p-3">Safe ID / Institution</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Zone</th>
                  <th className="text-left p-3">Principal / Contact</th>
                  <th className="text-left p-3">Enrolled Students</th>
                  <th className="text-left p-3">Compliance</th>
                  <th className="text-left p-3">Assigned Inspector</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map(row => {
                  const isUnlocked = institutionStore.isCertificateUnlocked(row._id);

                  return (
                    <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="font-mono font-black text-[#0F2038] text-[10px]">{row.safeId}</p>
                        <p
                          onClick={() => setSelectedInstModal(row)}
                          className="font-black text-[#0F2038] text-xs hover:text-[#D4AF37] cursor-pointer flex items-center gap-1"
                        >
                          <span>{row.name}</span>
                          <FiEye size={11} className="text-[#D4AF37]" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">{row.address}</p>
                        <p className="text-[9px] font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 mt-0.5">
                          <MdLocalPolice size={10} className="text-blue-800" />
                          {row.nearestPoliceStation || `${row.district || 'Hazratganj'} Police Station`}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{row.type}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          DCP {row.zone || 'CENTRAL'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{row.principal} ({row.contact})</td>
                      <td className="p-3 font-black text-[#0F2038]">{row.totalStudents || 0}</td>
                      <td className="p-3 font-black text-emerald-700">{row.complianceScore}%</td>
                      <td className="p-3">
                        {row.assignedInspector ? (
                          <span className="text-[10px] font-bold text-[#0F2038] flex items-center gap-1">
                            <MdLocalPolice className="text-[#D4AF37]" /> {row.assignedInspector}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={isUnlocked ? 'success' : 'warning'}>
                          {isUnlocked ? 'VERIFIED 🔓' : 'PENDING 🔒'}
                        </Badge>
                      </td>
                      <td className="p-3 space-y-1">
                        <button
                          onClick={() => setSelectedInstModal(row)}
                          className="text-[10px] font-black px-2.5 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-lg hover:bg-[#1E3A5F] transition-all flex items-center gap-1 cursor-pointer w-full justify-center shadow-sm"
                        >
                          <FiEye size={11} /> View Full Info
                        </button>
                        <button
                          onClick={() => {
                            setAssignInst(row);
                            setSelectedOfficer(row.assignedInspector || `DCP ${row.zone || 'CENTRAL'}`);
                          }}
                          className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-[#0F2038] border border-slate-300 rounded-lg hover:bg-[#0F2038] hover:text-[#D4AF37] transition-all flex items-center gap-1 cursor-pointer w-full justify-center"
                        >
                          <FiUserPlus size={11} /> Assign Officer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Assign Modal */}
      {assignInst && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden">
            <div className="bg-[#0F2038] p-4 text-white flex items-center gap-2 border-b-2 border-[#D4AF37]">
              <img src="/up-police-logo.png" alt="UP Police" className="w-7 h-7 object-contain" />
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Assign DCP Inspection Officer</h3>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-500">Institution Name:</p>
                <p className="text-sm font-black text-[#0F2038]">{assignInst.name}</p>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Select DCP Officer</label>
                <select
                  value={selectedOfficer}
                  onChange={e => setSelectedOfficer(e.target.value)}
                  className="w-full text-xs font-bold p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {INSPECTION_OFFICERS.map(o => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.zone} Zone)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignInst(null)}
                  className="flex-1 font-black py-2.5 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-black py-2.5 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F]"
                >
                  Confirm Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full Details Modal */}
      {selectedInstModal && (
        <InstitutionFullDetailModal
          institution={selectedInstModal}
          onClose={() => setSelectedInstModal(null)}
        />
      )}
    </PageWrapper>
  );
};
