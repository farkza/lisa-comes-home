import { useEffect, useMemo, useState } from "react";

type Mode = "day" | "night";

function useTimeMode(): Mode {
  const [mode, setMode] = useState<Mode>(() => getMode());
  useEffect(() => {
    const id = setInterval(() => setMode(getMode()), 60_000);
    return () => clearInterval(id);
  }, []);
  return mode;
}

function getMode(): Mode {
  const h = new Date().getHours();
  return h >= 7 && h < 20 ? "day" : "night";
}

export function Particles() {
  const mode = useTimeMode();

  const items = useMemo(
    () =>
      Array.from({ length: mode === "night" ? 40 : 22 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        size: mode === "night" ? 2 + Math.random() * 2 : 10 + Math.random() * 14,
        drift: -20 + Math.random() * 40,
      })),
    [mode],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      {items.map((p) =>
        mode === "night" ? (
          <span
            key={p.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            }}
          />
        ) : (
          <span
            key={p.id}
            className="absolute animate-petal select-none"
            style={{
              left: `${p.left}%`,
              top: `-5%`,
              fontSize: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration + 8}s`,
              ["--drift" as never]: `${p.drift}vw`,
            }}
          >
            🌸
          </span>
        ),
      )}
    </div>
  );
}
