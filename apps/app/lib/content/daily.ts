import { getAllProfiles } from "./profiles";
import type { PastProfile, Profile } from "./types";

const MS_PER_DAY = 86_400_000;

/** Deterministic 32-bit FNV-1a hash — used to derive a stable rotation order. */
function hash(str: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

// A fixed pseudo-random rotation order (independent of the alphabetical display
// order), deterministic across builds. The daily feature walks this in order,
// so every profile is featured once before any repeats.
const ROTATION: Profile[] = [...getAllProfiles()].sort((a, b) => {
  const diff = hash(a.slug) - hash(b.slug);
  return diff === 0 ? a.slug.localeCompare(b.slug) : diff;
});

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function dayNumber(dateStr: string): number {
  return Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / MS_PER_DAY);
}

function dateStringFromDayNumber(dayNum: number): string {
  return new Date(dayNum * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Today's date (YYYY-MM-DD) in US Eastern time. The featured profile flips at
 * midnight Eastern, matching the previous cron-based behavior.
 */
export function getEasternDate(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

/** The profile featured on a given Eastern date, computed deterministically. */
export function getDailyProfile(dateStr: string = getEasternDate()): Profile | null {
  if (ROTATION.length === 0) {
    return null;
  }
  return ROTATION[mod(dayNumber(dateStr), ROTATION.length)];
}

/**
 * The archive: profiles featured on `today` and the preceding `count - 1` days,
 * newest first. Fully derived from the deterministic rotation — no stored history.
 */
export function getPastFeatures(todayStr: string = getEasternDate(), count = 30): PastProfile[] {
  if (ROTATION.length === 0) {
    return [];
  }
  const base = dayNumber(todayStr);
  const result: PastProfile[] = [];
  for (let i = 0; i < count; i++) {
    const dayNum = base - i;
    const profile = ROTATION[mod(dayNum, ROTATION.length)];
    result.push({ ...profile, featuredDate: dateStringFromDayNumber(dayNum) });
  }
  return result;
}
