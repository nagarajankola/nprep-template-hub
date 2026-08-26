import { NextResponse } from "next/server";
import {
  createTemplate,
  getTemplateBySourcePath,
  updateTemplate,
} from "@/lib/db";
import { toMeta, parseTags } from "@/lib/util";
import { injectUpdatedBadge } from "@/lib/updated-badge";
import type { Template } from "@/lib/types";

// Keyed ingest — lets the global pusher (or any tool) register a prototype
// without a browser login. Upserts by source_path so re-pushing updates in place.
export async function POST(request: Request) {
  const key = request.headers.get("x-hub-key");
  if (!process.env.HUB_INGEST_KEY || key !== process.env.HUB_INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const html = typeof body.html === "string" ? body.html : "";
  if (!html.trim() || !/<[a-z!]/i.test(html)) {
    return NextResponse.json({ error: "That doesn't look like HTML." }, { status: 422 });
  }

  const sourcePath = body.source_path ? String(body.source_path) : null;
  const name = String(body.name ?? "").trim();

  let when = new Date();
  if (body.code_updated_at) {
    const d = new Date(String(body.code_updated_at));
    if (!Number.isNaN(d.getTime())) when = d;
  }

  const meta: Partial<Template> = {};
  if (name) meta.name = name;
  if (typeof body.type === "string" && body.type.trim()) meta.type = body.type.trim();
  if (typeof body.project === "string" && body.project.trim()) meta.project = body.project.trim();
  if (typeof body.description === "string") meta.description = body.description.trim();
  if (body.tags !== undefined) meta.tags = parseTags(body.tags);

  const origin = new URL(request.url).origin;

  // Update existing entry for this file, if any.
  if (sourcePath) {
    const existing = await getTemplateBySourcePath(sourcePath);
    if (existing) {
      const badged = injectUpdatedBadge(html, when);
      const updated = await updateTemplate(existing.id, {
        ...meta,
        html: badged,
        size_bytes: Buffer.byteLength(badged, "utf-8"),
        updated_at: when.toISOString(),
      });
      return NextResponse.json({
        action: "updated",
        template: updated ? toMeta(updated) : null,
        shareUrl: updated ? `${origin}/v/${updated.slug}` : null,
      });
    }
  }

  const created = await createTemplate({
    name: name || "Untitled template",
    description: typeof body.description === "string" ? body.description : "",
    type: typeof body.type === "string" ? body.type : undefined,
    project: typeof body.project === "string" ? body.project : undefined,
    tags: parseTags(body.tags),
    html,
    source: "import",
    source_path: sourcePath,
    code_updated_at: when,
  });

  return NextResponse.json({
    action: "created",
    template: toMeta(created),
    shareUrl: `${origin}/v/${created.slug}`,
  });
}
