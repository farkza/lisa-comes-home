import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  author: string | null;
  created_at: string;
  url: string;
};

const BUCKET = "photos";

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [author, setAuthor] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const withUrls: Photo[] = (data ?? []).map((p) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p.storage_path);
      return { ...p, url: pub.publicUrl };
    });
    setPhotos(withUrls);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("photos").insert({
        storage_path: path,
        caption: caption || null,
        author: author || null,
      });
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
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "700ms" }}>
      <h2 className="font-display text-3xl mb-4">Galerie de l'aventure 📸</h2>

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
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground text-center">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground text-center italic">
          Aucune photo pour l'instant. Lance la galerie en ajoutant la première !
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p) => (
            <figure
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-white/40 bg-card/40 aspect-square"
            >
              <img
                src={p.url}
                alt={p.caption ?? "Photo de Lisa"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {(p.caption || p.author) && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs">
                  {p.caption}
                  {p.author && <span className="block opacity-70">— {p.author}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
