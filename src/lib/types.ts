export type TemplateSource = "upload" | "import";

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  html: string;
  size_bytes: number;
  source: TemplateSource;
  source_path: string | null;
  share_token: string;
  share_enabled: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Listing rows — everything except the heavy `html` blob. */
export type TemplateMeta = Omit<Template, "html">;

export interface NewTemplateInput {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  html: string;
  source?: TemplateSource;
  source_path?: string | null;
}
