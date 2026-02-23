/**
 * server.js — Flight Path Video Generator v2
 *
 * POST /api/snapshot  { center: {lat,lng}, zoom }
 *   → fetches tiles, stitches PNG, returns { mapFile, tlX, tlY, zoom, imageBase64 }
 *
 * POST /api/render    { waypoints:[{lat,lng,label,delayAfter}], planeColor, lineColor, mapFile, tlX, tlY, zoom }
 *   → converts coords → pixels, runs Remotion render, returns { jobId }
 *
 * GET  /api/status/:id   → { status, phase, percent, error? }
 * GET  /api/download/:id → MP4 stream
 * GET  /*               → serves web/index.html
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { snapshotMap, generateMapFromCoords } = require("./scripts/map-generator");

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "web")));

// ── In-memory job store + queue ───────────────────────────────────────────────
const jobs = new Map();
const renderQueue = [];   // jobIds waiting to run
let isRunning = false;

// ── /api/snapshot ─────────────────────────────────────────────────────────────

app.post("/api/snapshot", async (req, res) => {
  const { center, zoom, mapStyle } = req.body;

  if (!center?.lat || !center?.lng || !zoom) {
    return res.status(400).json({ error: "center { lat, lng } and zoom are required" });
  }

  try {
    console.log(`\n[snapshot] center=${center.lat.toFixed(4)},${center.lng.toFixed(4)} zoom=${zoom} style=${mapStyle || 'satellite'}`);

    const result = await snapshotMap({ center, zoom: Math.round(zoom), mapStyle: mapStyle || 'satellite' }, ({ phase, percent }) => {
      console.log(`  [snapshot] ${Math.round(percent)}% — ${phase}`);
    });

    // Return image as base64 so the frontend can display it immediately
    const pngPath = path.join(__dirname, "public", result.mapFile);
    const imageBase64 = fs.readFileSync(pngPath).toString("base64");

    console.log(`[snapshot] Done → ${result.mapFile}`);
    res.json({ ...result, imageBase64 });
  } catch (err) {
    console.error("[snapshot] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/render ───────────────────────────────────────────────────────────────

app.post("/api/render", (req, res) => {
  const { waypoints, planeColor, lineColor, planeStyle, glowEnabled, glowColor, glowIntensity, trailGlowEnabled, trailGlowColor, trailGlowIntensity, labelFontColor, labelBgColor, labelFontFamily, labelTextCase, labelBold, labelItalic, panEnabled, panSpeed, zoomEnabled, zoomMax, speed, mapFile, tlX, tlY, zoom } = req.body;

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return res.status(400).json({ error: "At least 2 waypoints are required" });
  }
  for (const wp of waypoints) {
    if (typeof wp.lat !== "number" || typeof wp.lng !== "number") {
      return res.status(400).json({ error: "Each waypoint must have numeric lat and lng" });
    }
  }
  if (!mapFile || tlX === undefined || tlY === undefined || !zoom) {
    return res.status(400).json({ error: "mapFile, tlX, tlY, zoom required (from /api/snapshot)" });
  }
  const jobId = crypto.randomBytes(6).toString("hex");
  const queuePos = renderQueue.length + (isRunning ? 1 : 0);
  jobs.set(jobId, {
    status: queuePos === 0 ? "running" : "queued",
    phase: queuePos === 0 ? "Building config…" : `Queued — position ${queuePos + 1}`,
    percent: 0,
    params: { waypoints, planeColor, lineColor, planeStyle, glowEnabled, glowColor, glowIntensity, trailGlowEnabled, trailGlowColor, trailGlowIntensity, labelFontColor, labelBgColor, labelFontFamily, labelTextCase, labelBold, labelItalic, panEnabled, panSpeed, zoomEnabled, zoomMax, speed, mapFile, tlX, tlY, zoom },
  });
  renderQueue.push(jobId);
  res.json({ jobId, queuePosition: queuePos });
  processQueue();
});

// ── /api/status ───────────────────────────────────────────────────────────────

app.get("/api/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  const queueIdx = renderQueue.indexOf(req.params.jobId);
  const queuePosition = queueIdx === -1 ? null : queueIdx; // 0 = currently running
  const { params, ...jobOut } = job; // don't expose params in response
  res.json({ ...jobOut, queuePosition, queueLength: renderQueue.length });
});

// ── /api/download ─────────────────────────────────────────────────────────────

app.get("/api/download/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== "done") return res.status(404).json({ error: "Video not ready" });
  if (!fs.existsSync(job.outputFile)) return res.status(404).json({ error: "Video file missing" });
  res.download(job.outputFile, "flight-path-video.mp4");
});

// ── Catch-all → frontend ──────────────────────────────────────────────────────

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

// ── Queue processor ───────────────────────────────────────────────────────────

async function processQueue() {
  if (isRunning || renderQueue.length === 0) return;
  isRunning = true;
  const jobId = renderQueue[0]; // peek — remove after done
  const job = jobs.get(jobId);
  const params = job.params;

  // Update any still-queued jobs with their new positions
  renderQueue.forEach((id, idx) => {
    if (idx === 0) return;
    const j = jobs.get(id);
    if (j && j.status === "queued") {
      jobs.set(id, { ...j, phase: `Queued — position ${idx + 1} of ${renderQueue.length}` });
    }
  });

  try {
    await runJob(jobId, params);
  } catch (err) {
    jobs.set(jobId, { status: "error", phase: "Failed", percent: 0, error: err.message });
    console.error(`[${jobId}] Error:`, err.message);
  } finally {
    renderQueue.shift(); // remove completed/errored job from front
    isRunning = false;
    processQueue();      // kick off next
  }
}

// ── Job runner ────────────────────────────────────────────────────────────────

async function runJob(jobId, { waypoints, planeColor, lineColor, planeStyle, glowEnabled, glowColor, glowIntensity, trailGlowEnabled, trailGlowColor, trailGlowIntensity, labelFontColor, labelBgColor, labelFontFamily, labelTextCase, labelBold, labelItalic, panEnabled, panSpeed, zoomEnabled, zoomMax, speed, mapFile, tlX, tlY, zoom }) {

  function update(patch) {
    jobs.set(jobId, { ...jobs.get(jobId), ...patch });
  }

  console.log(`\n[${jobId}] Render: ${waypoints.length} waypoints, map=${mapFile}`);

  // Build mapConfig from pre-recorded lat/lng coordinates — no tile fetching needed
  const config = generateMapFromCoords({
    coordWaypoints: waypoints,
    planeColor: planeColor || "#FFD700",
    lineColor: lineColor || "#FFD700",
    planeStyle: planeStyle || "default",
    glowEnabled: glowEnabled ?? false,
    glowColor: glowColor || "#FFD700",
    glowIntensity: glowIntensity || 1,
    trailGlowEnabled: trailGlowEnabled ?? false,
    trailGlowColor: trailGlowColor || "#FFD700",
    trailGlowIntensity: trailGlowIntensity || 1,
    labelFontColor: labelFontColor || "#000000",
    labelBgColor: labelBgColor || "#FFD700",
    labelFontFamily: labelFontFamily || "system-ui, -apple-system, sans-serif",
    labelTextCase: labelTextCase || "none",
    labelBold: labelBold ?? false,
    labelItalic: labelItalic ?? false,
    panEnabled: panEnabled ?? true,
    panSpeed: panSpeed || 1,
    zoomEnabled: zoomEnabled ?? true,
    zoomMax: zoomMax || 1.4,
    speed: speed || 1,
    mapFile,
    tlX,
    tlY,
    zoom,
  });

  fs.writeFileSync(
    path.join(__dirname, "src", "mapConfig.json"),
    JSON.stringify(config, null, 2)
  );

  console.log(`[${jobId}] mapConfig written — ${config.durationInFrames} frames`);
  update({ phase: "Starting Remotion render…", percent: 5 });

  const outputFile = path.join(__dirname, "out", `video-${jobId}.mp4`);
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });

  await new Promise((resolve, reject) => {
    const proc = spawn("npx", ["remotion", "render", "MapsVideo", outputFile, "--config", "remotion.config.ts"], { cwd: __dirname });
    let stderr = "";
    proc.stdout.on("data", (data) => {
      const str = data.toString();
      const match = str.match(/Rendered\s+(\d+)\/(\d+)/);
      if (match) {
        const pct = parseInt(match[1]) / parseInt(match[2]);
        update({ phase: `Rendering frames ${match[1]} / ${match[2]}`, percent: Math.round(5 + pct * 95) });
      }
    });
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Render exited ${code}. ${stderr.slice(-400)}`));
    });
  });

  update({ status: "done", phase: "Done!", percent: 100, outputFile });
  console.log(`[${jobId}] Done → ${outputFile}`);
}

// ── Start ─────────────────────────────────────────────────────────────────────

const { networkInterfaces } = require('os');
function getLocalIP() {
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log("┌────────────────────────────────────────┐");
  console.log("│   ✈  Flight Path Video Generator v2    │");
  console.log(`│   Local:   http://localhost:${PORT}         │`);
  console.log(`│   Network: http://${ip}:${PORT}      │`);
  console.log("└────────────────────────────────────────┘\n");
});
