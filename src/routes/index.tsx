import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import corsica from "@/assets/corsica.jpg";
import { Journal } from "@/components/Journal";
import "../styles.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retour de Lisa 🍑" },
      { name: "description", content: "Compte à rebours jusqu'au retour de Lisa du GR20" },
    ],
  }),
  component: Index,
});

const DEPART = new Date("2026-06-04T00:00:00");
const RETOUR = new Date("2026-06-19T23:59:59");

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, now };
}

function Unit({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <div
      className="animate-fade-up flex flex-col items-center rounded-2xl bg-card/60 backdrop-blur-xl border border-white/40 px-3 py-4 sm:px-5 sm:py-6 shadow-[0_10px_40px_-10px_oklch(0.62_0.18_15/0.25)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="font-display text-4xl sm:text-6xl font-semibold tabular-nums text-sunset leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Index() {
  const { days, hours, minutes, seconds, now } = useCountdown(RETOUR);
  const totalTrip = RETOUR.getTime() - DEPART.getTime();
  const elapsed = Math.min(Math.max(0, now.getTime() - DEPART.getTime()), totalTrip);
  const progress = (elapsed / totalTrip) * 100;
  const isAway = now >= DEPART && now <= RETOUR;
  const isBack = now > RETOUR;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={corsica}
          alt=""
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Floating peach */}
      <div className="pointer-events-none absolute top-20 right-6 sm:right-16 text-6xl sm:text-8xl animate-float select-none">
        🍑
      </div>
      <div className="pointer-events-none absolute top-1/3 -left-4 text-5xl animate-glow select-none">
        ✨
      </div>

      <div className="relative mx-auto max-w-2xl px-5 pt-20 pb-16 sm:pt-28">
        <div className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80 font-medium">
            GR20 · Corse
          </p>
          <h1 className="mt-3 font-display text-5xl sm:text-7xl font-semibold leading-[0.95]">
            Retour de
            <br />
            <span className="text-sunset italic">Lisa</span>
            <span className="inline-block ml-2 text-4xl sm:text-5xl">🍑</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md">
            {isBack
              ? "Elle est rentrée ! Va lui faire un câlin. 💛"
              : isAway
              ? "Elle est sur les crêtes corses en ce moment même. Plus que…"
              : "Le grand départ approche. Profitez bien d'ici là."}
          </p>
        </div>

        {/* Countdown grid */}
        <div className="mt-10 grid grid-cols-4 gap-2 sm:gap-3">
          <Unit value={days} label="jours" delay={100} />
          <Unit value={hours} label="heures" delay={200} />
          <Unit value={minutes} label="min" delay={300} />
          <Unit value={seconds} label="sec" delay={400} />
        </div>

        {/* Progress */}
        <div className="mt-10 animate-fade-up" style={{ animationDelay: "500ms" }}>
          <div className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <span>4 juin</span>
            <span className="text-primary font-medium">{Math.round(progress)}%</span>
            <span>19 juin</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, oklch(0.78 0.14 50), oklch(0.65 0.2 10), oklch(0.55 0.18 340))",
                boxShadow: "0 0 20px oklch(0.7 0.17 10 / 0.5)",
              }}
            />
          </div>
        </div>

        {/* Stats card */}
        <div
          className="mt-10 animate-fade-up rounded-3xl bg-card/50 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]"
          style={{ animationDelay: "600ms" }}
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Distance</p>
              <p className="font-display text-2xl mt-1">~180 km</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Dénivelé</p>
              <p className="font-display text-2xl mt-1">+12 000 m</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Étapes</p>
              <p className="font-display text-2xl mt-1">16 jours</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Câlins en attente</p>
              <p className="font-display text-2xl mt-1">∞</p>
            </div>
          </div>
        </div>

        <Journal />

        <p className="mt-12 text-center text-sm text-muted-foreground italic animate-fade-up" style={{ animationDelay: "800ms" }}>
          « Les montagnes te rendront ce que tu leur donnes. »
        </p>
      </div>
    </main>
  );
}
