import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper/PageWrapper';
import { Card, Spinner } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { FiCheckSquare, FiAlertCircle } from 'react-icons/fi';

export const EmergencyPlanPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [formData, setFormData] = useState({
    hasFireExtinguishers: true,
    fireExtinguisherCount: 12,
    hasFireAlarm: true,
    hasEmergencyExits: true,
    emergencyExitCount: 4,
    hasEvacuationPlan: true,
    hasFirstAidKit: true,
    firstAidKitCount: 5,
    firstAidTrainedStaffCount: 8,
    hasCCTV: true,
    cctvCameraCount: 20,
    cctvFunctional: true,
  });

  useEffect(() => {
    if (user?.institutionId) {
      axiosInstance.get(`/compliance/institution/${user.institutionId}`)
        .then(res => {
          if (res.data?.data?.emergencyPlan) {
            setFormData(prev => ({ ...prev, ...res.data.data.emergencyPlan }));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await axiosInstance.post(`/compliance/emergency-plan/${user.institutionId}`, formData);
      setMsg('Emergency readiness checklist saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <PageWrapper title="Emergency Readiness Plan" subtitle="Self-declaration of fire safety &amp; disaster evacuation preparedness">
      <Card className="max-w-4xl mx-auto">
        {msg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider mb-3">1. Fire Safety Equipment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasFireExtinguishers}
                  onChange={(e) => setFormData({ ...formData, hasFireExtinguishers: e.target.checked })}
                />
                <span>Functional Fire Extinguishers Available</span>
              </label>

              <div>
                <label className="block font-semibold mb-1">Total Extinguishers Count</label>
                <input
                  type="number"
                  value={formData.fireExtinguisherCount}
                  onChange={(e) => setFormData({ ...formData, fireExtinguisherCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border rounded"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasFireAlarm}
                  onChange={(e) => setFormData({ ...formData, hasFireAlarm: e.target.checked })}
                />
                <span>Automatic Fire Alarm &amp; Smoke Detectors</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider mb-3">2. Exits &amp; Evacuation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasEmergencyExits}
                  onChange={(e) => setFormData({ ...formData, hasEmergencyExits: e.target.checked })}
                />
                <span>Marked Emergency Exits</span>
              </label>

              <div>
                <label className="block font-semibold mb-1">Emergency Exits Count</label>
                <input
                  type="number"
                  value={formData.emergencyExitCount}
                  onChange={(e) => setFormData({ ...formData, emergencyExitCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border rounded"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving}>Save Emergency Readiness Plan</Button>
          </div>
        </form>
      </Card>
    </PageWrapper>
  );
};
