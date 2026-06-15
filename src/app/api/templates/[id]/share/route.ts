import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTemplate, updateTemplate } from "@/lib/db";
import { shareToken } from "@/lib/slug";
import { toMeta } from "@/lib/util";
import type { Template } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "toggle");

  const current = await getTemplate(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch: Partial<Template> = {};
  if (action === "rotate") patch.share_token = shareToken();
  else if (action === "enable") patch.share_enabled = true;
  else if (action === "disable") patch.share_enabled = false;
  else patch.share_enabled = !current.share_enabled;

  const updated = await updateTemplate(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template: toMeta(updated) });
}
