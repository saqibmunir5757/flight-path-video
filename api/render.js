const { renderMediaOnLambda } = require("@remotion/lambda/client");
const { generateMapFromCoords } = require("../scripts/config-generator");

// Your deployed Remotion site
const SERVE_URL = "https://remotionlambda-apsouth1-q29v20bgvr.s3.ap-south-1.amazonaws.com/sites/3w54aetk46/index.html";
const REGION = "ap-south-1";
const FUNCTION_NAME = "remotion-render-4-0-427-mem2048mb-disk2048mb-120sec";
const BUCKET_NAME = "remotionlambda-apsouth1-q29v20bgvr";

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    // Generate map config (same as before)
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

    const startTime = Date.now();
    console.log(`[Lambda Render] Config generated, invoking Lambda...`);

    // Render on Lambda
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
    console.log(`[Lambda Render] Started successfully: ${renderId} (took ${elapsed}ms)`);

    // Return render ID and bucket info
    return res.status(200).json({
      jobId: renderId,
      bucketName,
      status: "rendering",
      message: "Video rendering on AWS Lambda",
    });
  } catch (err) {
    console.error("[Lambda Render] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
