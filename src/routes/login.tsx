import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

const ADMIN_EMAIL = "admin@gr20.local";

function Login() {
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Log de montage — vérifie que le composant se monte une seule fois
  useEffect(() => {
    console.log("[Login] composant monté");
    console.log("[Login] environment:", typeof window !== "undefined" ? "client" : "server");
    return () => {
      console.log("[Login] composant démonté");
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const password = passwordRef.current?.value ?? "";
    console.log("[Login] tentative de connexion, email:", ADMIN_EMAIL, "password length:", password.length);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

      console.log("[Login] réponse Supabase:", { data, authError });

      if (authError) {
        console.error("[Login] erreur auth:", authError.message, authError.status);
        setError("Mot de passe incorrect.");
        setLoading(false);
        return;
      }

      console.log("[Login] connexion OK, redirection vers /admin");
      navigate({ to: "/admin" });
    } catch (err) {
      console.error("[Login] exception inattendue:", err);
      setError("Erreur inattendue.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Retour
        </a>

        <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-white/40 p-8 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)]">
          <div className="mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="font-display text-2xl">Espace admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre le mot de passe pour continuer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Mot de passe
              </label>
              <input
                ref={passwordRef}
                type="password"
                autoFocus
                required
                placeholder="••••••••"
                className="w-full rounded-xl bg-background/60 border border-white/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[oklch(0.78_0.14_50)] to-[oklch(0.65_0.2_10)] text-white font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Entrer"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
