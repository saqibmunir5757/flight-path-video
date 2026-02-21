/**
 * config-generator.js — Lightweight config generation for serverless environments
 *
 * This module contains ONLY the coordinate conversion and config generation logic.
 * No Sharp, no filesystem operations - safe for Vercel/serverless deployment.
 */

const TILE_SIZE = 256;
const FPS = 30;
const HOLD_START = Math.round(FPS * 0.5); // 15 f
const HOLD_END = FPS;                      // 30 f
const PIXELS_PER_SECOND = 180;
const MIN_FRAMES = 18;
const MAX_FRAMES = 360;

// ── Mercator projection ───────────────────────────────────────────────────────

function lngLatToWorldPixel(lng, lat, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

// ── Path smoothing helpers ────────────────────────────────────────────────────

function pointToLineDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  return Math.abs(dx * (a.y - p.y) - (a.x - p.x) * dy) / len;
}

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

// ── generateMapFromCoords — build mapConfig from lat/lng waypoints ───────────

/**
 * Converts lat/lng waypoints to pixel positions and generates Remotion config.
 * This function is serverless-safe (no filesystem, no native dependencies).
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

  // Path smoothing: RDP simplification + Gaussian smoothing
  let pts = rdpSimplify(wpPixels, 6);
  pts = gaussianSmooth(pts, 4);

  // Catmull-Rom tangents at each waypoint
  const n = pts.length;
  const tangents = pts.map((_, i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    if (i === 0) return { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
    if (i === n - 1) return { x: pts[n - 1].x - pts[n - 2].x, y: pts[n - 1].y - pts[n - 2].y };
    return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
  });

  // Cubic Bezier control points per segment
  const segments = [];
  for (let i = 0; i < n - 1; i++) {
    const s = pts[i], e = pts[i + 1];
    const dist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
    const frames = Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, Math.round(dist / (PIXELS_PER_SECOND * speed) * FPS)));
    segments.push({
      c1x: s.x + tangents[i].x / 3,
      c1y: s.y + tangents[i].y / 3,
      c2x: e.x - tangents[i + 1].x / 3,
      c2y: e.y - tangents[i + 1].y / 3,
      frames,
    });
  }

  // Total duration
  let durationInFrames = HOLD_START + HOLD_END;
  for (const seg of segments) durationInFrames += seg.frames;
  for (let i = 1; i < pts.length - 1; i++) durationInFrames += (pts[i].delayAfter || 0);

  return {
    mapFile,
    planeColor,
    lineColor,
    planeStyle,
    glowEnabled,
    glowColor,
    glowIntensity,
    trailGlowEnabled,
    trailGlowColor,
    trailGlowIntensity,
    labelFontColor,
    labelBgColor,
    labelFontFamily,
    labelTextCase,
    labelBold,
    labelItalic,
    panEnabled,
    panSpeed,
    zoomEnabled,
    zoomMax,
    durationInFrames,
    waypoints: pts,
    segments,
    zoom,
  };
}

module.exports = { generateMapFromCoords };
