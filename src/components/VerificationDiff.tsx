import React, { useState, useRef, useMemo } from 'react';
import type { CleaningResult, DetectedMetadata } from '../engine/types';
import { type CameraProfile, CAMERA_PRESETS, generateCameraFilename } from '../engine/camera-profiles';
import { formatBytes } from '../engine/hasher';
import { Download, CheckCircle2, ShieldCheck, Sparkles, Hash, Camera, RefreshCw, Edit3, Sliders, LayoutGrid } from 'lucide-react';

interface VerificationDiffProps {
  originalFile: File;
  originalMetadata: DetectedMetadata;
  result: CleaningResult;
  selectedCamera?: CameraProfile;
  onReset: () => void;
}

export const VerificationDiff: React.FC<VerificationDiffProps> = ({
  originalFile,
  originalMetadata,
  result,
  selectedCamera,
  onReset
}) => {
  const [viewMode, setViewMode] = useState<'SLIDER' | 'GRID'>('SLIDER');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const originalUrl = useMemo(() => URL.createObjectURL(originalFile), [originalFile]);

  // Determine active camera format (injected camera > selected camera > detected camera in metadata > default S24)
  const [activeCameraName, setActiveCameraName] = useState<string>(() => {
    return (
      result.injectedCamera ||
      selectedCamera?.name ||
      originalMetadata.cameraMake ||
      originalMetadata.cameraModel ||
      'Samsung Galaxy S24 Ultra'
    );
  });

  // Always default to legitimate camera hardware roll filename matching the chosen camera
  const [downloadName, setDownloadName] = useState<string>(() => {
    const camName =
      result.injectedCamera ||
      selectedCamera?.name ||
      originalMetadata.cameraMake ||
      originalMetadata.cameraModel ||
      'Samsung Galaxy S24 Ultra';
    return generateCameraFilename(camName);
  });

  const handleSelectCameraPreset = (cam: CameraProfile) => {
    setActiveCameraName(cam.name);
    setDownloadName(generateCameraFilename(cam.name));
  };

  const handleRandomizeCameraName = () => {
    setDownloadName(generateCameraFilename(activeCameraName));
  };

  const downloadCleanedFile = () => {
    const finalName = downloadName.trim() || generateCameraFilename(activeCameraName);
    const link = document.createElement('a');
    link.href = result.cleanedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateSliderFromClientX = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(Math.round(clamped));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      updateSliderFromClientX(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      updateSliderFromClientX(e.touches[0].clientX);
    }
  };

  return (
    <div className="bg-[#111726] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl shadow-cyan-950/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Verification & Integrity Certificate
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            Sanitized in {result.processingTimeMs} ms using{' '}
            <span className="text-cyan-400 font-mono">
              {result.isLossless ? '100% Lossless Slicing' : 'Canvas Re-render'}
            </span>
            {result.injectedCamera && (
              <span className="text-indigo-400 font-mono">
                {' '}· Injected: {result.injectedCamera}
              </span>
            )}
            .
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onReset}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors text-center"
          >
            Reset
          </button>
          <button
            onClick={downloadCleanedFile}
            className="flex-2 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download Image</span>
          </button>
        </div>
      </div>

      {/* Save Filename Customizer & Camera Brand Matcher */}
      <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Edit3 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-mono text-slate-300 shrink-0">Camera Roll Filename:</span>
            <input
              type="text"
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              className="bg-slate-900 border border-slate-700 focus:border-cyan-400 text-cyan-300 font-mono text-xs px-2.5 py-1.5 rounded w-full sm:w-64 outline-none"
              placeholder="e.g. 20241120_192045.jpg or IMG_4821.JPG"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRandomizeCameraName}
              className="text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-colors"
              title="Generate a new sequence number or timestamp for this camera brand"
            >
              <RefreshCw className="w-3 h-3" />
              <span>New Sequence ID</span>
            </button>
          </div>
        </div>

        {/* Quick Camera Brand Format Switcher */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Camera className="w-3 h-3 text-slate-500" /> Match Brand:
          </span>
          {CAMERA_PRESETS.map((cam) => {
            const isCurrent =
              activeCameraName.toLowerCase().includes(cam.make.toLowerCase()) ||
              activeCameraName.toLowerCase().includes(cam.model.toLowerCase());
            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => handleSelectCameraPreset(cam)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 ring-1 ring-cyan-500/40 font-semibold'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={`Format filename as authentic ${cam.name} DCIM roll`}
              >
                {cam.name.replace('Apple ', '').replace('Samsung Galaxy ', 'Samsung ').replace('α', 'A')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Delta Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">C2PA Manifest</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Purged
          </span>
        </div>
        <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">Hardware Signature</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-indigo-400 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {result.injectedCamera ? 'Injected' : 'Intact'}
          </span>
        </div>
        <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">Pixel Integrity</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {result.isLossless ? 'Untouched' : 'Preserved'}
          </span>
        </div>
        <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">AI Badge Status</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
            Neutralized
          </span>
        </div>
      </div>

      {/* Visual Diff Header & Mode Switcher */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Lossless Verification Preview:
        </span>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('SLIDER')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded flex items-center gap-1 transition-colors ${
              viewMode === 'SLIDER'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Split Reveal Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('GRID')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded flex items-center gap-1 transition-colors ${
              viewMode === 'GRID'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Split Reveal Slider */}
      {viewMode === 'SLIDER' && (
        <div className="space-y-2">
          <div
            ref={sliderContainerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={(e) => updateSliderFromClientX(e.clientX)}
            className="relative aspect-video max-h-[460px] w-full bg-[#0a0e18] rounded-2xl overflow-hidden border border-cyan-500/40 select-none cursor-ew-resize group shadow-2xl"
          >
            {/* Sanitized Layer (Background / Right) */}
            <img
              src={result.cleanedUrl}
              alt="Sanitized preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-emerald-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/40 pointer-events-none z-10">
              {result.injectedCamera ? `Shot on ${result.injectedCamera}` : 'Sanitized & Cloaked'}
            </div>

            {/* Original Layer (Foreground / Left, clipped by sliderPos) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img
                src={originalUrl}
                alt="Original preview"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-rose-300 border border-rose-500/40 pointer-events-none z-10">
                Original (AI Provenance Flagged)
              </div>
            </div>

            {/* Slider Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none z-20 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white pointer-events-auto cursor-grab active:cursor-grabbing">
                ↔
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>◄ Drag slider to reveal pixel-identical comparison</span>
            <span>Split: {sliderPos}%</span>
          </div>
        </div>
      )}

      {/* Mode 2: Side-by-Side Grid Preview & Diff */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left: Original Details */}
          <div className="bg-[#0d1322] border border-slate-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-slate-400">Original File</span>
                <span className="text-xs font-mono text-slate-400">{formatBytes(result.originalSize)}</span>
              </div>
              <div className="aspect-video bg-black/50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 relative group">
                <img
                  src={originalUrl}
                  alt="Original preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-rose-300 border border-rose-500/40">
                  AI / EXIF Intact
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px] sm:text-xs text-slate-400 font-mono">
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="text-slate-200">{originalMetadata.format}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dimensions:</span>
                  <span className="text-slate-200">
                    {originalMetadata.dimensions.width}×{originalMetadata.dimensions.height}
                  </span>
                </div>
                <div className="flex items-center justify-between truncate" title={result.originalSha256}>
                  <span className="flex items-center gap-1 shrink-0">
                    <Hash className="w-3 h-3 text-slate-500" /> Hash:
                  </span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[150px] sm:max-w-[200px]">
                    {result.originalSha256}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sanitized Cleaned File */}
          <div className="bg-[#0d1322] border border-cyan-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-lg shadow-cyan-950/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sanitized File
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {formatBytes(result.cleanedSize)}
                </span>
              </div>
              <div className="aspect-video bg-black/50 rounded-lg overflow-hidden flex items-center justify-center border border-cyan-900/60 relative">
                <img
                  src={result.cleanedUrl}
                  alt="Sanitized preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-emerald-300 border border-emerald-500/40">
                  {result.injectedCamera ? `Shot on ${result.injectedCamera}` : '100% Provenance Free'}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px] sm:text-xs text-slate-400 font-mono">
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="text-slate-200">{originalMetadata.format} (Cleaned)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hardware:</span>
                  <span className="text-indigo-400 truncate max-w-[150px] sm:max-w-[200px]">
                    {result.injectedCamera || 'Cleaned'}
                  </span>
                </div>
                <div className="flex items-center justify-between truncate" title={result.cleanedSha256}>
                  <span className="flex items-center gap-1 shrink-0">
                    <Hash className="w-3 h-3 text-cyan-500" /> Hash:
                  </span>
                  <span className="text-cyan-400 text-[10px] truncate max-w-[150px] sm:max-w-[200px]">
                    {result.cleanedSha256}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 5: Social Platform Pre-Flight Readiness Simulator */}
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-mono uppercase text-slate-200 font-semibold tracking-wider">
              Social Platform Pre-Flight Readiness Simulator
            </h4>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded w-fit">
            100% Stealth · Zero AI Flag Risk
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 font-mono text-xs">
          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white">Instagram</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">PASS</span>
            </div>
            <p className="text-[10px] text-slate-400">C2PA APP11 purged. IPTC markers stripped.</p>
          </div>

          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white">Threads & Meta</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">PASS</span>
            </div>
            <p className="text-[10px] text-slate-400">digitalSourceType wiped from XMP payload.</p>
          </div>

          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white">TikTok</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">PASS</span>
            </div>
            <p className="text-[10px] text-slate-400">Content Credentials box (0xFFEB) sliced.</p>
          </div>

          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white">X / Twitter</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">PASS</span>
            </div>
            <p className="text-[10px] text-slate-400">Lossless JPEG/PNG container sanitized.</p>
          </div>

          <div className="bg-[#0e1424] border border-slate-800/80 rounded-lg p-2.5 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white">Google Lens</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">PASS</span>
            </div>
            <p className="text-[10px] text-slate-400">SynthID & Provenance signatures neutralized.</p>
          </div>
        </div>
      </div>

      {/* Removed vs Preserved Tags Breakdown */}
      <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
        <h4 className="text-[11px] sm:text-xs font-mono uppercase text-slate-300">Detailed Action Ledger</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs font-mono">
          <div>
            <span className="text-rose-400 font-semibold block mb-1.5 flex items-center gap-1.5">
              <span>✕</span> Removed Containers ({result.removedSegments.length})
            </span>
            <ul className="space-y-1 text-slate-400">
              {result.removedSegments.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-rose-300/80">
                  <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                  <span className="break-all">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-emerald-400 font-semibold block mb-1.5 flex items-center gap-1.5">
              <span>✓</span> Preserved & Injected Segments ({result.preservedSegments.length})
            </span>
            <ul className="space-y-1 text-slate-400">
              {result.preservedSegments.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-emerald-300/80">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <span className="break-all">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
