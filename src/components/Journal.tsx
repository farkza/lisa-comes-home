import { useEffect, useMemo, useState } from "react";

type DayEntry = {
  km: number;
  denivele: number;
  note: string;
};

const HIKE_START = new Date("2026-06-04T00:00:00");
const TOTAL_DAYS = 15; // 15 étapes officielles, du 4 au 18 juin
const GOAL_KM = 180;
const GOAL_DENIVELE = 12000;
const STORAGE_KEY = "lisa-gr20-journal-v1";

const STAGES = [
  "Calenzana → Ortu di u Piobbu",
  "Ortu di u Piobbu → Carrozzu",
  "Carrozzu → Ascu Stagnu",
  "Ascu Stagnu → Ballone (via Tighjettu)",
  "Ballone → Castel de Vergio",
  "Castel de Vergio → Vaccaghja",
  "Vaccaghja → Petra Piana",
  "Petra Piana → Onda",
  "Onda → Vizzavona",
  "Vizzavona → Capannelle (via u Fugone)",
  "Capannelle → Usciolu (via u Fugone)",
  "Usciolu → I Croci",
  "I Croci → Asinau",
  "Asinau → Paliri",
  "Paliri → Conca",
];

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function loadEntries(): Record<number, DayEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function Journal() {
  const [entries, setEntries] = useState<Record<number, DayEntry>>({});
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setEntries(loadEntries());
    // Sélectionne le jour actuel si on est pendant la rando
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - HIKE_START.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < TOTAL_DAYS) setSelected(diffDays);
  }, []);

  const update = (idx: number, patch: Partial<DayEntry>) => {
    setEntries((prev) => {
      const base: DayEntry = prev[idx] ?? { km: 0, denivele: 0, note: "" };
      const next = {
        ...prev,
        [idx]: { ...base, ...patch },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const { totalKm, totalDen, daysDone } = useMemo(() => {
    let km = 0;
    let den = 0;
    let dd = 0;
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const e = entries[i];
      if (e && (e.km > 0 || e.denivele > 0 || e.note?.trim())) {
        km += Number(e.km) || 0;
        den += Number(e.denivele) || 0;
        dd += 1;
      }
    }
    return { totalKm: km, totalDen: den, daysDone: dd };
  }, [entries]);

  const kmPct = Math.min(100, (totalKm / GOAL_KM) * 100);
  const denPct = Math.min(100, (totalDen / GOAL_DENIVELE) * 100);
  const overallPct = (kmPct + denPct) / 2;

  const selectedDate = new Date(HIKE_START.getTime() + selected * 86400000);
  const current = entries[selected] ?? { km: 0, denivele: 0, note: "" };

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "750ms" }}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80 font-medium">
            Journal de bord
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Le chemin de Lisa</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-sunset tabular-nums">{Math.round(overallPct)}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">parcouru</p>
        </div>
      </div>

      {/* Gauge interactive */}
      <div className="rounded-3xl bg-card/50 backdrop-blur-xl border border-white/40 p-5 sm:p-7 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
        {/* Trace de l'itinéraire avec jalons par jour */}
        <div className="relative">
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${overallPct}%`,
                background:
                  "linear-gradient(90deg, oklch(0.78 0.14 50), oklch(0.65 0.2 10), oklch(0.55 0.18 340))",
                boxShadow: "0 0 24px oklch(0.7 0.17 10 / 0.6)",
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-8 sm:grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
            {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
              const e = entries[i];
              const done = e && (e.km > 0 || e.denivele > 0 || e.note?.trim());
              const isSel = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  aria-label={`Jour ${i + 1}`}
                  className={`group relative aspect-square rounded-lg border transition-all ${
                    isSel
                      ? "border-primary scale-110 shadow-[0_0_12px_oklch(0.7_0.17_10/0.6)]"
                      : "border-white/30 hover:border-primary/60"
                  } ${done ? "bg-gradient-to-br from-[oklch(0.78_0.14_50)] to-[oklch(0.55_0.18_340)]" : "bg-secondary/60"}`}
                >
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold ${
                      done ? "text-white" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Totaux */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
            <p className="font-display text-xl tabular-nums">
              {totalKm.toFixed(1)} <span className="text-xs text-muted-foreground">/ {GOAL_KM} km</span>
            </p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-sunset" style={{ width: `${kmPct}%` }} />
            </div>
          </div>
          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dénivelé</p>
            <p className="font-display text-xl tabular-nums">
              {totalDen.toLocaleString("fr-FR")}{" "}
              <span className="text-xs text-muted-foreground">/ {GOAL_DENIVELE.toLocaleString("fr-FR")} m</span>
            </p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-sunset" style={{ width: `${denPct}%` }} />
            </div>
          </div>
          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Étapes</p>
            <p className="font-display text-xl tabular-nums">
              {daysDone} <span className="text-xs text-muted-foreground">/ {TOTAL_DAYS}</span>
            </p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-sunset"
                style={{ width: `${(daysDone / TOTAL_DAYS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire du jour sélectionné */}
      <div className="mt-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Jour {selected + 1} · {formatDate(selectedDate)}
            </p>
            <p className="mt-1 font-display text-xl text-sunset">{STAGES[selected]}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSelected((s) => Math.max(0, s - 1))}
              disabled={selected === 0}
              className="rounded-full border border-white/40 px-3 py-1 text-sm hover:bg-primary/10 disabled:opacity-30"
            >
              ←
            </button>
            <button
              onClick={() => setSelected((s) => Math.min(TOTAL_DAYS - 1, s + 1))}
              disabled={selected === TOTAL_DAYS - 1}
              className="rounded-full border border-white/40 px-3 py-1 text-sm hover:bg-primary/10 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Kilomètres
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={current.km || ""}
              onChange={(e) => update(selected, { km: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="mt-1 w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 font-display text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dénivelé (m)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              value={current.denivele || ""}
              onChange={(e) => update(selected, { denivele: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="mt-1 w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 font-display text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Carnet du jour (optionnel)
          </span>
          <textarea
            value={current.note}
            onChange={(e) => update(selected, { note: e.target.value })}
            placeholder="Lever de soleil sur le Cinto, jambes lourdes mais cœur léger…"
            rows={4}
            className="mt-1 w-full resize-none rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <p className="mt-3 text-[10px] text-muted-foreground italic">
          Sauvegardé automatiquement sur cet appareil.
        </p>
      </div>
    </section>
  );
}
