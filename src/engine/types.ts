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

  // Personal Privacy
  hasGps: boolean;
  gpsCoordinates?: { lat: number; lng: number; alt?: number };
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  dateTaken?: string;
  serialNumber?: string;
  software?: string;
  creatorOrAuthor?: string;

  // Color & Tech
  colorProfile?: string;
  hasIccProfile: boolean;

  // Structural breakdown
  rawSegments: RawSegment[];
}

export interface RawSegment {
  id: string;
  type: string; // e.g. "APP11", "APP1", "caPX", "tEXt"
  name: string; // Human readable name
  sizeBytes: number;
  riskCategory: 'AI_PROVENANCE' | 'PERSONAL_PRIVACY' | 'SAFE_TECHNICAL';
  details: string;
  actionOnClean: 'STRIPPED' | 'PRESERVED' | 'OPTIONAL';
}

export type CleaningMode = 'ANTI_AI' | 'FULL_PRIVACY' | 'CAMERA_CLOAK' | 'CANVAS_REGEN';

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
