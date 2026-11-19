#!/usr/bin/env node
/**
 * Convert all .jfif / .jpg files in assets/gen/ into production .png files:
 *  - Character sprites (gc_*, gk_*):
 *      1. 2x supersampled border BFS flood-fill to remove pure white background (#FFFFFF)
 *      2. Smart enclosed background pocket removal (hair/neck/arm/torso/leg loops) while
 *         protecting eye sclera, blouse highlights, and button icons
 *      3. 2-ring premultiplied white-matte color decontamination (zero white halo on dark bg)
 *      4. High-quality downsample to canonical 1x PNG dimensions in assets/gen/<name>.png
 *  - Scene plates & sheets (bg_*, hu_*, kv_*, sheet_*):
 *      1. Auto-trim any accidental outer white margin (for scene plates)
 *      2. High-quality conversion to canonical 1x opaque PNG in assets/gen/<name>.png
 *
 * Usage:
 *   node work/tools/jfif_to_png.mjs [--keep-jfif] [--grid <path>]
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const GEN_DIR = path.join(ROOT, 'assets', 'gen');

const require = createRequire(path.join(ROOT, 'studio', 'package.json'));
const { openBrowser } = require('@remotion/renderer');
const { getPageAndCleanupFn } = require(path.join(ROOT, 'studio', 'node_modules', '@remotion', 'renderer', 'dist', 'get-browser-instance.js'));

const args = process.argv.slice(2);
const keepJfif = args.includes('--keep-jfif');
const gridIdx = args.indexOf('--grid');
const gridOutPath = gridIdx >= 0 ? args[gridIdx + 1] : null;

function getTargetSize(baseName, srcW, srcH) {
  if (baseName === 'gc_hello') return [848, 1264];
  if (baseName === 'gc_face_open' || baseName === 'gc_sleep' || baseName === 'sheet_A') return [1264, 848];
  if (Math.abs(srcW - srcH) <= 32) return [1254, 1254];
  if (srcW > srcH) return [1536, 1024];
  return [1024, 1536];
}

async function main() {
  const jfifFiles = fs.readdirSync(GEN_DIR)
    .filter(f => /\.(jfif|jpe?g)$/i.test(f))
    .sort();

  if (jfifFiles.length === 0) {
    console.log('No .jfif/.jpg files found in assets/gen/.');
    return;
  }

  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const f = u.searchParams.get('f');
    const p = path.join(GEN_DIR, path.basename(f || ''));
    if (f && fs.existsSync(p)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(p).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const browser = await openBrowser('chrome', { logLevel: 'error' });
  const { page, cleanupPage } = await getPageAndCleanupFn({
    passedInInstance: browser,
    browserExecutable: null,
    chromiumOptions: {},
    forceDeviceScaleFactor: 1,
    indent: false,
    logLevel: 'error',
    onBrowserDownload: () => {},
    chromeMode: 'headless-shell',
    pageIndex: 0,
    onBrowserLog: null,
    onLog: () => {},
  });

  const gridItems = [];

  try {
    for (const file of jfifFiles) {
      const baseName = file.replace(/\.(jfif|jpe?g)$/i, '');
      const isCharSprite = baseName.startsWith('gc_') || baseName.startsWith('gk_');
      const isScenePlate = baseName.startsWith('hu_') || baseName.startsWith('bg_') || baseName.startsWith('kv_');
      const outPngPath = path.join(GEN_DIR, `${baseName}.png`);

      const res = await page.evaluate(async ({ url, baseName, isCharSprite, isScenePlate }) => {
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.crossOrigin = 'anonymous';
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('Failed to load ' + url));
          i.src = url;
        });

        const w = img.naturalWidth, h = img.naturalHeight;
        let tw = 1024, th = 1536;
        if (baseName === 'gc_hello') { tw = 848; th = 1264; }
        else if (baseName === 'gc_face_open' || baseName === 'gc_sleep' || baseName === 'sheet_A') { tw = 1264; th = 848; }
        else if (Math.abs(w - h) <= 32) { tw = 1254; th = 1254; }
        else if (w > h) { tw = 1536; th = 1024; }

        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const pocketLogs = [];
        const clearedLogs = [];

        if (!isCharSprite) {
          // Opaque scene plate or character sheet (keep full frame intact)
          const outC = document.createElement('canvas');
          outC.width = tw; outC.height = th;
          const outCtx = outC.getContext('2d');
          outCtx.imageSmoothingEnabled = true;
          outCtx.imageSmoothingQuality = 'high';
          outCtx.drawImage(c, 0, 0, w, h, 0, 0, tw, th);

          // Also make thumbnail for grid
          const thumbC = document.createElement('canvas');
          thumbC.width = 240; thumbC.height = 240;
          const tctx = thumbC.getContext('2d');
          tctx.fillStyle = '#0D1021';
          tctx.fillRect(0, 0, 240, 240);
          const sc = Math.min(220 / tw, 200 / th);
          const dw = tw * sc, dh = th * sc;
          tctx.drawImage(outC, (240 - dw) / 2, (210 - dh) / 2, dw, dh);

          return {
            w, h, tw, th,
            pocketLogs, clearedLogs,
            pngUrl: outC.toDataURL('image/png'),
            thumbUrl: thumbC.toDataURL('image/png'),
          };
        }

        // Transparent character sprite matting at full 2x source resolution
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        const n = w * h;

        const isWhiteBg = (idx) => {
          const i = idx * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
          return mn >= 238 && (mx - mn) <= 14;
        };

        const isStrictWhite = (idx) => {
          const i = idx * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
          return mn >= 248 && (mx - mn) <= 6;
        };

        // 1. Border BFS
        const bgMask = new Uint8Array(n);
        const q = new Int32Array(n);
        let qh = 0, qt = 0;
        const push = (idx) => {
          if (!bgMask[idx] && isWhiteBg(idx)) {
            bgMask[idx] = 1;
            q[qt++] = idx;
          }
        };
        for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
        while (qh < qt) {
          const cur = q[qh++];
          const x = cur % w, y = (cur - x) / w;
          if (x > 0) push(cur - 1);
          if (x < w - 1) push(cur + 1);
          if (y > 0) push(cur - w);
          if (y < h - 1) push(cur + w);
        }

        // 2. Detect enclosed pure-white pockets & classify background loops vs sclera/icons
        const vis = new Uint8Array(n);
        for (let start = 0; start < n; start++) {
          if (bgMask[start] || vis[start] || !isStrictWhite(start)) continue;
          let pqh = 0;
          const comp = [start];
          vis[start] = 1;
          let minX = w, maxX = -1, minY = h, maxY = -1;
          let skinBorder = 0, darkHairOrDressBorder = 0, totalBorder = 0;

          while (pqh < comp.length) {
            const cur = comp[pqh++];
            const x = cur % w, y = (cur - x) / w;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            const nb = [x > 0 ? cur - 1 : -1, x < w - 1 ? cur + 1 : -1, y > 0 ? cur - w : -1, y < h - 1 ? cur + w : -1];
            for (const k of nb) {
              if (k < 0) continue;
              if (!bgMask[k] && !vis[k] && isStrictWhite(k)) {
                vis[k] = 1;
                comp.push(k);
              } else if (!isStrictWhite(k)) {
                // Sample 2px further out to inspect true neighbor material color
                const nx = k % w, ny = (k - nx) / w;
                const dx = Math.sign(nx - x) * 3, dy = Math.sign(ny - y) * 3;
                const sx = Math.max(0, Math.min(w - 1, nx + dx));
                const sy = Math.max(0, Math.min(h - 1, ny + dy));
                const si = (sy * w + sx) * 4;
                const r = d[si], g = d[si + 1], b = d[si + 2];
                totalBorder++;
                // Skin / warm blush check
                if (r > 195 && g > 140 && b > 120 && r > b + 20) skinBorder++;
                // Dark indigo hair / midnight navy dress / black outline check
                if (b > r + 20 || (r < 90 && g < 95 && b < 160)) darkHairOrDressBorder++;
              }
            }
          }

          if (comp.length >= 90) {
            const skinRatio = totalBorder > 0 ? skinBorder / totalBorder : 0;
            const ny0 = +(minY / h).toFixed(3), ny1 = +(maxY / h).toFixed(3);
            const nx0 = +(minX / w).toFixed(3), nx1 = +(maxX / w).toFixed(3);
            const info = { len: comp.length, nx0, nx1, ny0, ny1, skinRatio: +skinRatio.toFixed(2) };
            pocketLogs.push(info);

            // Only clear true enclosed background loops (between arms/hair/props and torso/legs),
            // preserving all white lace skirt frills, white sleeves, white halo/robes (gc_god),
            // white blouse, eye sclera, and button icons (gc_press).
            let shouldClear = false;
            if ((baseName === 'gc_answer' || baseName === 'gc_snap') && comp.length >= 5000 && ny0 > 0.70) {
              shouldClear = true;
            } else if (baseName === 'gc_hello' && comp.length >= 1400 && ny0 > 0.35 && ny1 < 0.55) {
              shouldClear = true;
            } else if (baseName === 'gc_dark_face' && ny0 > 0.60 && comp.length >= 200) {
              shouldClear = true;
            } else if (baseName === 'gc_dark_conduct' && comp.length >= 1000 && ny0 < 0.45 && skinRatio < 0.05) {
              shouldClear = true;
            } else if (baseName === 'gc_lever' && comp.length >= 10000) {
              shouldClear = true;
            } else if (baseName === 'gc_press' && comp.length >= 15000) {
              shouldClear = true;
            } else if (baseName === 'gc_reach' && comp.length >= 8000 && ny0 > 0.38 && ny1 < 0.55) {
              shouldClear = true;
            } else if (baseName === 'gc_teacher' && comp.length >= 10000 && ny0 > 0.35 && ny1 < 0.55) {
              shouldClear = true;
            }

            if (shouldClear) {
              for (const k of comp) {
                bgMask[k] = 1;
                const x = k % w, y = (k - x) / w;
                if (x > 0 && isWhiteBg(k - 1)) bgMask[k - 1] = 1;
                if (x < w - 1 && isWhiteBg(k + 1)) bgMask[k + 1] = 1;
                if (y > 0 && isWhiteBg(k - w)) bgMask[k - w] = 1;
                if (y < h - 1 && isWhiteBg(k + w)) bgMask[k + w] = 1;
              }
              clearedLogs.push(info);
            }
          }
        }

        // 3. Apply alpha & 2-ring white-matte color decontamination
        for (let idx = 0; idx < n; idx++) {
          if (bgMask[idx]) d[idx * 4 + 3] = 0;
        }

        const isEdge = new Uint8Array(n);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (!bgMask[idx] && (bgMask[idx - 1] || bgMask[idx + 1] || bgMask[idx - w] || bgMask[idx + w])) {
              isEdge[idx] = 1;
            }
          }
        }
        const isEdge2 = new Uint8Array(n);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (!bgMask[idx] && !isEdge[idx] && (isEdge[idx - 1] || isEdge[idx + 1] || isEdge[idx - w] || isEdge[idx + w])) {
              isEdge2[idx] = 1;
            }
          }
        }

        const decontam = (mask) => {
          for (let y = 3; y < h - 3; y++) {
            for (let x = 3; x < w - 3; x++) {
              const idx = y * w + x;
              if (!mask[idx]) continue;
              let sr = 0, sg = 0, sb = 0, cnt = 0;
              for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                  const ni = (y + dy) * w + (x + dx);
                  if (!bgMask[ni] && !isEdge[ni] && !isEdge2[ni]) {
                    const pi = ni * 4;
                    sr += d[pi]; sg += d[pi + 1]; sb += d[pi + 2]; cnt++;
                  }
                }
              }
              if (!cnt) continue;
              const fr = sr / cnt, fg = sg / cnt, fb = sb / cnt;
              const pi = idx * 4;
              const denom = 255 * 3 - (fr + fg + fb);
              const pSum = d[pi] + d[pi + 1] + d[pi + 2], fSum = fr + fg + fb;
              if (denom > 35 && pSum > fSum + 6) {
                const a = Math.max(0.04, Math.min(1, 1 - (pSum - fSum) / denom));
                d[pi] = Math.round(fr); d[pi + 1] = Math.round(fg); d[pi + 2] = Math.round(fb);
                d[pi + 3] = Math.round(a * 255);
              }
            }
          }
        };
        decontam(isEdge2);
        decontam(isEdge);

        ctx.putImageData(id, 0, 0);

        // 4. Downsample cleanly to canonical 1x PNG dimensions
        const outC = document.createElement('canvas');
        outC.width = tw; outC.height = th;
        const outCtx = outC.getContext('2d');
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';
        outCtx.drawImage(c, 0, 0, w, h, 0, 0, tw, th);

        // 5. Render dark-background verification thumbnail
        const thumbC = document.createElement('canvas');
        thumbC.width = 240; thumbC.height = 240;
        const tctx = thumbC.getContext('2d');
        tctx.fillStyle = '#0D1021';
        tctx.fillRect(0, 0, 240, 240);
        const sc = Math.min(220 / tw, 200 / th);
        const dw = tw * sc, dh = th * sc;
        tctx.drawImage(outC, (240 - dw) / 2, (210 - dh) / 2, dw, dh);

        return {
          w, h, tw, th,
          pocketLogs, clearedLogs,
          pngUrl: outC.toDataURL('image/png'),
          thumbUrl: thumbC.toDataURL('image/png'),
        };
      }, { url: `${baseUrl}/?f=${encodeURIComponent(file)}`, baseName, isCharSprite, isScenePlate });

      const outBuf = Buffer.from(res.pngUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      fs.writeFileSync(outPngPath, outBuf);
      gridItems.push({ baseName, thumbUrl: res.thumbUrl });

      const pStr = res.clearedLogs.length ? `cleared=${res.clearedLogs.length}` : 'cleared=0';
      console.log(`${file.padEnd(22)} ${res.w}x${res.h} -> ${baseName}.png (${res.tw}x${res.th}) [${pStr}]`);
      if (res.pocketLogs.length) {
        console.log(`   pockets: ${JSON.stringify(res.pocketLogs)}`);
      }
      if (!keepJfif) {
        fs.unlinkSync(path.join(GEN_DIR, file));
      }
    }

    if (gridOutPath && gridItems.length) {
      const gridUrl = await page.evaluate(async (items) => {
        const cols = 7, rows = Math.ceil(items.length / cols);
        const cw = 240, ch = 240;
        const c = document.createElement('canvas');
        c.width = cols * cw; c.height = rows * ch;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#070913';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        for (let idx = 0; idx < items.length; idx++) {
          const col = idx % cols, row = Math.floor(idx / cols);
          const x = col * cw, y = row * ch;
          const img = await new Promise((r, j) => {
            const i = new Image();
            i.onload = () => r(i);
            i.onerror = j;
            i.src = items[idx].thumbUrl;
          });
          ctx.drawImage(img, x, y);
          ctx.strokeStyle = '#1E293B';
          ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText(items[idx].baseName, x + cw / 2, y + ch - 8);
        }
        return c.toDataURL('image/png');
      }, gridItems);
      fs.writeFileSync(gridOutPath, Buffer.from(gridUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
      console.log('Saved verification grid:', gridOutPath);
    }
  } finally {
    await cleanupPage();
    try { await browser.close({ silent: true }); } catch {}
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
