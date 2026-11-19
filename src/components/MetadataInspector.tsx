import React, { useState } from 'react';
import type { DetectedMetadata, CleaningMode } from '../engine/types';
import { formatBytes } from '../engine/hasher';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MapPin,
  Camera,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface MetadataInspectorProps {
  metadata: DetectedMetadata;
  selectedMode: CleaningMode;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({ metadata, selectedMode }) => {
  const [showRawSegments, setShowRawSegments] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`rounded-xl p-3.5 sm:p-4 border flex items-start gap-3 sm:gap-4 ${
          metadata.isAiFlagged
            ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
            : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
        }`}
      >
        <div
          className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${
            metadata.isAiFlagged ? 'bg-rose-900/40 text-rose-400' : 'bg-emerald-900/40 text-emerald-400'
          }`}
        >
          {metadata.isAiFlagged ? <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" /> : <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-sm sm:text-base text-white">
              {metadata.isAiFlagged
                ? 'AI Provenance & Badging Triggers Detected'
                : 'No Generative AI Metadata Found'}
            </h4>
            {metadata.c2paDetected && (
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                C2PA Active
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
            {metadata.isAiFlagged
              ? 'This file contains C2PA cryptographic manifests or IPTC algorithmic media assertions. When uploaded to platforms like Instagram, Meta, or TikTok, these specific tags trigger the automated "Made with AI" badge.'
              : 'This image does not contain standard C2PA manifests or generative AI software markers.'}
          </p>
        </div>
      </div>

      {/* Grid of Forensic Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Category 1: AI & Provenance */}
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                AI Origin Markers
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded ${
                  metadata.isAiFlagged
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {metadata.isAiFlagged ? 'Triggers Badge' : 'Clean'}
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">C2PA Manifest:</span>
                <span className={`font-mono text-right ${metadata.c2paDetected ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}>
                  {metadata.c2paDetected ? 'Present (APP11)' : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Generative Tag:</span>
                <span className="font-mono text-slate-200 text-right truncate max-w-[130px] sm:max-w-none">
                  {metadata.aiGenerativeType ? 'trainedAlgorithmicMedia' : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Detected Software:</span>
                <span className="font-mono text-cyan-400 truncate max-w-[130px] sm:max-w-[160px] text-right" title={metadata.aiSoftware || 'None'}>
                  {metadata.aiSoftware || 'Not Specified'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Target of "Anti-AI" mode</span>
          </div>
        </div>

        {/* Category 2: Personal Privacy & Location */}
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Privacy & Location
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded ${
                  metadata.hasGps
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {metadata.hasGps ? 'GPS Detected' : 'No GPS'}
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">GPS Coordinates:</span>
                <span className={`font-mono text-right ${metadata.hasGps ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                  {metadata.hasGps ? 'Coordinates Stored' : 'Not Present'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Author / Creator:</span>
                <span className="font-mono text-slate-200 truncate max-w-[130px] sm:max-w-[160px] text-right">
                  {metadata.creatorOrAuthor || 'Anonymous'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Date Timestamp:</span>
                <span className="font-mono text-slate-200 text-right">
                  {metadata.dateTaken || 'None'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Wiped in "Full Privacy" mode</span>
          </div>
        </div>

        {/* Category 3: Technical Integrity */}
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Technical & Color
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900/40">
                {metadata.format}
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Dimensions:</span>
                <span className="font-mono text-slate-200 text-right">
                  {metadata.dimensions.width > 0 ? `${metadata.dimensions.width}×${metadata.dimensions.height}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">ICC Color Profile:</span>
                <span className="font-mono text-emerald-400 text-right">
                  {metadata.hasIccProfile ? 'Embedded' : 'Standard sRGB'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total File Size:</span>
                <span className="font-mono text-slate-200 text-right">
                  {formatBytes(metadata.fileSize)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Colors & Pixels kept lossless</span>
          </div>
        </div>
      </div>

      {/* Raw Binary Segments Accordion */}
      {metadata.rawSegments.length > 0 && (
        <div className="border border-slate-800 bg-[#0f1422] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawSegments(!showRawSegments)}
            className="w-full px-3.5 sm:px-4 py-3 flex items-center justify-between text-left text-xs font-mono text-slate-300 hover:bg-slate-800/40 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Binary Segments ({metadata.rawSegments.length} found)</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400 shrink-0 text-[11px]">
              {showRawSegments ? 'Hide' : 'View'}
              {showRawSegments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {showRawSegments && (
            <div className="p-3 sm:p-4 border-t border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-[11px] sm:text-xs font-mono min-w-[500px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="pb-2 font-normal">Marker / Chunk</th>
                    <th className="pb-2 font-normal">Name</th>
                    <th className="pb-2 font-normal">Size</th>
                    <th className="pb-2 font-normal">Category</th>
                    <th className="pb-2 font-normal">Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {metadata.rawSegments.map((seg) => {
                    const willStrip =
                      seg.type === 'APP11' ||
                      (selectedMode === 'FULL_PRIVACY' && (seg.type.includes('APP1') || seg.type.includes('EXIF') || seg.type.includes('IPTC'))) ||
                      (selectedMode === 'ANTI_AI' && (seg.type.includes('APP11') || seg.type.includes('XMP') || seg.name.includes('AI') || seg.type.includes('caPX')));

                    return (
                      <tr key={seg.id} className="hover:bg-slate-800/30">
                        <td className="py-2 text-cyan-400 font-semibold">{seg.type}</td>
                        <td className="py-2 text-slate-200">
                          <div>{seg.name}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{seg.details}</div>
                        </td>
                        <td className="py-2 text-slate-400">{formatBytes(seg.sizeBytes)}</td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] ${
                              seg.riskCategory === 'AI_PROVENANCE'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : seg.riskCategory === 'PERSONAL_PRIVACY'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {seg.riskCategory}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              willStrip
                                ? 'bg-rose-900/30 text-rose-400'
                                : 'bg-emerald-900/30 text-emerald-400'
                            }`}
                          >
                            {willStrip ? 'STRIP' : 'KEEP'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
