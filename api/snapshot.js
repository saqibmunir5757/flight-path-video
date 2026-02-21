// Vercel-compatible snapshot API
const TILE_SIZE = 256;

function lngLatToWorldPixel(lng, lat, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

module.exports = (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // Parse body (Vercel handles this automatically, but let's be defensive)
    const body = req.body || {};
    const { center, zoom, mapStyle } = body;

    console.log("[snapshot] Received:", JSON.stringify(body));

    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
      return res.status(400).json({
        error: "Invalid request: center { lat, lng } required",
        received: body
      });
    }

    if (!zoom || typeof zoom !== 'number') {
      return res.status(400).json({
        error: "Invalid request: zoom (number) required",
        received: body
      });
    }

    const z = Math.round(zoom);
    const OUT_W = 1920;
    const OUT_H = 1080;

    const centerPx = lngLatToWorldPixel(center.lng, center.lat, z);
    const tlX = Math.round(centerPx.x - OUT_W / 2);
    const tlY = Math.round(centerPx.y - OUT_H / 2);

    const response = {
      mapFile: `map-${Date.now()}.png`,
      tlX,
      tlY,
      zoom: z,
      imageBase64: ""
    };

    console.log("[snapshot] Success:", response);
    return res.status(200).json(response);
  } catch (err) {
    console.error("[snapshot] Error:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
      details: err.stack
    });
  }
};
