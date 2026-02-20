#!/usr/bin/env node
/**
 * fetch-map.js — CLI wrapper around map-generator.js
 *
 * Usage:
 *   node scripts/fetch-map.js "Tokyo" "Osaka"
 *   node scripts/fetch-map.js "New York" "Chicago" "Los Angeles"
 *   node scripts/fetch-map.js "35.68,139.69" "34.69,135.50"
 */

const fs = require("fs");
const path = require("path");
const { generateMap } = require("./map-generator");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      'Usage: node scripts/fetch-map.js "FROM" "TO" ["STOP1" ...]\n' +
        'Examples:\n' +
        '  node scripts/fetch-map.js "Tokyo" "Osaka"\n' +
        '  node scripts/fetch-map.js "Lahore" "Karachi" "Islamabad"'
    );
    process.exit(1);
  }

  // Build waypoints — all delays 0 for CLI usage
  const waypoints = args.map((loc) => ({ location: loc, delayAfter: 0 }));
  const route = args.join(" → ");

  console.log(`Generating map: ${route}\n`);

  const config = await generateMap({ waypoints }, ({ phase, percent }) => {
    process.stdout.write(`\r  [${String(Math.round(percent)).padStart(3)}%] ${phase}    `);
  });

  process.stdout.write("\n\n");

  fs.writeFileSync(
    path.join(__dirname, "..", "src", "mapConfig.json"),
    JSON.stringify(config, null, 2)
  );

  console.log("✓ public/" + config.mapFile + " written");
  console.log("✓ src/mapConfig.json written");
  config.waypoints.forEach((wp, i) => {
    console.log(`  Stop ${i}: ${wp.label} (${wp.x}, ${wp.y})`);
  });
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
