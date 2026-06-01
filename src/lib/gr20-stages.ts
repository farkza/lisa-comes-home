export type Stage = {
  day: number;
  date: string; // ISO date for "in progress" detection (start of stage)
  from: string;
  to: string;
  lat: number;
  lon: number;
  altitude: number; // m of refuge B
  ascent: number; // m+
  descent: number; // m-
  distance: number; // km
};

// Coordinates: refuges of arrival (point B) along the GR20 Nord→Sud.
export const GR20_STAGES: Stage[] = [
  { day: 1,  date: "2026-06-04", from: "Calenzana",        to: "Ortu di u Piobbu", lat: 42.4378, lon: 8.9181, altitude: 1570, ascent: 1550, descent: 250, distance: 10.5 },
  { day: 2,  date: "2026-06-05", from: "Ortu di u Piobbu", to: "Carrozzu",         lat: 42.4258, lon: 8.8861, altitude: 1270, ascent: 850,  descent: 1150, distance: 8 },
  { day: 3,  date: "2026-06-06", from: "Carrozzu",         to: "Ascu Stagnu",      lat: 42.4106, lon: 8.9069, altitude: 1422, ascent: 850,  descent: 700, distance: 6 },
  { day: 4,  date: "2026-06-07", from: "Ascu Stagnu",      to: "Ballone",          lat: 42.3781, lon: 8.9408, altitude: 1440, ascent: 1500, descent: 1480, distance: 10 },
  { day: 5,  date: "2026-06-08", from: "Ballone",          to: "Ciottulu di i Mori", lat: 42.3225, lon: 8.9436, altitude: 1991, ascent: 800,  descent: 250, distance: 7.5 },
  { day: 6,  date: "2026-06-09", from: "Ciottulu di i Mori", to: "Manganu",        lat: 42.2589, lon: 8.9756, altitude: 1601, ascent: 900,  descent: 1300, distance: 17 },
  { day: 7,  date: "2026-06-10", from: "Manganu",          to: "Petra Piana",      lat: 42.2317, lon: 9.0489, altitude: 1842, ascent: 850,  descent: 600, distance: 10 },
  { day: 8,  date: "2026-06-11", from: "Petra Piana",      to: "L'Onda",           lat: 42.2017, lon: 9.0717, altitude: 1430, ascent: 400,  descent: 800, distance: 11 },
  { day: 9,  date: "2026-06-12", from: "L'Onda",           to: "Vizzavona",        lat: 42.1219, lon: 9.1303, altitude: 920,  ascent: 600,  descent: 1100, distance: 10 },
  { day: 10, date: "2026-06-13", from: "Vizzavona",        to: "Capannelle",       lat: 42.0556, lon: 9.1572, altitude: 1586, ascent: 850,  descent: 200, distance: 14 },
  { day: 11, date: "2026-06-14", from: "Capannelle",       to: "Usciolu",          lat: 41.9067, lon: 9.1797, altitude: 1750, ascent: 1100, descent: 950, distance: 17 },
  { day: 12, date: "2026-06-15", from: "Usciolu",          to: "I Croci",          lat: 41.8419, lon: 9.1797, altitude: 1500, ascent: 700,  descent: 950, distance: 12 },
  { day: 13, date: "2026-06-16", from: "I Croci",          to: "Asinau",           lat: 41.7456, lon: 9.2092, altitude: 1530, ascent: 900,  descent: 900, distance: 15 },
  { day: 14, date: "2026-06-17", from: "Asinau",           to: "Paliri",           lat: 41.7164, lon: 9.2606, altitude: 1055, ascent: 550,  descent: 1050, distance: 12 },
  { day: 15, date: "2026-06-18", from: "Paliri",           to: "Conca",            lat: 41.7372, lon: 9.3458, altitude: 252,  ascent: 350,  descent: 1150, distance: 12 },
];

export function getCurrentStageIndex(now: Date = new Date()): number {
  const today = now.toISOString().slice(0, 10);
  const idx = GR20_STAGES.findIndex((s) => s.date === today);
  if (idx !== -1) return idx;
  // If past last stage, return last; if before first, return -1
  const last = GR20_STAGES[GR20_STAGES.length - 1].date;
  if (today > last) return GR20_STAGES.length - 1;
  return -1;
}
