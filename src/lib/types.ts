export type TemplateSource = "upload" | "import";

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  type: string; // "Group by Type" bucket (Metrics, Analysis, Plan, Prototype, …)
  project: string; // "Group by Project" bucket (Onboarding & retention, Sales funnel, …)
  tags: string[];
  html: string;
  size_bytes: number;
  source: TemplateSource;
  source_path: string | null;
  share_token: string; // legacy default token (kept so old links keep working)
  share_enabled: boolean; // legacy
  created_at: string;
  updated_at: string;
}

/** Listing rows — everything except the heavy `html` blob. */
export type TemplateMeta = Omit<Template, "html">;

export interface NewTemplateInput {
  name: string;
  description?: string;
  category?: string;
  type?: string;
  project?: string;
  tags?: string[];
  html: string;
  source?: TemplateSource;
  source_path?: string | null;
  /** When the prototype's code was last edited (drives the badge + updated_at). */
  code_updated_at?: Date;
}

/** A named, revocable share link. A template can have many. */
export interface ShareLink {
  id: string;
  template_id: string;
  token: string;
  label: string;
  description: string;
  shared_with: string; // who this link is for
  purpose: string; // why this link exists
  enabled: boolean;
  created_at: string;
}

export interface NewShareLinkInput {
  template_id: string;
  label?: string;
  description?: string;
  shared_with?: string;
  purpose?: string;
}

export interface ShareLinkUpdate {
  label?: string;
  description?: string;
  shared_with?: string;
  purpose?: string;
  enabled?: boolean;
}

/** One row per page-load of a share link. */
export interface LinkVisit {
  id: string;
  link_id: string;
  visited_at: string;
  visitor_id: string; // browser cookie id — the unique-user key
  ip_hash: string; // hashed IP+UA — network fallback
}

export interface TimeBucket {
  key: string; // "2026-06-11" | "2026-W24" | "2026-06"
  label: string; // friendly: "11 Jun" | "Wk 24" | "Jun 2026"
  visits: number;
  uniques: number;
}

export interface LinkStats {
  total_visits: number;
  unique_users: number;
  unique_networks: number;
  last_visit: string | null;
  by_day: TimeBucket[];
  by_week: TimeBucket[];
  by_month: TimeBucket[];
}

export interface ShareLinkWithStats extends ShareLink {
  stats: LinkStats;
}
