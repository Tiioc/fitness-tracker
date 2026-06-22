"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Keyboard } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    if (manualMode) return;
    const reader = new BrowserMultiFormatReader();
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result && !stopped) {
          stopped = true;
          if (navigator.vibrate) navigator.vibrate(60);
          onDetected(result.getText());
        }
      })
      .then((c) => { controls = c; })
      .catch(() => setError("Couldn't access the camera. Enter the barcode manually instead."));

    return () => { stopped = true; controls?.stop(); };
  }, [manualMode, onDetected]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h3 className="font-semibold">Scan barcode</h3>
        <button onClick={onClose} className="p-1"><X size={22} /></button>
      </div>

      {!manualMode ? (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {/* Aiming frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-40 border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
          {error && (
            <div className="absolute bottom-24 left-4 right-4 text-center text-sm text-red-300">{error}</div>
          )}
          <p className="absolute bottom-28 left-0 right-0 text-center text-xs text-white/70">
            Point at the product barcode
          </p>
          <button
            onClick={() => setManualMode(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl text-sm text-white"
          >
            <Keyboard size={16} /> Enter barcode manually
          </button>
        </div>
      ) : (
        <div className="flex-1 px-5 pt-6 space-y-3">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Barcode number"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
          />
          <button
            onClick={() => manual.trim() && onDetected(manual.trim())}
            className="w-full py-3 rounded-xl bg-blue-600 font-semibold text-white"
          >
            Look up
          </button>
          <button onClick={() => setManualMode(false)} className="w-full py-2 text-sm text-gray-400">
            ← Back to camera
          </button>
        </div>
      )}
    </div>
  );
}
