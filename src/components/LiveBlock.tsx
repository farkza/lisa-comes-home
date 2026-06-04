import { useEffect, useState } from "react";
import { GR20_STAGES, getCurrentStageIndex } from "@/lib/gr20-stages";

type Weather = { temp: number; code: number; wind: number } | null;

const WEATHER_LABELS: Record<number, string> = {
  0: "Ciel dégagé ☀️",
  1: "Plutôt ensoleillé 🌤",
  2: "Partiellement nuageux ⛅",
  3: "Couvert ☁️",
  45: "Brouillard 🌫",
  48: "Brouillard givrant 🌫",
  51: "Bruine légère 🌦",
  53: "Bruine 🌦",
  55: "Bruine forte 🌦",
  61: "Pluie faible 🌧",
  63: "Pluie 🌧",
  65: "Pluie forte 🌧",
  71: "Neige faible 🌨",
  73: "Neige 🌨",
  75: "Neige forte ❄️",
  80: "Averses 🌦",
  81: "Averses 🌧",
  82: "Averses violentes ⛈",
  95: "Orage ⛈",
  96: "Orage + grêle ⛈",
  99: "Orage + grêle ⛈",
};

const DISMISS_KEY = "lisa-live-dismissed-until";

export function LiveBlock() {
  const idx = getCurrentStageIndex();
  const stage = idx >= 0 ? GR20_STAGES[idx] : null;
  const [weather, setWeather] = useState<Weather>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    setDismissed(Date.now() < until);
  }, []);

  useEffect(() => {
    if (!stage) return;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${stage.lat}&longitude=${stage.lon}&current=temperature_2m,weather_code,wind_speed_10m`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const c = d?.current;
        if (c) setWeather({ temp: Math.round(c.temperature_2m), code: c.weather_code, wind: Math.round(c.wind_speed_10m) });
      })
      .catch(() => {});
  }, [stage?.day]);

  if (!stage || dismissed) return null;

  function handleDismiss() {
    // dismiss 4h
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 4 * 60 * 60 * 1000));
    setDismissed(true);
  }

  return (
    <div className="animate-fade-up mb-8 rounded-3xl border border-white/40 bg-gradient-to-br from-[oklch(0.78_0.14_50/0.15)] to-[oklch(0.55_0.18_340/0.15)] backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.4)] relative">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Masquer"
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/60 hover:text-white text-sm leading-none transition"
      >
        ×
      </button>
      <p className="text-[10px] uppercase tracking-[0.25em] text-primary/90 font-semibold flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        En direct du GR20
      </p>
      <p className="mt-2 font-display text-xl sm:text-2xl leading-tight">
        📍 Lisa est à <span className="text-sunset">{stage.to}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Jour <span className="text-foreground font-medium">{stage.day}/15</span> · {stage.from} → {stage.to}
      </p>
      {weather && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div>
            <span className="font-display text-3xl text-sunset tabular-nums">{weather.temp}°</span>
          </div>
          <div className="text-muted-foreground">
            <p>{WEATHER_LABELS[weather.code] ?? "Météo locale"}</p>
            <p className="text-xs mt-0.5">Vent {weather.wind} km/h · altitude {stage.altitude} m</p>
          </div>
        </div>
      )}
    </div>
  );
}
