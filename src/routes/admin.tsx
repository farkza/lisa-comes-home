import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Journal } from "@/components/Journal";
import { Gallery } from "@/components/Gallery";

// Journal et Gallery ici sont les versions originales avec les inputs
// (les fichiers que tu avais avant la modification read-only)

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Vérification…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="text-sm font-medium">Admin GR20</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              ← Voir le site
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-muted-foreground hover:text-foreground hover:border-white/40 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-20">
        {/* Gallery upload section */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 font-medium">Galerie</p>
            <h2 className="mt-1 font-display text-2xl">Ajouter des photos</h2>
          </div>
          <GalleryAdmin />
        </section>

        {/* Journal edit section */}
        <section className="mt-12">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 font-medium">Journal</p>
            <h2 className="mt-1 font-display text-2xl">Saisir les données du jour</h2>
          </div>
          <JournalAdmin />
        </section>
      </div>
    </main>
  );
}

// ─── Gallery admin (upload) ────────────────────────────────────────────────

import { useRef } from "react";

const BUCKET = "photos";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  author: string | null;
  created_at: string;
  url: string;
};

function GalleryAdmin() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
    if (error) { setLoading(false); return; }
    const withUrls: Photo[] = (data ?? []).map((p) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p.storage_path);
      return { ...p, url: pub.publicUrl };
    });
    setPhotos(withUrls);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("photos").insert({ storage_path: path, caption: caption || null, author: "Lisa" });
      if (insErr) throw insErr;
      setCaption("");
      await load();
    } catch (e) {
      console.error(e);
      alert("Oups, l'upload a échoué.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-3xl bg-card/50 backdrop-blur-xl border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Une petite légende…"
          className="flex-1 px-3 py-2 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white text-sm font-medium hover:opacity-90 transition">
          {uploading ? "Envoi…" : "📷 Ajouter"}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">Chargement…</p>
      ) : photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <figure key={p.id} className="relative rounded-xl overflow-hidden aspect-square border border-white/20">
              <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-full object-cover" />
              {p.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-white text-[10px] truncate">
                  {p.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Journal admin (saisie) ────────────────────────────────────────────────

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
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function JournalAdmin() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const kmRef = useRef<HTMLInputElement>(null);
  const deniveleRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("gr20_journal").select("*").eq("hiker", "lisa").order("day_index");
      if (error) return;
      const map: Record<number, DayEntry> = {};
      (data || []).forEach((row) => { map[row.day_index] = { day_index: row.day_index, stage: row.stage || "", km: Number(row.km) || 0, denivele: Number(row.denivele) || 0, note: row.note || "" }; });
      const loaded: DayEntry[] = Array.from({ length: TOTAL_DAYS }, (_, i) => ({ day_index: i, stage: map[i]?.stage || "", km: map[i]?.km || 0, denivele: map[i]?.denivele || 0, note: map[i]?.note || "" }));
      setDays(loaded);
      const today = new Date();
      const diff = Math.floor((today.getTime() - HIKE_START.getTime()) / 86400000);
      if (diff >= 0 && diff < TOTAL_DAYS) setSelected(diff);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const km = parseFloat(kmRef.current?.value ?? "") || 0;
    const denivele = parseInt(deniveleRef.current?.value ?? "") || 0;
    const note = noteRef.current?.value ?? "";
    try {
      const { error } = await supabase.from("gr20_journal").update({ km, denivele, note }).eq("hiker", "lisa").eq("day_index", selected);
      if (error) throw error;
      window.location.reload();
    } catch {
      alert("Erreur lors de la sauvegarde.");
      setSaving(false);
    }
  }

  const selectedDate = new Date(HIKE_START.getTime() + selected * 86400000);
  const entry = days[selected];
  const inputClass = "mt-1 w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 font-display text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form onSubmit={handleSave} className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Jour {selected + 1} · {formatDate(selectedDate)}
          </p>
          <p className="mt-1 font-display text-xl text-sunset">{entry?.stage || "—"}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="p-2 border rounded-lg hover:bg-white/10" onClick={() => setSelected((s) => Math.max(0, s - 1))}>←</button>
          <button type="button" className="p-2 border rounded-lg hover:bg-white/10" onClick={() => setSelected((s) => Math.min(TOTAL_DAYS - 1, s + 1))}>→</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kilomètres</span>
          <input key={`km-${selected}`} ref={kmRef} type="number" step="0.1" inputMode="decimal" defaultValue={entry?.km > 0 ? String(entry.km) : ""} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dénivelé (m)</span>
          <input key={`den-${selected}`} ref={deniveleRef} type="number" inputMode="numeric" defaultValue={entry?.denivele > 0 ? String(entry.denivele) : ""} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 block">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Carnet du jour</span>
        <textarea key={`note-${selected}`} ref={noteRef} defaultValue={entry?.note} placeholder="Lever de soleil sur le Cinto, jambes lourdes mais cœur léger…" rows={5} className="mt-1 w-full resize-y rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </label>

      <div className="mt-6">
        <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Enregistrement…" : "Enregistrer le jour"}
        </button>
      </div>
    </form>
  );
}
