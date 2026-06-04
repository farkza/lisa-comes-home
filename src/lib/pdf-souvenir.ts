import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { GR20_STAGES } from "./gr20-stages";

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateSouvenirPDF() {
  const [{ data: journal }, { data: photos }] = await Promise.all([
    supabase.from("gr20_journal").select("*").eq("hiker", "lisa").order("day_index"),
    supabase.from("photos").select("*").order("created_at", { ascending: true }),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Cover
  doc.setFillColor(255, 245, 230);
  doc.rect(0, 0, W, H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(60, 30, 20);
  doc.text("Le GR20 de Lisa", W / 2, 80, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("4 — 18 juin 2026", W / 2, 95, { align: "center" });
  doc.text("180 km · +12 000 m · 15 jours", W / 2, 105, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(120, 80, 60);
  doc.text("Carnet de bord — souvenir", W / 2, H - 25, { align: "center" });

  // Journal pages — one stage per page
  let totalKm = 0;
  let totalDen = 0;
  const byDay: Record<number, any> = {};
  (journal ?? []).forEach((d: any) => {
    byDay[d.day_index] = d;
    totalKm += Number(d.km) || 0;
    totalDen += Number(d.denivele) || 0;
  });

  for (const stage of GR20_STAGES) {
    const j = byDay[stage.day - 1];
    doc.addPage();
    doc.setTextColor(60, 30, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Jour ${stage.day} · ${stage.date}`, 20, 20);
    doc.setFontSize(20);
    doc.text(`${stage.from} → ${stage.to}`, 20, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${j?.km ?? stage.distance} km · +${j?.denivele ?? stage.ascent} m · altitude ${stage.altitude} m`, 20, 42);
    if (j?.note) {
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(j.note, W - 40);
      doc.text(lines, 20, 56);
    } else {
      doc.setTextColor(160, 140, 130);
      doc.setFont("helvetica", "italic");
      doc.text("(pas de note pour ce jour)", 20, 56);
    }
  }

  // Stats page
  doc.addPage();
  doc.setTextColor(60, 30, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("L'aventure en chiffres", W / 2, 40, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  const lines = [
    `${totalKm.toFixed(1)} km parcourus`,
    `+${Math.round(totalDen).toLocaleString("fr-FR")} m de dénivelé`,
    `${GR20_STAGES.length} étapes`,
    `${(photos ?? []).length} photos partagées`,
  ];
  lines.forEach((l, i) => doc.text(l, W / 2, 70 + i * 12, { align: "center" }));

  // Photo pages — 2 per page
  const ps = photos ?? [];
  for (let i = 0; i < ps.length; i += 2) {
    doc.addPage();
    for (let k = 0; k < 2 && i + k < ps.length; k++) {
      const p = ps[i + k];
      const { data: pub } = supabase.storage.from("photos").getPublicUrl(p.storage_path);
      const dataUrl = await loadImageAsDataURL(pub.publicUrl);
      if (!dataUrl) continue;
      const y = 15 + k * (H / 2);
      try {
        doc.addImage(dataUrl, "JPEG", 20, y, W - 40, H / 2 - 30, undefined, "FAST");
      } catch {
        try { doc.addImage(dataUrl, "PNG", 20, y, W - 40, H / 2 - 30, undefined, "FAST"); } catch {}
      }
      if (p.caption) {
        doc.setFontSize(10);
        doc.setTextColor(80, 60, 50);
        doc.text(p.caption, 20, y + H / 2 - 25);
      }
    }
  }

  doc.save("Lisa-GR20-carnet.pdf");
}
