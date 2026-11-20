export interface DetectedMetadata {
  fileSize: number;
  format: 'JPEG' | 'PNG' | 'WEBP' | 'OTHER';
  dimensions: { width: number; height: number };
  
  // AI & Provenance
  c2paDetected: boolean;
  c2paSignatures: string[];
  aiSoftware?: string;
  aiGenerativeType?: boolean;
  aiPromptSnippet?: string;
  isAiFlagged: boolean;

  // Camera & Hardware Data
  hasCameraData: boolean;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  cameraExposure?: string; // e.g. "f/1.78 · ISO 64 · 1/120s"
  dateTaken?: string;
  software?: string;
  serialNumber?: string;
  creatorOrAuthor?: string;

  // Personal Privacy
  hasGps: boolean;
  gpsCoordinates?: { lat: number; lng: number; alt?: number };

  // Color & Tech
  colorProfile?: string;
  hasIccProfile: boolean;

  // Structural breakdown
  rawSegments: RawSegment[];
}

export interface RawSegment {
  id: string;
  type: string;
  name: string;
  sizeBytes: number;
  riskCategory: 'AI_PROVENANCE' | 'PERSONAL_PRIVACY' | 'SAFE_TECHNICAL';
  details: string;
  actionOnClean: 'STRIPPED' | 'PRESERVED' | 'OPTIONAL';
}

export type CleaningMode = 'ANTI_AI' | 'FULL_PRIVACY' | 'CAMERA_CLOAK' | 'CANVAS_REGEN';

export type SensorNoiseLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type DateOption = 'NOW' | 'PAST_24H' | 'PAST_7D' | 'CUSTOM';

export interface GpsPreset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
}

export interface CloakOptions {
  dateOption?: DateOption;
  customDate?: string;
  gpsPresetId?: string;
  sensorNoise?: SensorNoiseLevel;
}

export interface CleaningResult {
  cleanedBlob: Blob;
  cleanedUrl: string;
  originalSize: number;
  cleanedSize: number;
  sizeReductionBytes: number;
  sizeReductionPercent: number;
  isLossless: boolean;
  processingTimeMs: number;
  originalSha256: string;
  cleanedSha256: string;
  removedSegments: string[];
  preservedSegments: string[];
  injectedCamera?: string;
  injectedDate?: string;
  injectedLocation?: string;
  sensorNoiseApplied?: boolean;
  verificationStatus: {
    c2paRemoved: boolean;
    aiFlagsRemoved: boolean;
    gpsRemoved: boolean;
    pixelsPreserved: boolean;
    cameraInjected?: boolean;
  };
}

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'PENDING' | 'INSPECTING' | 'INSPECTED' | 'CLEANING' | 'DONE' | 'ERROR';
  metadata?: DetectedMetadata;
  result?: CleaningResult;
  errorMessage?: string;
}
