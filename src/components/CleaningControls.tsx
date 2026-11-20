import React from 'react';
import type { CleaningMode, CloakOptions, SensorNoiseLevel, DateOption } from '../engine/types';
import { type CameraProfile, CAMERA_PRESETS, generateCameraFilename, GPS_PRESETS } from '../engine/camera-profiles';
import { Sparkles, Shield, RefreshCw, Zap, Camera, MapPin, Calendar, Activity } from 'lucide-react';

interface CleaningControlsProps {
  selectedMode: CleaningMode;
  setSelectedMode: (mode: CleaningMode) => void;
  selectedCamera: CameraProfile;
  setSelectedCamera: (cam: CameraProfile) => void;
  cloakOptions: CloakOptions;
  setCloakOptions: React.Dispatch<React.SetStateAction<CloakOptions>>;
  onClean: () => void;
  isCleaning: boolean;
  disabled: boolean;
}

export const CleaningControls: React.FC<CleaningControlsProps> = ({
  selectedMode,
  setSelectedMode,
  selectedCamera,
  setSelectedCamera,
  cloakOptions,
  setCloakOptions,
  onClean,
  isCleaning,
  disabled
}) => {
  const modes: Array<{
    id: CleaningMode;
    title: string;
    badge: string;
    description: string;
    icon: React.ReactNode;
    tagClass: string;
  }> = [
    {
      id: 'ANTI_AI',
      title: 'Anti-AI Tag Mode',
      badge: 'Instagram Focus',
      description: 'Slices out C2PA JUMBF (APP11) manifests and IPTC generative AI markers. Keeps camera profiles and orientation losslessly.',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
      tagClass: 'bg-cyan-950 text-cyan-300 border-cyan-800'
    },
    {
      id: 'CAMERA_CLOAK',
      title: 'Camera Metadata Cloak',
      badge: 'Hardware Injection',
      description: 'Purges C2PA/AI flags and injects genuine physical camera EXIF (Make, Model, Lens, ISO, Aperture, Shutter).',
      icon: <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />,
      tagClass: 'bg-indigo-950 text-indigo-300 border-indigo-800'
    },
    {
      id: 'FULL_PRIVACY',
      title: 'Full Privacy Shield',
      badge: 'Zero Digital Trace',
      description: 'Removes C2PA manifests plus all GPS coordinates, camera serial numbers, creator info, timestamps, and edit history.',
      icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
      tagClass: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    {
      id: 'CANVAS_REGEN',
      title: 'Canvas Deep Wipe',
      badge: 'Pixel Re-render',
      description: 'Decodes raw pixels to an off-screen canvas and re-encodes a fresh container. Completely purges all possible hidden containers.',
      icon: <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
      tagClass: 'bg-amber-950 text-amber-300 border-amber-800'
    }
  ];

  return (
    <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-xs sm:text-sm font-mono uppercase text-slate-400 tracking-wider">
          Step 2: Choose Sanitization Profile
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
          Select how you want to handle metadata or inject authentic camera hardware EXIF.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`cursor-pointer rounded-xl p-3 sm:p-4 border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                  : 'border-slate-800 bg-[#0d1320] hover:border-slate-700 hover:bg-[#101728]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {mode.icon}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border ${mode.tagClass}`}>
                    {mode.badge}
                  </span>
                </div>
                <h4 className={`font-semibold text-xs sm:text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {mode.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                  {mode.description}
                </p>
              </div>

              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-700'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0d14]" />}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-300">
                  {isSelected ? 'Active Profile' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Profile Selection Drawer (Appears when CAMERA_CLOAK is active) */}
      {selectedMode === 'CAMERA_CLOAK' && (
        <div className="bg-[#0b101c] border border-indigo-500/40 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-300 uppercase flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-400" />
              Select Camera Hardware Signature to Inject
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ISO, Aperture & Shutter will be generated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {CAMERA_PRESETS.map((cam) => {
              const isCamSelected = selectedCamera.id === cam.id;
              return (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setSelectedCamera(cam)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isCamSelected
                      ? 'border-indigo-400 bg-indigo-950/40 ring-1 ring-indigo-400/40 text-white'
                      : 'border-slate-800 bg-[#0e1422] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{cam.name}</span>
                    {isCamSelected && <span className="text-[9px] font-mono text-indigo-300">Selected</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                    {cam.lensModel}
                  </div>
                  <div className="text-[9px] text-indigo-300/80 mt-1 font-mono">
                    f/{cam.fNumber[0] / cam.fNumber[1]} · ISO {cam.iso} · 1/{cam.exposureTime[1]}s
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] font-mono">
                    <span className="text-slate-400">Roll Filename:</span>
                    <span className="text-cyan-300">{generateCameraFilename(cam.name)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Date & Geolocation Cloak Options */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Timestamp Cloak */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Capture Timestamp:
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'NOW', label: 'Current' },
                    { id: 'PAST_24H', label: 'Past 24h' },
                    { id: 'PAST_7D', label: 'Past 7 Days' }
                  ] as Array<{ id: DateOption; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCloakOptions((prev) => ({ ...prev, dateOption: opt.id }))}
                    className={`py-1.5 px-2 text-[10px] font-mono rounded border transition-colors ${
                      (cloakOptions.dateOption || 'NOW') === opt.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Geolocation Preset Cloak */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  GPS Camera Roll Coordinates:
                </span>
              </div>
              <select
                value={cloakOptions.gpsPresetId || 'none'}
                onChange={(e) => setCloakOptions((prev) => ({ ...prev, gpsPresetId: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-mono px-2.5 py-1.5 rounded outline-none focus:border-indigo-400"
              >
                {GPS_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Adversarial Sensor Noise Bar */}
      <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-mono text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Adversarial CMOS Sensor Noise (Bypass Computer-Vision AI Detectors)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Defeats Hive AI & Sightengine spectral frequency classifiers
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(
            [
              { id: 'NONE', label: 'Off (100% Lossless)', desc: 'Pure bit-for-bit slice' },
              { id: 'LOW', label: 'Low (0.3% - ISO 100)', desc: 'Subtle sensor grain' },
              { id: 'MEDIUM', label: 'Medium (0.6% - ISO 400)', desc: 'Breaks diffusion grids' },
              { id: 'HIGH', label: 'High (1.0% - ISO 1600)', desc: 'Strong anti-AI shield' }
            ] as Array<{ id: SensorNoiseLevel; label: string; desc: string }>
          ).map((level) => {
            const isLevelSelected = (cloakOptions.sensorNoise || 'NONE') === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setCloakOptions((prev) => ({ ...prev, sensorNoise: level.id }))}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isLevelSelected
                    ? 'border-amber-500/70 bg-amber-950/30 text-amber-200 ring-1 ring-amber-500/40'
                    : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold font-mono">{level.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{level.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-1 sm:pt-2">
        <button
          onClick={onClean}
          disabled={disabled || isCleaning}
          className={`w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
            disabled || isCleaning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : selectedMode === 'CAMERA_CLOAK'
              ? 'bg-gradient-to-r from-indigo-500 hover:from-indigo-400 to-purple-600 hover:to-purple-500 text-white shadow-indigo-500/20'
              : 'bg-gradient-to-r from-cyan-500 hover:from-cyan-400 to-indigo-600 hover:to-indigo-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/30 ring-1 ring-cyan-300/30'
          }`}
        >
          {isCleaning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>
                {selectedMode === 'CAMERA_CLOAK'
                  ? 'Injecting Camera Hardware Profile & Slicing...'
                  : 'Slicing Binary Segments & Sanitizing...'}
              </span>
            </>
          ) : (
            <>
              {selectedMode === 'CAMERA_CLOAK' ? (
                <>
                  <Camera className="w-4 h-4 text-indigo-200" />
                  <span>Sanitize & Inject "{selectedCamera.name}" Data</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>Sanitize & Remove AI Provenance</span>
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
