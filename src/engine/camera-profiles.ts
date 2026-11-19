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

  // We write in Little Endian (II / 0x4949)
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
  view.setUint32(pos, 8, true);      // Offset to IFD0 (relative to tiffStart)
  pos += 4;

  // 3. IFD0 Entries
  // Tags: Make (0x010F), Model (0x0110), Orientation (0x0112), Software (0x0131), DateTime (0x0132), ExifOffset (0x8769)
  const ifd0EntryCount = 6;
  view.setUint16(pos, ifd0EntryCount, true);
  pos += 2;

  // Space for IFD0 entries (6 entries * 12 bytes = 72 bytes)
  const ifd0EntriesPos = pos;
  pos += ifd0EntryCount * 12;

  // Next IFD Offset (0 = none)
  view.setUint32(pos, 0, true);
  pos += 4;

  // Dynamic data pool starts here (for strings and SubIFD)
  let dataPoolPos = pos;

  function writeAscii(str: string): { offset: number; len: number } {
    const bytes = new TextEncoder().encode(str + '\0');
    const offset = dataPoolPos - tiffStart;
    for (let i = 0; i < bytes.length; i++) {
      view.setUint8(dataPoolPos++, bytes[i]);
    }
    // Pad to word boundary
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

  // Write IFD0 Strings
  const makeData = writeAscii(profile.make);
  const modelData = writeAscii(profile.model);
  const softwareData = writeAscii(profile.software);
  const dateTimeData = writeAscii(dateStr);

  // Write SubIFD (ExifIFD)
  const subIfdOffset = dataPoolPos - tiffStart;

  // SubIFD Entries:
  // ExposureTime (0x829A), FNumber (0x829D), ISO (0x8827), DateTimeOriginal (0x9003),
  // FocalLength (0x920A), FocalLengthIn35mm (0xA405), LensModel (0xA434)
  const subIfdCount = 7;
  view.setUint16(dataPoolPos, subIfdCount, true);
  dataPoolPos += 2;

  const subIfdEntriesPos = dataPoolPos;
  dataPoolPos += subIfdCount * 12;

  // Next IFD in SubIFD
  view.setUint32(dataPoolPos, 0, true);
  dataPoolPos += 4;

  // SubIFD Data values
  const expTimeOffset = writeRational(profile.exposureTime[0], profile.exposureTime[1]);
  const fNumberOffset = writeRational(profile.fNumber[0], profile.fNumber[1]);
  const focalLengthOffset = writeRational(profile.focalLength[0], profile.focalLength[1]);
  const origDateData = writeAscii(dateStr);
  const lensModelData = writeAscii(profile.lensModel);

  // Now populate IFD0 entries
  let eIdx = ifd0EntriesPos;
  function writeEntry(tag: number, type: number, count: number, valOrOffset: number) {
    view.setUint16(eIdx, tag, true);
    view.setUint16(eIdx + 2, type, true);
    view.setUint32(eIdx + 4, count, true);
    view.setUint32(eIdx + 8, valOrOffset, true);
    eIdx += 12;
  }

  writeEntry(0x010F, 2, makeData.len, makeData.offset);       // Make
  writeEntry(0x0110, 2, modelData.len, modelData.offset);     // Model
  writeEntry(0x0112, 3, 1, 1);                                // Orientation = 1 (Normal)
  writeEntry(0x0131, 2, softwareData.len, softwareData.offset); // Software
  writeEntry(0x0132, 2, dateTimeData.len, dateTimeData.offset); // DateTime
  writeEntry(0x8769, 4, 1, subIfdOffset);                     // ExifIFDPointer

  // Now populate SubIFD entries
  eIdx = subIfdEntriesPos;
  writeEntry(0x829A, 5, 1, expTimeOffset);                    // ExposureTime
  writeEntry(0x829D, 5, 1, fNumberOffset);                    // FNumber
  writeEntry(0x8827, 3, 1, profile.iso);                      // ISO
  writeEntry(0x9003, 2, origDateData.len, origDateData.offset); // DateTimeOriginal
  writeEntry(0x920A, 5, 1, focalLengthOffset);                // FocalLength
  writeEntry(0xA405, 3, 1, profile.focalLengthIn35mm);        // FocalLengthIn35mmFilm
  writeEntry(0xA434, 2, lensModelData.len, lensModelData.offset); // LensModel

  const payloadSize = dataPoolPos;
  const totalSegmentLength = payloadSize + 2; // 2 bytes for segment length itself

  // Assemble full APP1 segment: [0xFF, 0xE1, len_hi, len_lo, ...payload]
  const segment = new Uint8Array(2 + totalSegmentLength);
  segment[0] = 0xFF;
  segment[1] = 0xE1;
  segment[2] = (totalSegmentLength >> 8) & 0xFF;
  segment[3] = totalSegmentLength & 0xFF;
  segment.set(new Uint8Array(buffer, 0, payloadSize), 4);

  return segment;
}
