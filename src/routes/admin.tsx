import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

// ─── Calcul automatique du stage_day ──────────────────────────────────────
const HIKE_START = new Date("2026-06-04T12:00:00");
const HIKE_END = new Date("2026-06-18T12:00:00");
const TOTAL_DAYS = 15;

function getAutoStageDay(): number {
  const now = new Date();
  if (now < HIKE_START) return -1; // avant l'aventure
  if (now > HIKE_END) return 15;  // après l'aventure
  const diff = Math.floor((now.getTime() - HIKE_START.getTime()) / 86400000);
  return Math.min(Math.max(diff, 0), TOTAL_DAYS - 1);
}

function stageDayLabel(v: number): string {
  if (v === -1) return "Avant l'aventure";
  if (v === 15) return "Après l'aventure";
  return `Jour ${v + 1} (${new Date(HIKE_START.getTime() + v * 86400000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })})`;
}

// ─── Top bar avatar ────────────────────────────────────────────────────────
function TopBarAvatar() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const { data } = supabase.storage.from("profile").getPublicUrl("lisa/avatar.jpg");
    if (data?.publicUrl) setUrl(`${data.publicUrl}?t=${Date.now()}`);
  }, []);
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden border border-white/30 bg-gradient-to-br from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] flex-shrink-0">
      {url ? (
        <img src={url} alt="Profil" className="w-full h-full object-cover" onError={() => setUrl(null)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Admin page ────────────────────────────────────────────────────────────
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
            <TopBarAvatar />
            <span className="text-sm font-medium">Lisaaaaaaa</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition">
              ← Voir le site
            </Link>
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
        {/* Profile picture section */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 font-medium">Profil</p>
            <h2 className="mt-1 font-display text-2xl">Photo de profil</h2>
          </div>
          <ProfileAdmin />
        </section>

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

// ─── Profile admin ─────────────────────────────────────────────────────────
const PROFILE_BUCKET = "profile";
const PROFILE_PATH = "lisa/avatar.jpg";

function ProfileAdmin() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(PROFILE_PATH);
    if (data?.publicUrl) {
      setCurrentUrl(`${data.publicUrl}?t=${Date.now()}`);
    }
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Merci de sélectionner une image (JPG, PNG…)");
      return;
    }
    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(PROFILE_PATH, arrayBuffer, {
          cacheControl: "0",
          contentType: file.type,
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(PROFILE_PATH);
      if (data?.publicUrl) {
        setCurrentUrl(`${data.publicUrl}?t=${Date.now()}`);
      }
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
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 bg-muted flex-shrink-0">
          {currentUrl ? (
            <img src={currentUrl} alt="Photo de profil" className="w-full h-full object-cover" onError={() => setCurrentUrl(null)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">🧍</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Format JPG ou PNG · Remplace automatiquement l'ancienne photo.</p>
          <label
            htmlFor="profile-file-input"
            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white text-sm font-medium hover:opacity-90 transition w-fit cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? "Envoi…" : "🖼️ Changer la photo"}
          </label>
          <input
            id="profile-file-input"
            type="file"
            accept="image/*"
            disabled={uploading}
            style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Gallery admin ─────────────────────────────────────────────────────────
const BUCKET = "photos";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  author: string | null;
  created_at: string;
  stage_day: number | null;
  url: string;
};

function GalleryAdmin() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sélection manuelle du stage_day (pré-rempli avec le jour automatique)
  const [selectedStageDay, setSelectedStageDay] = useState<number>(getAutoStageDay());

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur chargement photos :", error);
      setLoading(false);
      return;
    }
    const withUrls: Photo[] = (data ?? []).map((p: any) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p.storage_path);
      return { ...p, url: pub.publicUrl };
    });
    setPhotos(withUrls);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadOne(file: File, sharedCaption: string | null): Promise<boolean> {
    if (!file.type.startsWith("image/")) return false;
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, {
          cacheControl: "3600",
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("photos")
        .insert({
          storage_path: path,
          caption: sharedCaption,
          author: "Lisa",
          stage_day: selectedStageDay,
        } as any);
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }
      return true;
    } catch (e) {
      console.error("Upload échoué :", file.name, e);
      return false;
    }
  }

  async function handleFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      alert("Merci de sélectionner des images.");
      return;
    }
    setUploading(true);
    setProgress({ done: 0, total: images.length });
    const sharedCaption = caption.trim() || null;
    let ok = 0;
    let fail = 0;
    // Parallélisme limité (3 à la fois) pour aller plus vite sans surcharger
    const queue = [...images];
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length > 0) {
        const f = queue.shift();
        if (!f) break;
        const success = await uploadOne(f, sharedCaption);
        if (success) ok++; else fail++;
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    });
    await Promise.all(workers);
    setCaption("");
    await load();
    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (fail > 0) alert(`${ok} photo(s) ajoutée(s), ${fail} en échec.`);
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(`Supprimer cette photo${photo.caption ? ` "${photo.caption}"` : ""} ?`)) return;
    try {
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      if (storageErr) throw storageErr;
      const { error: dbErr } = await supabase.from("photos").delete().eq("id", photo.id);
      if (dbErr) throw dbErr;
      await load();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    }
  }

  return (
    <div className="rounded-3xl bg-card/50 backdrop-blur-xl border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
      {/* Sélecteur manuel du stage_day */}
      <div className="mb-5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
          Quand a été prise cette photo ?
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedStageDay(-1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              selectedStageDay === -1
                ? "bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white border-transparent"
                : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-foreground"
            }`}
          >
            Avant
          </button>
          {Array.from({ length: 15 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedStageDay(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selectedStageDay === i
                  ? "bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white border-transparent"
                  : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-foreground"
              }`}
            >
              J{i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedStageDay(15)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              selectedStageDay === 15
                ? "bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white border-transparent"
                : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-foreground"
            }`}
          >
            Après
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Sélectionné : <span className="text-foreground font-medium">{stageDayLabel(selectedStageDay)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Une petite légende…"
          className="w-full px-3 py-2 rounded-xl bg-background/60 border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <label
          htmlFor="gallery-file-input"
          className={`inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white text-sm font-medium hover:opacity-90 transition cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {uploading ? "Envoi…" : "📷 Ajouter une photo"}
        </label>
        <input
          id="gallery-file-input"
          type="file"
          accept="image/*"
          disabled={uploading}
          style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">Aucune photo pour l'instant.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <figure key={p.id} className="relative rounded-xl overflow-hidden aspect-square border border-white/20 group">
              <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-full object-cover" />
              {(p.caption || typeof p.stage_day === "number") && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-white text-[10px] truncate">
                  {typeof p.stage_day === "number" && p.stage_day >= 0 && p.stage_day < 15
                    ? `J${p.stage_day + 1}`
                    : p.stage_day === -1
                    ? "Avant"
                    : p.stage_day === 15
                    ? "Après"
                    : ""}
                  {p.caption ? ` · ${p.caption}` : ""}
                </figcaption>
              )}
              <button
                type="button"
                onClick={() => handleDelete(p)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-white text-xs flex items-center justify-center transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                title="Supprimer"
              >
                ✕
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Journal admin ─────────────────────────────────────────────────────────
type DayEntry = {
  day_index: number;
  stage: string;
  km: number;
  denivele: number;
  note: string;
};

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function JournalAdmin() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");
  const kmRef = useRef<HTMLInputElement>(null);
  const deniveleRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("gr20_journal")
        .select("*")
        .eq("hiker", "lisa")
        .order("day_index");
      if (error) {
        console.error("Erreur chargement journal :", error);
        return;
      }
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
      const loaded: DayEntry[] = Array.from({ length: TOTAL_DAYS }, (_, i) => ({
        day_index: i,
        stage: map[i]?.stage || "",
        km: map[i]?.km || 0,
        denivele: map[i]?.denivele || 0,
        note: map[i]?.note || "",
      }));
      setDays(loaded);
      const today = new Date();
      const diff = Math.floor((today.getTime() - HIKE_START.getTime()) / 86400000);
      if (diff >= 0 && diff < TOTAL_DAYS) setSelected(diff);
    })();
  }, []);

  async function handleClear() {
    if (!confirm("Effacer les données de ce jour ?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gr20_journal").upsert(
        { hiker: "lisa", day_index: selected, stage: days[selected]?.stage || "", km: 0, denivele: 0, note: "" },
        { onConflict: "hiker,day_index" }
      );
      if (error) throw error;
      setDays((prev) => prev.map((d) => d.day_index === selected ? { ...d, km: 0, denivele: 0, note: "" } : d));
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("idle");
    const km = parseFloat((kmRef.current?.value ?? "").replace(",", ".")) || 0;
    const denivele = parseInt(deniveleRef.current?.value ?? "") || 0;
    const note = noteRef.current?.value?.trim() ?? "";
    const stage = days[selected]?.stage || "";
    try {
      const { error } = await supabase.from("gr20_journal").upsert(
        { hiker: "lisa", day_index: selected, stage, km, denivele, note },
        { onConflict: "hiker,day_index" }
      );
      if (error) throw error;
      setDays((prev) => prev.map((d) => d.day_index === selected ? { ...d, km, denivele, note } : d));
      setSaveStatus("ok");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      console.error("Erreur sauvegarde :", e);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const selectedDate = new Date(HIKE_START.getTime() + selected * 86400000);
  const entry = days[selected];
  const inputClass =
    "mt-1 w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 font-display text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form
      onSubmit={handleSave}
      className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]"
    >
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Jour {selected + 1} · {formatDate(selectedDate)}
          </p>
          <p className="mt-1 font-display text-xl text-sunset">{entry?.stage || "—"}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="p-2 border rounded-lg hover:bg-white/10 disabled:opacity-40"
            disabled={selected === 0}
            onClick={() => setSelected((s) => Math.max(0, s - 1))}
          >←</button>
          <button
            type="button"
            className="p-2 border rounded-lg hover:bg-white/10 disabled:opacity-40"
            disabled={selected === TOTAL_DAYS - 1}
            onClick={() => setSelected((s) => Math.min(TOTAL_DAYS - 1, s + 1))}
          >→</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kilomètres</span>
          <input
            key={`km-${selected}`}
            ref={kmRef}
            type="text"
            step="0.01"
            min="0"
            inputMode="decimal"
            pattern="[0-9]+([.,][0-9]+)?"
            defaultValue={entry?.km > 0 ? String(entry.km) : ""}
            placeholder="ex : 12.80"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dénivelé (m)</span>
          <input
            key={`den-${selected}`}
            ref={deniveleRef}
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={entry?.denivele > 0 ? String(entry.denivele) : ""}
            placeholder="0"
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-5 block">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Carnet du jour</span>
        <textarea
          key={`note-${selected}`}
          ref={noteRef}
          defaultValue={entry?.note}
          placeholder="Lever de soleil sur le Cinto, jambes lourdes mais cœur léger…"
          rows={5}
          className="mt-1 w-full resize-y rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement…" : "Enregistrer le jour"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleClear}
          className="px-4 py-3 rounded-2xl border border-white/20 text-muted-foreground text-sm hover:border-red-400 hover:text-red-400 transition disabled:opacity-50"
        >
          🗑 Effacer
        </button>
        {saveStatus === "ok" && <span className="text-sm text-green-400">✓ Sauvegardé !</span>}
        {saveStatus === "error" && <span className="text-sm text-red-400">✗ Erreur lors de la sauvegarde.</span>}
      </div>
    </form>
  );
}
