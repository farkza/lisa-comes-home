import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GR20_STAGES } from "@/lib/gr20-stages";
import { Skeleton } from "@/components/ui/skeleton";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  author: string | null;
  created_at: string;
  stage_day: number | null;
  url: string;
};

type Reaction = { id: string; photo_id: string; emoji: string; author: string };

const BUCKET = "photos";
const EMOJIS = ["❤️", "🔥", "🥹", "🏔️", "👏"];
const NAME_KEY = "lisa-visitor-name";

type Filter = "all" | "before" | "after" | number; // number = day index

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [visitorName, setVisitorName] = useState<string>("");

  useEffect(() => {
    setVisitorName(localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: ph }, { data: rx }] = await Promise.all([
      supabase.from("photos").select("*").order("created_at", { ascending: false }),
      supabase.from("photo_reactions").select("*"),
    ]);
    const withUrls: Photo[] = (ph ?? []).map((p: any) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p.storage_path);
      return { ...p, url: pub.publicUrl };
    });
    setPhotos(withUrls);
    setReactions((rx as Reaction[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return photos;
    if (filter === "before") return photos.filter((p) => p.stage_day === -1);
    if (filter === "after") return photos.filter((p) => p.stage_day === 15);
    return photos.filter((p) => p.stage_day === filter);
  }, [photos, filter]);

  async function react(photo: Photo, emoji: string) {
    let name = visitorName.trim();
    if (!name) {
      name = (prompt("Ton prénom (pour signer ta réaction) ?") || "").trim();
      if (!name) return;
      localStorage.setItem(NAME_KEY, name);
      setVisitorName(name);
    }
    // toggle
    const mine = reactions.find(
      (r) => r.photo_id === photo.id && r.emoji === emoji && r.author.toLowerCase() === name.toLowerCase()
    );
    if (mine) {
      setReactions((p) => p.filter((r) => r.id !== mine.id));
      await supabase.from("photo_reactions").delete().eq("id", mine.id);
    } else {
      const optimistic: Reaction = { id: `tmp-${Date.now()}`, photo_id: photo.id, emoji, author: name };
      setReactions((p) => [...p, optimistic]);
      const { data } = await supabase
        .from("photo_reactions")
        .insert({ photo_id: photo.id, emoji, author: name })
        .select()
        .single();
      if (data) {
        setReactions((p) => p.map((r) => (r.id === optimistic.id ? (data as Reaction) : r)));
      }
    }
  }

  function counts(photo: Photo) {
    const m: Record<string, { n: number; mine: boolean; authors: string[] }> = {};
    const name = visitorName.toLowerCase();
    reactions.filter((r) => r.photo_id === photo.id).forEach((r) => {
      const k = r.emoji;
      if (!m[k]) m[k] = { n: 0, mine: false, authors: [] };
      m[k].n++;
      m[k].authors.push(r.author);
      if (name && r.author.toLowerCase() === name) m[k].mine = true;
    });
    return m;
  }

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "700ms" }}>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-display text-3xl">Galerie de l'aventure 📸</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} photo{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Filters */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>Tout</Chip>
        <Chip active={filter === "before"} onClick={() => setFilter("before")}>Avant</Chip>
        {GR20_STAGES.map((s) => (
          <Chip key={s.day} active={filter === s.day - 1} onClick={() => setFilter(s.day - 1)}>
            J{s.day} · {s.to}
          </Chip>
        ))}
        <Chip active={filter === "after"} onClick={() => setFilter("after")}>Après</Chip>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center italic py-8">
          Aucune photo pour ce filtre.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const cs = counts(p);
            return (
              <figure
                key={p.id}
                className="group relative rounded-2xl overflow-hidden border border-white/40 bg-card/40 aspect-square cursor-pointer"
                onClick={() => setLightbox(p)}
              >
                <img
                  src={p.url}
                  alt={p.caption ?? "Photo de Lisa"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* reactions overlay */}
                {Object.keys(cs).length > 0 && (
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap pointer-events-none">
                    {Object.entries(cs).map(([emo, info]) => (
                      <span
                        key={emo}
                        className="px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] backdrop-blur"
                      >
                        {emo} {info.n}
                      </span>
                    ))}
                  </div>
                )}
                {p.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="block font-medium">{p.caption}</span>
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? "Photo de Lisa"}
              className="w-full max-h-[65vh] object-contain bg-black"
            />
            <div className="bg-card/90 backdrop-blur px-5 py-4">
              {lightbox.caption && <p className="text-sm font-medium">{lightbox.caption}</p>}
              {typeof lightbox.stage_day === "number" && lightbox.stage_day >= 0 && lightbox.stage_day < 15 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Jour {lightbox.stage_day + 1} · {GR20_STAGES[lightbox.stage_day]?.to}
                </p>
              )}
              {/* reaction picker */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {EMOJIS.map((emo) => {
                  const info = counts(lightbox)[emo];
                  const mine = info?.mine;
                  return (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => react(lightbox, emo)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        mine
                          ? "bg-primary/20 border-primary text-foreground"
                          : "bg-background/60 border-white/20 hover:border-primary/50"
                      }`}
                    >
                      {emo} {info?.n ?? 0}
                    </button>
                  );
                })}
              </div>
              {/* who reacted */}
              {Object.entries(counts(lightbox)).some(([, i]) => i.authors.length > 0) && (
                <div className="mt-3 text-[11px] text-muted-foreground space-y-0.5">
                  {Object.entries(counts(lightbox)).map(([emo, info]) => (
                    <p key={emo}>
                      {emo} {info.authors.join(", ")}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition text-lg leading-none"
              onClick={() => setLightbox(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background/60 border-white/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
