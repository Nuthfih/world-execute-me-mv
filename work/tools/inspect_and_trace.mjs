#!/usr/bin/env node
/**
 * 1) Renders a zoomed (u, v) coordinate grid + current HandShape overlay onto
 *    studio/public/img/gc_reach.png -> work/tmp/reach_grid.png
 *    Also prints detected silhouette bounds / fingertip peaks of the raised hand.
 * 2) Traces studio/public/img/gc_hello.png at 496x1148 into smooth vector paths
 *    matching VecData ({ w, h, paths: [{ f, x, y, d }] }) ->
 *    work/tmp/gc_hello_vec_new.json + preview PNG work/tmp/hello_vec_preview.png.
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
      if (cleanUrl === '__worker.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<!doctype html><html><body><canvas id="c"></canvas></body></html>');
        return;
      }
      const fp = path.join(rootDir, decodeURIComponent(cleanUrl));
      if (!fp.startsWith(rootDir) || !fs.existsSync(fp)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.json' ? 'application/json' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
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

    // ---------------------------------------------------------
    // PART 1: Inspect gc_reach.png hand geometry + render grid
    // ---------------------------------------------------------
    const reachReport = await page.evaluate(async (baseUrl) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = baseUrl + '/studio/public/img/gc_reach.png';
      await new Promise((r, j) => { img.onload = r; img.onerror = j; });

      const W = 873, H = 1412;
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, W, H);
      const data = octx.getImageData(0, 0, W, H).data;

      // Render crop focused on upper half (u: 0..0.60, v: 0.15..0.85) at 2x scale
      const u0 = 0.0, u1 = 0.65, v0 = 0.12, v1 = 0.80;
      const sx = Math.floor(u0 * W), sy = Math.floor(v0 * H);
      const sw = Math.floor((u1 - u0) * W), sh = Math.floor((v1 - v0) * H);
      const outScale = 2;
      const cv = document.createElement('canvas');
      cv.width = sw * outScale;
      cv.height = sh * outScale;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#F2F4FA';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(off, sx, sy, sw, sh, 0, 0, cv.width, cv.height);

      // Draw normalized (u, v) grid
      for (let g = 0; g <= 100; g += 2) {
        const u = g / 100;
        if (u >= u0 && u <= u1) {
          const x = (u * W - sx) * outScale;
          const major = g % 10 === 0;
          ctx.strokeStyle = major ? 'rgba(220, 38, 38, 0.7)' : 'rgba(220, 38, 38, 0.22)';
          ctx.lineWidth = major ? 1.5 : 1;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
          if (major) {
            ctx.fillStyle = '#B91C1C';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('u=' + u.toFixed(2), x + 4, 22);
          }
        }
        const v = g / 100;
        if (v >= v0 && v <= v1) {
          const y = (v * H - sy) * outScale;
          const major = g % 10 === 0;
          ctx.strokeStyle = major ? 'rgba(220, 38, 38, 0.7)' : 'rgba(220, 38, 38, 0.22)';
          ctx.lineWidth = major ? 1.5 : 1;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
          if (major) {
            ctx.fillStyle = '#B91C1C';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('v=' + v.toFixed(2), 8, y - 5);
          }
        }
      }

      // Also detect skin pixels inside raised hand region (u: 0.05..0.38, v: 0.25..0.62)
      // Find topmost local peaks across u-slices to locate fingertips!
      const skinCols = [];
      for (let px = Math.floor(0.05 * W); px <= Math.floor(0.38 * W); px++) {
        let minY = H, maxY = 0, cnt = 0;
        for (let py = Math.floor(0.25 * H); py <= Math.floor(0.62 * H); py++) {
          const idx = (py * W + px) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
          // skin tone in anime sprite: warm peach (r > g > b, r > 200)
          if (a > 128 && r > 210 && g > 170 && b > 140 && r - b > 12) {
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
            cnt++;
          }
        }
        if (cnt > 5) skinCols.push({ px, minY, maxY, cnt, u: px / W, vTop: minY / H, vBot: maxY / H });
      }

      // Draw blue dots along topmost skin edge & palm estimation
      ctx.fillStyle = '#059669';
      for (const s of skinCols) {
        const x = (s.px - sx) * outScale;
        const y = (s.minY - sy) * outScale;
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }

      // Overlay current HandShape at current S03_Pre1 REACH = {u: 0.308, v: 0.573} & old aspect 1040/1552 vs new 873/1412
      // Wait: in S03_Pre1 at scale 1, sprH=1500, HAND_S=1.03 -> in gc_reach 1x coords (W=873, H=1412), ratio = 1412/1500
      // Let's draw current HandShape at REACH = {u:0.308, v:0.573} normalized so HandShape radius ~ HAND_S*(H/1500)
      const scaleToImg = (H / 1500) * 1.03;
      const hx = 0.308 * W, hy = 0.573 * H;
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#3B82F6';
      ctx.strokeStyle = '#3B82F6';
      const fgs = [
        [-88, -30, -186, -104, 50],
        [-48, -70, -108, -212, 56],
        [2, -96, -12, -262, 60],
        [88, -60, 118, -214, 56],
        [78, 34, 214, -6, 60],
      ];
      ctx.translate((hx - sx) * outScale, (hy - sy) * outScale);
      ctx.scale(scaleToImg * outScale, scaleToImg * outScale);
      ctx.beginPath(); ctx.ellipse(0, 8, 118, 112, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineCap = 'round';
      for (const [x0, y0, x1, y1, w] of fgs) {
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.restore();

      // Summarize skin bounds
      const uMin = Math.min(...skinCols.map(c => c.u));
      const uMax = Math.max(...skinCols.map(c => c.u));
      const vMin = Math.min(...skinCols.map(c => c.vTop));
      const vMax = Math.max(...skinCols.map(c => c.vBot));
      return {
        dataUrl: cv.toDataURL('image/png'),
        skinUV: { uMin: +uMin.toFixed(4), uMax: +uMax.toFixed(4), vMin: +vMin.toFixed(4), vMax: +vMax.toFixed(4) },
      };
    }, baseUrl);

    const reachBuf = Buffer.from(reachReport.dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(ROOT, 'work', 'tmp', 'reach_grid.png'), reachBuf);
    console.log('reach skin UV bounds:', reachReport.skinUV);

    // ---------------------------------------------------------
    // PART 2: Trace gc_hello.png into smooth vector paths
    // ---------------------------------------------------------
    const traceResult = await page.evaluate(async (baseUrl) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = baseUrl + '/studio/public/img/gc_hello.png';
      await new Promise((r, j) => { img.onload = r; img.onerror = j; });

      const W = 496, H = 1148;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const rgba = ctx.getImageData(0, 0, W, H).data;

      // 1. Collect opaque pixels and sample colors for k-means quantization
      const N = W * H;
      const opaque = new Uint8Array(N);
      const samples = [];
      for (let i = 0; i < N; i++) {
        const a = rgba[i * 4 + 3];
        if (a >= 110) {
          opaque[i] = 1;
          if (i % 7 === 0) {
            samples.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]);
          }
        }
      }

      // Deterministic K-means++ initialization for K = 16 colors
      const K = 16;
      const centers = [samples[Math.floor(samples.length * 0.3)]];
      const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
      // Add deterministic seeded PRNG
      let seed = 1337;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

      for (let c = 1; c < K; c++) {
        let sumD = 0;
        const dArr = new Float64Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          let best = Infinity;
          for (let j = 0; j < centers.length; j++) {
            const d = dist2(samples[i], centers[j]);
            if (d < best) best = d;
          }
          dArr[i] = best;
          sumD += best;
        }
        let target = rnd() * sumD;
        let chosen = samples[samples.length - 1];
        for (let i = 0; i < samples.length; i++) {
          target -= dArr[i];
          if (target <= 0) { chosen = samples[i]; break; }
        }
        centers.push([...chosen]);
      }

      for (let it = 0; it < 14; it++) {
        const acc = Array.from({ length: K }, () => [0, 0, 0, 0]);
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          let bi = 0, bd = Infinity;
          for (let k = 0; k < K; k++) {
            const d = dist2(s, centers[k]);
            if (d < bd) { bd = d; bi = k; }
          }
          acc[bi][0] += s[0]; acc[bi][1] += s[1]; acc[bi][2] += s[2]; acc[bi][3]++;
        }
        for (let k = 0; k < K; k++) {
          if (acc[k][3] > 0) {
            centers[k][0] = acc[k][0] / acc[k][3];
            centers[k][1] = acc[k][1] / acc[k][3];
            centers[k][2] = acc[k][2] / acc[k][3];
          }
        }
      }

      const hexPalette = centers.map(c =>
        '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()).join('')
      );

      // Assign every opaque pixel to nearest center (0 = transparent, 1..K = palette index + 1)
      let labels = new Int16Array(N);
      for (let i = 0; i < N; i++) {
        if (!opaque[i]) continue;
        const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
        let bi = 0, bd = Infinity;
        for (let k = 0; k < K; k++) {
          const d = (r - centers[k][0]) ** 2 + (g - centers[k][1]) ** 2 + (b - centers[k][2]) ** 2;
          if (d < bd) { bd = d; bi = k; }
        }
        labels[i] = bi + 1;
      }

      // Gentle 3x3 modal despeckle to remove 1px AA salt between flat zones
      for (let pass = 0; pass < 1; pass++) {
        const next = new Int16Array(labels);
        const counts = new Int32Array(K + 1);
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const idx = y * W + x;
            const cur = labels[idx];
            if (!cur) continue;
            counts.fill(0);
            let same = 0, maxC = 0, maxL = cur;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const l = labels[(y + dy) * W + (x + dx)];
                if (l > 0) {
                  counts[l]++;
                  if (l === cur) same++;
                  if (counts[l] > maxC) { maxC = counts[l]; maxL = l; }
                }
              }
            }
            if (same <= 2 && maxC >= 5) next[idx] = maxL;
          }
        }
        labels = next;
      }

      // Connected components via BFS + merge components < 16 px into neighbor
      const compId = new Int32Array(N);
      compId.fill(-1);
      const comps = []; // { label, pixels: [], minX, minY, maxX, maxY }
      const qx = new Int32Array(N), qy = new Int32Array(N);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const startIdx = y * W + x;
          const lbl = labels[startIdx];
          if (lbl <= 0 || compId[startIdx] !== -1) continue;
          const id = comps.length;
          let head = 0, tail = 0;
          qx[tail] = x; qy[tail] = y; tail++;
          compId[startIdx] = id;
          const pixels = [];
          let minX = x, maxX = x, minY = y, maxY = y;
          while (head < tail) {
            const cx = qx[head], cy = qy[head]; head++;
            const cIdx = cy * W + cx;
            pixels.push(cIdx);
            if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
            const nbs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (let n = 0; n < 4; n++) {
              const nx = nbs[n][0], ny = nbs[n][1];
              if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                const nIdx = ny * W + nx;
                if (compId[nIdx] === -1 && labels[nIdx] === lbl) {
                  compId[nIdx] = id;
                  qx[tail] = nx; qy[tail] = ny; tail++;
                }
              }
            }
          }
          comps.push({ id, label: lbl, pixels, minX, minY, maxX, maxY, area: pixels.length });
        }
      }

      // Marching-Squares boundary extraction for each component with area >= 18
      // Plus one full outer silhouette outline component for extra crisp outside edge!
      function extractLoopsFromGridMask(isInside, bx0, by0, bx1, by1) {
        const bw = bx1 - bx0 + 1;
        const bh = by1 - by0 + 1;
        // Grid of corners (bw+1) x (bh+1); directed boundary half-edges along pixel boundaries
        // Using exact integer pixel corner graph (4-way unit segments where inside differs across edge):
        // Directed edge keeps "inside" on its RIGHT in screen coords (cw outer, ccw hole).
        const edgeMap = new Map();
        const addEdge = (x0, y0, x1, y1) => {
          const key = (y0 * 2048 + x0);
          let arr = edgeMap.get(key);
          if (!arr) { arr = []; edgeMap.set(key, arr); }
          arr.push([x1, y1]);
        };
        for (let py = by0; py <= by1; py++) {
          for (let px = bx0; px <= bx1; px++) {
            if (!isInside(px, py)) continue;
            const lx = px - bx0, ly = py - by0;
            if (!isInside(px, py - 1)) addEdge(lx, ly, lx + 1, ly);         // top: L -> R
            if (!isInside(px + 1, py)) addEdge(lx + 1, ly, lx + 1, ly + 1); // right: T -> B
            if (!isInside(px, py + 1)) addEdge(lx + 1, ly + 1, lx, ly + 1); // bottom: R -> L
            if (!isInside(px - 1, py)) addEdge(lx, ly + 1, lx, ly);         // left: B -> T
          }
        }

        const loops = [];
        // Trace closed directed cycles, always turning right/left cleanly on diagonal saddles
        for (const [startKey, startOuts] of edgeMap.entries()) {
          while (startOuts.length > 0) {
            const sx = startKey % 2048;
            const sy = Math.floor(startKey / 2048);
            const firstNext = startOuts.pop();
            const pts = [[sx + bx0, sy + by0]];
            let cx = firstNext[0], cy = firstNext[1];
            let prevDx = cx - sx, prevDy = cy - sy;
            while (cx !== sx || cy !== sy) {
              pts.push([cx + bx0, cy + by0]);
              const key = cy * 2048 + cx;
              const outs = edgeMap.get(key);
              if (!outs || outs.length === 0) break;
              let bestIdx = 0;
              if (outs.length > 1) {
                // Prefer sharpest right turn (or straight) to keep components non-crossing
                let bestScore = -999;
                for (let i = 0; i < outs.length; i++) {
                  const dx = outs[i][0] - cx, dy = outs[i][1] - cy;
                  const cross = prevDx * dy - prevDy * dx; // positive = right turn in screen coords
                  const dot = prevDx * dx + prevDy * dy;
                  const score = cross * 2 + dot * 0.5;
                  if (score > bestScore) { bestScore = score; bestIdx = i; }
                }
              }
              const next = outs.splice(bestIdx, 1)[0];
              prevDx = next[0] - cx; prevDy = next[1] - cy;
              cx = next[0]; cy = next[1];
              if (pts.length > 20000) break;
            }
            if (pts.length >= 6) loops.push(pts);
          }
        }
        return loops;
      }

      // Smooth integer staircase loop via 2 passes of corner cutting + collinear pruning + Douglas-Peucker + Catmull-Rom Cubic Bezier
      function smoothLoopToSvgSubpath(pts, originX, originY, eps) {
        // 1. Prune straight collinear grid vertices
        let simp = [];
        const m = pts.length;
        for (let i = 0; i < m; i++) {
          const p0 = pts[(i - 1 + m) % m];
          const p1 = pts[i];
          const p2 = pts[(i + 1) % m];
          if ((p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]) !== 0) {
            simp.push(p1);
          }
        }
        if (simp.length < 4) return null;

        // 2. Closed Chaikin corner-cutting (2 passes) dissolves 1-px stairsteps smoothly
        for (let pass = 0; pass < 2; pass++) {
          const out = [];
          const n = simp.length;
          for (let i = 0; i < n; i++) {
            const a = simp[i], b = simp[(i + 1) % n];
            out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
            out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
          }
          simp = out;
        }

        // 3. Closed radial + Douglas-Peucker simplification around farthest pair
        function dp(arr, aIdx, bIdx, tol, keep) {
          let maxD = 0, far = -1;
          const ax = arr[aIdx][0], ay = arr[aIdx][1];
          const bx = arr[bIdx][0], by = arr[bIdx][1];
          const dx = bx - ax, dy = by - ay;
          const len2 = dx * dx + dy * dy;
          for (let i = aIdx + 1; i < bIdx; i++) {
            const px = arr[i][0], py = arr[i][1];
            let d;
            if (len2 < 1e-6) {
              d = Math.hypot(px - ax, py - ay);
            } else {
              const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
              d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
            }
            if (d > maxD) { maxD = d; far = i; }
          }
          if (maxD > tol && far !== -1) {
            keep[far] = 1;
            dp(arr, aIdx, far, tol, keep);
            dp(arr, far, bIdx, tol, keep);
          }
        }
        // Rotate so point 0 is min-Y
        let topI = 0;
        for (let i = 1; i < simp.length; i++) {
          if (simp[i][1] < simp[topI][1] || (simp[i][1] === simp[topI][1] && simp[i][0] < simp[topI][0])) topI = i;
        }
        const rot = [...simp.slice(topI), ...simp.slice(0, topI)];
        const half = Math.floor(rot.length / 2);
        const keep = new Uint8Array(rot.length);
        keep[0] = 1; keep[half] = 1;
        dp(rot, 0, half, eps, keep);
        dp([...rot, rot[0]], half, rot.length, eps, keep);
        const poly = [];
        for (let i = 0; i < rot.length; i++) if (keep[i]) poly.push(rot[i]);
        if (poly.length < 3) return null;

        // 4. Catmull-Rom to Cubic Bezier relative to (originX, originY)
        const n = poly.length;
        const tension = 0.22;
        const f1 = (v) => v.toFixed(1).replace(/\.0$/, '');
        let d = `M${f1(poly[0][0] - originX)} ${f1(poly[0][1] - originY)} `;
        for (let i = 0; i < n; i++) {
          const p0 = poly[(i - 1 + n) % n];
          const p1 = poly[i];
          const p2 = poly[(i + 1) % n];
          const p3 = poly[(i + 2) % n];
          const c1x = p1[0] + (p2[0] - p0[0]) * tension - originX;
          const c1y = p1[1] + (p2[1] - p0[1]) * tension - originY;
          const c2x = p2[0] - (p3[0] - p1[0]) * tension - originX;
          const c2y = p2[1] - (p3[1] - p1[1]) * tension - originY;
          const ex = p2[0] - originX;
          const ey = p2[1] - originY;
          d += `C${f1(c1x)} ${f1(c1y)} ${f1(c2x)} ${f1(c2y)} ${f1(ex)} ${f1(ey)} `;
        }
        return d + 'Z';
      }

      const paths = [];
      for (const comp of comps) {
        if (comp.area < 24) continue;
        const cid = comp.id;
        const isInside = (x, y) => {
          if (x < 0 || x >= W || y < 0 || y >= H) return false;
          return compId[y * W + x] === cid;
        };
        const loops = extractLoopsFromGridMask(isInside, comp.minX, comp.minY, comp.maxX, comp.maxY);
        if (loops.length === 0) continue;
        // Origin at top-most point of first loop (outer contour)
        let topPt = loops[0][0];
        for (const p of loops[0]) {
          if (p[1] < topPt[1] || (p[1] === topPt[1] && p[0] < topPt[0])) topPt = p;
        }
        const ox = Math.round(topPt[0]);
        const oy = Math.round(topPt[1]);
        const parts = [];
        for (const lp of loops) {
          // Skip tiny noise inner holes
          if (lp.length < 14) continue;
          const sub = smoothLoopToSvgSubpath(lp, ox, oy, 1.35);
          if (sub) parts.push(sub);
        }
        if (parts.length > 0) {
          paths.push({
            f: hexPalette[comp.label - 1],
            x: ox,
            y: oy,
            d: parts.join(' '),
          });
        }
      }

      // Also add 1 clean outer silhouette contour loop around the entire opaque character
      // so outermost profile always has an uninterrupted crisp line
      const outerLoops = extractLoopsFromGridMask(
        (x, y) => (x >= 0 && x < W && y >= 0 && y < H && opaque[y * W + x] === 1),
        0, 0, W - 1, H - 1
      );
      for (const lp of outerLoops) {
        if (lp.length < 80) continue;
        let topPt = lp[0];
        for (const p of lp) if (p[1] < topPt[1] || (p[1] === topPt[1] && p[0] < topPt[0])) topPt = p;
        const ox = Math.round(topPt[0]), oy = Math.round(topPt[1]);
        const sub = smoothLoopToSvgSubpath(lp, ox, oy, 1.25);
        if (sub) paths.unshift({ f: 'none', x: ox, y: oy, d: sub });
      }

      // Sort paths top-to-bottom by y
      paths.sort((a, b) => a.y - b.y || a.x - b.x);

      // Render a faithful LineArt preview at 1x inside 800x1080
      const pcv = document.createElement('canvas');
      pcv.width = 800; pcv.height = 1080;
      const pctx = pcv.getContext('2d');
      pctx.fillStyle = '#EEF2FF';
      pctx.fillRect(0, 0, 800, 1080);
      const scale = 900 / H;
      const dx0 = 400 - (W * scale) / 2;
      const dy0 = 1010 - 900;
      pctx.save();
      pctx.translate(dx0, dy0);
      pctx.scale(scale, scale);
      for (const p of paths) {
        const p2 = new Path2D(p.d);
        pctx.save();
        pctx.translate(p.x, p.y);
        pctx.strokeStyle = '#3942A2';
        pctx.lineWidth = 1.6;
        pctx.lineJoin = 'round';
        pctx.lineCap = 'round';
        pctx.stroke(p2);
        pctx.restore();
      }
      pctx.restore();

      return {
        vec: { w: W, h: H, paths },
        previewUrl: pcv.toDataURL('image/png'),
        stats: { numPaths: paths.length, jsonBytes: 0 },
      };
    }, baseUrl);

    const jsonStr = JSON.stringify(traceResult.vec);
    fs.writeFileSync(path.join(ROOT, 'work', 'tmp', 'gc_hello_vec_new.json'), jsonStr);
    fs.writeFileSync(
      path.join(ROOT, 'work', 'tmp', 'hello_vec_preview.png'),
      Buffer.from(traceResult.previewUrl.split(',')[1], 'base64'),
    );
    console.log('Traced gc_hello:', { numPaths: traceResult.vec.paths.length, jsonKB: (jsonStr.length / 1024).toFixed(1) });
  } finally {
    await cleanupPage();
    try { await browser.close({ silent: true }); } catch {}
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
