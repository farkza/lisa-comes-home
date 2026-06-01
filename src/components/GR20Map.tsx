import { useEffect, useState } from "react";
import { GR20_STAGES, getCurrentStageIndex } from "@/lib/gr20-stages";

export function GR20Map() {
  const [Comp, setComp] = useState<null | React.FC>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ MapContainer, TileLayer, Polyline, CircleMarker, Popup }, L] = await Promise.all([
        import("react-leaflet"),
        import("leaflet"),
      ]);
      await import("leaflet/dist/leaflet.css");

      // Suppress default icon issues (we use CircleMarker)
      void L;

      const currentIdx = getCurrentStageIndex();
      const positions = GR20_STAGES.map((s) => [s.lat, s.lon] as [number, number]);
      const center: [number, number] = [42.1, 9.05];

      const Inner: React.FC = () => (
        <MapContainer
          center={center}
          zoom={9}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", borderRadius: "1.25rem" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={positions} pathOptions={{ color: "#e85d3a", weight: 3, opacity: 0.8 }} />
          {GR20_STAGES.map((s, i) => {
            const isCurrent = i === currentIdx;
            return (
              <CircleMarker
                key={s.day}
                center={[s.lat, s.lon]}
                radius={isCurrent ? 11 : 6}
                pathOptions={{
                  color: isCurrent ? "#fff" : "#c9532e",
                  weight: isCurrent ? 3 : 1.5,
                  fillColor: isCurrent ? "#ffb347" : "#e85d3a",
                  fillOpacity: 1,
                }}
                className={isCurrent ? "animate-pulse" : undefined}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong>Jour {s.day}</strong> — {s.from} → {s.to}
                    <br />
                    <span style={{ fontSize: 12, color: "#666" }}>
                      Alt. {s.altitude} m · +{s.ascent} m / -{s.descent} m · {s.distance} km
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      );

      if (!cancelled) setComp(() => Inner);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-12 animate-fade-up" style={{ animationDelay: "650ms" }}>
      <h2 className="font-display text-3xl mb-4">La traversée</h2>
      <div className="h-[420px] w-full rounded-3xl overflow-hidden border border-white/40 shadow-[0_20px_60px_-20px_oklch(0.62_0.18_15/0.3)] bg-card/50">
        {Comp ? <Comp /> : <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">Chargement de la carte…</div>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">15 étapes · Calenzana → Conca · l'étape du jour clignote en orange.</p>
    </section>
  );
}
