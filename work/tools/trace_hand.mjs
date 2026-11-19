#!/usr/bin/env node
/**
 * Extracts an exact, smooth SVG path contour of Gemini-chan's raised hand from
 * studio/public/img/gc_reach.png, transformed into S03_Pre1 ShotUnite local coords:
 *   - origin (0, 0) = REACH (u=0.206, v=0.526)
 *   - sprH = 1500, sprW = sprH * (873/1412), press = 0.97
 * Also writes a visual comparison overlay PNG to work/tmp/hand_overlay_test.png.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const require = createRequire(path.join(ROOT, 'studio', 'package.json'));
const { openBrowser } = require('@remotion/renderer');
const { getPageAndCleanupFn } = require(
  path.join(ROOT, 'studio', 'node_modules', '@remotion', 'renderer', 'dist', 'get-browser-instance.js'),
);

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanUrl = (req.url || '/').split('?')[0].replace(/^\/+/, '');
      const fp = path.join(rootDir, decodeURIComponent(cleanUrl));
      if (!fp.startsWith(rootDir) || !fs.existsSync(fp)) {
        res.writeHead(404); res.end('Not found'); return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function run() {
  fs.mkdirSync(path.join(ROOT, 'work', 'tmp'), { recursive: true });
  const { server, port } = await startStaticServer(ROOT);
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

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    const res = await page.evaluate(async (baseUrl) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = baseUrl + '/studio/public/img/gc_reach.png';
      await new Promise((r, j) => { img.onload = r; img.onerror = j; });

      // Work directly at target screen scale (1x = ShotUnite @ press=0.97)
      // At sprH=1500, press=0.97 -> effective height = 1455, effective width = 1455 * (873/1412) = 899.58
      const W = 900, H = 1455;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const rgba = ctx.getImageData(0, 0, W, H).data;

      // Origin (0,0) = REACH (0.206, 0.526)
      const ox = 0.206 * W;
      const oy = 0.526 * H;

      // 1. Build skin mask of her raised hand (excluding the chest-resting hand on the right and gold trim):
      const rawMask = new Uint8Array(W * H);
      for (let y = Math.floor(0.33 * H); y < Math.floor(0.60 * H); y++) {
        for (let x = 0; x < Math.floor(0.38 * W); x++) {
          const u = x / W, v = y / H;
          // Exclude gold/blouse below wrist cuff (below navy band which starts ~v=0.585)
          if (v > 0.584) continue;
          // Clean diagonal separator along outer palm heel (keeps thumb heel cleanly without chest-hand spikes)
          if (v > 0.51 && u > 0.315 - Math.max(0, v - 0.525) * 0.35) continue;
          // Exclude stray gold trim left of cuff
          if (u < 0.115 && v > 0.568) continue;
          const idx = (y * W + x) * 4;
          const r = rgba[idx], g = rgba[idx + 1], b = rgba[idx + 2], a = rgba[idx + 3];
          if (a < 110) continue;
          // Pure anime skin + warm skin lineart (explicitly rejects dark navy cuff & saturated gold trim where b < 115)
          const isSkin = r > 185 && g > 145 && b > 125 && r >= g && r - b < 95;
          const isWarmHandLine = r > 135 && g > 95 && b > 82 && r > b + 8 && r - b < 75;
          if (isSkin || isWarmHandLine) {
            rawMask[y * W + x] = 1;
          }
        }
      }

      // Close small interior lineart gaps via 3px morphological closing, then floodfill holes
      const dilate = (src, rad) => {
        const out = new Uint8Array(W * H);
        const r2 = rad * rad;
        for (let y = Math.floor(0.32 * H); y < Math.floor(0.62 * H); y++) {
          for (let x = 0; x < Math.floor(0.40 * W); x++) {
            if (!src[y * W + x]) continue;
            for (let dy = -rad; dy <= rad; dy++) {
              const yy = y + dy; if (yy < 0 || yy >= H) continue;
              for (let dx = -rad; dx <= rad; dx++) {
                if (dx * dx + dy * dy > r2) continue;
                const xx = x + dx; if (xx < 0 || xx >= W) continue;
                out[yy * W + xx] = 1;
              }
            }
          }
        }
        return out;
      };
      const erode = (src, rad) => {
        const out = new Uint8Array(W * H);
        const r2 = rad * rad;
        for (let y = Math.floor(0.32 * H); y < Math.floor(0.62 * H); y++) {
          for (let x = 0; x < Math.floor(0.40 * W); x++) {
            if (!src[y * W + x]) continue;
            let ok = true;
            for (let dy = -rad; dy <= rad && ok; dy++) {
              const yy = y + dy;
              for (let dx = -rad; dx <= rad; dx++) {
                if (dx * dx + dy * dy > r2) continue;
                const xx = x + dx;
                if (xx < 0 || xx >= W || yy < 0 || yy >= H || !src[yy * W + xx]) { ok = false; break; }
              }
            }
            if (ok) out[y * W + x] = 1;
          }
        }
        return out;
      };

      // Close tiny crevices inside palm/knuckles, keep only largest connected component (the raised hand!)
      let closed = erode(dilate(rawMask, 3), 3);

      // Connected components -> largest component
      const vis = new Int32Array(W * H);
      let bestPts = [];
      for (let y = Math.floor(0.33 * H); y < Math.floor(0.61 * H); y++) {
        for (let x = 0; x < Math.floor(0.39 * W); x++) {
          const si = y * W + x;
          if (!closed[si] || vis[si]) continue;
          const comp = [si];
          vis[si] = 1;
          for (let q = 0; q < comp.length; q++) {
            const c = comp[q];
            const cx = c % W, cy = (c - cx) / W;
            const nb = [c + 1, c - 1, c + W, c - W];
            for (const ni of nb) {
              if (ni >= 0 && ni < W * H && closed[ni] && !vis[ni]) { vis[ni] = 1; comp.push(ni); }
            }
          }
          if (comp.length > bestPts.length) bestPts = comp;
        }
      }

      const handOnly = new Uint8Array(W * H);
      for (const p of bestPts) handOnly[p] = 1;

      // Expand outward +3px for clean silhouette wrap around the dark outline, and round bottom into smooth wrist base
      const finalMask = dilate(handOnly, 3);

      // Keep largest outer boundary loop (no holes)
      function extractOuterLoop(mask) {
        const edgeMap = new Map();
        const addEdge = (x0, y0, x1, y1) => {
          const key = y0 * 2048 + x0;
          let arr = edgeMap.get(key);
          if (!arr) { arr = []; edgeMap.set(key, arr); }
          arr.push([x1, y1]);
        };
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            if (!mask[y * W + x]) continue;
            if (!mask[(y - 1) * W + x]) addEdge(x, y, x + 1, y);
            if (!mask[y * W + (x + 1)]) addEdge(x + 1, y, x + 1, y + 1);
            if (!mask[(y + 1) * W + x]) addEdge(x + 1, y + 1, x, y + 1);
            if (!mask[y * W + (x - 1)]) addEdge(x, y + 1, x, y);
          }
        }
        const loops = [];
        for (const [startKey, outs] of edgeMap.entries()) {
          while (outs.length > 0) {
            const sx = startKey % 2048, sy = Math.floor(startKey / 2048);
            const n0 = outs.pop();
            const pts = [[sx, sy]];
            let cx = n0[0], cy = n0[1], pdx = cx - sx, pdy = cy - sy;
            while (cx !== sx || cy !== sy) {
              pts.push([cx, cy]);
              const list = edgeMap.get(cy * 2048 + cx);
              if (!list || list.length === 0) break;
              let bi = 0;
              if (list.length > 1) {
                let bs = -999;
                for (let i = 0; i < list.length; i++) {
                  const dx = list[i][0] - cx, dy = list[i][1] - cy;
                  const s = (pdx * dy - pdy * dx) * 2 + (pdx * dx + pdy * dy) * 0.5;
                  if (s > bs) { bs = s; bi = i; }
                }
              }
              const nx = list.splice(bi, 1)[0];
              pdx = nx[0] - cx; pdy = nx[1] - cy; cx = nx[0]; cy = nx[1];
              if (pts.length > 20000) break;
            }
            loops.push(pts);
          }
        }
        loops.sort((a, b) => b.length - a.length);
        return loops[0];
      }

      const rawLoop = extractOuterLoop(finalMask);

      // Simplify + smooth into Catmull-Rom Cubic Bezier centered around (ox, oy)
      function toSmoothPath(pts, ox0, oy0, tol) {
        let simp = [];
        const m = pts.length;
        for (let i = 0; i < m; i++) {
          const a = pts[(i - 1 + m) % m], b = pts[i], c = pts[(i + 1) % m];
          if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) simp.push(b);
        }
        for (let pass = 0; pass < 3; pass++) {
          const out = [];
          const n = simp.length;
          for (let i = 0; i < n; i++) {
            const a = simp[i], b = simp[(i + 1) % n];
            out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
            out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
          }
          simp = out;
        }
        function dp(arr, aIdx, bIdx, tTol, keep) {
          let maxD = 0, far = -1;
          const ax = arr[aIdx][0], ay = arr[aIdx][1], bx = arr[bIdx][0], by = arr[bIdx][1];
          const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
          for (let i = aIdx + 1; i < bIdx; i++) {
            const px = arr[i][0], py = arr[i][1];
            const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
            const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
            if (d > maxD) { maxD = d; far = i; }
          }
          if (maxD > tTol && far !== -1) {
            keep[far] = 1; dp(arr, aIdx, far, tTol, keep); dp(arr, far, bIdx, tTol, keep);
          }
        }
        const half = Math.floor(simp.length / 2);
        const keep = new Uint8Array(simp.length);
        keep[0] = 1; keep[half] = 1;
        dp(simp, 0, half, tol, keep);
        dp([...simp, simp[0]], half, simp.length, tol, keep);
        const poly = [];
        for (let i = 0; i < simp.length; i++) if (keep[i]) poly.push(simp[i]);

        // Smooth closed midpoint-quadratic curve (stays strictly inside polygon convex hull -> zero overshoot spikes)
        const n = poly.length;
        const f1 = (v) => v.toFixed(1).replace(/\.0$/, '');
        const mid = (a, b) => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
        const m0 = mid(poly[n - 1], poly[0]);
        let d = `M${f1(m0[0] - ox0)} ${f1(m0[1] - oy0)} `;
        for (let i = 0; i < n; i++) {
          const ctrl = poly[i];
          const nxt = mid(poly[i], poly[(i + 1) % n]);
          d += `Q${f1(ctrl[0] - ox0)} ${f1(ctrl[1] - oy0)} ${f1(nxt[0] - ox0)} ${f1(nxt[1] - oy0)} `;
        }
        return { d: d + 'Z', pts: poly.length, bbox: {
          minX: +(Math.min(...poly.map(p => p[0] - ox0))).toFixed(1),
          maxX: +(Math.max(...poly.map(p => p[0] - ox0))).toFixed(1),
          minY: +(Math.min(...poly.map(p => p[1] - oy0))).toFixed(1),
          maxY: +(Math.max(...poly.map(p => p[1] - oy0))).toFixed(1),
        }};
      }

      const pathRes = toSmoothPath(rawLoop, ox, oy, 1.9);

      // Compute natural wrist bounds from y = 60..85 so wrist starts smoothly INSIDE the palm (no horizontal seam!)
      let wMinX = 999, wMaxX = -999;
      for (const pt of rawLoop) {
        const lx = pt[0] - ox, ly = pt[1] - oy;
        if (ly >= 50 && ly <= 88) {
          if (lx < wMinX) wMinX = lx;
          if (lx > wMaxX) wMaxX = lx;
        }
      }
      const wCx = Math.max(-20, Math.min(20, (wMinX + wMaxX) / 2));
      const wHalfW = Math.min(64, Math.max(52, (wMaxX - wMinX) / 2 - 4));
      const wristInfo = { wCx: +wCx.toFixed(1), wHalfW: +wHalfW.toFixed(1) };
      const wristPath = `M${(wCx - wHalfW + 8).toFixed(1)} 78 L${(wCx + wHalfW - 8).toFixed(1)} 78 L${(wCx + wHalfW - 14).toFixed(1)} 212 Q${wCx.toFixed(1)} 232 ${(wCx - wHalfW + 14).toFixed(1)} 212 Z`;

      // Render visual test preview cropped around the hand (ox-250..ox+250, oy-300..oy+280) using an offscreen buffer (just like SVG <g opacity=0.58>)!
      const prev = document.createElement('canvas');
      prev.width = 700; prev.height = 760;
      const pctx = prev.getContext('2d');
      pctx.fillStyle = '#F2F4FA';
      pctx.fillRect(0, 0, 700, 760);
      pctx.save();
      pctx.translate(350 - ox * 1.2, 420 - oy * 1.2);
      pctx.scale(1.2, 1.2);
      pctx.drawImage(img, 0, 0, W, H);
      pctx.restore();

      const ov = document.createElement('canvas');
      ov.width = 700; ov.height = 760;
      const octx = ov.getContext('2d');
      octx.save();
      octx.translate(350, 420);
      octx.scale(1.2, 1.2);
      const grad = octx.createLinearGradient(0, 78, 0, 225);
      grad.addColorStop(0, '#38BDF8');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      octx.fillStyle = grad;
      octx.fill(new Path2D(wristPath));
      octx.fillStyle = '#38BDF8';
      octx.shadowColor = 'rgba(106,155,204,0.8)';
      octx.shadowBlur = 18;
      octx.fill(new Path2D(pathRes.d));
      octx.restore();

      pctx.globalAlpha = 0.58;
      pctx.drawImage(ov, 0, 0);
      pctx.globalAlpha = 1;

      return { pathRes, wristInfo, wristPath, previewUrl: prev.toDataURL('image/png') };
    }, baseUrl);

    fs.writeFileSync(path.join(ROOT, 'work', 'tmp', 'hand_overlay_test.png'), Buffer.from(res.previewUrl.split(',')[1], 'base64'));
    console.log('Traced Hand Path stats:', { pts: res.pathRes.pts, len: res.pathRes.d.length, bbox: res.pathRes.bbox, wristInfo: res.wristInfo });
    fs.writeFileSync(path.join(ROOT, 'work', 'tmp', 'hand_traced.json'), JSON.stringify({ d: res.pathRes.d, wristD: res.wristPath, bbox: res.pathRes.bbox, wristInfo: res.wristInfo }, null, 2));
  } finally {
    await cleanupPage();
    try { await browser.close({ silent: true }); } catch {}
    server.close();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
