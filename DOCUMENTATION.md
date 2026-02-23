# Flight Path Video Generator v2 - Complete Documentation

**Version:** 2.0  
**Last Updated:** February 22, 2026  
**Tech Stack:** Node.js, Express, Remotion, React, Leaflet, Sharp  
**Video Output:** 1920×1080 HD MP4 at 30 FPS

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Usage Guide](#usage-guide)
6. [API Documentation](#api-documentation)
7. [Frontend Application](#frontend-application)
8. [Video Rendering Engine](#video-rendering-engine)
9. [Map Generation System](#map-generation-system)
10. [Customization Options](#customization-options)
11. [Deployment Guide](#deployment-guide)
12. [File Structure](#file-structure)
13. [Algorithm Deep Dive](#algorithm-deep-dive)
14. [Performance Optimization](#performance-optimization)
15. [Troubleshooting](#troubleshooting)
16. [Advanced Usage](#advanced-usage)
17. [Development Guide](#development-guide)
18. [Contributing](#contributing)

---

## Project Overview

### What is Flight Path Video Generator?

An automated video production system that creates professional, cinema-quality animated videos showing aircraft traveling along customized flight paths on real satellite or street maps. Users interact with an intuitive web interface to click waypoints on a map, customize visual settings, and receive a fully rendered MP4 video.

### Key Features

- ✈️ **14 Real Aircraft Types** - Boeing 747, 777, 787, Airbus A320, A380, and more
- 🗺️ **Multiple Map Styles** - Satellite imagery, OpenStreetMap, CartoDB themes
- ✨ **Advanced Effects** - Plane glow, trail glow, customizable colors
- 📹 **Professional Output** - 1920×1080 HD at 30 FPS with smooth Bezier curves
- 🎬 **Camera Effects** - Dynamic zoom and pan following the aircraft
- 🏷️ **Route Labels** - Customized departure/arrival airport badges
- ⚡ **Queue System** - Multiple concurrent renders with progress tracking
- 📊 **Render History** - Session-based job tracking and re-download capability

### Use Cases

- **Airlines & Aviation** - Route marketing, promotional videos
- **Travel Agencies** - Trip visualization, destination marketing
- **Content Creators** - YouTube travel videos, social media content
- **Education** - Geography lessons, aviation training
- **Personal** - Trip documentation, vacation memories

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Web Browser                        │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Phase 1  │→ │ Phase 2  │→ │ Phase 3  │→ │ Phase 4  │ │
│  │   Map Nav  │  │  Draw    │  │ Progress │  │ Download │ │
│  └────────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Express Server (Node.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Snapshot   │  │    Render    │  │   Download   │     │
│  │   API        │→ │    Queue     │→ │   API        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Map Generation Module                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Tile Fetch  │→ │    Sharp     │→ │  1920×1080   │     │
│  │  (ArcGIS)    │  │   Stitch     │  │     PNG      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Remotion Video Engine                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chromium   │→ │   React      │→ │     MP4      │     │
│  │  Headless    │  │ Composition  │  │   Output     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User Interface** (Leaflet.js + Vanilla JS)
   - Interactive map navigation
   - Click-to-draw waypoint system
   - Real-time coordinate tracking
   - Settings panel with 50+ customization options

2. **Backend Server** (Express.js)
   - RESTful API endpoints
   - Job queue management (in-memory)
   - Map tile orchestration
   - Process spawning for Remotion

3. **Map Generation** (Sharp + HTTPS)
   - Tile fetching from multiple providers
   - Dynamic viewport calculation
   - Image composition and optimization
   - Mercator projection mathematics

4. **Video Rendering** (Remotion + React + Chromium)
   - Frame-by-frame React rendering
   - Bezier curve path animation
   - SVG composition and filtering
   - H.264 video encoding

---

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express** | 5.2.1 | Web server framework |
| **Remotion** | 4.0.427 | Video rendering engine |
| **React** | 18.3.1 | UI component library |
| **Sharp** | 0.34.5 | Image processing (tile stitching) |
| **Leaflet** | 1.9.4 | Interactive map library |

### Development Tools

- **TypeScript** 5.4.5 - Type safety for video composition
- **Docker** - Containerization
- **PM2** - Process management (production)
- **Nginx** - Reverse proxy (optional)

### External Services

- **ArcGIS World Imagery** - High-resolution satellite tiles
- **ArcGIS Reference Layer** - Place name labels
- **OpenStreetMap** - Street map tiles
- **CartoDB** - Themed map styles (Voyager, Dark, Light)

---

## Installation & Setup

### Prerequisites

- Node.js 20.x or later
- 2GB+ RAM (4GB recommended for rendering)
- 1GB free disk space

### Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/yourusername/flight-path-video.git
cd flight-path-video

# Install dependencies
npm install

# Start development server
npm run server

# Open browser
# Navigate to http://localhost:3005
```

The server will start on port 3005 and display:
```
┌────────────────────────────────────────┐
│   ✈  Flight Path Video Generator v2    │
│   Local:   http://localhost:3005       │
│   Network: http://192.168.1.x:3005     │
└────────────────────────────────────────┘
```

### Docker Installation

```bash
# Build image
docker-compose up --build

# Or use Dockerfile directly
docker build -t flight-path-video .
docker run -p 3005:3005 -v $(pwd)/out:/app/out flight-path-video
```

### Production Setup (Ubuntu VPS)

See [Deployment Guide](#deployment-guide) section for detailed instructions.

---

## Usage Guide

### Step-by-Step Walkthrough

#### **Phase 1: Navigate Map**

1. **Open Application** - Navigate to `http://localhost:3005`
2. **Choose Map Style** - Select from dropdown (Satellite recommended)
3. **Navigate to Region** - Use mouse to pan/zoom
4. **Frame Your Shot** - Position map to show your route area
5. **Capture View** - Click "📷 Capture This View"

**Tips:**
- Zoom level 8-12 works best for long routes
- Ensure both start and end points are visible
- Higher zoom = more detail but smaller coverage area

#### **Phase 2: Draw Flight Path**

1. **Click Waypoints** - Click on map to add route points
2. **View Coordinates** - Hover to see live lat/lng
3. **Customize Colors** - Use toolbar color pickers
4. **Add Route Labels** - Click ⚙ Settings → enter airport names
5. **Adjust Settings** - Configure plane, trail, camera, speed
6. **Generate Video** - Click "▶ Generate Video" (requires 2+ points)

**Pro Tips:**
- Use 5-15 waypoints for smooth curves
- Click "Undo" to remove last point
- Settings are preserved across renders
- Try different aircraft types for variety

#### **Phase 3: Render Progress**

1. **Monitor Progress** - Watch real-time percentage counter
2. **Queue Position** - See your place in line if others are rendering
3. **Phase Updates** - Track current render phase
4. **Background Renders** - Click "← Create Another" to start new job while current renders

**Render Phases:**
- Building config (1-5%)
- Starting Remotion (5-10%)
- Rendering frames (10-95%)
- Finalizing video (95-100%)

#### **Phase 4: Download**

1. **Preview** - Watch video inline before downloading
2. **Download** - Click "⬇ Download MP4" button
3. **History** - Access past renders from 🕐 History button
4. **Generate Another** - Click "Generate another" to start fresh

---

## API Documentation

### Base URL
```
http://localhost:3005/api
```

### Endpoints

#### **POST /api/snapshot**

Captures map tiles for a specified center point and zoom level.

**Request Body:**
```json
{
  "center": {
    "lat": 51.5074,
    "lng": -0.1278
  },
  "zoom": 10,
  "mapStyle": "satellite"
}
```

**Parameters:**
- `center.lat` (number, required) - Latitude (-90 to 90)
- `center.lng` (number, required) - Longitude (-180 to 180)
- `zoom` (number, required) - Zoom level (1-18)
- `mapStyle` (string, optional) - Map style: `satellite`, `osm`, `voyager`, `dark`, `light`

**Response:**
```json
{
  "mapFile": "map-1708643520123.png",
  "tlX": 65536.45,
  "tlY": 43210.78,
  "zoom": 10,
  "imageBase64": "iVBORw0KGgoAAAANS..."
}
```

**Response Fields:**
- `mapFile` - Filename of stitched map PNG
- `tlX` - Top-left X world pixel coordinate
- `tlY` - Top-left Y world pixel coordinate
- `zoom` - Zoom level used
- `imageBase64` - Base64-encoded preview image (may be empty on serverless)

**Errors:**
- `400` - Invalid parameters
- `500` - Tile fetch or stitching failed

---

#### **POST /api/render**

Starts a new video render job.

**Request Body:**
```json
{
  "waypoints": [
    {
      "lat": 51.5074,
      "lng": -0.1278,
      "label": "London Heathrow",
      "delayAfter": 0
    },
    {
      "lat": 40.6413,
      "lng": -73.7781,
      "label": "New York JFK",
      "delayAfter": 0
    }
  ],
  "planeColor": "#FFFFFF",
  "lineColor": "#FFD700",
  "planeStyle": "Boeing_747",
  "glowEnabled": true,
  "glowColor": "#FFD700",
  "glowIntensity": 2,
  "trailGlowEnabled": true,
  "trailGlowColor": "#FFD700",
  "trailGlowIntensity": 1.5,
  "labelFontColor": "#000000",
  "labelBgColor": "#FFD700",
  "labelFontFamily": "system-ui, -apple-system, sans-serif",
  "labelTextCase": "uppercase",
  "labelBold": false,
  "labelItalic": false,
  "panEnabled": true,
  "panSpeed": 1.0,
  "zoomEnabled": true,
  "zoomMax": 1.4,
  "speed": 1,
  "mapFile": "map-1708643520123.png",
  "tlX": 65536.45,
  "tlY": 43210.78,
  "zoom": 10
}
```

**Parameters:**

**Waypoints:**
- `waypoints` (array, required) - Array of waypoint objects (min 2)
  - `lat` (number) - Latitude
  - `lng` (number) - Longitude
  - `label` (string) - Display label (optional)
  - `delayAfter` (number) - Pause duration in frames (default: 0)

**Visual Customization:**
- `planeColor` (string) - Hex color code (default: `#FFFFFF`)
- `lineColor` (string) - Trail color (default: `#FFD700`)
- `planeStyle` (string) - Aircraft type (see [Aircraft Types](#aircraft-types))
- `glowEnabled` (boolean) - Enable plane glow (default: `false`)
- `glowColor` (string) - Glow color (default: `#FFD700`)
- `glowIntensity` (number) - Glow strength 1-5 (default: `1`)
- `trailGlowEnabled` (boolean) - Enable trail glow (default: `true`)
- `trailGlowColor` (string) - Trail glow color (default: `#FFD700`)
- `trailGlowIntensity` (number) - Trail glow strength 0.5-5 (default: `1.5`)

**Label Customization:**
- `labelFontColor` (string) - Text color (default: `#000000`)
- `labelBgColor` (string) - Badge background (default: `#FFD700`)
- `labelFontFamily` (string) - Font family (default: system-ui)
- `labelTextCase` (string) - Text transformation: `none`, `uppercase`, `lowercase` (default: `uppercase`)
- `labelBold` (boolean) - Bold text (default: `false`)
- `labelItalic` (boolean) - Italic text (default: `false`)

**Camera Effects:**
- `panEnabled` (boolean) - Enable camera following (default: `true`)
- `panSpeed` (number) - Pan speed multiplier 0.5-1.5 (default: `1.0`)
- `zoomEnabled` (boolean) - Enable progressive zoom (default: `true`)
- `zoomMax` (number) - Maximum zoom level 1.0-2.0 (default: `1.4`)

**Animation:**
- `speed` (number) - Animation speed: `0.5` (slow), `1` (normal), `2` (fast)

**Map Data:**
- `mapFile` (string, required) - Map filename from snapshot
- `tlX` (number, required) - Top-left X coordinate
- `tlY` (number, required) - Top-left Y coordinate
- `zoom` (number, required) - Zoom level

**Response:**
```json
{
  "jobId": "a1b2c3d4e5f6",
  "queuePosition": 0
}
```

**Response Fields:**
- `jobId` - Unique job identifier for polling
- `queuePosition` - Position in render queue (0 = currently rendering)

---

#### **GET /api/status/:jobId**

Polls render job status.

**URL Parameters:**
- `jobId` (string) - Job ID from render response

**Response (Queued):**
```json
{
  "status": "queued",
  "phase": "Queued — position 2 of 5",
  "percent": 0,
  "queuePosition": 1,
  "queueLength": 5
}
```

**Response (Running):**
```json
{
  "status": "running",
  "phase": "Rendering frames 180 / 360",
  "percent": 55,
  "queuePosition": 0,
  "queueLength": 4
}
```

**Response (Done):**
```json
{
  "status": "done",
  "phase": "Done!",
  "percent": 100,
  "queuePosition": null,
  "queueLength": 3
}
```

**Response (Error):**
```json
{
  "status": "error",
  "phase": "Failed",
  "percent": 0,
  "error": "Render exited with code 1",
  "queuePosition": null,
  "queueLength": 2
}
```

**Status Values:**
- `queued` - Waiting in queue
- `running` - Currently rendering
- `done` - Completed successfully
- `error` - Failed

---

#### **GET /api/download/:jobId**

Downloads finished video file.

**URL Parameters:**
- `jobId` (string) - Job ID from render response

**Response:**
- Success: Binary MP4 file with `Content-Disposition: attachment; filename="flight-path-video.mp4"`
- Error: `404` if job not found or video not ready

**Example:**
```bash
curl -o my-video.mp4 http://localhost:3005/api/download/a1b2c3d4e5f6
```

---

## Frontend Application

### Architecture Overview

The frontend is a **single-page application** (SPA) built with vanilla JavaScript, organized into **4 distinct phases** that guide the user through the video creation workflow.

### Phase System

```javascript
const phases = {
  map: 'Navigate map and capture viewport',
  draw: 'Click waypoints to define route',
  progress: 'Monitor render progress',
  download: 'Preview and download video'
};
```

### State Management

All application state is managed in a global `state` object:

```javascript
const state = {
  phase: 'map',              // Current phase
  mapFile: null,             // Captured map filename
  tlX: null,                 // Top-left X coordinate
  tlY: null,                 // Top-left Y coordinate
  zoom: null,                // Zoom level
  waypoints: [],             // Array of {lat, lng, nx, ny}
  pollTimer: null,           // Status polling interval
  currentJobId: null,        // Active render job
  jobHistory: [],            // Past render jobs
  bgPolls: {},               // Background job polling
  hasPreviewImage: false     // Preview availability flag
};
```

### User Interface Components

#### **1. Topbar**
- Application title and branding
- Phase indicator (dynamic text)
- History button with badge counter
- Responsive layout

#### **2. Map Phase (Leaflet)**
- **Tile Layers:**
  - Satellite: ArcGIS World Imagery + Reference labels
  - OpenStreetMap: Community-maintained street maps
- **Map Style Selector:** Dropdown with 2 options
- **Capture Button:** Large prominent CTA
- **Toolbar Hint:** Contextual help text

#### **3. Draw Phase**
- **Canvas Overlay:** Transparent layer over map/image
- **Coordinates Display:** Live lat/lng on hover
- **Waypoint Chips:** Numbered badges showing added points
- **Toolbar Controls:**
  - Point counter
  - Waypoint list (scrollable)
  - Color pickers (plane, trail)
  - Undo/Clear buttons
  - Settings button
  - Generate button (enabled at 2+ points)

#### **4. Settings Panel**
- **Slide-in Panel:** 300px width, right-side overlay
- **Sections:**
  - Route Labels (departure, destination, styling)
  - Plane Style (dropdown with 15 options)
  - Colors (plane, trail)
  - Glow Effects (toggles, intensity selectors)
  - Animation Speed (3-button selector)
  - Camera Effects (pan/zoom toggles and sliders)

#### **5. Progress Phase**
- **Progress Card:** Centered modal-style display
- **Phase Text:** Dynamic status messages
- **Progress Bar:** Animated width transition
- **Percentage Counter:** Live update
- **Create Another Button:** Background rendering support

#### **6. Download Phase**
- **Video Preview:** HTML5 `<video>` element with controls
- **Download Button:** Large primary CTA
- **Generate Another Button:** Start fresh workflow

#### **7. History Panel**
- **Slide-in Panel:** 320px width, right-side
- **Job Entries:** Card-based list with:
  - Route label
  - Status badge with color coding
  - Progress bar
  - Timestamp
  - Download button (for completed jobs)
- **Auto-refresh:** Updates during active polls

### Coordinate System

The application uses **two coordinate systems**:

1. **Geographic (Lat/Lng)**
   - World Geodetic System (WGS84)
   - User-facing coordinates
   - Stored in waypoints

2. **Pixel (Natural 1920×1080)**
   - Mercator projection
   - Used for video rendering
   - Calculated from lat/lng + map metadata

**Conversion Flow:**
```
User Click (clientX, clientY)
    ↓
Canvas Coordinates (canvasX, canvasY)
    ↓
Natural Pixels (nx, ny) [0-1920, 0-1080]
    ↓
World Pixels (wx, wy) = (tlX + nx, tlY + ny)
    ↓
Geographic (lat, lng) via Inverse Mercator
```

### Event Handling

#### **Map Capture**
```javascript
// Triggered by "Capture This View" button
1. Get Leaflet map center and zoom
2. POST /api/snapshot with {center, zoom, mapStyle}
3. Display loading overlay with spinner
4. On success:
   - Store mapFile, tlX, tlY, zoom in state
   - Load image preview (if available)
   - Initialize draw canvas
   - Switch to draw phase
```

#### **Waypoint Click**
```javascript
// Triggered by canvas click event
1. Get click position relative to canvas
2. Scale to 1920×1080 natural coordinates
3. Calculate world pixels (tlX + nx, tlY + ny)
4. Convert to lat/lng via worldPixelToLngLat()
5. Add {lat, lng, nx, ny} to state.waypoints
6. Redraw canvas with updated path
7. Update waypoint chips in toolbar
```

#### **Video Generation**
```javascript
// Triggered by "Generate Video" button
1. Validate waypoint count (min 2)
2. Build waypoints array with labels
3. POST /api/render with full configuration
4. Store jobId and add to history
5. Switch to progress phase
6. Start polling /api/status every 1200ms
```

#### **Status Polling**
```javascript
// Runs every 1.2 seconds for active job
1. GET /api/status/:jobId
2. Update progress bar and text
3. Update history panel entry
4. If status === 'done':
   - Stop polling
   - Switch to download phase
   - Set video preview source
5. If status === 'error':
   - Stop polling
   - Show error phase
```

### Canvas Drawing System

The draw phase uses **HTML5 Canvas 2D** for path visualization:

```javascript
function redrawCanvas() {
  // 1. Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. Draw dashed path lines
  ctx.beginPath();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  // ... connect waypoints
  ctx.stroke();
  
  // 3. Draw waypoint dots with glow
  waypoints.forEach((wp, i) => {
    // Outer glow ring
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = planeColor + '28'; // 28 = hex alpha
    ctx.fill();
    
    // Inner dot
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = planeColor;
    ctx.fill();
    
    // Number label
    ctx.fillText(i + 1, x, y);
  });
  
  // 4. Draw coordinate labels
  // ... rounded rect with lat/lng text
}
```

### Local Storage

The application persists render history to `localStorage`:

```javascript
// Key: 'fpv2-history'
// Value: JSON array of job objects (max 50)
[
  {
    "jobId": "a1b2c3d4e5f6",
    "label": "London → New York",
    "startedAt": 1708643520000,
    "status": "done",
    "percent": 100
  },
  // ... more jobs
]
```

**Privacy Note:** Data is stored client-side only and never sent to external servers.

---

## Video Rendering Engine

### Remotion Architecture

Remotion is a **React-based video rendering framework** that generates videos by:
1. Rendering React components for each frame
2. Capturing screenshots via headless Chromium
3. Encoding frames to video using FFmpeg

**Configuration:** The project uses `remotion.config.js` to set the public directory for static assets (map images and aircraft SVGs), configure timeout limits, and optimize rendering performance.

#### Remotion Configuration File

The [remotion.config.js](remotion.config.js) file ensures proper static file serving:

```javascript
const {Config} = require('@remotion/cli/config');

// Configure public directory (where map images and aircraft SVGs are stored)
Config.setPublicDir('./public');

// Enable image compression for better performance
Config.setImageFormat('png');

// Set concurrency (adjust based on server resources)
Config.setConcurrency(1);

// Increase timeout for long renders
Config.setTimeoutInMilliseconds(300000); // 5 minutes
```

**Why this is important:**
- **Docker/Production:** Remotion spawns its own server (port 3000) separate from Express (port 3005)
- **Static files:** `staticFile("map-123.png")` looks in the configured public directory
- **Path resolution:** Without this config, Remotion can't find map images, causing 404 errors

### Composition Structure

The main video composition is in [src/Composition.tsx](src/Composition.tsx):

```tsx
export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Calculate flight progress (0 to N-1)
  const fp = getFlightProgress(frame);
  
  // ... path interpolation, camera effects, rendering
  
  return (
    <AbsoluteFill>
      {/* Map background */}
      <Img src={staticFile(mapConfig.mapFile)} />
      
      {/* SVG overlay with path and plane */}
      <svg>
        {/* Trail paths */}
        {/* Route labels */}
        {/* Aircraft */}
      </svg>
    </AbsoluteFill>
  );
};
```

### Frame Timeline

Every render has a consistent timeline structure:

```
Frame 0-14:    HOLD_START (0.5s)
               - Plane stationary at first waypoint
               - Labels fade in

Frame 15-...:  FLIGHT SEGMENTS
               - Plane moves along Bezier curves
               - Variable duration per segment

Frame ...-...: INTERMEDIATE DELAYS
               - Plane pauses at waypoints
               - Only if delayAfter > 0

Frame ...-30:  HOLD_END (1.0s)
               - Plane stationary at last waypoint
               - Final fade effects
```

**Total Duration:**
```javascript
duration = HOLD_START + 
           sum(segment.frames) + 
           sum(waypoint.delayAfter) + 
           HOLD_END
```

### Path Animation Algorithm

#### **1. Waypoint Simplification (RDP)**

**Ramer-Douglas-Peucker** removes unnecessary intermediate points:

```javascript
function rdpSimplify(points, epsilon = 6) {
  // If ≤2 points, cannot simplify
  if (points.length <= 2) return points;
  
  // Find point farthest from line (first → last)
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToLineDist(points[i], points[0], points[points.length-1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  
  // If farthest point is within epsilon, remove all middle points
  if (maxDist <= epsilon) {
    return [points[0], points[points.length - 1]];
  }
  
  // Otherwise, recursively simplify both halves
  const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
  const right = rdpSimplify(points.slice(maxIdx), epsilon);
  
  return [...left.slice(0, -1), ...right];
}
```

**Effect:** Collapses tight zigzags and near-collinear points, reducing from 20+ clicks to 5-10 keyframes.

#### **2. Gaussian Smoothing**

Applies **weighted averaging** to remove jitter:

```javascript
function gaussianSmooth(points, iterations = 4) {
  let current = points.slice();
  
  for (let iter = 0; iter < iterations; iter++) {
    const next = [current[0]]; // Keep first point fixed
    
    for (let i = 1; i < current.length - 1; i++) {
      // Weighted average: 25% prev + 50% current + 25% next
      next.push({
        x: current[i-1].x * 0.25 + current[i].x * 0.5 + current[i+1].x * 0.25,
        y: current[i-1].y * 0.25 + current[i].y * 0.5 + current[i+1].y * 0.25,
        label: current[i].label,
        delayAfter: current[i].delayAfter
      });
    }
    
    next.push(current[current.length - 1]); // Keep last point fixed
    current = next;
  }
  
  return current;
}
```

**Effect:** Smooths hand-drawn paths while preserving start/end positions exactly.

#### **3. Catmull-Rom Tangent Calculation**

Computes smooth direction vectors at each waypoint:

```javascript
function calculateTangents(points) {
  return points.map((pt, i) => {
    // Edge cases: first and last points
    if (i === 0) {
      return { x: points[1].x - points[0].x, y: points[1].y - points[0].y };
    }
    if (i === points.length - 1) {
      return { x: points[i].x - points[i-1].x, y: points[i].y - points[i-1].y };
    }
    
    // Interior points: average of neighboring vectors
    const prev = points[i - 1];
    const next = points[i + 1];
    return {
      x: (next.x - prev.x) / 2,
      y: (next.y - prev.y) / 2
    };
  });
}
```

**Effect:** Ensures smooth transitions through waypoints without sharp corners.

#### **4. Cubic Bezier Segment Generation**

For each segment between consecutive waypoints:

```javascript
const segments = [];
for (let i = 0; i < waypoints.length - 1; i++) {
  const start = waypoints[i];
  const end = waypoints[i + 1];
  const tangentStart = tangents[i];
  const tangentEnd = tangents[i + 1];
  
  // Control points at 1/3 distance along tangent
  const c1 = {
    x: start.x + tangentStart.x / 3,
    y: start.y + tangentStart.y / 3
  };
  const c2 = {
    x: end.x - tangentEnd.x / 3,
    y: end.y - tangentEnd.y / 3
  };
  
  // Calculate duration based on Euclidean distance
  const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const frames = Math.max(
    MIN_FRAMES,  // 18 frames = 0.6s
    Math.min(
      MAX_FRAMES,  // 360 frames = 12s
      Math.round(distance / (PIXELS_PER_SECOND * speed) * FPS)
    )
  );
  
  segments.push({ c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, frames });
}
```

**Effect:** Creates smooth, professionally curved paths with realistic timing.

#### **5. Frame Interpolation**

During rendering, each frame calculates plane position using **cubic Bezier formula**:

```javascript
function cubicBezierPoint(sx, sy, c1x, c1y, c2x, c2y, ex, ey, t) {
  const mt = 1 - t;  // Complement of t
  
  // Cubic polynomial in Bernstein form
  return [
    mt*mt*mt*sx + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*ex,
    mt*mt*mt*sy + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*ey
  ];
}
```

Where:
- `s` = start point
- `c1` = first control point
- `c2` = second control point
- `e` = end point
- `t` = interpolation parameter (0.0 to 1.0)

**Rotation Calculation:**

```javascript
function cubicBezierAngleDeg(sx, sy, c1x, c1y, c2x, c2y, ex, ey, t) {
  const mt = 1 - t;
  
  // Derivative of cubic Bezier (tangent vector)
  const dx = 3*mt*mt*(c1x-sx) + 6*mt*t*(c2x-c1x) + 3*t*t*(ex-c2x);
  const dy = 3*mt*mt*(c1y-sy) + 6*mt*t*(c2y-c1y) + 3*t*t*(ey-c2y);
  
  // Convert to degrees (+ 90° to point nose forward)
  return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
}
```

### Camera System

#### **Zoom Effect**

Progressive zoom over video duration:

```javascript
const camZoom = zoomEnabled
  ? interpolate(frame, [0, durationInFrames], [1.0, zoomMax], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    })
  : 1.0;
```

**Interpolation:** Linear from 1.0× to zoomMax× (typically 1.4×)

#### **Pan Effect**

Camera follows plane with configurable looseness:

```javascript
// Calculate desired center position (plane at center of screen)
const targetX = 960 - planeX * camZoom;
const targetY = 540 - planeY * camZoom;

// Apply pan speed multiplier (< 1.0 = looser follow)
const rawTx = panEnabled ? targetX * panSpeed : 0;
const rawTy = panEnabled ? targetY * panSpeed : 0;

// Clamp to prevent showing outside map bounds
const tx = Math.max(1920 * (1 - camZoom), Math.min(0, rawTx));
const ty = Math.max(1080 * (1 - camZoom), Math.min(0, rawTy));
```

**Pan Speed Examples:**
- `1.0` - Plane locked at center
- `0.8` - Gentle follow with slight lag
- `0.5` - Loose follow, plane can move within frame

#### **Transform Application**

```tsx
<AbsoluteFill
  style={{
    transform: `translate(${tx}px, ${ty}px) scale(${camZoom})`,
    transformOrigin: '0 0'
  }}
>
  {/* Map and overlays */}
</AbsoluteFill>
```

### Aircraft Rendering

#### **Default Plane (SVG Path)**

Generic jet silhouette defined as SVG path:

```javascript
const DEFAULT_PLANE_PATH = `
  M 0,-42 C 6,-37 8,-22 8,-8 L 46,18 L 46,26 L 8,10
  L 7,34 L 22,40 L 22,46 L 0,42
  L -22,46 L -22,40 L -7,34 L -8,10
  L -46,26 L -46,18 L -8,-8 C -8,-22 -6,-37 0,-42 Z
`;
```

**Rendering:**
```tsx
<g transform={`translate(${planeX},${planeY}) rotate(${planeRotation}) scale(${PLANE_SIZE/46})`}>
  <path d={DEFAULT_PLANE_PATH} fill={planeColor} />
</g>
```

#### **Real Aircraft (SVG Images)**

14 aircraft silhouettes stored in `public/aircraft/`:
- Airbus A300, A320, A380
- Boeing 707, 727, 747, 777, 787
- Douglas DC-3, DC-9, DC-10, MD-11
- Cessna Citation, Learjet 45

**Recoloring via CSS Filter:**

```tsx
<defs>
  <filter id="ac-recolor">
    <feFlood floodColor={planeColor} result="clr"/>
    <feComposite in="clr" in2="SourceGraphic" operator="in"/>
  </filter>
</defs>

<image
  href={staticFile(`aircraft/${planeStyle}.svg`)}
  x={-width/2} y={-height/2}
  width={width} height={height}
  filter="url(#ac-recolor)"
/>
```

**Effect:** Black silhouette → Any color via SVG filter

### Glow Effects

#### **Plane Glow (Default Aircraft)**

**Stroke-based approach** - multiple concentric outlines:

```tsx
<PlaneGlow
  cx={planeX} cy={planeY} rot={planeRotation}
  planePath={DEFAULT_PLANE_PATH}
  color={glowColor}
  baseScale={PLANE_SIZE / 46}
  intensity={glowIntensity}
/>
```

**Implementation:**
```tsx
const rings = [
  { worldPx: 2,   opacity: 0.70 },
  { worldPx: 5,   opacity: 0.55 },
  { worldPx: 10,  opacity: 0.40 },
  { worldPx: 18,  opacity: 0.28 },
  { worldPx: 30,  opacity: 0.18 },
  { worldPx: 48,  opacity: 0.11 },
  { worldPx: 72,  opacity: 0.06 },
  { worldPx: 104, opacity: 0.03 }
];

// Render (intensity × 3) to (intensity × 8) rings
const activeCount = Math.min(8, Math.round(3 + intensity));

rings.slice(0, activeCount).map(({ worldPx, opacity }) => (
  <path
    d={planePath}
    fill="none"
    stroke={color}
    strokeWidth={worldPx * intensity / baseScale}
    opacity={opacity * (0.7 + intensity * 0.3)}
  />
));
```

**Effect:** Distance-from-edge glow that follows plane shape perfectly

#### **Plane Glow (Real Aircraft)**

**Gaussian blur approach:**

```tsx
<defs>
  <filter id="ac-glow">
    <feFlood floodColor={glowColor} result="clr"/>
    <feComposite in="clr" in2="SourceGraphic" operator="in" result="tinted"/>
    <feGaussianBlur in="tinted" stdDeviation={10 * intensity} result="b1"/>
    <feGaussianBlur in="tinted" stdDeviation={5  * intensity} result="b2"/>
    <feGaussianBlur in="tinted" stdDeviation={20 * intensity} result="b3"/>
    <feMerge>
      <feMergeNode in="b3"/>
      <feMergeNode in="b1"/>
      <feMergeNode in="b2"/>
    </feMerge>
  </filter>
</defs>

<image filter="url(#ac-glow)" />
```

**Effect:** Multi-layer blur creating soft halo

#### **Trail Glow**

Similar Gaussian blur on path strokes:

```tsx
<filter id="trail-glow">
  <feFlood floodColor={trailGlowColor} result="clr"/>
  <feComposite in="clr" in2="SourceGraphic" operator="in" result="tinted"/>
  <feGaussianBlur in="tinted" stdDeviation={8  * intensity} result="b1"/>
  <feGaussianBlur in="tinted" stdDeviation={16 * intensity} result="b2"/>
  <feGaussianBlur in="tinted" stdDeviation={24 * intensity} result="b3"/>
  <feMerge>
    <feMergeNode in="b3"/>
    <feMergeNode in="b2"/>
    <feMergeNode in="b1"/>
  </feMerge>
</filter>

<path d={segmentPath} stroke={trailGlowColor} strokeWidth={4} filter="url(#trail-glow)" />
```

### Route Labels

Animated badges that appear at start/end waypoints:

```tsx
<RouteLabel
  x={waypointX} y={waypointY}
  text={label}
  opacity={fadeInProgress}
  fontColor={labelFontColor}
  bgColor={labelBgColor}
  fontFamily={labelFontFamily}
  textCase={labelTextCase}
  bold={labelBold}
  italic={labelItalic}
/>
```

**Component Structure:**
```tsx
<g opacity={opacity}>
  {/* Connector dot */}
  <circle cx={x} cy={y} r={5} fill={fontColor} />
  <line x1={x} y1={y-6} x2={x} y2={badgeY} stroke={fontColor} />
  
  {/* Background badge */}
  <rect x={badgeX} y={badgeY} width={width} height={30} rx={6} fill={bgColor} />
  
  {/* Text */}
  <text
    x={x} y={badgeY+20}
    textAnchor="middle"
    fill={fontColor}
    fontSize={15}
    fontFamily={fontFamily}
    fontWeight={bold ? '800' : '600'}
    fontStyle={italic ? 'italic' : 'normal'}
  >
    {transformedText}
  </text>
</g>
```

**Fade-in Animation:**
- Start label: Fades in during first 20 frames (HOLD_START to HOLD_START+20)
- End label: Fades in when last segment begins

---

## Map Generation System

### Tile-Based Rendering

The map generation system fetches and stitches together individual **256×256 pixel tiles** to create the final 1920×1080 background image.

### Tile Providers

#### **ArcGIS World Imagery (Satellite)**

**Base Layer:**
```
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

**Label Overlay:**
```
https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}
```

**Features:**
- High-resolution satellite imagery
- Global coverage from various providers (Maxar, DigitalGlobe, etc.)
- Updated regularly
- Place name labels as separate layer

#### **OpenStreetMap**

```
https://a.tile.openstreetmap.org/{z}/{x}/{y}.png
```

**Features:**
- Community-maintained street maps
- Excellent urban detail
- Free and open data
- Subdomains: a, b, c (for load balancing)

#### **CartoDB Styles**

**Voyager:**
```
https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png
```

**Dark:**
```
https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
```

**Light:**
```
https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png
```

### Tile Fetching Algorithm

```javascript
async function fetchTile(z, x, y, mapStyle = 'satellite') {
  // 1. Handle tile wrapping (world repeats horizontally)
  const maxTile = Math.pow(2, z);
  const tx = ((x % maxTile) + maxTile) % maxTile;
  const ty = Math.max(0, Math.min(maxTile - 1, y));
  
  // 2. Get URL template for style
  const urls = TILE_URLS[mapStyle];
  const baseUrl = urls.base(z, tx, ty);
  const labelUrl = urls.labels ? urls.labels(z, tx, ty) : null;
  
  // 3. Fetch base + optional labels
  try {
    if (labelUrl) {
      const [base, labels] = await Promise.all([
        get(baseUrl),
        get(labelUrl).catch(() => null)
      ]);
      return { sat: base, lbl: labels };
    } else {
      const base = await get(baseUrl);
      return { sat: base, lbl: null };
    }
  } catch {
    return null; // Tile unavailable
  }
}
```

### Tile Stitching

Uses **Sharp** (libvips-based image processing library) for high-performance composition:

```javascript
async function stitchTiles(tlX, tlY, zoom, mapStyle, onProgress) {
  // 1. Calculate tile range
  const tileX0 = Math.floor(tlX / TILE_SIZE);
  const tileY0 = Math.floor(tlY / TILE_SIZE);
  const tileX1 = Math.ceil((tlX + OUT_W) / TILE_SIZE);
  const tileY1 = Math.ceil((tlY + OUT_H) / TILE_SIZE);
  
  // 2. Fetch all tiles
  const composites = [];
  const labelComposites = [];
  
  for (let ty = tileY0; ty < tileY1; ty++) {
    for (let tx = tileX0; tx < tileX1; tx++) {
      const tile = await fetchTile(zoom, tx, ty, mapStyle);
      const left = Math.round(tx * TILE_SIZE - tlX);
      const top = Math.round(ty * TILE_SIZE - tlY);
      
      if (tile) {
        if (tile.sat) composites.push({ input: tile.sat, left, top });
        if (tile.lbl) labelComposites.push({ input: tile.lbl, left, top });
      }
      
      onProgress({ /* ... */ });
    }
  }
  
  // 3. Create base canvas (satellite layer)
  const satBuf = await sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 3,
      background: { r: 10, g: 10, b: 20 }
    }
  })
    .composite(composites)
    .png()
    .toBuffer();
  
  // 4. Composite labels on top
  const filename = `map-${Date.now()}.png`;
  await sharp(satBuf)
    .composite(labelComposites)
    .png()
    .toFile(path.join('public', filename));
  
  return filename;
}
```

**Performance:**
- Sharp uses libvips (2-10× faster than ImageMagick)
- Parallel tile fetching (up to 6 concurrent)
- Efficient buffer operations (no disk I/O until final save)
- Typical stitch time: 2-5 seconds for 20-40 tiles

### Mercator Projection

All coordinate conversions use **Web Mercator** (EPSG:3857):

#### **Forward Projection (Lat/Lng → Pixels)**

```javascript
function lngLatToWorldPixel(lng, lat, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  
  // Longitude: linear mapping
  const x = ((lng + 180) / 360) * n;
  
  // Latitude: inverse Gudermannian function
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  
  return { x, y };
}
```

**Math Explained:**
- **World size at zoom Z:** `256 × 2^Z` pixels
- **Longitude:** Direct proportion (−180° to +180° maps to 0 to width)
- **Latitude:** Logarithmic compression (poles pushed to infinity)

#### **Inverse Projection (Pixels → Lat/Lng)**

```javascript
function worldPixelToLngLat(wx, wy, zoom) {
  const n = Math.pow(2, zoom) * TILE_SIZE;
  
  // Longitude: inverse linear
  const lng = (wx / n) * 360 - 180;
  
  // Latitude: Gudermannian function
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * wy / n)));
  const lat = (latRad * 180) / Math.PI;
  
  return { lat, lng };
}
```

### Automatic Zoom Calculation

When using the legacy CLI tool, zoom level is auto-calculated to fit all waypoints:

```javascript
function findBestZoom(minLat, minLng, maxLat, maxLng) {
  const PADDING = 0.22; // 22% padding on each side
  
  // Try each zoom level from 16 down to 1
  for (let z = 16; z >= 1; z--) {
    const p1 = lngLatToWorldPixel(minLng, minLat, z);
    const p2 = lngLatToWorldPixel(maxLng, maxLat, z);
    
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    
    // Check if route fits within padded viewport
    if (dx < OUT_W * (1 - 2 * PADDING) && dy < OUT_H * (1 - 2 * PADDING)) {
      return z;
    }
  }
  
  return 2; // Fallback (world view)
}
```

**Effect:** Automatically selects highest zoom that shows entire route with margins.

---

## Customization Options

### Aircraft Types

| Value | Name | Description |
|-------|------|-------------|
| `default` | Generic Jet | Simple stylized aircraft |
| `Airbus_A300` | Airbus A300 | Wide-body twin-engine jet |
| `Airbus_A320` | Airbus A320 | Narrow-body twin-engine jet |
| `Airbus_A380` | Airbus A380 | Double-deck wide-body (world's largest) |
| `Boeing_707` | Boeing 707 | First successful commercial jetliner |
| `Boeing_727` | Boeing 727 | Three-engine narrow-body |
| `Boeing_747` | Boeing 747 | "Queen of the Skies" jumbo jet |
| `Boeing_777` | Boeing 777 | Long-range wide-body twin-engine |
| `Boeing_787` | Boeing 787 Dreamliner | Modern composite wide-body |
| `Cessna_Citation` | Cessna Citation | Small business jet |
| `Douglas_DC-10` | Douglas DC-10 | Three-engine wide-body |
| `Douglas_DC-3` | Douglas DC-3 | Historic propeller aircraft |
| `Douglas_DC-9` | Douglas DC-9 | Twin-engine narrow-body |
| `Douglas_MD-11` | Douglas MD-11 | Three-engine wide-body |
| `Learjet_45` | Learjet 45 | Mid-size business jet |

### Color Presets

While any hex color is supported, here are recommended presets:

**Plane Colors:**
- `#FFFFFF` - Classic white (default)
- `#FFD700` - Gold/yellow
- `#FF4444` - Red
- `#4444FF` - Blue
- `#00FF00` - Green
- `#FF00FF` - Magenta

**Trail Colors:**
- `#FFD700` - Gold (default)
- `#00FFFF` - Cyan
- `#FF1493` - Pink
- `#32CD32` - Lime green
- `#FFA500` - Orange

### Glow Intensity Levels

**Plane Glow:**
- `1` - Subtle outline (4 rings)
- `1.5` - Soft glow (5 rings)
- `2` - Medium glow (6 rings)
- `2.5` - Strong glow (7 rings)
- `3+` - Intense glow (8 rings)

**Trail Glow:**
- `0.5` - Barely visible
- `1` - Subtle
- `1.5` - Moderate (default)
- `2` - Strong
- `3+` - Intense

### Font Families

**Available Options:**
- `system-ui, -apple-system, sans-serif` - Native system font (default)
- `Georgia, serif` - Classic serif
- `'Courier New', monospace` - Monospace/typewriter
- `Impact, 'Arial Narrow', sans-serif` - Bold impact style

### Speed Multipliers

| Value | Label | Effect | Use Case |
|-------|-------|--------|----------|
| `0.5` | 🐢 Slow | 2× frames | Long scenic routes |
| `1` | Normal | Baseline | Most routes (default) |
| `2` | ⚡ Fast | 0.5× frames | Quick previews, short hops |

**Formula:** `frames = distance / (180 * speed) * 30`

### Camera Pan Speeds

| Value | Effect | Description |
|-------|--------|-------------|
| `0.5` | Loose follow | Plane can move within 50% of frame |
| `0.75` | Moderate follow | Slight lag behind plane |
| `1.0` | Locked center | Plane always at exact center (default) |
| `1.25` | Tight lead | Camera leads plane slightly |
| `1.5` | Aggressive lead | Strong anticipatory movement |

### Zoom Ranges

| zoomMax | Effect |
|---------|--------|
| `1.0` | No zoom (static) |
| `1.2` | Subtle zoom |
| `1.4` | Moderate zoom (default) |
| `1.6` | Strong zoom |
| `2.0` | Dramatic zoom |

**Note:** Zooming beyond 1.6× may cause black edges if plane travels to map boundaries.

---

## Deployment Guide

### Option 1: Railway (Recommended for Beginners)

**Why Railway?**
- No timeout limits (Vercel free tier = 10s)
- Free tier: 500 hours/month
- Automatic GitHub integration
- Perfect for long-running Remotion renders

**Steps:**

1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Project**
   - New Project → Deploy from GitHub repo
   - Select `flight-path-video` repository
   - Railway auto-detects Node.js

3. **Environment Variables** (None required by default)
   - Optional: `PORT=3005` (Railway auto-assigns)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Copy Railway URL (e.g., `flight-path-video-production.up.railway.app`)

5. **Access Application**
   - Open Railway URL in browser
   - Start creating videos!

**Cost:** Free tier (500 hours/month) = ~600 videos

---

### Option 2: Docker (Local or Cloud)

**Docker Compose (Recommended):**

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Manual Docker:**

```bash
# Build image
docker build -t flight-path-video .

# Run container
docker run -d \
  --name flight-path-video \
  -p 3005:3005 \
  -v $(pwd)/out:/app/out \
  -v $(pwd)/public:/app/public \
  flight-path-video

# View logs
docker logs -f flight-path-video

# Stop
docker stop flight-path-video
```

**Dockerfile Explained:**
```dockerfile
FROM node:20-slim
# Start with lightweight Node.js image

RUN apt-get update && apt-get install -y chromium ...
# Install Chromium + dependencies for Remotion

COPY package*.json ./
RUN npm install
# Install Node modules

COPY . .
# Copy application code

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Tell Remotion where to find Chromium

CMD ["npm", "run", "server"]
# Start Express server
```

---

### Option 3: Ubuntu VPS (Full Control)

**Prerequisites:**
- Ubuntu 20.04+ VPS (2GB RAM minimum)
- Root or sudo access
- Domain name (optional)

#### **Step 1: Install Node.js**

```bash
# SSH into server
ssh user@your-server-ip

# Add Node.js 20.x repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v20.x
npm --version
```

#### **Step 2: Clone and Setup**

```bash
# Clone repository
git clone https://github.com/yourusername/flight-path-video.git
cd flight-path-video

# Install dependencies
npm install

# Test server
npm run server
# Press Ctrl+C to stop test
```

#### **Step 3: Install PM2 Process Manager**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name flight-path-video

# Configure auto-start on reboot
pm2 startup
# Follow the command it prints

pm2 save

# Check status
pm2 status

# View logs
pm2 logs flight-path-video

# Restart (after code updates)
pm2 restart flight-path-video
```

#### **Step 4: Setup Nginx Reverse Proxy**

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create configuration file
sudo nano /etc/nginx/sites-available/flight-path-video
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or server IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
```

**Enable site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/flight-path-video /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

#### **Step 5: Setup SSL (Optional but Recommended)**

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

#### **Step 6: Configure Firewall**

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH (if not already allowed)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

#### **Maintenance Commands**

```bash
# Update application
cd flight-path-video
git pull
npm install
pm2 restart flight-path-video

# View logs
pm2 logs flight-path-video --lines 100

# Monitor resources
pm2 monit

# Clear old videos
rm -rf out/*.mp4

# Clear old maps
rm -rf public/map-*.png
```

---

### Option 4: Vercel (Frontend Only)

**⚠️ Warning:** Vercel has 10-second timeout on free tier, so renders will fail. Use Railway for `/api/render` endpoint.

**Hybrid Architecture:**
```
Vercel (frontend) → Railway (render API)
```

**Steps:**

1. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Update Frontend**
   Edit `web/index.html` line ~1340:
   ```javascript
   const renderUrl = 'https://your-app.railway.app/api/render';
   ```

3. **Deploy Railway**
   Follow Option 1 above

**Result:** Fast static hosting + unlimited render backend

---

## File Structure

```
flight-path-video/
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript config for Composition
├── remotion.config.js          # Remotion configuration (public dir, timeouts)
├── server.js                   # Express API server
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Docker orchestration
├── nixpacks.toml              # Railway deployment config
├── .gitignore                 # Git ignore rules
│
├── src/                        # Video composition (Remotion)
│   ├── index.ts               # Entry point (registers Root)
│   ├── Root.tsx               # Remotion root component
│   ├── Composition.tsx        # Main video composition logic
│   └── mapConfig.json         # Dynamic config (gitignored)
│
├── scripts/                    # Map generation utilities
│   ├── map-generator.js       # Tile fetching and stitching
│   ├── config-generator.js    # Serverless-safe config builder
│   └── fetch-map.js           # CLI tool for geocoded routes
│
├── web/                        # Frontend SPA
│   └── index.html             # Complete single-page app
│
├── public/                     # Static assets
│   ├── aircraft/              # 14 aircraft SVG silhouettes
│   │   ├── Airbus_A300.svg
│   │   ├── Airbus_A320.svg
│   │   └── ...
│   └── *.png                  # Generated map images (gitignored)
│
├── out/                        # Rendered videos (gitignored)
│   └── video-*.mp4
│
├── aircraft_silhouettes/       # Aircraft showcase
│   ├── showcase.html          # Visual gallery of all aircraft
│   └── *.svg                  # Same SVGs as public/aircraft/
│
└── docs/                       # Documentation
    ├── RAILWAY_DEPLOY.md      # Railway deployment guide
    └── DEPLOY_OWN_SERVER.md   # VPS deployment guide
```

---

## Algorithm Deep Dive

### Mercator Projection Mathematics

#### **Why Mercator?**

Web Mercator (EPSG:3857) is the de facto standard for web maps because:
1. **Angle preservation** - Compass bearings are straight lines
2. **Simple implementation** - Closed-form formulas
3. **Tile compatibility** - All providers use it
4. **Zoom efficiency** - Integer zoom levels = power-of-2 scale factors

#### **Forward Projection Derivation**

Given latitude φ and longitude λ:

**Longitude (trivial):**
```
x = R × (λ - λ₀)
```
Where R = radius, λ₀ = central meridian (0°)

**Latitude (complex):**

The Mercator projection maps latitude to Y using the **Gudermannian function**:

```
y = R × ln(tan(π/4 + φ/2))
```

Which can also be written as:
```
y = R × ln(tan(φ) + sec(φ))
```

Or using hyperbolic functions:
```
y = R × arctanh(sin(φ))
```

**In code (normalized to pixel space):**
```javascript
const n = Math.pow(2, zoom) * 256;  // World size in pixels
const x = ((lng + 180) / 360) * n;
const latRad = lat * Math.PI / 180;
const y = ((1 - Math.log(Math.tan(latRad) + 1/Math.cos(latRad)) / Math.PI) / 2) * n;
```

#### **Inverse Projection**

Given world pixel (x, y), recover (lat, lng):

**Longitude:**
```javascript
lng = (x / n) * 360 - 180;
```

**Latitude:**

We need to invert y = R × ln(tan(φ) + sec(φ))

Using the identity sinh(y/R) = tan(φ):
```javascript
const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
const lat = latRad * 180 / Math.PI;
```

#### **Properties**

- **Scale factor at equator:** k₀ = 1 (true to scale)
- **Scale factor at latitude φ:** k = sec(φ) = 1/cos(φ)
- **Maximum latitude:** ~85.05° (poles at infinity)
- **Area distortion:** Increases toward poles (Greenland looks huge)

### Bezier Curve Mathematics

#### **Cubic Bezier Definition**

A cubic Bezier curve is defined by 4 control points:
- P₀ = start point
- P₁ = first control point
- P₂ = second control point  
- P₃ = end point

**Parametric Equation (t ∈ [0,1]):**

```
B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
```

**Bernstein Polynomial Form:**
```
B(t) = Σ bᵢ,ₙ(t)Pᵢ
```

Where bᵢ,₃(t) are the Bernstein basis polynomials of degree 3.

#### **First Derivative (Tangent)**

```
B'(t) = 3(1-t)²(P₁ - P₀) + 6(1-t)t(P₂ - P₁) + 3t²(P₃ - P₂)
```

This gives the tangent vector at parameter t, which we use for rotation:

```javascript
const dx = 3*mt*mt*(c1x-sx) + 6*mt*t*(c2x-c1x) + 3*t*t*(ex-c2x);
const dy = 3*mt*mt*(c1y-sy) + 6*mt*t*(c2y-c1y) + 3*t*t*(ey-c2y);
const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
```

#### **Catmull-Rom to Bezier Conversion**

Catmull-Rom splines pass through all control points, while cubic Beziers don't. To convert:

Given waypoints P₀, P₁, P₂, P₃ with tangent at P₁:
```
T₁ = (P₂ - P₀) / 2
```

The Bezier control points for segment P₁ → P₂ are:
```
C₁ = P₁ + T₁ / 3
C₂ = P₂ - T₂ / 3
```

**In code:**
```javascript
// Calculate tangent at each point
const tangent = {
  x: (nextPoint.x - prevPoint.x) / 2,
  y: (nextPoint.y - prevPoint.y) / 2
};

// Derive control points
const c1 = {
  x: startPoint.x + tangent.x / 3,
  y: startPoint.y + tangent.y / 3
};
const c2 = {
  x: endPoint.x - nextTangent.x / 3,
  y: endPoint.y - nextTangent.y / 3
};
```

**Result:** Smooth curve passing through all waypoints with continuous first derivatives.

### Ramer-Douglas-Peucker Algorithm

**Purpose:** Simplify polyline by removing points that don't significantly affect shape.

**Algorithm:**
1. Draw line from first to last point
2. Find point farthest from this line
3. If distance > ε (epsilon), split at that point and recurse
4. If distance ≤ ε, keep only endpoints

**Pseudocode:**
```
function RDP(points[], epsilon):
    if len(points) < 3:
        return points
    
    # Find farthest point from line (first → last)
    maxDist = 0
    maxIdx = 0
    for i = 1 to len(points) - 2:
        dist = perpendicularDistance(points[i], points[0], points[-1])
        if dist > maxDist:
            maxDist = dist
            maxIdx = i
    
    # Decide: keep or remove
    if maxDist > epsilon:
        # Split and recurse
        left = RDP(points[0..maxIdx], epsilon)
        right = RDP(points[maxIdx..-1], epsilon)
        return concat(left[0:-1], right)
    else:
        # Remove all intermediate points
        return [points[0], points[-1]]
```

**Complexity:** O(n²) worst case, O(n log n) average

**Effect on flight paths:**
- Input: 20+ clicked waypoints with small jitter
- Output: 5-10 essential keyframes
- Epsilon = 6 pixels preserves shape while reducing noise

### Gaussian Smoothing

**Purpose:** Remove high-frequency jitter while preserving overall shape.

**1D Gaussian Kernel (σ = 1):**
```
weights = [0.25, 0.5, 0.25]
```

For point i:
```
smoothed[i] = 0.25 × points[i-1] + 0.5 × points[i] + 0.25 × points[i+1]
```

**2D Application (X and Y independently):**
```javascript
for (let iter = 0; iter < 4; iter++) {
  for (let i = 1; i < points.length - 1; i++) {
    newPoints[i].x = 0.25 * cur[i-1].x + 0.5 * cur[i].x + 0.25 * cur[i+1].x;
    newPoints[i].y = 0.25 * cur[i-1].y + 0.5 * cur[i].y + 0.25 * cur[i+1].y;
  }
  cur = newPoints;
}
```

**Why 4 iterations?**
- 1 pass: Subtle smoothing (σ_eff ≈ 1.0)
- 2 passes: Moderate smoothing (σ_eff ≈ 1.4)
- 4 passes: Strong smoothing (σ_eff ≈ 2.0)
- 8+ passes: Over-smoothing (loses detail)

**Tradeoff:** More iterations = smoother but less faithful to original path.

---

## Performance Optimization

### Render Speed

**Factors affecting render time:**

1. **Video Duration**
   - Base: ~60 frames (2 seconds): 10-15 seconds render
   - Long: ~600 frames (20 seconds): 90-120 seconds render
   - Formula: ~6 frames/second render speed

2. **Frame Complexity**
   - Simple (default plane, no glow): Baseline
   - Real aircraft: +10% render time
   - Plane glow enabled: +15% render time
   - Trail glow enabled: +20% render time
   - Both glows: +35% render time

3. **Resolution**
   - Hardcoded 1920×1080 (optimal for H.264)

**Optimization Tips:**
- Use default plane for fastest renders
- Disable glows for quick previews
- Reduce waypoints after simplification
- Lower animation speed for shorter videos

### Memory Usage

**Server Memory Requirements:**
- Base process: ~200 MB
- Per render job:
  - Chromium instance: ~300-500 MB
  - Sharp image processing: ~50-100 MB
  - FFmpeg encoding: ~100-200 MB
- Queue: 1 concurrent render at a time (prevents OOM)

**Recommended Specs:**
- Development: 2 GB RAM minimum
- Production (light use): 2 GB RAM
- Production (heavy use): 4 GB+ RAM

### Disk Usage

**Temporary Files:**
- Map images: ~1-5 MB each (auto-cleaned on restart)
- Video outputs: ~5-50 MB each (varies by duration)
- Remotion cache: ~50-100 MB

**Cleanup Strategy:**
```bash
# Clean old maps (keep only from current session)
rm -f public/map-*.png

# Clean old videos older than 24 hours
find out/ -name "video-*.mp4" -mtime +1 -delete
```

### Network Bandwidth

**Tile Fetching:**
- Average tile: 15-50 KB (JPEG compressed)
- Tiles per snapshot: 20-40 tiles
- Total download: 0.5-2 MB per snapshot

**Optimization:**
- Tiles cached by providers' CDN
- Parallel fetching (6 concurrent)
- HTTPS keep-alive reuses connections

### Remotion Render Optimization

**CPU Usage:**
- Chromium rendering: Single-threaded per frame
- Multiple processes for different frames
- Recommended: 2-4 CPU cores

**Concurrency Settings:**

Default (in Remotion):
```bash
npx remotion render --concurrency=1 --config=remotion.config.js
```

High-performance server:
```bash
npx remotion render --concurrency=4 --config=remotion.config.js
```

**Note:** Higher concurrency = faster render but more RAM. The `--config` flag ensures Remotion uses the correct public directory and timeout settings.

---

## Troubleshooting

### Common Issues

#### **1. Port Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3005
```

**Solution:**
```bash
# Find process using port 3005
lsof -i :3005

# Kill process (use PID from above)
kill -9 <PID>

# Or change port in server.js / env variable
PORT=3006 npm run server
```

#### **2. Chromium Not Found**

**Error:**
```
Error: Could not find Chrome (ver. XXX)
```

**Solution (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

**Solution (macOS):**
```bash
brew install chromium
```

**Solution (Docker):**
Already included in Dockerfile - rebuild image:
```bash
docker-compose build --no-cache
```

#### **3. Render Timeout**

**Error:**
```
Render exited with code 1. Process killed
```

**Causes:**
- Out of memory (OOM)
- Chromium crash
- Filesystem permissions

**Solutions:**
1. **Check memory:**
   ```bash
   free -h  # Linux
   top      # Check node process
   ```

2. **Increase Node memory:**
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 npm run server
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check permissions:**
   ```bash
   chmod -R 755 out/
   chmod -R 755 public/
   ```

#### **4. Map Tiles Not Loading**

**Error:**
```
Snapshot failed: Failed to fetch tiles
```

**Causes:**
- Network connectivity issues
- Tile provider is down
- Firewall blocking HTTPS

**Solutions:**
1. **Test connectivity:**
   ```bash
   curl -I https://server.arcgisonline.com
   ```

2. **Try different map style:**
   - Switch from Satellite to OSM
   - Check if provider is down: https://status.arcgis.com

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Ensure outbound HTTPS (443) is allowed
   ```

#### **5. Video Playback Issues**

**Problem:** Video won't play in browser

**Solutions:**
1. **Check codec support:**
   - MP4/H.264 should work in all modern browsers
   - Try downloading and playing in VLC

2. **Check file size:**
   ```bash
   ls -lh out/video-*.mp4
   # Should be > 0 bytes
   ```

3. **Re-render:**
   - Delete `out/video-<jobId>.mp4`
   - Submit render request again

#### **6. TypeScript Errors**

**Error:**
```
Cannot find type definition file for 'node'
```

**Solution:**
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

**Or ignore (they don't affect runtime):**
```bash
# These are warnings, not blocking errors
# Application will still run fine
```

#### **7. Map File 404 Error During Render**

**Error:**
```
[404 Not Found] Could not load image with source http://localhost:3000/public/map-xxxxx.png
Render exited with code 1
```

**Cause:** Remotion's internal server can't find the map image file.

**Solutions:**

1. **Ensure remotion.config.js exists:**
   ```bash
   ls -la remotion.config.js
   # Should exist in project root
   ```

2. **Check map file exists:**
   ```bash
   ls -la public/map-*.png
   # Should show your generated map files
   ```

3. **Verify server.js static file configuration:**
   ```javascript
   app.use(express.static(path.join(__dirname, "public")));
   // NOT: app.use("/public", express.static(...))
   ```

4. **Restart server after config changes:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run server
   ```

5. **Docker users - rebuild container:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

**Root cause:** The `remotion.config.js` file tells Remotion where to find static assets. Without it, or with incorrect Express static file serving, Remotion's separate rendering server (port 3000) can't access map images from the Express server (port 3005).

---

## Advanced Usage

### CLI Tool (fetch-map.js)

Generate videos from command line using place names or coordinates:

```bash
# Basic usage (geocodes locations automatically)
node scripts/fetch-map.js "London" "Paris"

# Multiple stops
node scripts/fetch-map.js "New York" "Chicago" "Los Angeles"

# Using coordinates (lat,lng)
node scripts/fetch-map.js "51.5074,-0.1278" "48.8566,2.3522"

# Mixed (places and coords)
node scripts/fetch-map.js "Tokyo" "35.6762,139.6503" "Osaka"
```

**Output:**
```
Generating map: London → Paris

[  5%] Geocoding locations…
[ 10%] London
[ 40%] Fetching map tiles (15/30)…
[ 75%] Stitching map…
[100%] Map ready

✓ public/map-1708643520123.png written
✓ src/mapConfig.json written
  Stop 0: London (456, 389)
  Stop 1: Paris (512, 402)
```

**Then render:**
```bash
npx remotion render MapsVideo out/london-paris.mp4 --config=remotion.config.js
```

### Programmatic API Usage

Use the render API from your own Node.js code:

```javascript
const axios = require('axios');

async function createFlightVideo() {
  // 1. Capture map
  const mapRes = await axios.post('http://localhost:3005/api/snapshot', {
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 8,
    mapStyle: 'satellite'
  });
  
  const { mapFile, tlX, tlY, zoom } = mapRes.data;
  
  // 2. Start render
  const renderRes = await axios.post('http://localhost:3005/api/render', {
    waypoints: [
      { lat: 40.7128, lng: -74.0060, label: 'New York', delayAfter: 0 },
      { lat: 34.0522, lng: -118.2437, label: 'Los Angeles', delayAfter: 0 }
    ],
    planeColor: '#FFFFFF',
    lineColor: '#FFD700',
    planeStyle: 'Boeing_747',
    mapFile, tlX, tlY, zoom
  });
  
  const { jobId } = renderRes.data;
  
  // 3. Poll status
  while (true) {
    const statusRes = await axios.get(`http://localhost:3005/api/status/${jobId}`);
    const { status, percent } = statusRes.data;
    
    console.log(`Render ${percent}%`);
    
    if (status === 'done') {
      console.log('Video ready!');
      break;
    } else if (status === 'error') {
      throw new Error('Render failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 4. Download
  const videoRes = await axios.get(
    `http://localhost:3005/api/download/${jobId}`,
    { responseType: 'arraybuffer' }
  );
  
  require('fs').writeFileSync('my-video.mp4', videoRes.data);
  console.log('Saved to my-video.mp4');
}

createFlightVideo().catch(console.error);
```

### Custom Map Styles

Add your own tile provider:

**Edit `scripts/map-generator.js`:**

```javascript
const TILE_URLS = {
  // ... existing styles
  
  myCustomStyle: {
    base: (z, x, y) => `https://mytiles.example.com/${z}/${x}/${y}.png`,
    labels: null  // Optional label overlay
  }
};
```

**Edit `web/index.html`:**

```html
<select id="map-style-selector">
  <option value="satellite">🛰 Satellite</option>
  <option value="osm">🗺 OpenStreetMap</option>
  <option value="myCustomStyle">🎨 My Style</option>
</select>
```

### Webhook Integration

Send notifications when renders complete:

**Add to `server.js` after render finishes:**

```javascript
// In runJob() function, after status = 'done'
async function notifyWebhook(jobId, outputFile) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    await axios.post(webhookUrl, {
      event: 'video.completed',
      jobId,
      downloadUrl: `http://yourserver.com/api/download/${jobId}`,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Webhook failed:', err.message);
  }
}

// Call after updating job status
jobs.set(jobId, { status: "done", ... });
await notifyWebhook(jobId, outputFile);
```

**Usage:**
```bash
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK npm run server
```

### Batch Processing

Process multiple routes from JSON file:

```javascript
const routes = require('./routes.json');
// routes.json: [{ waypoints: [...], settings: {...} }, ...]

async function batchProcess() {
  for (const route of routes) {
    console.log(`Processing route ${route.name}...`);
    
    // Capture map for route
    const bounds = calculateBounds(route.waypoints);
    const mapRes = await axios.post('/api/snapshot', { center: bounds.center, zoom: bounds.zoom });
    
    // Render video
    const renderRes = await axios.post('/api/render', {
      ...route,
      mapFile: mapRes.data.mapFile,
      tlX: mapRes.data.tlX,
      tlY: mapRes.data.tlY,
      zoom: mapRes.data.zoom
    });
    
    // Wait for completion
    await pollUntilComplete(renderRes.data.jobId);
  }
}
```

---

## Development Guide

### Project Setup

```bash
# Clone repository
git clone https://github.com/your-username/flight-path-video.git
cd flight-path-video

# Install dependencies
npm install

# Start development server with auto-reload
npx nodemon server.js
```

### Code Style

- **JavaScript**: ES6+ with async/await
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Comments**: JSDoc style for functions

### Adding New Aircraft

1. **Prepare SVG:**
   - Must be black silhouette on transparent background
   - Nose pointing up (toward −Y)
   - Centered at origin
   - Minified (remove metadata)

2. **Add to `public/aircraft/`:**
   ```bash
   cp My_Aircraft.svg public/aircraft/
   ```

3. **Update metadata** in `src/Composition.tsx`:
   ```javascript
   const AIRCRAFT_META = {
     // ... existing aircraft
     "My_Aircraft": { w: 200, h: 180 }  // viewBox dimensions
   };
   ```

4. **Add to UI** in `web/index.html`:
   ```html
   <select id="plane-style-select">
     <!-- ... existing options -->
     <option value="My_Aircraft">My Aircraft Name</option>
   </select>
   ```

### Modifying Path Algorithm

**To change curve shape**, edit `scripts/map-generator.js`:

```javascript
// Current: Catmull-Rom (smooth through all points)
const tangents = pts.map((_, i) => {
  const prev = pts[Math.max(0, i - 1)];
  const next = pts[Math.min(n - 1, i + 1)];
  return { x: (next.x - prev.x) / 2, y: (next.y - prev.y) / 2 };
});

// Alternative: B-spline (looser curves)
const tangents = pts.map((_, i) => {
  if (i === 0 || i === n - 1) return { x: 0, y: 0 };
  const prev = pts[i - 1];
  const curr = pts[i];
  const next = pts[i + 1];
  return {
    x: (next.x - prev.x) / 6,
    y: (next.y - prev.y) / 6
  };
});
```

### Adding Custom Effects

**Example: Smoke trail effect**

Edit `src/Composition.tsx`:

```tsx
{/* After plane rendering */}
{trail.map((point, i) => (
  <circle
    key={i}
    cx={point.x}
    cy={point.y}
    r={5 - i * 0.1}
    fill="#FFFFFF"
    opacity={0.5 - i * 0.05}
  />
))}
```

### Testing

**Manual Testing Checklist:**
- [ ] Map loads and is interactive
- [ ] Snapshot captures correct region
- [ ] Waypoints can be clicked and drawn
- [ ] Canvas redraws on undo/clear
- [ ] Settings panel opens/closes
- [ ] Color pickers update canvas
- [ ] Generate button enables at 2+ points
- [ ] Render starts and progress updates
- [ ] Video downloads successfully
- [ ] History panel shows past renders
- [ ] Multiple concurrent renders work

**API Testing:**
```bash
# Snapshot
curl -X POST http://localhost:3005/api/snapshot \
  -H "Content-Type: application/json" \
  -d '{"center":{"lat":51.5074,"lng":-0.1278},"zoom":10}'

# Render
curl -X POST http://localhost:3005/api/render \
  -H "Content-Type: application/json" \
  -d @test-render.json

# Status
curl http://localhost:3005/api/status/<jobId>

# Download
curl -o test.mp4 http://localhost:3005/api/download/<jobId>
```

---

## Contributing

### How to Contribute

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Contribution Ideas

- [ ] Add GPX/KML file import
- [ ] Support for altitude profiles
- [ ] Multiple aircraft in single video
- [ ] Custom audio track support
- [ ] Real-time collaborative drawing
- [ ] Database persistent storage
- [ ] User authentication
- [ ] Cloud storage integration (S3, GCS)
- [ ] Advanced rendering (4K, 60fps)
- [ ] Mobile app (React Native)

### Bug Reports

When filing issues, include:
- OS and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages / logs
- Screenshots if applicable

### Code Review Guidelines

- Maintain existing code style
- Add comments for complex logic
- Update documentation
- Test thoroughly before PR
- Keep changes focused (one feature per PR)

---

## FAQ

### Q: Can I use this commercially?

**A:** Yes! The code is open source. However, ensure you comply with tile provider terms:
- **ArcGIS:** Free for testing, paid for commercial
- **OpenStreetMap:** Free with attribution
- **CartoDB:** Free tier available, check limits

### Q: How much does it cost to run?

**A:** 
- **Locally:** Free (just electricity)
- **Railway Free Tier:** 500 hours/month = ~600 videos
- **VPS:** $5-10/month (DigitalOcean, Linode)
- **AWS/GCP:** Pay per use (~$0.02-0.10 per video)

### Q: Can I render 4K videos?

**A:** Yes, but requires code changes:
1. Update `OUT_W` and `OUT_H` in map-generator.js
2. Update width/height in `src/Root.tsx`
3. Increase Sharp memory limit
4. Expect 2-3× longer render times

### Q: Can I add custom maps?

**A:** Yes! See [Custom Map Styles](#custom-map-styles) section.

### Q: Does it work offline?

**A:** Partially:
- ✅ Frontend and render engine work offline
- ❌ Map tiles require internet connection
- **Solution:** Pre-download tiles or use local tile server

### Q: Can I run multiple renders simultaneously?

**A:** Yes, see queue system in `server.js`. Increase concurrency:
```javascript
// In server.js, change:
let maxConcurrent = 1;  // Change to 2, 3, etc.
```

**Note:** Each render uses ~500MB RAM.

### Q: How do I delete old videos?

**A:** Videos are stored in `out/` directory:
```bash
rm -rf out/*.mp4
```

Or add auto-cleanup to `server.js` after download.

### Q: Is there a video length limit?

**A:** No hard limit, but practical limits:
- Max 360 frames per segment = 12 seconds per segment
- Recommended total: 10-60 seconds (300-1800 frames)
- Longer videos = slower renders and larger files

### Q: Can I use real airline routes?

**A:** Yes! Use actual airport codes/coordinates. No restrictions on route geography.

---

## Credits & License

### Built With

- **Remotion** - Video rendering framework
- **React** - UI component library
- **Express** - Web server
- **Sharp** - Image processing
- **Leaflet** - Interactive maps
- **ArcGIS** - Satellite imagery
- **OpenStreetMap** - Street map tiles

### Aircraft Silhouettes

Aircraft SVG files are simplified silhouettes derived from public domain specifications. Not affiliated with aircraft manufacturers.

### Map Tile Providers

- **Esri / ArcGIS** - World Imagery
- **OpenStreetMap Contributors** - Community maps
- **CartoDB** - Styled base maps

### License

MIT License - see LICENSE file for details.

### Author

Created with ❤️ by the open source community.

### Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@example.com

---

## Changelog

### Version 2.0 (Current)
- ✅ Complete rewrite with Remotion
- ✅ Web-based interface (no CLI required)
- ✅ Real aircraft silhouettes
- ✅ Glow effects
- ✅ Camera pan/zoom
- ✅ Render queue system
- ✅ Multiple map styles
- ✅ Docker support

### Version 1.0 (Legacy)
- CLI-based workflow
- Basic path rendering
- Single map style
- No queue system

---

## Appendix

### Glossary

- **Bezier Curve** - Smooth curve defined by control points
- **Catmull-Rom** - Spline interpolation that passes through all points
- **Mercator Projection** - Map projection that preserves angles
- **RDP** - Ramer-Douglas-Peucker polygon simplification
- **Remotion** - React-based video rendering framework
- **Sharp** - High-performance image processing library
- **Tile** - 256×256 pixel map image
- **Web Mercator** - EPSG:3857 coordinate system

### Resources

- **Remotion Docs:** https://remotion.dev
- **Leaflet Docs:** https://leafletjs.com
- **Web Mercator:** https://en.wikipedia.org/wiki/Web_Mercator_projection
- **Bezier Curves:** https://pomax.github.io/bezierinfo/

### Version Info

- **Node.js:** 20.x
- **Remotion:** 4.0.427
- **React:** 18.3.1
- **Sharp:** 0.34.5

---

**End of Documentation**

For questions, issues, or contributions, visit the [GitHub repository](#).

Last updated: February 22, 2026
