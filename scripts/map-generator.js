/**
 * map-generator.js — Core map generation module (mapv2)
 *
 * snapshotMap({ center, zoom }, onProgress?)
 *   → fetches tiles centered on that point, stitches 1920×1080 PNG
 *   → returns { mapFile, tlX, tlY, zoom }
 *
 * generateMapFromCoords({ coordWaypoints, planeColor, lineColor, mapFile, tlX, tlY, zoom })
 *   coordWaypoints: [{ lat, lng, label, delayAfter }]
 *   → converts lat/lng → pixel positions, computes Bezier curves
 *   → returns mapConfig object (same format as v1)
 *
 * generateMap (legacy v1 compat — kept for CLI scripts)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const TILE_SIZE = 256;
const OUT_W = 1920;
const OUT_H = 1080;
const FPS = 30;
const HOLD_START = Math.round(FPS * 0.5); // 15 f
const HOLD_END = FPS;                      // 30 f

// Speed-based timing: plane moves at a constant pixel/second rate.
// This means close points = short clip, far points = longer clip.
const PIXELS_PER_SECOND = 180; // pixels per second at 1920×1080
const MIN_FRAMES = 18;         // 0.6s minimum (short hops still visible)
const MAX_FRAMES = 360;        // 12s maximum (very long routes don't drag)
const FLY_FRAMES = FPS * 6;   // fallback for legacy generateMap

// ── Mercator projection ───────────────────────────────────────────────────────

function lngLatToWorldPixel(lng, lat, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function worldPixelToLngLat(wx, wy, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  const lng = (wx / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * wy / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

function findBestZoom(minLat, minLng, maxLat, maxLng) {
  const PADDING = 0.22;
  for (let z = 16; z >= 1; z--) {
    const p1 = lngLatToWorldPixel(minLng, minLat, z);
    const p2 = lngLatToWorldPixel(maxLng, maxLat, z);
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    if (dx < OUT_W * (1 - 2 * PADDING) && dy < OUT_H * (1 - 2 * PADDING)) return z;
  }
  return 2;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RemotionMapsBot/1.0", ...headers } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location, headers).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// ── Geocoding (kept for legacy generateMap) ───────────────────────────────────

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=1&accept-language=en`;
  const buf = await get(url, { "Accept-Language": "en" });
  const results = JSON.parse(buf.toString());
  if (!results.length) throw new Error(`Could not geocode: "${query}"`);
  const r = results[0];
  return {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    name: r.display_name.split(",")[0].trim(),
  };
}

function parseCoord(str) {
  const m = str.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), name: str };
  return null;
}

async function resolveLocation(arg) {
  return parseCoord(arg) ?? (await geocode(arg));
}

// ── Tile fetching ─────────────────────────────────────────────────────────────

// Tile URL templates for different map styles
const TILE_URLS = {
  osm: {
    base: (z, x, y) => `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`
  },
  satellite: {
    base: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    labels: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`
  },
  voyager: {
    base: (z, x, y) => `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`
  },
  dark: {
    base: (z, x, y) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`
  },
  light: {
    base: (z, x, y) => `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`
  }
};

async function fetchTile(z, x, y, mapStyle = 'satellite') {
  const maxTile = Math.pow(2, z);
  const tx = ((x % maxTile) + maxTile) % maxTile;
  const ty = Math.max(0, Math.min(maxTile - 1, y));

  const urls = TILE_URLS[mapStyle] || TILE_URLS.satellite;
  const baseUrl = urls.base(z, tx, ty);
  const labelUrl = urls.labels ? urls.labels(z, tx, ty) : null;

  try {
    if (labelUrl) {
      const [base, labels] = await Promise.all([get(baseUrl), get(labelUrl).catch(() => null)]);
      return { sat: base, lbl: labels };
    } else {
      const base = await get(baseUrl);
      return { sat: base, lbl: null };
    }
  } catch {
    return null;
  }
}

// ── Tile stitching (shared) ───────────────────────────────────────────────────

async function stitchTiles(tlX, tlY, zoom, mapStyle, onProgress) {
  const tileX0 = Math.floor(tlX / TILE_SIZE);
  const tileY0 = Math.floor(tlY / TILE_SIZE);
  const tileX1 = Math.ceil((tlX + OUT_W) / TILE_SIZE);
  const tileY1 = Math.ceil((tlY + OUT_H) / TILE_SIZE);
  const total = (tileX1 - tileX0) * (tileY1 - tileY0);

  const composites = [];
  const labelComposites = [];
  let fetched = 0;

  for (let ty = tileY0; ty < tileY1; ty++) {
    for (let tx = tileX0; tx < tileX1; tx++) {
      const tile = await fetchTile(zoom, tx, ty, mapStyle);
      const left = Math.round(tx * TILE_SIZE - tlX);
      const top = Math.round(ty * TILE_SIZE - tlY);
      if (tile) {
        if (tile.sat) composites.push({ input: tile.sat, left, top });
        if (tile.lbl) labelComposites.push({ input: tile.lbl, left, top });
      }
      fetched++;
      onProgress({
        phase: `Fetching map tiles (${fetched}/${total})…`,
        percent: 5 + (fetched / total) * 55,
      });
    }
  }

  onProgress({ phase: "Stitching map…", percent: 62 });

  const publicDir = path.join(__dirname, "..", "public");
  fs.mkdirSync(publicDir, { recursive: true });

  const mapFilename = `map-${Date.now()}.png`;

  const satBuf = await sharp({
    create: { width: OUT_W, height: OUT_H, channels: 3, background: { r: 10, g: 10, b: 20 } },
  })
    .composite(composites)
    .png()
    .toBuffer();

  await sharp(satBuf)
    .composite(labelComposites)
    .png()
    .toFile(path.join(publicDir, mapFilename));

  return mapFilename;
}

// ── Path smoothing helpers ────────────────────────────────────────────────────

// Perpendicular distance from point P to line (A→B)
function pointToLineDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  return Math.abs(dx * (a.y - p.y) - (a.x - p.x) * dy) / len;
}

// Ramer-Douglas-Peucker: removes points that are within `epsilon` pixels
// of the straight line between their neighbours — eliminates redundant clicks.
function rdpSimplify(pts, epsilon) {
  if (pts.length <= 2) return pts;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = pointToLineDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left  = rdpSimplify(pts.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(pts.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

// Gaussian smoothing: pull each point toward its neighbours.
// Keeps first and last point fixed. Run multiple iterations for stronger smoothing.
function gaussianSmooth(pts, iterations = 4) {
  let cur = pts.slice();
  for (let iter = 0; iter < iterations; iter++) {
    const next = [cur[0]];
    for (let i = 1; i < cur.length - 1; i++) {
      next.push({
        ...cur[i],
        x: cur[i - 1].x * 0.25 + cur[i].x * 0.5 + cur[i + 1].x * 0.25,
        y: cur[i - 1].y * 0.25 + cur[i].y * 0.5 + cur[i + 1].y * 0.25,
      });
    }
    next.push(cur[cur.length - 1]);
    cur = next;
  }
  return cur;
}

// ── snapshotMap — capture a viewport centered on a lat/lng point ──────────────

/**
 * Fetches map tiles for a 1920×1080 view centered on `center` at `zoom`.
 * Returns the PNG filename + the top-left world pixel coords so the frontend
 * can convert canvas clicks → lat/lng.
 *
 * @param {{ center: { lat, lng }, zoom: number, mapStyle: string }} opts
 * @param {Function} onProgress
 * @returns {{ mapFile: string, tlX: number, tlY: number, zoom: number }}
 */
