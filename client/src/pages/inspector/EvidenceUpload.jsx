import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { evidenceStore } from '../../api/evidenceStore';
import {
  FiCamera, FiUpload, FiCheckCircle, FiAlertCircle, FiTrash2,
  FiEye, FiShield, FiCheck, FiMapPin, FiClock, FiVideo, FiX, FiRefreshCw
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';



export const EvidenceUpload = () => {
  const { user } = useAuth();
  const dcpZone = user?.dcpZone || 'DCP Central';
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [evidenceList, setEvidenceList] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Fire Safety');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Live Camera State & Refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const loadData = () => {
    // ✅ ZONE-FILTERED: Only show institutions from this DCP's zone
    const insts = institutionStore.getInstitutionsForZone(dcpZone);
    setInstitutions(insts);
    if (insts.length > 0 && !selectedInstId) {
      setSelectedInstId(insts[0]._id);
    }
    const evs = evidenceStore.getEvidenceList();
    setEvidenceList(evs);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, dcpZone]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permission in browser or upload file.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setPhotos(prev => [
      ...prev,
      {
        id: Date.now(),
        title: photoTitle || `Live Camera Photo ${prev.length + 1}`,
        category: photoCategory,
        url: dataUrl,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    stopCamera();
  };



  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [
          ...prev,
          {
            id: Date.now() + index,
            title: photoTitle || file.name || `Site Photo ${prev.length + 1}`,
            category: photoCategory,
            url: reader.result,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (photos.length < 3) {
      alert('❌ Minimum 3 site inspection evidence photos are required for Higher Authorities audit!');
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));

    const inst = institutions.find(i => i._id === selectedInstId);

    evidenceStore.submitInspectionEvidence({
      institutionId: selectedInstId,
      institutionName: inst?.name || 'School',
      inspectorName: user?.name || 'DCP Inspection Officer',
      dcpZone: user?.dcpZone || 'DCP Central',
      photos,
      remarks,
    });

    setPhotos([]);
    setRemarks('');
    setSubmitting(false);
    loadData();
    setToast('✅ Inspection Evidence & 3+ Site Photos submitted! Flagged for Higher Authorities Audit (ADGP & Police Commissioner).');
    setTimeout(() => setToast(''), 5000);
  };

  const currentInst = institutions.find(i => i._id === selectedInstId);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-4 py-3 rounded-2xl shadow-2xl animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white hover:text-[#D4AF37] font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-7 h-7 object-contain" />
            <h1 className="text-xl font-black text-[#0F2038] font-serif">Site Inspection Evidence Portal</h1>
          </div>
          <p className="text-xs text-slate-500 ml-9">
            Upload at least / min. 3 site evidence photos per inspection for Higher Authorities (ADGP & Police Commissioner) audit.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0F2038] text-[#D4AF37] px-3.5 py-2 rounded-xl text-xs font-black border border-[#D4AF37]">
          <MdLocalPolice size={16} /> {user?.name || 'Inspection Officer'} ({user?.designation || user?.rankLevel || 'Sub-Inspector'}) • {dcpZone}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FiCamera className="text-[#D4AF37] text-lg" />
            <h2 className="text-sm font-black text-[#0F2038]">Submit Site Evidence (Min. 3 Photos)</h2>
          </div>

          <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
            {/* Select School */}
            <div>
              <label className="block font-black text-[#0F2038] mb-1">Select Institution <span className="text-rose-500">*</span></label>
              <select
                value={selectedInstId}
                onChange={e => setSelectedInstId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37] font-semibold"
              >
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.district}) — {inst.safeId}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Category & Upload / Camera */}
            <div className="space-y-2">
              <label className="block font-black text-[#0F2038] mb-1">Add Site Photos (Live Camera / File Upload)</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full bg-[#0F2038] hover:bg-[#1E3A5F] text-[#D4AF37] border-2 border-[#D4AF37] text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all"
                >
                  <FiCamera size={16} /> Open Camera
                </button>

                <label className="w-full bg-slate-100 hover:bg-slate-200 text-[#0F2038] border-2 border-slate-300 text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all text-center">
                  <FiUpload size={14} /> Upload File
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Selected Photos Count Badge */}
            <div className={`p-3 rounded-xl border-2 text-xs font-black flex items-center justify-between ${
              photos.length >= 3 ? 'bg-emerald-50 text-emerald-900 border-emerald-400' : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              <span>Photos Uploaded: {photos.length} / 3 min</span>
              <span>{photos.length >= 3 ? '✓ Minimum Requirement Met' : '⚠️ Min 3 Required'}</span>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Preview Selected Evidence:</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group border rounded-lg overflow-hidden bg-slate-100 aspect-square">
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 text-xs"
                      >
                        <FiTrash2 size={10} />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] p-1 truncate font-semibold">
                        {p.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block font-black text-[#0F2038] mb-1">Inspection Evidence Remarks</label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={2}
                placeholder="Enter site inspection findings (e.g. All fire extinguishers operational, exit routes cleared)..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || photos.length < 3}
              className="w-full bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black py-3 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting Evidence...' : <><FiUpload size={14} /> Submit Evidence for Higher Audit</>}
            </button>
          </form>
        </div>

        {/* Uploaded Evidence Feed for Higher Authorities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FiShield className="text-[#D4AF37] text-lg" />
                <h2 className="text-sm font-black text-[#0F2038]">Site Evidence Audit Records (Higher Authorities Log)</h2>
              </div>
              <span className="text-xs font-black text-slate-500">{evidenceList.length} Inspection Audits</span>
            </div>

            <div className="space-y-4">
              {evidenceList.map((ev) => (
                <div key={ev._id} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3 hover:border-[#D4AF37] transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-xs font-black text-[#0F2038]">{ev.institutionName}</h3>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Inspector: <strong>{ev.inspectorName}</strong> ({ev.dcpZone}) • Inspection Date: {ev.date}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                      <MdVerified size={12} /> {ev.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 italic font-semibold">"{ev.remarks}"</p>

                  {/* Photos Grid */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FiCamera size={11} className="text-[#D4AF37]" /> {ev.photos?.length || 0} Site Photos Submitted:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {ev.photos?.map((photo, i) => (
                        <div key={i} className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <img src={photo.url} alt={photo.title} className="w-full h-24 object-cover" />
                          <div className="p-1.5 text-[9px] bg-slate-900 text-white">
                            <p className="font-black text-[#D4AF37] truncate">{photo.category}</p>
                            <p className="opacity-75 truncate">{photo.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📸 LIVE CAMERA CAPTURE MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F2038] border-4 border-[#D4AF37] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-5 text-white relative">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
              <div className="flex items-center gap-2">
                <FiCamera size={18} className="text-[#D4AF37]" />
                <h3 className="text-sm font-black text-[#D4AF37] font-serif uppercase tracking-wider">
                  Live Site Inspection Camera Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-full text-lg cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {cameraError ? (
              <div className="p-6 text-center space-y-3 bg-rose-950/60 border border-rose-600/50 rounded-2xl text-rose-200">
                <FiAlertCircle size={32} className="mx-auto text-rose-400" />
                <p className="text-xs font-bold">{cameraError}</p>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-xs font-black bg-white text-rose-900 px-4 py-2 rounded-xl cursor-pointer"
                >
                  Close &amp; Use File Upload
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[#D4AF37] font-mono text-[9px] font-bold px-2.5 py-1 rounded border border-[#D4AF37]/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    LIVE WEBCAM STREAM
                  </div>
                </div>

                {/* Hidden Canvas for Frame Snap */}
                <canvas ref={canvasRef} className="hidden" />

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={snapPhoto}
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-[#0F2038] font-black text-xs py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
                  >
                    <FiCamera size={16} /> Snap Evidence Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
