export interface CameraProfile {
  id: string;
  name: string;
  make: string;
  model: string;
  software: string;
  lensModel: string;
  fNumber: [number, number];       // numerator, denominator (e.g. [178, 100] for f/1.78)
  exposureTime: [number, number];  // e.g. [1, 125] for 1/125s
  iso: number;
  focalLength: [number, number];   // e.g. [240, 10] for 24mm
  focalLengthIn35mm: number;
}

export const CAMERA_PRESETS: CameraProfile[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'Apple iPhone 16 Pro Max',
    make: 'Apple',
    model: 'iPhone 16 Pro Max',
    software: '18.1.1',
    lensModel: 'iPhone 16 Pro Max back triple camera 6.765mm f/1.78',
    fNumber: [178, 100],
    exposureTime: [1, 120],
    iso: 64,
    focalLength: [6765, 1000],
    focalLengthIn35mm: 24
  },
  {
    id: 'sony-a7iv',
    name: 'Sony α7 IV',
    make: 'SONY',
    model: 'ILCE-7M4',
    software: 'ILCE-7M4 v3.00',
    lensModel: 'FE 24-70mm F2.8 GM II',
    fNumber: [28, 10],
    exposureTime: [1, 250],
    iso: 100,
    focalLength: [350, 10],
    focalLengthIn35mm: 35
  },
  {
    id: 'fujifilm-x-t5',
    name: 'Fujifilm X-T5',
    make: 'FUJIFILM',
    model: 'X-T5',
    software: 'Digital Camera X-T5 Ver3.01',
    lensModel: 'XF33mmF1.4 R LM WR',
    fNumber: [14, 10],
    exposureTime: [1, 500],
    iso: 125,
    focalLength: [330, 10],
    focalLengthIn35mm: 50
  },
  {
    id: 'canon-eos-r5',
    name: 'Canon EOS R5',
    make: 'Canon',
    model: 'Canon EOS R5',
    software: 'Firmware Version 2.0.0',
    lensModel: 'RF50mm F1.2 L USM',
    fNumber: [12, 10],
    exposureTime: [1, 1000],
    iso: 100,
    focalLength: [500, 10],
    focalLengthIn35mm: 50
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    make: 'samsung',
    model: 'SM-S928B',
    software: 'S928BXXU1AXB5',
    lensModel: 'Samsung S24 Ultra Main Camera 6.3mm f/1.7',
    fNumber: [17, 10],
    exposureTime: [1, 180],
    iso: 50,
    focalLength: [630, 100],
    focalLengthIn35mm: 23
  }
];

// Generates an authentic DCIM camera filename matching the camera brand or defaulting to system camera format
export function generateCameraFilename(cameraName?: string, originalFileName?: string, forceOriginal = false): string {
  const rand4 = Math.floor(1000 + Math.random() * 9000);

  if (forceOriginal && originalFileName) {
    const ext = originalFileName.split('.').pop() || 'jpg';
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    return `${baseName}_cleaned.${ext}`;
  }

  if (cameraName) {
    const lower = cameraName.toLowerCase();
    if (lower.includes('sony')) return `DSC0${rand4}.JPG`;
    if (lower.includes('fuji')) return `DSCF${rand4}.JPG`;
    if (lower.includes('samsung')) {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
    }
    // Apple / Canon / Mobile camera standard
    return `IMG_${rand4}.JPG`;
  }

  // Default for all photos: authentic camera system filename (IMG_XXXX.JPG)
  return `IMG_${rand4}.JPG`;
}

