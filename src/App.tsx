import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dropzone } from './components/Dropzone';
import { MetadataInspector } from './components/MetadataInspector';
import { CleaningControls } from './components/CleaningControls';
import { VerificationDiff } from './components/VerificationDiff';
import { BatchStudio } from './components/BatchStudio';
import { ExplainAiModal } from './components/ExplainAiModal';
import type { DetectedMetadata, CleaningMode, CleaningResult } from './engine/types';
import { inspectImage } from './engine/binary-inspector';
import { cleanImage } from './engine/binary-cleaner';
import { createSampleAiImage } from './engine/sample-generator';
import { formatBytes } from './engine/hasher';
import {
  ShieldCheck,
  Lock,
  Cpu,
  RefreshCw,
  FileImage
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<DetectedMetadata | null>(null);
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null);
  const [selectedMode, setSelectedMode] = useState<CleaningMode>('ANTI_AI');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > 1) {
      setActiveTab('batch');
      return;
    }

    const file = files[0];
    setCurrentFile(file);
    setCleaningResult(null);
    setIsInspecting(true);

    try {
      const metadata = await inspectImage(file);
      setCurrentMetadata(metadata);
    } catch (err) {
      console.error('Inspection failed:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleLoadSample = async () => {
    setIsInspecting(true);
    try {
      const sampleFile = await createSampleAiImage();
      setCurrentFile(sampleFile);
      setCleaningResult(null);
      const metadata = await inspectImage(sampleFile);
      setCurrentMetadata(metadata);
      setActiveTab('single');
    } catch (err) {
      console.error('Failed to create sample:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleClean = async () => {
    if (!currentFile || !currentMetadata || isCleaning) return;
    setIsCleaning(true);

    try {
      const result = await cleanImage(currentFile, currentMetadata, selectedMode);
      setCleaningResult(result);
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setCurrentMetadata(null);
    setCleaningResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExplain={() => setIsExplainOpen(true)}
        onLoadSample={handleLoadSample}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
        {/* Hero Banner (Shown when no file is loaded in single view) */}
        {!currentFile && activeTab === 'single' && (
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-1">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-[11px] sm:text-xs font-mono mb-3 sm:mb-4 shadow-inner">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>100% Client-Side · Zero Server Uploads</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 leading-tight">
              Strip AI Provenance & <br className="hidden xs:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Neutralize "Made with AI" Badges
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              When you post ChatGPT or DALL·E 3 images to Instagram, hidden <strong>C2PA APP11 manifests</strong> and <strong>IPTC generative tags</strong> automatically trigger the AI label. TRACELESS performs surgical, lossless binary slicing in your browser to remove these tags in milliseconds.
            </p>
          </div>
        )}

        {/* Tab 1: Single Inspector Studio */}
        {activeTab === 'single' && (
          <div>
            {!currentFile ? (
              <div className="max-w-3xl mx-auto">
                <Dropzone
                  onFilesSelected={handleFilesSelected}
                  onLoadSample={handleLoadSample}
                />

                {/* Educational Value Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-10">
                  <div className="bg-[#0f1523] border border-slate-800 rounded-xl p-3.5 sm:p-4">
                    <div className="p-2 w-fit rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 mb-2 sm:mb-3">
                      <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-white mb-1">C2PA Manifest Slicing</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Deletes APP11 JUMBF boxes and IPTC markers that social networks scan during ingest.
                    </p>
                  </div>

                  <div className="bg-[#0f1523] border border-slate-800 rounded-xl p-3.5 sm:p-4">
                    <div className="p-2 w-fit rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 mb-2 sm:mb-3">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-white mb-1">100% Lossless Quality</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Pixel entropy streams are preserved bit-for-bit without lossy re-encoding or compression.
                    </p>
                  </div>

                  <div className="bg-[#0f1523] border border-slate-800 rounded-xl p-3.5 sm:p-4">
                    <div className="p-2 w-fit rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60 mb-2 sm:mb-3">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-white mb-1">Private & Offline</h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      Files never leave your machine. Processed 100% in local device memory.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
                {/* Active File Bar */}
                <div className="bg-[#111726] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 shrink-0">
                      <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
                          {currentFile.name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                          {formatBytes(currentFile.size)}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                        {currentMetadata ? `${currentMetadata.format} · ${currentMetadata.dimensions.width}×${currentMetadata.dimensions.height} px` : 'Analyzing binary structure...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Choose Different Image
                    </button>
                  </div>
                </div>

                {isInspecting ? (
                  <div className="p-8 sm:p-12 text-center bg-[#111726] border border-slate-800 rounded-2xl">
                    <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white">Inspecting Binary Structure...</p>
                    <p className="text-xs text-slate-400 mt-1">Checking APP11, APP1, XMP, IPTC, and C2PA manifests.</p>
                  </div>
                ) : (
                  currentMetadata && (
                    <div className="space-y-6 sm:space-y-8">
                      {/* Section 1: Inspection & Findings */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-mono uppercase text-slate-400 mb-2 sm:mb-3 tracking-wider">
                          Step 1: Forensic Inspection Findings
                        </h3>
                        <MetadataInspector
                          metadata={currentMetadata}
                          selectedMode={selectedMode}
                        />
                      </div>

                      {/* Section 2: Sanitization Controls */}
                      {!cleaningResult && (
                        <CleaningControls
                          selectedMode={selectedMode}
                          setSelectedMode={setSelectedMode}
                          onClean={handleClean}
                          isCleaning={isCleaning}
                          disabled={isInspecting}
                        />
                      )}

                      {/* Section 3: Result & Verification Diff */}
                      {cleaningResult && (
                        <VerificationDiff
                          originalFile={currentFile}
                          originalMetadata={currentMetadata}
                          result={cleaningResult}
                          onReset={handleReset}
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Batch Studio */}
        {activeTab === 'batch' && (
          <div className="animate-in fade-in duration-200">
            <BatchStudio onLoadSample={handleLoadSample} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-5 sm:py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Local Browser Sandbox Active · Zero Telemetry · Offline Ready</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              onClick={() => setIsExplainOpen(true)}
              className="text-[11px] sm:text-xs hover:text-cyan-400 transition-colors"
            >
              C2PA & Instagram Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      <ExplainAiModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
      />
    </div>
  );
}
