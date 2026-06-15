import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateTemplate, deleteTemplate } from "@/lib/db";
import { toMeta, parseTags } from "@/lib/util";
import type { Template } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Partial<Template> = {};
  if (typeof body.name === "string") patch.name = body.name.trim() || "Untitled template";
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.category === "string") patch.category = body.category.trim() || "Uncategorized";
  if (typeof body.type === "string") patch.type = body.type.trim() || "Other";
  if (typeof body.project === "string") patch.project = body.project.trim() || "Unsorted";
  if (body.tags !== undefined) patch.tags = parseTags(body.tags);
  if (typeof body.share_enabled === "boolean") patch.share_enabled = body.share_enabled;

  const updated = await updateTemplate(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template: toMeta(updated) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteTemplate(id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
