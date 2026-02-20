import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import mapConfig from "./mapConfig.json";

// ─── Config ────────────────────────────────────────────────────────────────────
const waypoints   = mapConfig.waypoints;
const segments    = mapConfig.segments;
const planeColor  = (mapConfig as any).planeColor  || "#FFD700";
const lineColor   = (mapConfig as any).lineColor   || "#FFD700";
const planeStyle      = (mapConfig as any).planeStyle      || "default";
const glowEnabled     = (mapConfig as any).glowEnabled     ?? false;
const glowColor       = (mapConfig as any).glowColor       || "#FFD700";
const glowIntensity   = (mapConfig as any).glowIntensity   || 1;
const trailGlowEnabled  = (mapConfig as any).trailGlowEnabled  ?? false;
const trailGlowColor    = (mapConfig as any).trailGlowColor    || lineColor;
const trailGlowIntensity = (mapConfig as any).trailGlowIntensity || 1;
const panEnabled      = (mapConfig as any).panEnabled      ?? true;
const panSpeed        = (mapConfig as any).panSpeed        || 1;
const zoomEnabled     = (mapConfig as any).zoomEnabled     ?? true;
const zoomMax         = (mapConfig as any).zoomMax         || 1.4;
const labelFontColor  = (mapConfig as any).labelFontColor  || "#000000";
const labelBgColor    = (mapConfig as any).labelBgColor    || "#FFD700";
const labelFontFamily = (mapConfig as any).labelFontFamily || "system-ui, -apple-system, sans-serif";
const labelTextCase   = (mapConfig as any).labelTextCase   || "none";
const labelBold       = (mapConfig as any).labelBold       ?? false;
const labelItalic     = (mapConfig as any).labelItalic     ?? false;
const N = waypoints.length;

const HOLD_START  = Math.round(30 * 0.5); // 15 f
const HOLD_END    = 30;                    // 30 f
const DEFAULT_FLY = 30 * 6;               // fallback for legacy mapConfig

const NORM = 1000;

// ─── Timeline ─────────────────────────────────────────────────────────────────
function getFlightProgress(frame: number): number {
  let t = HOLD_START;
  if (frame <= t) return 0;

  for (let i = 0; i < N - 1; i++) {
    const segFrames = (segments[i] as any).frames ?? DEFAULT_FLY;
    const flyEnd = t + segFrames;
    if (frame <= flyEnd) return i + (frame - t) / segFrames;
    t = flyEnd;

    if (i < N - 2) {
      const delay = (waypoints[i + 1] as any).delayAfter;
      if (delay > 0) {
        if (frame <= t + delay) return i + 1;
        t += delay;
      }
    }
  }
  return N - 1;
}

// ─── Cubic Bezier helpers ──────────────────────────────────────────────────────
function cubicBezierPoint(
  sx: number, sy: number,
  c1x: number, c1y: number,
  c2x: number, c2y: number,
  ex: number, ey: number,
  t: number
): [number, number] {
  const mt = 1 - t;
  return [
    mt*mt*mt*sx + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*ex,
    mt*mt*mt*sy + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*ey,
  ];
}

