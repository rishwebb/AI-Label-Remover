import React, { useState } from 'react';
import type { CleaningResult, DetectedMetadata } from '../engine/types';
import { generateCameraFilename } from '../engine/camera-profiles';
import { formatBytes } from '../engine/hasher';
import { Download, CheckCircle2, ShieldCheck, Sparkles, Hash, Camera, RefreshCw, Edit3 } from 'lucide-react';

interface VerificationDiffProps {
  originalFile: File;
  originalMetadata: DetectedMetadata;
  result: CleaningResult;
  onReset: () => void;
}

export const VerificationDiff: React.FC<VerificationDiffProps> = ({
  originalFile,
  originalMetadata,
  result,
  onReset
}) => {
  // Initial filename based on camera preset or cleaned original name
  const [downloadName, setDownloadName] = useState<string>(() => {
    return generateCameraFilename(result.injectedCamera, originalFile.name);
  });

  const handleRandomizeCameraName = () => {
    setDownloadName(generateCameraFilename(result.injectedCamera, originalFile.name));
  };

  const handleRevertOriginalName = () => {
    const ext = originalFile.name.split('.').pop() || 'jpg';
    const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
    setDownloadName(`${baseName}_cleaned.${ext}`);
  };

  const downloadCleanedFile = () => {
    const finalName = downloadName.trim() || `IMG_${Math.floor(1000 + Math.random() * 9000)}.JPG`;
    const link = document.createElement('a');
    link.href = result.cleanedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Save Filename Customizer */}
      <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Edit3 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 shrink-0">Download File Name:</span>
          <input
            type="text"
            value={downloadName}
            onChange={(e) => setDownloadName(e.target.value)}
            className="bg-slate-900 border border-slate-700 focus:border-cyan-400 text-cyan-300 font-mono text-xs px-2.5 py-1 rounded w-full sm:w-64 outline-none"
            placeholder="e.g. IMG_4821.JPG"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {result.injectedCamera && (
            <button
              onClick={handleRandomizeCameraName}
              className="text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
              title="Generate a realistic DCIM sequence name like IMG_4921.JPG"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Camera DCIM Roll</span>
            </button>
          )}
          <button
            onClick={handleRevertOriginalName}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded transition-colors"
          >
            Use Original Name
          </button>
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

      {/* Image Preview & Diff */}
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
                src={URL.createObjectURL(originalFile)}
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
