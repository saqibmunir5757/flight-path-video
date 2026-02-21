/**
 * Simple Express server for Railway deployment
 * Handles ONLY the render endpoint - no timeouts
 */

const express = require('express');
const cors = require('cors');
const { renderMediaOnLambda } = require("@remotion/lambda/client");
const { generateMapFromCoords } = require("./scripts/config-generator");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Your deployed Remotion site
const SERVE_URL = "https://remotionlambda-apsouth1-q29v20bgvr.s3.ap-south-1.amazonaws.com/sites/3w54aetk46/index.html";
const REGION = "ap-south-1";
const FUNCTION_NAME = "remotion-render-4-0-427-mem2048mb-disk2048mb-120sec";

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'flight-path-render-api' });
});

// Render endpoint
app.post('/api/render', async (req, res) => {
  const {
    waypoints,
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
    speed,
    mapFile,
    tlX,
    tlY,
    zoom,
  } = req.body;

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return res.status(400).json({ error: "At least 2 waypoints required" });
  }
  if (!mapFile || tlX === undefined || tlY === undefined || !zoom) {
    return res.status(400).json({ error: "mapFile, tlX, tlY, zoom required" });
  }

  try {
    console.log(`[Render] Starting for ${waypoints.length} waypoints...`);
    const startTime = Date.now();

    // Generate config
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

    console.log(`[Render] Config generated, invoking AWS Lambda...`);

    // Render on Lambda - NO TIMEOUT on Railway
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: "MapsVideo",
      inputProps: config,
      codec: "h264",
      imageFormat: "jpeg",
      maxRetries: 1,
      privacy: "public",
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Render] SUCCESS: ${renderId} (took ${elapsed}ms)`);

    return res.status(200).json({
      jobId: renderId,
      bucketName,
      status: "rendering",
      message: "Video rendering on AWS Lambda",
    });
  } catch (err) {
    console.error("[Render] ERROR:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Render API server running on port ${PORT}`);
  console.log(`📍 Railway URL: https://<your-railway-app>.up.railway.app`);
});
