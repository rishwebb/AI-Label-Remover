import React from 'react';
import { ShieldCheck, HelpCircle, Layers, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  activeTab: 'single' | 'batch';
  setActiveTab: (tab: 'single' | 'batch') => void;
  onOpenExplain: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExplain,
  onLoadSample
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Logo size={36} />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">TRACELESS</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 hidden xs:inline-block">
                v2.0
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden md:block">AI Metadata &amp; Privacy Sanitizer</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 sm:p-1 text-[11px] sm:text-xs font-medium">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeTab === 'single'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Single</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 transition-colors"
            title="Load sample AI image to test"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Try Sample</span>
            <span className="sm:hidden">Sample</span>
          </button>

          <button
            onClick={onOpenExplain}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1.5"
            title="How Instagram & Platforms Detect AI"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">How AI Tags Work</span>
          </button>
        </div>
      </div>
    </header>
  );
};
