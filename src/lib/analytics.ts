import type { LinkVisit, LinkStats, TimeBucket } from "./types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7); // YYYY-MM
}
function weekKey(d: Date): string {
  // ISO-8601 week number
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dayLabel(key: string): string {
  const [, m, day] = key.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]}`;
}
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}
function weekLabel(key: string): string {
  return `Wk ${key.split("-W")[1]}`;
}

type Agg = { visits: number; users: Set<string> };

function bump(map: Map<string, Agg>, key: string, user: string) {
  let e = map.get(key);
  if (!e) {
    e = { visits: 0, users: new Set() };
    map.set(key, e);
  }
  e.visits++;
  if (user) e.users.add(user);
}

function toBuckets(
  map: Map<string, Agg>,
  labelFn: (k: string) => string,
  limit: number
): TimeBucket[] {
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest first
    .slice(0, limit)
    .reverse() // chart reads oldest → newest
    .map(([key, e]) => ({
      key,
      label: labelFn(key),
      visits: e.visits,
      uniques: e.users.size,
    }));
}

/** Aggregate raw visit rows into total/unique counts + day/week/month series. */
export function computeStats(visits: LinkVisit[]): LinkStats {
  const users = new Set<string>();
  const networks = new Set<string>();
  let last: string | null = null;

  const days = new Map<string, Agg>();
  const weeks = new Map<string, Agg>();
  const months = new Map<string, Agg>();

  for (const v of visits) {
    if (v.visitor_id) users.add(v.visitor_id);
    if (v.ip_hash) networks.add(v.ip_hash);
    if (!last || v.visited_at > last) last = v.visited_at;

    const d = new Date(v.visited_at);
    if (Number.isNaN(d.getTime())) continue;
    const u = v.visitor_id || v.ip_hash;
    bump(days, dayKey(d), u);
    bump(weeks, weekKey(d), u);
    bump(months, monthKey(d), u);
  }

  return {
    total_visits: visits.length,
    unique_users: users.size,
    unique_networks: networks.size,
    last_visit: last,
    by_day: toBuckets(days, dayLabel, 14),
    by_week: toBuckets(weeks, weekLabel, 8),
    by_month: toBuckets(months, monthLabel, 6),
  };
}

export const EMPTY_STATS: LinkStats = {
  total_visits: 0,
  unique_users: 0,
  unique_networks: 0,
  last_visit: null,
  by_day: [],
  by_week: [],
  by_month: [],
};
