import type { DetectedMetadata, RawSegment } from './types';

// Helper to convert byte subarray to ASCII string
function bytesToAscii(bytes: Uint8Array, start = 0, length = bytes.length): string {
  let str = '';
  const end = Math.min(start + length, bytes.length);
  for (let i = start; i < end; i++) {
    const c = bytes[i];
    // Keep printable ASCII or spaces
    str += (c >= 32 && c <= 126) ? String.fromCharCode(c) : ' ';
  }
  return str;
}

// Helper to search for an ASCII substring inside Uint8Array
function containsAscii(bytes: Uint8Array, search: string): boolean {
  const searchBytes = new TextEncoder().encode(search);
  const maxIdx = bytes.length - searchBytes.length;
  for (let i = 0; i <= maxIdx; i++) {
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

// Get image dimensions using browser Image element
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function inspectImage(file: File): Promise<DetectedMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const dimensions = await getImageDimensions(file);

  const rawSegments: RawSegment[] = [];
  const c2paSignatures: string[] = [];
  let c2paDetected = false;
  let aiSoftware: string | undefined = undefined;
  let aiGenerativeType: boolean | undefined = undefined;
  let aiPromptSnippet: string | undefined = undefined;
  let hasGps = false;
  let cameraMake: string | undefined = undefined;
  let cameraModel: string | undefined = undefined;
  let dateTaken: string | undefined = undefined;
  let software: string | undefined = undefined;
  let creatorOrAuthor: string | undefined = undefined;
  let colorProfile: string | undefined = undefined;
  let hasIccProfile = false;

  // Format determination
  let format: 'JPEG' | 'PNG' | 'WEBP' | 'OTHER' = 'OTHER';

  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    format = 'JPEG';
    inspectJpeg();
  } else if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
    bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
  ) {
    format = 'PNG';
    inspectPng();
  } else if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    format = 'WEBP';
    inspectWebP();
  }

  function inspectJpeg() {
    let offset = 2; // after 0xFFD8
    const len = bytes.length;

    while (offset < len) {
      if (bytes[offset] !== 0xFF) {
        offset++;
        continue;
      }

      // Skip fill bytes (0xFF 0xFF ...)
      while (offset < len && bytes[offset] === 0xFF) {
        offset++;
      }
      if (offset >= len) break;

      const marker = bytes[offset++];
      // Standalone markers without payload
      if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
        continue;
      }

      if (offset + 1 >= len) break;
      const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
      if (segmentLength < 2) break;

      const payloadStart = offset + 2;
      const payloadLength = segmentLength - 2;
      const payloadEnd = Math.min(payloadStart + payloadLength, len);
      const payload = bytes.subarray(payloadStart, payloadEnd);

      // 1. APP11 (0xFFEB): C2PA / JUMBF Manifest
      if (marker === 0xEB) {
        c2paDetected = true;
        c2paSignatures.push('C2PA JUMBF Manifest Store (APP11 Marker)');
        rawSegments.push({
          id: `seg-${offset}`,
          type: 'APP11',
          name: 'C2PA Content Credentials (JUMBF)',
          sizeBytes: segmentLength,
          riskCategory: 'AI_PROVENANCE',
          details: 'Cryptographic C2PA manifest container that triggers Instagram & Meta AI badges.',
          actionOnClean: 'STRIPPED'
        });
      }
      // 2. APP1 (0xFFE1): EXIF or XMP
      else if (marker === 0xE1) {
        const textPreview = bytesToAscii(payload, 0, Math.min(payload.length, 3000));

        // Check if EXIF
        const isExif = payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66;
        // Check if XMP
        const isXmp = textPreview.includes('http://ns.adobe.com/xap/1.0/') || textPreview.includes('<x:xmpmeta');

        if (isExif) {
          // Check for GPS
          if (textPreview.includes('GPS') || containsAscii(payload, 'GPSVersionID')) {
            hasGps = true;
          }
          // Check for Make / Model hints
          const makeMatches = textPreview.match(/Apple|Canon|Nikon|Sony|Google|Samsung|Fujifilm|Panasonic/i);
          if (makeMatches) cameraMake = makeMatches[0];

          rawSegments.push({
            id: `seg-${offset}`,
            type: 'APP1 (EXIF)',
            name: 'EXIF Metadata & Hardware Data',
            sizeBytes: segmentLength,
            riskCategory: 'PERSONAL_PRIVACY',
            details: hasGps ? 'Contains GPS location & camera identification tags.' : 'Contains camera exposure, timestamps, and device properties.',
            actionOnClean: 'STRIPPED'
          });
        } else if (isXmp) {
          // Inspect XMP for AI tags
          let isAiXmp = false;
          if (textPreview.includes('trainedAlgorithmicMedia')) {
            aiGenerativeType = true;
            isAiXmp = true;
          }
          if (textPreview.includes('c2pa') || textPreview.includes('c2pa.created')) {
            c2paDetected = true;
            c2paSignatures.push('XMP C2PA Claim / Assertion');
            isAiXmp = true;
          }
          if (/DALL[·-]?E|ChatGPT|Midjourney|Stable Diffusion|Adobe Firefly/i.test(textPreview)) {
            const match = textPreview.match(/DALL[·-]?E[ 0-9]*|ChatGPT|Midjourney|Stable Diffusion|Adobe Firefly/i);
            if (match) aiSoftware = match[0];
            isAiXmp = true;
          }

          rawSegments.push({
            id: `seg-${offset}`,
            type: 'APP1 (XMP)',
            name: isAiXmp ? 'XMP Generative AI & Provenance Record' : 'XMP Extensible Metadata',
            sizeBytes: segmentLength,
            riskCategory: isAiXmp ? 'AI_PROVENANCE' : 'PERSONAL_PRIVACY',
            details: isAiXmp 
              ? 'Contains generative AI markers (trainedAlgorithmicMedia, AI generator name, C2PA assertions).' 
              : 'Contains application edit history, author and workflow metadata.',
            actionOnClean: 'STRIPPED'
          });
        } else {
          rawSegments.push({
            id: `seg-${offset}`,
            type: 'APP1',
            name: 'Application Marker 1',
            sizeBytes: segmentLength,
            riskCategory: 'PERSONAL_PRIVACY',
            details: 'Standard metadata container.',
            actionOnClean: 'STRIPPED'
          });
        }
      }
      // 3. APP13 (0xFFED): Photoshop / IPTC
      else if (marker === 0xED) {
        const textPreview = bytesToAscii(payload, 0, 500);
        if (textPreview.includes('Photoshop') || textPreview.includes('IPTC')) {
          rawSegments.push({
            id: `seg-${offset}`,
            type: 'APP13 (IPTC)',
            name: 'Photoshop IPTC Information Record',
            sizeBytes: segmentLength,
            riskCategory: 'PERSONAL_PRIVACY',
            details: 'Contains copyright, creator name, caption, and IPTC digital source tags.',
            actionOnClean: 'STRIPPED'
          });
        }
      }
      // 4. APP2 (0xFFE2): ICC Color Profile
      else if (marker === 0xE2) {
        const textPreview = bytesToAscii(payload, 0, 50);
        if (textPreview.includes('ICC_PROFILE')) {
          hasIccProfile = true;
          colorProfile = 'ICC Embedded Color Profile';
          rawSegments.push({
            id: `seg-${offset}`,
            type: 'APP2 (ICC)',
            name: 'ICC Color Management Profile',
            sizeBytes: segmentLength,
            riskCategory: 'SAFE_TECHNICAL',
            details: 'Essential for accurate screen colors. Safe to keep.',
            actionOnClean: 'PRESERVED'
          });
        }
      }
      // 5. APP0 (0xFFE0): JFIF
      else if (marker === 0xE0) {
        rawSegments.push({
          id: `seg-${offset}`,
          type: 'APP0 (JFIF)',
          name: 'JFIF Standard Image Header',
          sizeBytes: segmentLength,
          riskCategory: 'SAFE_TECHNICAL',
          details: 'Basic JPEG file format definition.',
          actionOnClean: 'PRESERVED'
        });
      }
      // 6. COM (0xFFFE): Comments
      else if (marker === 0xFE) {
        const comment = bytesToAscii(payload, 0, payload.length);
        rawSegments.push({
          id: `seg-${offset}`,
          type: 'COM',
          name: 'JPEG Comment',
          sizeBytes: segmentLength,
          riskCategory: 'PERSONAL_PRIVACY',
          details: `Embedded comment: "${comment.substring(0, 50)}"`,
          actionOnClean: 'STRIPPED'
        });
      }
      // SOS (Start of Scan) - image pixel stream begins
      else if (marker === 0xDA) {
        break; // Scan starts, stop parsing markers
      }

      offset = payloadStart + payloadLength;
    }
  }

  function inspectPng() {
    let offset = 8; // skip PNG signature
    const len = bytes.length;

    while (offset + 8 <= len) {
      const chunkLength = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const chunkType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
      const dataStart = offset + 8;
      const dataEnd = Math.min(dataStart + chunkLength, len);
      const chunkData = bytes.subarray(dataStart, dataEnd);

      if (chunkType === 'caPX' || chunkType === 'c2pa') {
        c2paDetected = true;
        c2paSignatures.push(`C2PA Chunk (${chunkType})`);
        rawSegments.push({
          id: `chunk-${offset}`,
          type: chunkType,
          name: 'C2PA PNG Provenance Chunk',
          sizeBytes: chunkLength + 12,
          riskCategory: 'AI_PROVENANCE',
          details: 'Official C2PA cryptographic chunk that marks image as synthetic/AI.',
          actionOnClean: 'STRIPPED'
        });
      } else if (chunkType === 'tEXt' || chunkType === 'zTXt' || chunkType === 'iTXt') {
        const text = bytesToAscii(chunkData, 0, Math.min(chunkData.length, 1000));
        let isAi = false;

        if (/trainedAlgorithmicMedia|c2pa|DALL[·-]?E|ChatGPT|Midjourney|Stable Diffusion|prompt/i.test(text)) {
          isAi = true;
          c2paDetected = true;
          const match = text.match(/DALL[·-]?E[ 0-9]*|ChatGPT|Midjourney|Stable Diffusion/i);
          if (match) aiSoftware = match[0];
          if (text.includes('trainedAlgorithmicMedia')) aiGenerativeType = true;
        }

        rawSegments.push({
          id: `chunk-${offset}`,
          type: chunkType,
          name: isAi ? 'Text Chunk (AI Generation Parameters)' : `Text Chunk (${chunkType})`,
          sizeBytes: chunkLength + 12,
          riskCategory: isAi ? 'AI_PROVENANCE' : 'PERSONAL_PRIVACY',
          details: isAi ? 'Contains AI prompt or software parameters.' : 'Embedded text metadata.',
          actionOnClean: 'STRIPPED'
        });
      } else if (chunkType === 'eXIf') {
        rawSegments.push({
          id: `chunk-${offset}`,
          type: 'eXIf',
          name: 'PNG EXIF Chunk',
          sizeBytes: chunkLength + 12,
          riskCategory: 'PERSONAL_PRIVACY',
          details: 'Hardware, timestamp, and device metadata.',
          actionOnClean: 'STRIPPED'
        });
      } else if (chunkType === 'iCCP' || chunkType === 'sRGB' || chunkType === 'gAMA') {
        hasIccProfile = true;
        rawSegments.push({
          id: `chunk-${offset}`,
          type: chunkType,
          name: `Color Profile (${chunkType})`,
          sizeBytes: chunkLength + 12,
          riskCategory: 'SAFE_TECHNICAL',
          details: 'Display color fidelity profile.',
          actionOnClean: 'PRESERVED'
        });
      } else if (chunkType === 'IEND') {
        break;
      }

      offset = dataStart + chunkLength + 4; // 4 bytes CRC
    }
  }

  function inspectWebP() {
    let offset = 12; // skip RIFF....WEBP
    const len = bytes.length;

    while (offset + 8 <= len) {
      const chunkId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      const chunkSize = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
      const dataStart = offset + 8;
      const dataEnd = Math.min(dataStart + chunkSize, len);
      const chunkData = bytes.subarray(dataStart, dataEnd);

      if (chunkId === 'EXIF') {
        rawSegments.push({
          id: `webp-${offset}`,
          type: 'EXIF',
          name: 'WebP EXIF Chunk',
          sizeBytes: chunkSize + 8,
          riskCategory: 'PERSONAL_PRIVACY',
          details: 'Contains device, timestamps, and GPS metadata.',
          actionOnClean: 'STRIPPED'
        });
      } else if (chunkId === 'XMP ') {
        const text = bytesToAscii(chunkData, 0, Math.min(chunkData.length, 1000));
        const isAi = /trainedAlgorithmicMedia|c2pa|DALL[·-]?E|ChatGPT|Midjourney/i.test(text);
        if (isAi) {
          c2paDetected = true;
          aiGenerativeType = true;
        }

        rawSegments.push({
          id: `webp-${offset}`,
          type: 'XMP ',
          name: isAi ? 'WebP XMP AI Provenance Record' : 'WebP XMP Metadata',
          sizeBytes: chunkSize + 8,
          riskCategory: isAi ? 'AI_PROVENANCE' : 'PERSONAL_PRIVACY',
          details: isAi ? 'Contains C2PA assertions and AI generation tags.' : 'Standard XMP metadata.',
          actionOnClean: 'STRIPPED'
        });
      } else if (chunkId === 'ICCP') {
        hasIccProfile = true;
        rawSegments.push({
          id: `webp-${offset}`,
          type: 'ICCP',
          name: 'WebP ICC Color Profile',
          sizeBytes: chunkSize + 8,
          riskCategory: 'SAFE_TECHNICAL',
          details: 'Color rendering profile.',
          actionOnClean: 'PRESERVED'
        });
      }

      offset = dataStart + chunkSize + (chunkSize % 2); // WebP chunks are padded to even bytes
    }
  }

  // Also do a fast global string scan on bytes for any AI generator prompts or watermarks
  const globalScanSample = bytesToAscii(bytes, 0, Math.min(bytes.length, 30000));
  if (!aiSoftware) {
    if (globalScanSample.includes('DALL·E') || globalScanSample.includes('DALL-E') || globalScanSample.includes('OpenAI')) {
      aiSoftware = 'OpenAI DALL·E / ChatGPT';
      c2paDetected = true;
    } else if (globalScanSample.includes('Midjourney')) {
      aiSoftware = 'Midjourney';
    } else if (globalScanSample.includes('Stable Diffusion') || globalScanSample.includes('AUTOMATIC1111')) {
      aiSoftware = 'Stable Diffusion';
    } else if (globalScanSample.includes('Adobe Firefly')) {
      aiSoftware = 'Adobe Firefly';
      c2paDetected = true;
    }
  }

  const isAiFlagged = c2paDetected || Boolean(aiSoftware) || Boolean(aiGenerativeType);

  return {
    fileSize: file.size,
    format,
    dimensions,
    c2paDetected,
    c2paSignatures,
    aiSoftware,
    aiGenerativeType,
    aiPromptSnippet,
    isAiFlagged,
    hasGps,
    cameraMake,
    cameraModel,
    dateTaken,
    software,
    creatorOrAuthor,
    colorProfile,
    hasIccProfile,
    rawSegments
  };
}
