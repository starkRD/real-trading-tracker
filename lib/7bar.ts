import { ModelTrade } from "./types";

export type SevenBarSnapshot = { active: ModelTrade[]; closed: ModelTrade[]; fetchedAt: string; total: number };
const KEY = "rtt_7bar_snapshot";

export function save7BarSnapshot(snapshot: SevenBarSnapshot) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(snapshot));
}
export function get7BarSnapshot(): SevenBarSnapshot | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function modelTradesFromSnapshot(): ModelTrade[] { const s = get7BarSnapshot(); return s ? [...s.active, ...s.closed] : []; }
