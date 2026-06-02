import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type DayEntry = {
  day_index: number;
  stage: string;
  km: number;
  denivele: number;
  note: string;
};

const HIKE_START = new Date("2026-06-04T00:00:00");
const TOTAL_DAYS = 15;

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const DayButton = React.memo(
  ({
    i,
    selected,
    done,
    onSelect,
  }: {
    i: number;
    selected: number;
    done: boolean;
    onSelect: (i: number) => void;
  }) => {
    const isSel = i === selected;

    return (
      <button
        type="button"
        onClick={() => onSelect(i)}
        aria-label={`Jour ${i + 1}`}
        className={`group relative aspect-square rounded-lg border transition-all ${
          isSel
            ? "border-primary scale-110 shadow-[0_0_12px_oklch(0.7_0.17_10/0.6)]"
            : "border-white/30 hover:border-primary/60"
        } ${
          done
            ? "bg-gradient-to-br from-[oklch(0.78_0.14_50)] to-[oklch(0.55_0.18_340)]"
            : "bg-secondary/60"
        }`}
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
  }
);

DayButton.displayName = "DayButton";

export function Journal() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("gr20_journal")
          .select("*")
          .eq("hiker", "lisa")
          .order("day_index");

        if (error) throw error;

        const map: Record<number, DayEntry> = {};

        (data || []).forEach((row) => {
          map[row.day_index] = {
            day_index: row.day_index,
            stage: row.stage || "",
            km: Number(row.km) || 0,
            denivele: Number(row.denivele) || 0,
            note: row.note || "",
          };
        });

        const loadedDays: DayEntry[] = Array.from(
          { length: TOTAL_DAYS },
          (_, i) => ({
            day_index: i,
            stage: map[i]?.stage || "",
            km: map[i]?.km || 0,
            denivele: map[i]?.denivele || 0,
            note: map[i]?.note || "",
          })
        );

        setDays(loadedDays);

        const today = new Date();
        const diffDays = Math.floor(
          (today.getTime() - HIKE_START.getTime()) / 86400000
        );

        if (diffDays >= 0 && diffDays < TOTAL_DAYS) {
          setSelected(diffDays);
        }
      } catch (err) {
        console.error("Erreur de chargement:", err);
      }
    })();
  }, []);

  const { totalKm, totalDen, daysDone } = useMemo(() => {
    let km = 0;
    let den = 0;
    let done = 0;

    days.forEach((e) => {
      km += e.km || 0;
      den += e.denivele || 0;
      if (e.km > 0 || e.denivele > 0 || e.note.trim() !== "") {
        done++;
      }
    });

    return { totalKm: km, totalDen: den, daysDone: done };
  }, [days]);

  const totalDays = days.length || TOTAL_DAYS;
  const progressPct = totalDays > 0 ? Math.round((daysDone / totalDays) * 100) : 0;
  const selectedDate = new Date(HIKE_START.getTime() + selected * 86400000);
  const selectedEntry = days[selected];

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
          <p className="font-display text-3xl text-sunset tabular-nums">{progressPct}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">parcouru</p>
        </div>
      </div>

      <div className="rounded-3xl bg-card/50 backdrop-blur-xl border border-white/40 p-5 sm:p-7 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
        <div className="relative">
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background:
                  "linear-gradient(90deg, oklch(0.78 0.14 50), oklch(0.65 0.2 10), oklch(0.55 0.18 340))",
              }}
            />
          </div>

          <div className="mt-4 grid grid-cols-8 sm:grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
            {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
              const e = days[i];
              const done = !!e && (e.km > 0 || e.denivele > 0 || e.note?.trim() !== "");
              return (
                <DayButton
                  key={i}
                  i={i}
                  selected={selected}
                  done={done}
                  onSelect={setSelected}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
            <p className="font-display text-xl tabular-nums">
              {totalKm.toFixed(1)}
              <span className="text-xs text-muted-foreground"> km</span>
            </p>
          </div>

          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dénivelé</p>
            <p className="font-display text-xl tabular-nums">
              {totalDen.toLocaleString("fr-FR")}
              <span className="text-xs text-muted-foreground"> m</span>
            </p>
          </div>

          <div className="rounded-xl bg-background/40 border border-white/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Étapes</p>
            <p className="font-display text-xl tabular-nums">
              {daysDone}
              <span className="text-xs text-muted-foreground"> / {totalDays}</span>
            </p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-sunset"
                style={{ width: `${(daysDone / Math.max(totalDays, 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Day detail card — read-only */}
      <div className="mt-5 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Jour {selected + 1} · {formatDate(selectedDate)}
            </p>
            <p className="mt-1 font-display text-xl text-sunset">
              {selectedEntry?.stage || "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 border rounded-lg hover:bg-white/10"
              onClick={() => setSelected((s) => Math.max(0, s - 1))}
            >
              ←
            </button>
            <button
              type="button"
              className="p-2 border rounded-lg hover:bg-white/10"
              onClick={() => setSelected((s) => Math.min(totalDays - 1, s + 1))}
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-background/40 border border-white/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kilomètres</p>
            <p className="font-display text-2xl tabular-nums mt-1">
              {selectedEntry?.km > 0 ? selectedEntry.km.toFixed(1) : "—"}
              {selectedEntry?.km > 0 && (
                <span className="text-xs text-muted-foreground"> km</span>
              )}
            </p>
          </div>

          <div className="rounded-xl bg-background/40 border border-white/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dénivelé</p>
            <p className="font-display text-2xl tabular-nums mt-1">
              {selectedEntry?.denivele > 0
                ? selectedEntry.denivele.toLocaleString("fr-FR")
                : "—"}
              {selectedEntry?.denivele > 0 && (
                <span className="text-xs text-muted-foreground"> m</span>
              )}
            </p>
          </div>
        </div>

        {selectedEntry?.note ? (
          <div className="mt-5 rounded-xl bg-background/40 border border-white/30 px-4 py-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Carnet du jour
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {selectedEntry.note}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground italic">
            Aucune note pour ce jour.
          </p>
        )}
      </div>
    </section>
  );
}