async function snapshotMap({ center, zoom, mapStyle = 'satellite' }, onProgress = () => {}) {
  onProgress({ phase: "Centering map view…", percent: 0 });

  const cp = lngLatToWorldPixel(center.lng, center.lat, zoom);
  const tlX = cp.x - OUT_W / 2;
  const tlY = cp.y - OUT_H / 2;

  // Clean up old map files
  const publicDir = path.join(__dirname, "..", "public");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.readdirSync(publicDir)
    .filter((f) => f.startsWith("map-") && f.endsWith(".png"))
    .forEach((f) => fs.unlinkSync(path.join(publicDir, f)));

  const mapFile = await stitchTiles(tlX, tlY, zoom, mapStyle, onProgress);

  onProgress({ phase: "Snapshot ready", percent: 100 });
  return { mapFile, tlX, tlY, zoom };
}

// ── generateMapFromCoords — build mapConfig from pre-recorded lat/lng points ──

/**
 * Given lat/lng waypoints already recorded by the pen tool, converts them to
 * pixel positions in the existing map image and returns a full mapConfig.
 *
 * @param {{
 *   coordWaypoints: Array<{ lat: number, lng: number, label: string, delayAfter: number }>,
 *   planeColor: string,
 *   lineColor: string,
 *   planeStyle: string,
 *   glowEnabled: boolean,
 *   glowColor: string,
 *   glowIntensity: number,
 *   labelFontColor: string,
 *   labelBgColor: string,
 *   labelFontFamily: string,
 *   labelTextCase: string,
 *   labelBold: boolean,
 *   labelItalic: boolean,
 *   speed: number,
 *   mapFile: string,
 *   tlX: number,
 *   tlY: number,
 *   zoom: number,
 * }} opts
 */
