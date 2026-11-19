import React, { useRef, useState } from 'react';
import { Upload, Sparkles, FileImage, ShieldAlert, Cpu } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, onLoadSample }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-6 sm:p-12 text-center group flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/10'
            : 'border-slate-800 hover:border-cyan-500/50 bg-[#0f1626]/70 hover:bg-[#111a30]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-105 group-hover:border-cyan-400/80 transition-all shadow-inner">
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        </div>

        <h3 className="text-base sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">
          Drop your image here to clean
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4 sm:mb-6">
          Tap or drag your AI-generated images (JPEG, PNG, WebP).
          <span className="text-cyan-400 font-medium"> Processed 100% locally on your device.</span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            C2PA APP11 Strip
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <FileImage className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            Lossless Slicing
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            Zero Server Uploads
          </span>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoadSample();
          }}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 px-3 sm:px-4 py-2 rounded-lg border border-cyan-800/50 transition-colors text-center w-full sm:w-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Don't have an AI image? Load a live test image</span>
        </button>
      </div>
    </div>
  );
};
