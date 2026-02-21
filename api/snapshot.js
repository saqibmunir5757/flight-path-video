const { snapshotMap } = require("../scripts/map-generator");
const fs = require("fs");
const path = require("path");

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

  const { center, zoom, mapStyle } = req.body;

  if (!center?.lat || !center?.lng || !zoom) {
    return res.status(400).json({ error: "center { lat, lng } and zoom are required" });
  }

  try {
    console.log(`[snapshot] center=${center.lat.toFixed(4)},${center.lng.toFixed(4)} zoom=${zoom} style=${mapStyle || 'satellite'}`);

    const result = await snapshotMap(
      { center, zoom: Math.round(zoom), mapStyle: mapStyle || 'satellite' },
      ({ phase, percent }) => {
        console.log(`  [snapshot] ${Math.round(percent)}% — ${phase}`);
      }
    );

    // Return image as base64
    const pngPath = path.join(process.cwd(), "public", result.mapFile);
    const imageBase64 = fs.readFileSync(pngPath).toString("base64");

    console.log(`[snapshot] Done → ${result.mapFile}`);
    return res.status(200).json({ ...result, imageBase64 });
  } catch (err) {
    console.error("[snapshot] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
