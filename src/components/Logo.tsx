import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 36,
  withText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Vector Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="shieldGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="50%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#7f00ff" />
          </linearGradient>
          <linearGradient id="bgGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d1424" />
            <stop offset="100%" stopColor="#050811" />
          </linearGradient>
          <linearGradient id="sliceGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <filter id="glowReact" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Cyber Squircle */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill="url(#bgGradReact)"
          stroke="url(#shieldGradReact)"
          strokeWidth="2.2"
        />

        {/* Outer Aperture Shield Ring */}
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke="url(#shieldGradReact)"
          strokeWidth="1.5"
          strokeDasharray="2 3"
          opacity="0.6"
        />

        {/* Camera Aperture Iris Blades */}
        <path d="M32 15 L43 23 L37 32 Z" fill="#22d3ee" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M43 23 L45 37 L33 37 Z" fill="#38bdf8" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M45 37 L36 47 L29 39 Z" fill="#60a5fa" fillOpacity="0.25" stroke="#818cf8" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M36 47 L22 44 L26 34 Z" fill="#818cf8" fillOpacity="0.3" stroke="#a78bfa" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M22 44 L19 30 L30 30 Z" fill="#a78bfa" fillOpacity="0.25" stroke="#c084fc" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M19 30 L27 18 L34 26 Z" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.2" strokeLinejoin="round" />

        {/* Surgical Binary Slicing Laser Slash */}
        <line
          x1="14"
          y1="50"
          x2="50"
          y2="14"
          stroke="url(#sliceGradReact)"
          strokeWidth="2.8"
          strokeLinecap="round"
          filter="url(#glowReact)"
        />

        {/* Central Camera Sensor Eye */}
        <circle cx="32" cy="32" r="5" fill="#080d1a" stroke="url(#sliceGradReact)" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="2.2" fill="#22d3ee" filter="url(#glowReact)" />

        {/* Stealth Corner Accents */}
        <path d="M8 18 V10 H18" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <path d="M56 46 V54 H46" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>

      {/* Optional Embedded Wordmark */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wider text-white">TRACELESS</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              v2.0
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80 -mt-0.5">AI Sanitizer &amp; Camera Cloak</span>
        </div>
      )}
    </div>
  );
};