function generateMapFromCoords({
  coordWaypoints,
  planeColor = "#FFD700",
  lineColor = "#FFD700",
  planeStyle = "default",
  glowEnabled = false,
  glowColor = "#FFD700",
  glowIntensity = 1,
  trailGlowEnabled = false,
  trailGlowColor = "#FFD700",
  trailGlowIntensity = 1,
  labelFontColor = "#000000",
  labelBgColor = "#FFD700",
  labelFontFamily = "system-ui, -apple-system, sans-serif",
  labelTextCase = "none",
  labelBold = false,
  labelItalic = false,
  panEnabled = true,
  panSpeed = 1,
  zoomEnabled = true,
  zoomMax = 1.4,
  speed = 1,
  mapFile,
  tlX,
  tlY,
  zoom,
}) {
  // Convert lat/lng → pixel positions in the 1920×1080 image
  const wpPixels = coordWaypoints.map((wp) => {
    const world = lngLatToWorldPixel(wp.lng, wp.lat, zoom);
    return {
      x: Math.round(world.x - tlX),
      y: Math.round(world.y - tlY),
      label: wp.label || "",
      delayAfter: wp.delayAfter || 0,
    };
  });

  // ── Path smoothing ──────────────────────────────────────────────────────────
  // 1. RDP: remove points within 6px of the straight line between their neighbours.
  //    This collapses accidental extra clicks and tight zigzags.
  // 2. Gaussian: pull remaining points toward neighbours (4 passes).
  //    This rounds out any slight deviations from the intended curve.
  // First + last point are always preserved exactly.
  let pts = rdpSimplify(wpPixels, 6);
  pts = gaussianSmooth(pts, 4);
  // ────────────────────────────────────────────────────────────────────────────

  // Catmull-Rom tangents at each waypoint → smooth direction through every point
  const n   = pts.length;
  const tangents = pts.map((_, i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    if (i === 0)     return { x: pts[1].x - pts[0].x,           y: pts[1].y - pts[0].y };
    if (i === n - 1) return { x: pts[n-1].x - pts[n-2].x,       y: pts[n-1].y - pts[n-2].y };
    return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
  });

  // Cubic Bezier control points per segment (c1 = start + t/3, c2 = end - t/3)
  const segments = [];
  for (let i = 0; i < n - 1; i++) {
    const s = pts[i], e = pts[i + 1];
    const dist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
    // speed > 1 = faster (fewer frames); speed < 1 = slower (more frames)
    const frames = Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, Math.round(dist / (PIXELS_PER_SECOND * speed) * FPS)));
    segments.push({
      c1x: s.x + tangents[i].x / 3,
      c1y: s.y + tangents[i].y / 3,
      c2x: e.x - tangents[i + 1].x / 3,
      c2y: e.y - tangents[i + 1].y / 3,
      frames,
    });
  }

  // Total duration = hold + sum of per-segment frames + intermediate delays
  let durationInFrames = HOLD_START + HOLD_END;
  for (const seg of segments) durationInFrames += seg.frames;
  for (let i = 1; i < pts.length - 1; i++) durationInFrames += (pts[i].delayAfter || 0);

  return { mapFile, planeColor, lineColor, planeStyle, glowEnabled, glowColor, glowIntensity, trailGlowEnabled, trailGlowColor, trailGlowIntensity, labelFontColor, labelBgColor, labelFontFamily, labelTextCase, labelBold, labelItalic, panEnabled, panSpeed, zoomEnabled, zoomMax, durationInFrames, waypoints: pts, segments, zoom };
}

