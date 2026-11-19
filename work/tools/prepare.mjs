/**
 * Cross-platform prepare script (Windows / macOS / Linux):
 *   1. studio/public/audio/song.m4a  <- transcodes/copies song from source/
 *   2. studio/public/img/*.png       <- assets/gen/*.png, trimmed (gc_*, gk_*) + 2.5x Lanczos upscaled
 *   3. studio/src/data/images.ts     <- updated with exact trimmed 1x dimensions for aspect ratios
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'source');
const GEN_DIR = path.join(ROOT, 'assets', 'gen');
const IMG_OUT = path.join(ROOT, 'studio', 'public', 'img');
const AUD_OUT = path.join(ROOT, 'studio', 'public', 'audio');
const TMP_DIR = path.join(ROOT, 'work', 'tmp_prepare');

fs.mkdirSync(IMG_OUT, {recursive: true});
fs.mkdirSync(AUD_OUT, {recursive: true});
fs.mkdirSync(TMP_DIR, {recursive: true});

function findFfmpeg() {
  const candidates = [
    path.join(ROOT, 'studio', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(ROOT, 'studio', 'node_modules', '@remotion', 'compositor-darwin-arm64', 'ffmpeg'),
    path.join(ROOT, 'studio', 'node_modules', '@remotion', 'compositor-darwin-x64', 'ffmpeg'),
    path.join(ROOT, 'studio', 'node_modules', '@remotion', 'compositor-linux-x64-gnu', 'ffmpeg'),
    'ffmpeg',
  ];
  for (const c of candidates) {
    if (c === 'ffmpeg' || fs.existsSync(c)) return c;
  }
  throw new Error('ffmpeg not found. Run `npm ci` in studio/ or install ffmpeg.');
}

const FFMPEG = findFfmpeg();

// ---------------------------------------------------------------------------
// 1. Minimal pure-JS PNG reader/writer for trimming transparent borders
// ---------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8, w = 0, h = 0, colorType = 6;
  const idats = [];
  let plte = null, trns = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idats.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const stride = w * bpp;
  const recon = new Uint8Array(h * stride);
  let inOff = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[inOff++];
    const rowOff = y * stride, prevOff = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[inOff++];
      const a = x >= bpp ? recon[rowOff + x - bpp] : 0;
      const b = y > 0 ? recon[prevOff + x] : 0;
      const c = x >= bpp && y > 0 ? recon[prevOff + x - bpp] : 0;
      if (filter === 0) recon[rowOff + x] = v;
      else if (filter === 1) recon[rowOff + x] = (v + a) & 0xff;
      else if (filter === 2) recon[rowOff + x] = (v + b) & 0xff;
      else if (filter === 3) recon[rowOff + x] = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) recon[rowOff + x] = (v + paeth(a, b, c)) & 0xff;
    }
  }
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (colorType === 6) {
      rgba[i * 4] = recon[i * 4]; rgba[i * 4 + 1] = recon[i * 4 + 1];
      rgba[i * 4 + 2] = recon[i * 4 + 2]; rgba[i * 4 + 3] = recon[i * 4 + 3];
    } else if (colorType === 2) {
      rgba[i * 4] = recon[i * 3]; rgba[i * 4 + 1] = recon[i * 3 + 1];
      rgba[i * 4 + 2] = recon[i * 3 + 2]; rgba[i * 4 + 3] = 255;
    } else if (colorType === 3 && plte) {
      const idx = recon[i];
      rgba[i * 4] = plte[idx * 3]; rgba[i * 4 + 1] = plte[idx * 3 + 1];
      rgba[i * 4 + 2] = plte[idx * 3 + 2]; rgba[i * 4 + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
  return {w, h, rgba};
}
function writePNG(filePath, w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 1;
    const srcOff = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? rgba[srcOff + x - 4] : 0;
      raw[rowStart + 1 + x] = (rgba[srcOff + x] - a) & 0xff;
    }
  }
  const compressed = zlib.deflateSync(raw, {level: 6});
  const chunk = (type, data) => {
    const b = Buffer.alloc(12 + data.length);
    b.writeUInt32BE(data.length, 0);
    b.write(type, 4, 4, 'ascii');
    data.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(filePath, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]));
}

function trimTransparent({w, h, rgba}, pad = 8) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return {w, h, rgba};
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const nw = cw + pad * 2, nh = ch + pad * 2;
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < ch; y++) {
    const srcOff = ((minY + y) * w + minX) * 4;
    const dstOff = ((y + pad) * nw + pad) * 4;
    out.set(rgba.subarray(srcOff, srcOff + cw * 4), dstOff);
  }
  return {w: nw, h: nh, rgba: out};
}

// ---------------------------------------------------------------------------
// 2. Audio
// ---------------------------------------------------------------------------
const audioExts = ['.m4a', '.mp3', '.wav', '.flac', '.aac'];
const audioFile = fs.readdirSync(SRC_DIR).find((f) => audioExts.includes(path.extname(f).toLowerCase()));
if (!audioFile) {
  console.error("!! no audio found in source/ — put Mili's 'world.execute(me);' (3:32) there");
  process.exit(1);
}
const srcAudio = path.join(SRC_DIR, audioFile);
const dstAudio = path.join(AUD_OUT, 'song.m4a');
if (srcAudio.toLowerCase().endsWith('.m4a')) {
  fs.copyFileSync(srcAudio, dstAudio);
} else {
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', srcAudio, '-vn', '-c:a', 'aac', '-b:a', '320k', '-f', 'mp4', dstAudio], {stdio: 'inherit'});
}
console.log(`audio: source/${audioFile} -> studio/public/audio/song.m4a`);

// ---------------------------------------------------------------------------
// 3. Images (trim characters + 2.5x Lanczos upscale via ffmpeg) & images.ts
// ---------------------------------------------------------------------------
const files = fs.readdirSync(GEN_DIR).filter((f) => f.endsWith('.png') && !f.startsWith('sheet_')).sort();
const dims = {};

for (const name of files) {
  const srcPath = path.join(GEN_DIR, name);
  const dstPath = path.join(IMG_OUT, name);
  const isChar = name.startsWith('gc_') || name.startsWith('gk_');
  let inputForScale = srcPath;
  let w, h;

  if (isChar) {
    const trimmed = trimTransparent(readPNG(srcPath), 8);
    w = trimmed.w;
    h = trimmed.h;
    const tmpPng = path.join(TMP_DIR, name);
    writePNG(tmpPng, w, h, trimmed.rgba);
    inputForScale = tmpPng;
  } else {
    const buf = fs.readFileSync(srcPath);
    w = buf.readUInt32BE(16);
    h = buf.readUInt32BE(20);
  }
  dims[`img/${name}`] = [w, h];

  const upW = Math.round(w * 2.5);
  const upH = Math.round(h * 2.5);
  execFileSync(FFMPEG, [
    '-v', 'error', '-y',
    '-i', inputForScale,
    '-vf', `scale=${upW}:${upH}:flags=lanczos`,
    '-pix_fmt', 'rgba',
    dstPath,
  ]);
  console.log(`prepared ${name}: ${w}x${h} -> ${upW}x${upH}`);
}

fs.rmSync(TMP_DIR, {recursive: true, force: true});

const entries = Object.entries(dims)
  .map(([k, [w, h]]) => `  '${k}': [${w}, ${h}],`)
  .join('\n');
const imagesTs = `// generated: image sizes (w,h) for aspect ratios\nexport const IMG: Record<string, [number, number]> = {\n${entries}\n};\nexport const ar = (src: string) => (IMG[src] ? IMG[src][0] / IMG[src][1] : 2 / 3);\n`;
fs.writeFileSync(path.join(ROOT, 'studio', 'src', 'data', 'images.ts'), imagesTs, 'utf8');
console.log(`images: ${files.length} files in studio/public/img and updated studio/src/data/images.ts`);