// Helper to format date in EXIF format: "YYYY:MM:DD HH:MM:SS"
function getExifDate(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Builds a valid, binary-compliant APP1 (0xFFE1) EXIF segment containing
 * legitimate hardware camera tags (Make, Model, Lens, ISO, Shutter, Aperture).
 */
export function buildCameraExifSegment(profile: CameraProfile): Uint8Array {
  const dateStr = getExifDate();

  const buffer = new ArrayBuffer(2048);
  const view = new DataView(buffer);
  let pos = 0;

  // 1. "Exif\0\0" Header
  view.setUint8(pos++, 0x45); // E
  view.setUint8(pos++, 0x78); // x
  view.setUint8(pos++, 0x69); // i
  view.setUint8(pos++, 0x66); // f
  view.setUint8(pos++, 0x00);
  view.setUint8(pos++, 0x00);

  const tiffStart = pos;

  // 2. TIFF Header
  view.setUint16(pos, 0x4949, true); // "II" Little Endian
  pos += 2;
  view.setUint16(pos, 42, true);     // Magic 42
  pos += 2;
  view.setUint32(pos, 8, true);      // Offset to IFD0
  pos += 4;

  // 3. IFD0 Entries
  const ifd0EntryCount = 6;
  view.setUint16(pos, ifd0EntryCount, true);
  pos += 2;

  const ifd0EntriesPos = pos;
  pos += ifd0EntryCount * 12;

  // Next IFD Offset (0 = none)
  view.setUint32(pos, 0, true);
  pos += 4;

  let dataPoolPos = pos;

  function writeAscii(str: string): { offset: number; len: number } {
    const bytes = new TextEncoder().encode(str + '\0');
    const offset = dataPoolPos - tiffStart;
    for (let i = 0; i < bytes.length; i++) {
      view.setUint8(dataPoolPos++, bytes[i]);
    }
    if (dataPoolPos % 2 !== 0) view.setUint8(dataPoolPos++, 0);
    return { offset, len: bytes.length };
  }

  function writeRational(num: number, den: number): number {
    const offset = dataPoolPos - tiffStart;
    view.setUint32(dataPoolPos, num, true);
    dataPoolPos += 4;
    view.setUint32(dataPoolPos, den, true);
    dataPoolPos += 4;
    return offset;
  }

  const makeData = writeAscii(profile.make);
  const modelData = writeAscii(profile.model);
  const softwareData = writeAscii(profile.software);
  const dateTimeData = writeAscii(dateStr);

  const subIfdOffset = dataPoolPos - tiffStart;
  const subIfdCount = 7;
  view.setUint16(dataPoolPos, subIfdCount, true);
  dataPoolPos += 2;

  const subIfdEntriesPos = dataPoolPos;
  dataPoolPos += subIfdCount * 12;

  view.setUint32(dataPoolPos, 0, true);
  dataPoolPos += 4;

  const expTimeOffset = writeRational(profile.exposureTime[0], profile.exposureTime[1]);
  const fNumberOffset = writeRational(profile.fNumber[0], profile.fNumber[1]);
  const focalLengthOffset = writeRational(profile.focalLength[0], profile.focalLength[1]);
  const origDateData = writeAscii(dateStr);
  const lensModelData = writeAscii(profile.lensModel);

  let eIdx = ifd0EntriesPos;
  function writeEntry(tag: number, type: number, count: number, valOrOffset: number) {
    view.setUint16(eIdx, tag, true);
    view.setUint16(eIdx + 2, type, true);
    view.setUint32(eIdx + 4, count, true);
    view.setUint32(eIdx + 8, valOrOffset, true);
    eIdx += 12;
  }

  writeEntry(0x010F, 2, makeData.len, makeData.offset);
  writeEntry(0x0110, 2, modelData.len, modelData.offset);
  writeEntry(0x0112, 3, 1, 1);
  writeEntry(0x0131, 2, softwareData.len, softwareData.offset);
  writeEntry(0x0132, 2, dateTimeData.len, dateTimeData.offset);
  writeEntry(0x8769, 4, 1, subIfdOffset);

  eIdx = subIfdEntriesPos;
  writeEntry(0x829A, 5, 1, expTimeOffset);
  writeEntry(0x829D, 5, 1, fNumberOffset);
  writeEntry(0x8827, 3, 1, profile.iso);
  writeEntry(0x9003, 2, origDateData.len, origDateData.offset);
  writeEntry(0x920A, 5, 1, focalLengthOffset);
  writeEntry(0xA405, 3, 1, profile.focalLengthIn35mm);
  writeEntry(0xA434, 2, lensModelData.len, lensModelData.offset);

  const payloadSize = dataPoolPos;
  const totalSegmentLength = payloadSize + 2;

  const segment = new Uint8Array(2 + totalSegmentLength);
  segment[0] = 0xFF;
  segment[1] = 0xE1;
  segment[2] = (totalSegmentLength >> 8) & 0xFF;
  segment[3] = totalSegmentLength & 0xFF;
  segment.set(new Uint8Array(buffer, 0, payloadSize), 4);

  return segment;
}
