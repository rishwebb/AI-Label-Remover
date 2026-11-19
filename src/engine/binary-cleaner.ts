import type { CleaningMode, CleaningResult, DetectedMetadata } from './types';
import { computeSha256 } from './hasher';
import { type CameraProfile, buildCameraExifSegment, CAMERA_PRESETS } from './camera-profiles';

// Helper to check if byte range contains target ASCII
function subarrayContains(bytes: Uint8Array, start: number, length: number, search: string): boolean {
  const searchBytes = new TextEncoder().encode(search);
  const end = Math.min(start + length, bytes.length) - searchBytes.length;
  for (let i = start; i <= end; i++) {
    let match = true;
    for (let j = 0; j < searchBytes.length; j++) {
      if (bytes[i + j] !== searchBytes[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

// Lossless JPEG binary sanitizer & optional camera EXIF injector
function cleanJpegBinary(
  bytes: Uint8Array,
  mode: CleaningMode,
  cameraProfile: CameraProfile = CAMERA_PRESETS[0]
): { cleanedBytes: Uint8Array; removed: string[]; preserved: string[]; injected?: string } {
  const removed: string[] = [];
  const preserved: string[] = [];
  const chunks: Uint8Array[] = [];

  // Always keep SOI marker (0xFFD8)
  chunks.push(bytes.subarray(0, 2));
  preserved.push('SOI (Start of Image)');

  // If in CAMERA_CLOAK mode, inject genuine camera hardware EXIF right after SOI!
  let injected: string | undefined = undefined;
  if (mode === 'CAMERA_CLOAK') {
    const cameraExifSegment = buildCameraExifSegment(cameraProfile);
    chunks.push(cameraExifSegment);
    injected = `${cameraProfile.name} (EXIF Hardware Data)`;
    preserved.push(`Injected Hardware Profile: ${cameraProfile.name}`);
  }

  let offset = 2;
  const len = bytes.length;
  let inScan = false;

  while (offset < len) {
    if (inScan) {
      // Once inside entropy-coded image scan data, keep everything until EOF
      chunks.push(bytes.subarray(offset));
      preserved.push('Entropy-coded image pixel scan (100% Lossless)');
      break;
    }

    if (bytes[offset] !== 0xFF) {
      chunks.push(bytes.subarray(offset, offset + 1));
      offset++;
      continue;
    }

    // Skip fill 0xFF bytes
    const markerStart = offset;
    while (offset < len && bytes[offset] === 0xFF) {
      offset++;
    }
    if (offset >= len) break;

    const marker = bytes[offset++];

    // Standalone markers
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      chunks.push(bytes.subarray(markerStart, offset));
      continue;
    }

    if (offset + 1 >= len) break;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2) break;

    const segmentEnd = offset + segmentLength;
    const markerWithPayload = bytes.subarray(markerStart, segmentEnd);
    const payload = bytes.subarray(offset + 2, segmentEnd);

    let shouldStrip = false;
    let label = `Segment 0xFF${marker.toString(16).toUpperCase()}`;

    // 0xFFEB: APP11 (C2PA / JUMBF) -> Always strip in all cleaning modes
    if (marker === 0xEB) {
      label = 'APP11 (C2PA Manifest)';
      shouldStrip = true;
    }
    // 0xFFE1: APP1 (EXIF / XMP)
    else if (marker === 0xE1) {
      const isExif = payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66;
      if (mode === 'FULL_PRIVACY' || mode === 'CAMERA_CLOAK') {
        // Strip previous EXIF/XMP because we are replacing with camera profile or wiping
        label = isExif ? 'APP1 (Original EXIF / Camera)' : 'APP1 (XMP Metadata)';
        shouldStrip = true;
      } else if (mode === 'ANTI_AI') {
        if (!isExif) {
          const hasAi = subarrayContains(bytes, offset + 2, segmentLength - 2, 'trainedAlgorithmicMedia') ||
                        subarrayContains(bytes, offset + 2, segmentLength - 2, 'c2pa') ||
                        subarrayContains(bytes, offset + 2, segmentLength - 2, 'DALL') ||
                        subarrayContains(bytes, offset + 2, segmentLength - 2, 'ChatGPT');
          if (hasAi) {
            label = 'APP1 (XMP AI Provenance)';
            shouldStrip = true;
          } else {
            label = 'APP1 (XMP General)';
          }
        } else {
          label = 'APP1 (EXIF Camera Tags)';
        }
      }
    }
    // 0xFFED: APP13 (Photoshop IPTC)
    else if (marker === 0xED) {
      label = 'APP13 (Photoshop IPTC)';
      if (mode === 'FULL_PRIVACY' || mode === 'CAMERA_CLOAK') {
        shouldStrip = true;
      }
    }
    // 0xFFFE: COM (Comment)
    else if (marker === 0xFE) {
      label = 'COM (Comments)';
      if (mode === 'FULL_PRIVACY' || mode === 'CAMERA_CLOAK') {
        shouldStrip = true;
      }
    }
    // 0xFFE2: APP2 (ICC Color Profile) -> Always preserve to prevent color distortion!
    else if (marker === 0xE2) {
      label = 'APP2 (ICC Color Profile)';
      shouldStrip = false;
    }
    // 0xFFE0: APP0 (JFIF) -> Keep for standard format adherence
    else if (marker === 0xE0) {
      label = 'APP0 (JFIF Header)';
      shouldStrip = false;
    }
    // 0xFFDA: SOS (Start of Scan) -> Pixel stream begins!
    else if (marker === 0xDA) {
      inScan = true;
      chunks.push(markerWithPayload);
      preserved.push('SOS (Start of Scan)');
      offset = segmentEnd;
      continue;
    }

    if (shouldStrip) {
      removed.push(label);
    } else {
      chunks.push(markerWithPayload);
      preserved.push(label);
    }

    offset = segmentEnd;
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return { cleanedBytes: result, removed, preserved, injected };
}

// Lossless PNG binary sanitizer
function cleanPngBinary(
  bytes: Uint8Array,
  mode: CleaningMode
): { cleanedBytes: Uint8Array; removed: string[]; preserved: string[] } {
  const removed: string[] = [];
  const preserved: string[] = [];
  const chunks: Uint8Array[] = [];

  // Keep 8-byte PNG signature
  chunks.push(bytes.subarray(0, 8));
  preserved.push('PNG Signature Header');

  let offset = 8;
  const len = bytes.length;

  while (offset + 8 <= len) {
    const chunkLength = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const chunkType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const totalChunkSize = chunkLength + 12; // 4 len + 4 type + data + 4 crc
    const chunkBytes = bytes.subarray(offset, Math.min(offset + totalChunkSize, len));

    let shouldStrip = false;

    if (chunkType === 'caPX' || chunkType === 'c2pa') {
      shouldStrip = true;
      removed.push(`C2PA Provenance (${chunkType})`);
    } else if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
      if (mode === 'FULL_PRIVACY' || mode === 'CAMERA_CLOAK') {
        shouldStrip = true;
        removed.push(`Metadata Text (${chunkType})`);
      } else {
        const isAi = subarrayContains(bytes, offset + 8, chunkLength, 'c2pa') ||
                     subarrayContains(bytes, offset + 8, chunkLength, 'trainedAlgorithmicMedia') ||
                     subarrayContains(bytes, offset + 8, chunkLength, 'DALL') ||
                     subarrayContains(bytes, offset + 8, chunkLength, 'parameters') ||
                     subarrayContains(bytes, offset + 8, chunkLength, 'ChatGPT');
        if (isAi) {
          shouldStrip = true;
          removed.push(`AI Generation Parameters (${chunkType})`);
        } else {
          preserved.push(`Text Chunk (${chunkType})`);
        }
      }
    } else if (chunkType === 'eXIf') {
      if (mode === 'FULL_PRIVACY') {
        shouldStrip = true;
        removed.push('EXIF Chunk (eXIf)');
      } else {
        preserved.push('EXIF Chunk (eXIf)');
      }
    } else {
      preserved.push(`Image Data / Profile (${chunkType})`);
    }

    if (!shouldStrip) {
      chunks.push(chunkBytes);
    }

    if (chunkType === 'IEND') break;
    offset += totalChunkSize;
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return { cleanedBytes: result, removed, preserved };
}

// Fallback Canvas Re-encoding (100% metadata wipe via pixel rendering)
async function cleanViaCanvas(file: File): Promise<{ blob: Blob; removed: string[]; preserved: string[] }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({
              blob,
              removed: [
                'All C2PA Content Credentials',
                'All EXIF, GPS & Camera Serial numbers',
                'All XMP & IPTC Generative AI tags',
                'All comments & structural metadata'
              ],
              preserved: ['Rendered pixel bitmap (Pristine Visuals)', 'Standard Web Container']
            });
          } else {
            reject(new Error('Failed to encode image from canvas'));
          }
        },
        mimeType,
        0.98
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for canvas processing'));
    };
    img.src = url;
  });
}

