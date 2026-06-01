import { useMemo } from "react";
import { GR20_STAGES, getCurrentStageIndex } from "@/lib/gr20-stages";

// Bounding box géo de la Corse : lon [8.53, 9.57], lat [41.33, 43.02]
const GEO = { lonMin: 8.53, lonMax: 9.57, latMin: 41.33, latMax: 43.02 };
const W = 400;
const H = 520;

function project(lat: number, lon: number): [number, number] {
  const x = ((lon - GEO.lonMin) / (GEO.lonMax - GEO.lonMin)) * W;
  const y = (1 - (lat - GEO.latMin) / (GEO.latMax - GEO.latMin)) * H;
  return [x, y];
}

// Outline simplifié de la Corse (polygone approximatif, sens horaire)
const CORSICA_OUTLINE = [
  [43.02, 9.39],
  [42.97, 9.45],
  [42.88, 9.56],
  [42.72, 9.57],
  [42.58, 9.52],
  [42.47, 9.5],
  [42.35, 9.4],
  [42.25, 9.36],
  [42.1, 9.38],
  [41.95, 9.28],
  [41.85, 9.18],
  [41.75, 9.1],
  [41.6, 9.0],
  [41.45, 8.95],
  [41.38, 8.82],
  [41.33, 8.7],
  [41.4, 8.62],
  [41.55, 8.57],
  [41.7, 8.55],
  [41.85, 8.58],
  [41.95, 8.62],
  [42.05, 8.63],
  [42.15, 8.68],
  [42.25, 8.72],
  [42.38, 8.72],
  [42.5, 8.75],
  [42.6, 8.72],
  [42.68, 8.67],
  [42.75, 8.65],
  [42.82, 8.69],
  [42.88, 8.72],
  [42.92, 8.78],
  [42.97, 8.85],
  [43.0, 8.98],
  [43.02, 9.15],
  [43.02, 9.28],
  [43.02, 9.39],
].map(([lat, lon]) => project(lat, lon));

const corsicaPath =
  CORSICA_OUTLINE.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(
    " ",
  ) + " Z";

export function GR20Map() {
  const currentIdx = getCurrentStageIndex();

  const points = useMemo(() => GR20_STAGES.map((s) => project(s.lat, s.lon)), []);

  const polyline = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "650ms" }}>
      <h2 className="font-display text-3xl mb-4">La traversée</h2>
      <div className="rounded-3xl overflow-hidden border border-white/40 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)] bg-card/50 backdrop-blur-xl p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ maxHeight: 420 }}
          aria-label="Carte du GR20 en Corse"
        >
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="oklch(0.22 0.04 230)" />
              <stop offset="100%" stopColor="oklch(0.14 0.03 230)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Fond */}
          <rect width={W} height={H} fill="url(#bgGrad)" rx="12" />

          {/* Mer — petits points décoratifs */}
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              cx={((i * 73) % W) + 20}
              cy={((i * 47) % H) + 20}
              r="1"
              fill="oklch(0.55 0.08 220 / 0.25)"
            />
          ))}

          {/* Outline Corse */}
          <path
            d={corsicaPath}
            fill="oklch(0.28 0.06 140 / 0.55)"
            stroke="oklch(0.55 0.10 140 / 0.6)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Tracé GR20 — halo */}
          <path
            d={polyline}
            fill="none"
            stroke="oklch(0.65 0.20 28 / 0.35)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Tracé GR20 — trait principal */}
          <path
            d={polyline}
            fill="none"
            stroke="oklch(0.72 0.22 28)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGlow)"
          />

          {/* Étapes */}
          {GR20_STAGES.map((s, i) => {
            const [x, y] = points[i];
            const isCurrent = i === currentIdx;
            const isPast = i < currentIdx;
            return (
              <g key={s.day}>
                {isCurrent && (
                  <>
                    <circle cx={x} cy={y} r="18" fill="oklch(0.75 0.18 50 / 0.15)">
                      <animate
                        attributeName="r"
                        values="12;20;12"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.3;0;0.3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={x} cy={y} r="8" fill="oklch(0.75 0.18 50 / 0.3)">
                      <animate
                        attributeName="r"
                        values="6;10;6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 5.5 : 3.5}
                  fill={
                    isCurrent
                      ? "oklch(0.85 0.18 55)"
                      : isPast
                        ? "oklch(0.60 0.15 28)"
                        : "oklch(0.40 0.08 28)"
                  }
                  stroke={
                    isCurrent ? "white" : isPast ? "oklch(0.72 0.22 28)" : "oklch(0.50 0.10 28)"
                  }
                  strokeWidth={isCurrent ? 2 : 1}
                  filter={isCurrent ? "url(#glow)" : undefined}
                />
              </g>
            );
          })}

          {/* Labels début / fin */}
          {(() => {
            const [sx, sy] = points[0];
            const [ex, ey] = points[points.length - 1];
            return (
              <>
                <text
                  x={sx + 8}
                  y={sy - 6}
                  fontSize="9"
                  fill="oklch(0.80 0.10 50)"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Calenzana
                </text>
                <text
                  x={ex + 8}
                  y={ey + 4}
                  fontSize="9"
                  fill="oklch(0.80 0.10 50)"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  Conca
                </text>
              </>
            );
          })()}

          {/* Label étape courante */}
          {currentIdx >= 0 &&
            currentIdx < GR20_STAGES.length &&
            (() => {
              const s = GR20_STAGES[currentIdx];
              const [x, y] = points[currentIdx];
              const labelX = x > W * 0.65 ? x - 8 : x + 8;
              const anchor = x > W * 0.65 ? "end" : "start";
              return (
                <g>
                  <rect
                    x={anchor === "start" ? labelX - 2 : labelX - 110}
                    y={y + 8}
                    width={112}
                    height={22}
                    rx={4}
                    fill="oklch(0.15 0.04 230 / 0.85)"
                    stroke="oklch(0.75 0.18 50 / 0.5)"
                    strokeWidth="0.8"
                  />
                  <text
                    x={anchor === "start" ? labelX + 4 : labelX - 4}
                    y={y + 23}
                    fontSize="8.5"
                    fill="oklch(0.90 0.12 55)"
                    fontFamily="monospace"
                    textAnchor={anchor}
                  >
                    Jour {s.day} · {s.from}
                  </text>
                </g>
              );
            })()}

          {/* Légende */}
          <g transform={`translate(12, ${H - 38})`}>
            <rect width="110" height="30" rx="6" fill="oklch(0.15 0.04 230 / 0.7)" />
            <circle
              cx="14"
              cy="10"
              r="4"
              fill="oklch(0.85 0.18 55)"
              stroke="white"
              strokeWidth="1.5"
            />
            <text x="22" y="14" fontSize="7.5" fill="oklch(0.75 0.08 50)" fontFamily="monospace">
              Étape actuelle
            </text>
            <circle
              cx="14"
              cy="22"
              r="3"
              fill="oklch(0.60 0.15 28)"
              stroke="oklch(0.72 0.22 28)"
              strokeWidth="1"
            />
            <text x="22" y="26" fontSize="7.5" fill="oklch(0.65 0.08 50)" fontFamily="monospace">
              Étape passée
            </text>
          </g>
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        15 étapes · Calenzana → Conca · l'étape du jour clignote en orange.
      </p>
    </section>
  );
}
