import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GR20_STAGES } from "@/lib/gr20-stages";
import { generateSouvenirPDF } from "@/lib/pdf-souvenir";

function useCountUp(target: number, durationMs = 1500, start = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    const from = 0;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return v;
}

const RETOUR = new Date("2026-06-19T00:00:00");

export function FinalStats() {
  const [totalKm, setTotalKm] = useState(0);
  const [totalDen, setTotalDen] = useState(0);
  const [daysDone, setDaysDone] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isOver = new Date() >= RETOUR;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: journal }, { count }] = await Promise.all([
        supabase.from("gr20_journal").select("*").eq("hiker", "lisa"),
        supabase.from("photos").select("*", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      let km = 0, den = 0, done = 0;
      (journal ?? []).forEach((d: any) => {
        const k = Number(d.km) || 0;
        const dv = Number(d.denivele) || 0;
        km += k;
        den += dv;
        if (k > 0 || dv > 0 || (d.note ?? "").trim() !== "") done++;
      });
      setTotalKm(km);
      setTotalDen(den);
      setDaysDone(done);
      setPhotoCount(count ?? 0);
    }
    load();

    const ch = supabase
      .channel("final-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "gr20_journal" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, load)
      .subscribe();

    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const km = useCountUp(totalKm, 1800, visible);
  const den = useCountUp(totalDen, 2000, visible);
  const dn = useCountUp(daysDone, 1200, visible);
  const ph = useCountUp(photoCount, 1500, visible);

  async function handlePDF() {
    setGenerating(true);
    try {
      await generateSouvenirPDF();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setGenerating(false);
    }
  }

  

  return (
    <section ref={ref} className="mt-12 animate-fade-up" style={{ animationDelay: "850ms" }}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 font-medium">L'aventure en chiffres</p>
        <h2 className="mt-2 font-display text-3xl">{isOver ? "Quelle traversée 🏔" : "Lisa a déjà…"}</h2>
      </div>
      <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
        <div className="grid grid-cols-2 gap-6">
          <Stat value={km.toFixed(2)} unit="km" label="parcourus" />
          <Stat value={Math.round(den).toLocaleString("fr-FR")} unit="m" label="de dénivelé +" />
          <Stat value={Math.round(dn).toString()} unit={`/ ${GR20_STAGES.length}`} label="étapes bouclées" />
          <Stat value={Math.round(ph).toString()} unit="" label="photos partagées" />
        </div>
        <button
          type="button"
          onClick={handlePDF}
          disabled={generating}
          className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.55_0.18_340)] text-white font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {generating ? "Préparation du carnet…" : "📖 Télécharger le carnet souvenir (PDF)"}
        </button>
      </div>
    </section>
  );
}

function Stat({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl sm:text-4xl text-sunset tabular-nums">
        {value}
        {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
