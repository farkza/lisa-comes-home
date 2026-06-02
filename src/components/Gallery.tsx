import { useEffect, useState } from "react";
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
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "700ms" }}>
      <h2 className="font-display text-3xl mb-6">Galerie de l'aventure 📸</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center italic">
          Aucune photo pour l'instant.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p) => (
            <figure
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-white/40 bg-card/40 aspect-square cursor-pointer"
              onClick={() => setLightbox(p)}
            >
              <img
                src={p.url}
                alt={p.caption ?? "Photo de Lisa"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {(p.caption || p.author) && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {p.caption && <span className="block font-medium">{p.caption}</span>}
                  {p.author && <span className="block opacity-70 mt-0.5">— {p.author}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? "Photo de Lisa"}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            {(lightbox.caption || lightbox.author) && (
              <div className="bg-card/90 backdrop-blur px-5 py-4">
                {lightbox.caption && (
                  <p className="text-sm font-medium">{lightbox.caption}</p>
                )}
                {lightbox.author && (
                  <p className="text-xs text-muted-foreground mt-0.5">— {lightbox.author}</p>
                )}
              </div>
            )}
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
