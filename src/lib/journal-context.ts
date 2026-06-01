import { useEffect, useMemo, useState } from "react";
import { useJournalContext } from "../lib/journal-context";

type DayEntry = {
  km: number;
  denivele: number;
  note: string;
};

const HIKE_START = new Date("2026-06-04T00:00:00");
const TOTAL_DAYS = 15;
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
  const [entries, setEntries] = useState<Record<number, DayEntry>>(loadEntries);
  const [selected, setSelected] = useState(0);

  const { setSelectedStage, setCompletedStages } = useJournalContext();

  // Calcul du jour actuel au démarrage
  useEffect(() => {
    const today = new Date();
    const diffTime = today.getTime() - HIKE_START.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let initialDay = 0;
    if (diffDays >= 0 && diffDays < TOTAL_DAYS) {
      initialDay = diffDays;
    }

    setSelected(initialDay);
    setSelectedStage(initialDay);
  }, [setSelectedStage]);

  // Sync selected stage quand il change
  useEffect(() => {
    setSelectedStage(selected);
  }, [selected, setSelectedStage]);

  // Mise à jour des étapes complétées
  useEffect(() => {
    const completed = new Set<number>();
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const e = entries[i];
      if (e && (e.km > 0 || e.denivele > 0 || e.note?.trim())) {
        completed.add(i);
      }
    }
    setCompletedStages(completed);
  }, [entries, setCompletedStages]);

  const update = (idx: number, patch: Partial<DayEntry>) => {
    setEntries((prev) => {
      const base: DayEntry = prev[idx] ?? { km: 0, denivele: 0, note: "" };
      const next = { ...prev, [idx]: { ...base, ...patch } };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Erreur sauvegarde localStorage", e);
      }
      return next;
    });
  };

  const handleSelectDay = (i: number) => {
    setSelected(i);
    document.querySelector("[aria-label='Carte du GR20 en Corse']")
      ?.closest("section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const { totalKm, totalDen, daysDone } = useMemo(() => {
    let km = 0, den = 0, dd = 0;
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
  const overallPct = Math.round((kmPct + denPct) / 2);

  const selectedDate = new Date(HIKE_START.getTime() + selected * 86400000);
  const current = entries[selected] ?? { km: 0, denivele: 0, note: "" };

  return (
    // ... reste du JSX inchangé (je ne le recopie pas entièrement pour brevité)
    // Tu peux garder ton JSX tel quel, il est bien fait.
  );
}