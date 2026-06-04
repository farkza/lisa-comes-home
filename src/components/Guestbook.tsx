import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Entry = { id: string; author: string; message: string; created_at: string };

const NAME_KEY = "lisa-visitor-name";

export function Guestbook() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data as Entry[]) ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    setAuthor(localStorage.getItem(NAME_KEY) ?? "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = author.trim();
    const m = message.trim();
    if (!a || !m) return;
    setSending(true);
    const { error } = await supabase.from("guestbook").insert({ author: a, message: m });
    setSending(false);
    if (error) {
      alert("Oups, message non envoyé.");
      return;
    }
    localStorage.setItem(NAME_KEY, a);
    setMessage("");
    load();
  }

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "800ms" }}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80 font-medium">Livre d'or</p>
        <h2 className="mt-2 font-display text-3xl">Un mot pour Lisa 💌</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Laisse-lui un message d'encouragement — elle les lira le soir au refuge.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]"
      >
        <div className="grid gap-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ton prénom"
            maxLength={40}
            required
            className="w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Un mot, une blague, un câlin virtuel…"
            rows={3}
            maxLength={500}
            required
            className="w-full resize-y rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-start px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {sending ? "Envoi…" : "Envoyer 💛"}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {!loaded ? (
          <p className="text-sm text-muted-foreground text-center">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center italic">Sois la première personne à écrire un mot ✨</p>
        ) : (
          entries.map((e) => (
            <article key={e.id} className="rounded-2xl bg-card/40 backdrop-blur-md border border-white/30 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{e.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                — <span className="text-sunset font-medium">{e.author}</span>
                {" · "}
                {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