function cubicBezierAngleDeg(
  sx: number, sy: number,
  c1x: number, c1y: number,
  c2x: number, c2y: number,
  ex: number, ey: number,
  t: number
): number {
  const mt = 1 - t;
  const dx = 3*mt*mt*(c1x-sx) + 6*mt*t*(c2x-c1x) + 3*t*t*(ex-c2x);
  const dy = 3*mt*mt*(c1y-sy) + 6*mt*t*(c2y-c1y) + 3*t*t*(ey-c2y);
  if (dx === 0 && dy === 0) return 0;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ─── Default plane path — nose pointing UP (−Y), centered at (0,0), ±46 scale ─
const DEFAULT_PLANE_PATH =
  `M 0,-42 C 6,-37 8,-22 8,-8 L 46,18 L 46,26 L 8,10
   L 7,34 L 22,40 L 22,46 L 0,42
   L -22,46 L -22,40 L -7,34 L -8,10
   L -46,26 L -46,18 L -8,-8 C -8,-22 -6,-37 0,-42 Z`;

// ─── Real aircraft SVG metadata (viewBox width × height) ──────────────────────
const AIRCRAFT_META: Record<string, { w: number; h: number }> = {
  "Airbus_A300":     { w: 165, h: 197 },
  "Airbus_A320":     { w: 129, h: 139 },
  "Airbus_A380":     { w: 283, h: 262 },
  "Boeing_707":      { w: 165, h: 171 },
  "Boeing_727":      { w: 139, h: 170 },
  "Boeing_747":      { w: 211, h: 253 },
  "Boeing_777":      { w: 202, h: 231 },
  "Boeing_787":      { w: 216, h: 207 },
  "Cessna_Citation": { w: 60,  h: 54  },
  "Douglas_DC-10":   { w: 180, h: 217 },
  "Douglas_DC-3":    { w: 105, h: 136 },
  "Douglas_DC-9":    { w: 167, h: 182 },
  "Douglas_MD-11":   { w: 121, h: 165 },
  "Learjet_45":      { w: 109, h: 76  },
};

// ─── Plane glow — stroke-based, uniform distance from every edge ──────────────
// Stroke layers extend equally from each point on the outline, so narrow parts
// (nose, tail) glow the same thickness as wide parts (wings). worldPx values
// are converted to local-space stroke widths via baseScale so the glow stays
// proportional even if PLANE_SIZE changes.
const PlaneGlow: React.FC<{
  cx: number; cy: number; rot: number;
  planePath: string; color: string; baseScale: number; intensity: number;
}> = ({ cx, cy, rot, planePath, color, baseScale, intensity }) => {
  // 8 concentric stroke rings. At intensity=1 only the inner 4 are drawn;
  // each +1 of intensity activates one more outer ring + widens + brightens all rings.
  const rings = [
    { worldPx: 2,   o: 0.70 },
    { worldPx: 5,   o: 0.55 },
    { worldPx: 10,  o: 0.40 },
    { worldPx: 18,  o: 0.28 },
    { worldPx: 30,  o: 0.18 },
    { worldPx: 48,  o: 0.11 },
    { worldPx: 72,  o: 0.06 },
    { worldPx: 104, o: 0.03 },
  ];
  const activeCount = Math.min(rings.length, Math.round(3 + intensity));
  const opacityBoost = 0.7 + intensity * 0.3; // 1.0 at 1×, 2.5 at 5×
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rot}) scale(${baseScale})`}>
      {rings.slice(0, activeCount).map(({ worldPx, o }, i) => (
        <path
          key={i}
          d={planePath}
          fill="none"
          stroke={color}
          strokeWidth={(worldPx * intensity) / baseScale}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={Math.min(1, o * opacityBoost)}
        />
      ))}
    </g>
  );
};

// ─── Route label badge ─────────────────────────────────────────────────────────
const RouteLabel: React.FC<{
  x: number; y: number; text: string; opacity: number;
  fontColor: string; bgColor: string; fontFamily: string; textCase: string;
  bold: boolean; italic: boolean;
}> = ({ x, y, text, opacity, fontColor, bgColor, fontFamily, textCase, bold, italic }) => {
  const displayText = textCase === "uppercase" ? text.toUpperCase()
                    : textCase === "lowercase" ? text.toLowerCase()
                    : text;
  const approxW = Math.max(80, displayText.length * 10 + 32);
  const h = 30;
  const bx = x - approxW / 2;
  const by = y - 54;
  return (
    <g opacity={opacity}>
      {/* connector dot */}
      <circle cx={x} cy={y} r={5} fill={fontColor} opacity={0.95} />
      <line x1={x} y1={y - 6} x2={x} y2={by + h} stroke={fontColor} strokeWidth={1.5} opacity={0.5} />
      {/* badge */}
      <rect x={bx} y={by} width={approxW} height={h} rx={6} fill={bgColor} />
      <text
        x={x} y={by + 20}
        textAnchor="middle"
        fill={fontColor}
        fontSize={15}
        fontFamily={fontFamily}
        fontWeight={bold ? "800" : "600"}
        fontStyle={italic ? "italic" : "normal"}
      >
        {displayText}
      </text>
    </g>
  );
};

// ─── Composition ──────────────────────────────────────────────────────────────
export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fp     = getFlightProgress(frame);
  const segIdx = Math.min(Math.floor(fp), N - 2);
  const segT   = fp - segIdx;

  const seg    = segments[segIdx] as any;
  const wStart = waypoints[segIdx] as any;
  const wEnd   = waypoints[segIdx + 1] as any;

  const [planeX, planeY] = cubicBezierPoint(
    wStart.x, wStart.y,
    seg.c1x ?? seg.ctrlX, seg.c1y ?? seg.ctrlY,
    seg.c2x ?? seg.ctrlX, seg.c2y ?? seg.ctrlY,
    wEnd.x, wEnd.y,
    segT
  );

  const planeRotation = cubicBezierAngleDeg(
    wStart.x, wStart.y,
    seg.c1x ?? seg.ctrlX, seg.c1y ?? seg.ctrlY,
    seg.c2x ?? seg.ctrlX, seg.c2y ?? seg.ctrlY,
    wEnd.x, wEnd.y,
    segT
  ) + 90;

  // Camera: zoom + follow plane
  const camZoom = zoomEnabled
    ? interpolate(frame, [0, durationInFrames], [1.0, zoomMax], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1.0;
  // Pan: center on plane scaled by panSpeed (1.0 = exact center, < 1 = looser follow)
  const rawTx = panEnabled ? (960 - planeX * camZoom) * panSpeed : 0;
  const rawTy = panEnabled ? (540 - planeY * camZoom) * panSpeed : 0;
  const tx = Math.max(1920 * (1 - camZoom), Math.min(0, rawTx));
  const ty = Math.max(1080 * (1 - camZoom), Math.min(0, rawTy));

  // Label visibility
  const startWp  = waypoints[0] as any;
  const endWp    = waypoints[N - 1] as any;
  const startLabel = (startWp.label || "").trim();
  const endLabel   = (endWp.label   || "").trim();

  const startOpacity = interpolate(frame, [HOLD_START, HOLD_START + 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // End label fades in when plane starts the last segment
  const endRevealFrame = (() => {
    let t = HOLD_START;
    for (let i = 0; i < N - 2; i++) {
      t += (segments[i] as any).frames ?? DEFAULT_FLY;
    }
    return t;
  })();
  const endOpacity = interpolate(frame, [endRevealFrame, endRevealFrame + 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const PLANE_SIZE = 28;
  const isRealAircraft = planeStyle in AIRCRAFT_META;
  // For real aircraft: scale so the longest dimension = PLANE_SIZE * 3 world px
  const acMeta   = isRealAircraft ? AIRCRAFT_META[planeStyle] : null;
  const acScale  = acMeta ? (PLANE_SIZE * 3) / Math.max(acMeta.w, acMeta.h) : 1;
  const acDW     = acMeta ? acMeta.w * acScale : 0;
  const acDH     = acMeta ? acMeta.h * acScale : 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${camZoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Map */}
        <Img
          src={staticFile(mapConfig.mapFile)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* SVG overlay */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 1920 1080"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Trail glow (rendered behind trails) */}
          {trailGlowEnabled && segments.map((s: any, i: number) => {
            if (i > segIdx) return null;
            const ws = waypoints[i] as any;
            const we = waypoints[i + 1] as any;
            const d = `M ${ws.x} ${ws.y} C ${s.c1x ?? s.ctrlX} ${s.c1y ?? s.ctrlY} ${s.c2x ?? s.ctrlX} ${s.c2y ?? s.ctrlY} ${we.x} ${we.y}`;
            const dashoffset = i < segIdx ? 0 : NORM * (1 - segT);
            return (
              <path
                key={`glow-${i}`}
                d={d}
                pathLength={NORM}
                strokeDasharray={NORM}
                strokeDashoffset={dashoffset}
                stroke={trailGlowColor}
                strokeWidth={4}
                fill="none"
                strokeLinecap="butt"
                filter="url(#trail-glow)"
              />
            );
          })}

          {/* Trail paths */}
          {segments.map((s: any, i: number) => {
            if (i > segIdx) return null;
            const ws = waypoints[i] as any;
            const we = waypoints[i + 1] as any;
            const d = `M ${ws.x} ${ws.y} C ${s.c1x ?? s.ctrlX} ${s.c1y ?? s.ctrlY} ${s.c2x ?? s.ctrlX} ${s.c2y ?? s.ctrlY} ${we.x} ${we.y}`;
            const dashoffset = i < segIdx ? 0 : NORM * (1 - segT);
            return (
              <path
                key={i}
                d={d}
                pathLength={NORM}
                strokeDasharray={NORM}
                strokeDashoffset={dashoffset}
                stroke={lineColor}
                strokeWidth={4}
                fill="none"
                strokeLinecap="butt"
              />
            );
          })}

          {/* Route labels */}
          {startLabel ? (
            <RouteLabel x={startWp.x} y={startWp.y} text={startLabel} opacity={startOpacity} fontColor={labelFontColor} bgColor={labelBgColor} fontFamily={labelFontFamily} textCase={labelTextCase} bold={labelBold} italic={labelItalic} />
          ) : null}
          {endLabel ? (
            <RouteLabel x={endWp.x} y={endWp.y} text={endLabel} opacity={endOpacity} fontColor={labelFontColor} bgColor={labelBgColor} fontFamily={labelFontFamily} textCase={labelTextCase} bold={labelBold} italic={labelItalic} />
          ) : null}

          {/* SVG filters for real-aircraft recoloring and glow */}
          <defs>
            {isRealAircraft && (
              <>
                {/* Maps the black silhouette fill to planeColor */}
                <filter id="ac-recolor" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
                  <feFlood floodColor={planeColor} result="clr"/>
                  <feComposite in="clr" in2="SourceGraphic" operator="in"/>
                </filter>
                {/* Blurred version of the silhouette tinted to glowColor */}
                <filter id="ac-glow" colorInterpolationFilters="sRGB" x="-100%" y="-100%" width="300%" height="300%">
                  <feFlood floodColor={glowColor} result="clr"/>
                  <feComposite in="clr" in2="SourceGraphic" operator="in" result="tinted"/>
                  <feGaussianBlur in="tinted" stdDeviation={10 * glowIntensity} result="b1"/>
                  <feGaussianBlur in="tinted" stdDeviation={5  * glowIntensity} result="b2"/>
                  <feGaussianBlur in="tinted" stdDeviation={20 * glowIntensity} result="b3"/>
                  <feMerge>
                    <feMergeNode in="b3"/>
                    <feMergeNode in="b1"/>
                    <feMergeNode in="b2"/>
                  </feMerge>
                </filter>
              </>
            )}
            {/* Trail glow filter - multiple blur layers for smooth glow effect */}
            {trailGlowEnabled && (
              <filter id="trail-glow" colorInterpolationFilters="sRGB" x="-200%" y="-200%" width="500%" height="500%">
                <feFlood floodColor={trailGlowColor} result="clr"/>
                <feComposite in="clr" in2="SourceGraphic" operator="in" result="tinted"/>
                <feGaussianBlur in="tinted" stdDeviation={8  * trailGlowIntensity} result="b1"/>
                <feGaussianBlur in="tinted" stdDeviation={16 * trailGlowIntensity} result="b2"/>
                <feGaussianBlur in="tinted" stdDeviation={24 * trailGlowIntensity} result="b3"/>
                <feMerge>
                  <feMergeNode in="b3"/>
                  <feMergeNode in="b2"/>
                  <feMergeNode in="b1"/>
                </feMerge>
              </filter>
            )}
          </defs>

          {/* Glow — real aircraft: blurred recolored image */}
          {isRealAircraft && glowEnabled && (
            <g transform={`translate(${planeX},${planeY}) rotate(${planeRotation})`}>
              <image
                href={staticFile(`aircraft/${planeStyle}.svg`)}
                x={-acDW / 2} y={-acDH / 2} width={acDW} height={acDH}
                filter="url(#ac-glow)"
              />
            </g>
          )}

          {/* Glow — default plane: stroke-based shape-following */}
          {!isRealAircraft && glowEnabled && (
            <PlaneGlow
              cx={planeX} cy={planeY} rot={planeRotation}
              planePath={DEFAULT_PLANE_PATH} color={glowColor} baseScale={PLANE_SIZE / 46}
              intensity={glowIntensity}
            />
          )}

          {/* Airplane — real aircraft SVG recolored to planeColor */}
          {isRealAircraft && (
            <g transform={`translate(${planeX},${planeY}) rotate(${planeRotation})`}>
              <image
                href={staticFile(`aircraft/${planeStyle}.svg`)}
                x={-acDW / 2} y={-acDH / 2} width={acDW} height={acDH}
                filter="url(#ac-recolor)"
              />
            </g>
          )}

          {/* Airplane — default generic jet path */}
          {!isRealAircraft && (
            <g transform={`translate(${planeX},${planeY}) rotate(${planeRotation}) scale(${PLANE_SIZE / 46})`}>
              <path d={DEFAULT_PLANE_PATH} fill={planeColor} />
            </g>
          )}

          {/* Attribution */}
          <text
            x={1910} y={1073}
            textAnchor="end"
            fill="rgba(255,255,255,0.5)"
            fontSize={13}
            fontFamily="system-ui, sans-serif"
          >
            © Esri, Maxar, Earthstar Geographics
          </text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
