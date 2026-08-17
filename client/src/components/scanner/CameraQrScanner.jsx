import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiX, FiRefreshCw, FiImage, FiAlertCircle } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';

export const CameraQrScanner = ({ isOpen, onClose }) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeCamera, setActiveCamera] = useState('environment'); // environment or user
  const scannerRef = useRef(null);
  const navigate = useNavigate();
  const elementId = 'qr-camera-stream';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    startScanner(activeCamera);

    return () => {
      stopScanner();
    };
  }, [isOpen, activeCamera]);

  const startScanner = async (cameraMode) => {
    setCameraError('');
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: cameraMode },
        config,
        (decodedText) => {
          // Success callback
          html5QrCode.stop().then(() => {
            scannerRef.current = null;
            onClose();
            // Handle URL or raw Safe ID
            let targetSafeId = decodedText;
            if (decodedText.includes('/verify/')) {
              targetSafeId = decodedText.split('/verify/')[1];
            }
            navigate(`/verify/${targetSafeId.trim()}`);
          }).catch(console.error);
        },
        () => {
          // Frame error (scanning)
        }
      );

      setScannerStarted(true);
    } catch (err) {
      console.error('Camera Scanner Error:', err);
      setCameraError('Camera access denied or device camera unavailable. Please grant camera permission or enter Safe ID manually.');
      setScannerStarted(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        setScannerStarted(false);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode(elementId);
    html5QrCode.scanFile(file, true)
      .then((decodedText) => {
        onClose();
        let targetSafeId = decodedText;
        if (decodedText.includes('/verify/')) {
          targetSafeId = decodedText.split('/verify/')[1];
        }
        navigate(`/verify/${targetSafeId.trim()}`);
      })
      .catch(() => {
        alert('Could not detect a valid Safe ID QR Code in the selected image.');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#07111E] text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-[#D4AF37] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] flex items-center justify-center">
              <MdQrCodeScanner size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-serif">Live QR Code Camera Scanner</h3>
              <p className="text-[10px] text-[#D4AF37] font-bold uppercase">SafeED-UP Device Camera Access</p>
            </div>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative bg-black rounded-2xl overflow-hidden min-h-[280px] border-2 border-slate-800 flex items-center justify-center">
          <div id={elementId} className="w-full h-full"></div>

          {!scannerStarted && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#07111E]">
              <FiCamera size={40} className="text-[#D4AF37] animate-pulse mb-2" />
              <p className="text-xs font-bold">Requesting Camera Permission...</p>
              <p className="text-[10px] text-slate-400 mt-1">Please allow camera access when prompted by browser</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-rose-950/90 text-rose-200 space-y-3">
              <FiAlertCircle size={36} className="text-rose-400" />
              <p className="text-xs font-bold">{cameraError}</p>
              <label className="bg-[#D4AF37] text-[#0F2038] font-black text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-amber-400 transition-colors flex items-center gap-2">
                <FiImage size={14} /> Upload QR Image from Gallery
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCamera(prev => (prev === 'environment' ? 'user' : 'environment'))}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-semibold text-[11px] cursor-pointer"
            >
              <FiRefreshCw size={12} /> Switch Camera
            </button>
            <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-semibold text-[11px] cursor-pointer">
              <FiImage size={12} /> Upload Image
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="text-slate-400 hover:text-white text-[11px] font-semibold underline"
          >
            Cancel
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-4 border-t border-slate-800 pt-3">
          Point your smartphone camera directly at the SafeED-UP QR code printed on the school/coaching main gate.
        </p>
      </div>
    </div>
  );
};
