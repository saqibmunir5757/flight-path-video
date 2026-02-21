// Vercel-compatible snapshot API - generates map tiles and returns coordinates
// Note: Cannot save files in Vercel serverless, so we just return the map bounds
const https = require("https");

const TILE_SIZE = 256;

function lngLatToWorldPixel(lng, lat, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { center, zoom } = req.body;

  if (!center?.lat || !center?.lng || !zoom) {
    return res.status(400).json({ error: "center { lat, lng } and zoom are required" });
  }

  try {
    const z = Math.round(zoom);
    const OUT_W = 1920;
    const OUT_H = 1080;

    // Calculate top-left world pixel
    const centerPx = lngLatToWorldPixel(center.lng, center.lat, z);
    const tlX = Math.round(centerPx.x - OUT_W / 2);
    const tlY = Math.round(centerPx.y - OUT_H / 2);

    // Return map bounds - frontend will use these for rendering
    return res.status(200).json({
      mapFile: `map-${Date.now()}.png`, // Placeholder name
      tlX,
      tlY,
      zoom: z,
      imageBase64: null, // No image in Vercel (would need S3 upload)
    });
  } catch (err) {
    console.error("[snapshot] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
