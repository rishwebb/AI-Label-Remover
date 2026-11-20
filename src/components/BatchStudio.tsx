import React, { useState } from 'react';
import type { BatchItem, CleaningMode } from '../engine/types';
import { inspectImage } from '../engine/binary-inspector';
import { cleanImage } from '../engine/binary-cleaner';
import { generateCameraFilename } from '../engine/camera-profiles';
import { formatBytes } from '../engine/hasher';
import JSZip from 'jszip';
import {
  Layers,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Zap
} from 'lucide-react';

interface BatchStudioProps {
  onLoadSample: () => void;
}

export const BatchStudio: React.FC<BatchStudioProps> = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [cleaningMode, setCleaningMode] = useState<CleaningMode>('ANTI_AI');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const newItems: BatchItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        previewUrl,
        status: 'INSPECTING'
      });
    }

    setItems((prev) => [...prev, ...newItems]);

    // Asynchronously inspect each
    for (const item of newItems) {
      try {
        const metadata = await inspectImage(item.file);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, metadata, status: 'INSPECTED' } : i))
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'ERROR', errorMessage: 'Inspection failed' } : i))
        );
      }
    }
  };

  const handleCleanAll = async () => {
    if (items.length === 0 || isProcessingAll) return;
    setIsProcessingAll(true);

    for (const item of items) {
      if (!item.metadata || item.status === 'DONE') continue;

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'CLEANING' } : i))
      );

      try {
        const result = await cleanImage(item.file, item.metadata, cleaningMode);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, result, status: 'DONE' } : i))
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'ERROR', errorMessage: err?.message || 'Cleaning failed' } : i
          )
        );
      }
    }

    setIsProcessingAll(false);
  };

  const handleDownloadZip = async () => {
    const doneItems = items.filter((i) => i.status === 'DONE' && i.result);
    if (doneItems.length === 0 || isZipping) return;

    setIsZipping(true);
    const zip = new JSZip();

    for (const item of doneItems) {
      if (!item.result) continue;
      const cleanFileName = generateCameraFilename(item.result.injectedCamera);

      const buffer = await item.result.cleanedBlob.arrayBuffer();
      zip.file(cleanFileName, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `traceless_batch_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    setIsZipping(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    setItems([]);
  };

  const completedCount = items.filter((i) => i.status === 'DONE').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Batch Header Controls */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white">Batch Sanitization Studio</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Strip C2PA & personal metadata from multiple files at once. Download as a single ZIP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {items.length > 0 && (
            <>
              <button
                onClick={clearAll}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleCleanAll}
                disabled={isProcessingAll}
                className="flex-1 md:flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {isProcessingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Sanitize All ({items.length})</span>
                  </>
                )}
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex-1 md:flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP ({completedCount})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Batch Dropzone */}
      <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 text-center bg-[#0d1322]/80 transition-colors">
        <input
          type="file"
          id="batchFileInput"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <label
          htmlFor="batchFileInput"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 mb-2" />
          <span className="text-xs sm:text-sm font-semibold text-white">Tap or drag images to add to batch</span>
          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Supports multi-file selection of JPEG, PNG, and WebP</span>
        </label>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-[#111726] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <span>Queue: {items.length} Files</span>
            <div className="flex items-center gap-1.5">
              <span>Mode:</span>
              <select
                value={cleaningMode}
                onChange={(e) => setCleaningMode(e.target.value as CleaningMode)}
                className="bg-slate-900 border border-slate-700 text-cyan-400 rounded px-2 py-1 text-xs"
              >
                <option value="ANTI_AI">Anti-AI (C2PA Strip)</option>
                <option value="FULL_PRIVACY">Full Privacy</option>
                <option value="CANVAS_REGEN">Canvas Wipe</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-800/30 transition-colors"
              >
                {/* Thumbnail & Name */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/50 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={item.previewUrl} alt="Thumb" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                      {formatBytes(item.file.size)} · {item.metadata?.format || 'Parsing...'}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'INSPECTED' && item.metadata && (
                    <div className="flex items-center">
                      {item.metadata.isAiFlagged ? (
                        <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span className="hidden xs:inline">AI Tag</span>
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="hidden xs:inline">Clean</span>
                        </span>
                      )}
                    </div>
                  )}

                  {item.status === 'CLEANING' && (
                    <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span className="hidden xs:inline">Sanitizing</span>
                    </span>
                  )}

                  {item.status === 'DONE' && item.result && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="hidden xs:inline">Clean</span>
                      </span>
                      <a
                        href={item.result.cleanedUrl}
                        download={generateCameraFilename(item.result.injectedCamera)}
                        className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        title="Download single"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                      </a>
                    </div>
                  )}

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