// ── generateMap (legacy v1 — kept for fetch-map.js CLI) ──────────────────────

async function generateMap(
  { waypoints: waypointArgs, planeColor = "#FFD700", lineColor = "#FFD700" },
  onProgress = () => {}
) {
  if (!waypointArgs || waypointArgs.length < 2) {
    throw new Error("At least 2 waypoints are required");
  }

  onProgress({ phase: "Geocoding locations…", percent: 0 });
  const resolved = await Promise.all(
    waypointArgs.map((w) => resolveLocation(w.location))
  );

  const labels = resolved.map((r) => r.name).join(" → ");
  onProgress({ phase: labels, percent: 5 });

  const lats = resolved.map((r) => r.lat);
  const lngs = resolved.map((r) => r.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const zoom = findBestZoom(minLat, minLng, maxLat, maxLng);
  const pixels = resolved.map((r) => lngLatToWorldPixel(r.lng, r.lat, zoom));

  const pMin = lngLatToWorldPixel(minLng, maxLat, zoom);
  const pMax = lngLatToWorldPixel(maxLng, minLat, zoom);
  const centerX = (pMin.x + pMax.x) / 2;
  const centerY = (pMin.y + pMax.y) / 2;
  const tlX = centerX - OUT_W / 2;
  const tlY = centerY - OUT_H / 2;

  const publicDir = path.join(__dirname, "..", "public");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.readdirSync(publicDir)
    .filter((f) => f.startsWith("map-") && f.endsWith(".png"))
    .forEach((f) => fs.unlinkSync(path.join(publicDir, f)));

  const mapFile = await stitchTiles(tlX, tlY, zoom, 'satellite', onProgress);
  onProgress({ phase: "Map ready", percent: 75 });

  const wpPixels = pixels.map((p, i) => ({
    x: Math.round(p.x - tlX),
    y: Math.round(p.y - tlY),
    label: resolved[i].name,
    delayAfter: waypointArgs[i].delayAfter || 0,
  }));

  const segments = [];
  for (let i = 0; i < wpPixels.length - 1; i++) {
    const s = wpPixels[i], e = wpPixels[i + 1];
    const dist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
    segments.push({ ctrlX: Math.round((s.x + e.x) / 2), ctrlY: Math.round((s.y + e.y) / 2 - dist * 0.25) });
  }

  let durationInFrames = HOLD_START + HOLD_END + (wpPixels.length - 1) * FLY_FRAMES;
  for (let i = 1; i < wpPixels.length - 1; i++) durationInFrames += wpPixels[i].delayAfter;

  return { mapFile, planeColor, lineColor, durationInFrames, waypoints: wpPixels, segments, zoom };
}

module.exports = { snapshotMap, generateMapFromCoords, generateMap, lngLatToWorldPixel, worldPixelToLngLat };