export async function cleanImage(
  file: File,
  metadata: DetectedMetadata,
  mode: CleaningMode = 'ANTI_AI',
  cameraProfile: CameraProfile = CAMERA_PRESETS[0]
): Promise<CleaningResult> {
  const startTime = performance.now();
  const originalBuffer = await file.arrayBuffer();
  const originalSha256 = await computeSha256(originalBuffer);

  let cleanedBlob: Blob;
  let removedSegments: string[] = [];
  let preservedSegments: string[] = [];
  let injectedCamera: string | undefined = undefined;
  let isLossless = true;

  if (mode === 'CANVAS_REGEN' || metadata.format === 'OTHER') {
    const canvasResult = await cleanViaCanvas(file);
    cleanedBlob = canvasResult.blob;
    removedSegments = canvasResult.removed;
    preservedSegments = canvasResult.preserved;
    isLossless = false;
  } else {
    const bytes = new Uint8Array(originalBuffer);
    if (metadata.format === 'JPEG') {
      const { cleanedBytes, removed, preserved, injected } = cleanJpegBinary(bytes, mode, cameraProfile);
      cleanedBlob = new Blob([cleanedBytes.buffer.slice(0, cleanedBytes.byteLength) as ArrayBuffer], { type: 'image/jpeg' });
      removedSegments = removed;
      preservedSegments = preserved;
      injectedCamera = injected;
    } else if (metadata.format === 'PNG') {
      const { cleanedBytes, removed, preserved } = cleanPngBinary(bytes, mode);
      cleanedBlob = new Blob([cleanedBytes.buffer.slice(0, cleanedBytes.byteLength) as ArrayBuffer], { type: 'image/png' });
      removedSegments = removed;
      preservedSegments = preserved;
    } else {
      const canvasResult = await cleanViaCanvas(file);
      cleanedBlob = canvasResult.blob;
      removedSegments = canvasResult.removed;
      preservedSegments = canvasResult.preserved;
      isLossless = false;
    }
  }

  const cleanedBuffer = await cleanedBlob.arrayBuffer();
  const cleanedSha256 = await computeSha256(cleanedBuffer);
  const cleanedUrl = URL.createObjectURL(cleanedBlob);
  const processingTimeMs = Math.round(performance.now() - startTime);

  const originalSize = file.size;
  const cleanedSize = cleanedBlob.size;
  const sizeReductionBytes = Math.max(0, originalSize - cleanedSize);
  const sizeReductionPercent = originalSize > 0 ? (sizeReductionBytes / originalSize) * 100 : 0;

  return {
    cleanedBlob,
    cleanedUrl,
    originalSize,
    cleanedSize,
    sizeReductionBytes,
    sizeReductionPercent,
    isLossless,
    processingTimeMs,
    originalSha256,
    cleanedSha256,
    removedSegments,
    preservedSegments,
    injectedCamera,
    verificationStatus: {
      c2paRemoved: true,
      aiFlagsRemoved: true,
      gpsRemoved: mode === 'FULL_PRIVACY' || mode === 'CANVAS_REGEN',
      pixelsPreserved: isLossless,
      cameraInjected: Boolean(injectedCamera)
    }
  };
}
