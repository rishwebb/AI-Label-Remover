import React from 'react';
import { X, Cpu, Check, AlertTriangle } from 'lucide-react';

interface ExplainAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainAiModal: React.FC<ExplainAiModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101726] border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-600/40 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">How Instagram & Social Platforms Detect AI</h3>
            <p className="text-xs text-slate-400">The Technical Anatomy of the "Made with AI" Badge</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              1. C2PA Content Credentials (JUMBF Container)
            </h4>
            <p className="text-slate-400">
              When OpenAI (ChatGPT / DALL·E 3), Adobe Firefly, or Microsoft Designer generates an image, it embeds an ISO/IEC 19566-5 JUMBF container in the image's <strong className="text-cyan-300">APP11 binary segment</strong> (or <strong className="text-cyan-300">caPX chunk</strong> in PNG). This manifest contains a cryptographically signed claim stating <code className="text-rose-300">"c2pa.created" by OpenAI</code>. When you upload this file to Instagram, Meta's ingest server parses the APP11 segment and immediately attaches the "AI info" label.
            </p>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              2. IPTC & XMP Generative AI Flags
            </h4>
            <p className="text-slate-400">
              The IPTC standard added the tag <code className="text-amber-300">DigitalSourceType: "trainedAlgorithmicMedia"</code>. Models also save generation prompts, seeds, and generator versions inside XMP text headers.
            </p>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              3. How TRACELESS Neutralizes It (100% Losslessly)
            </h4>
            <p className="text-slate-400">
              Instead of passing your image through a destructive compressor, TRACELESS scans the binary byte stream directly. It navigates to the APP11 (C2PA) and generative XMP segments and slices them out of the binary file.
              <br /><br />
              <strong>The pixel data (DQT, DHT, and entropy scans) remains 100% untouched bit-for-bit.</strong> Your image quality does not drop by a single pixel, but platforms can no longer find the cryptographic AI marker.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
