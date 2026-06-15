import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateShareLink, deleteShareLink } from "@/lib/db";
import { shareToken } from "@/lib/slug";
import type { ShareLink } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { linkId } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Partial<ShareLink> = {};
  if (typeof body.label === "string") patch.label = body.label.trim() || "Untitled link";
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.shared_with === "string") patch.shared_with = body.shared_with.trim();
  if (typeof body.purpose === "string") patch.purpose = body.purpose.trim();
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (body.action === "rotate") patch.token = shareToken();

  const updated = await updateShareLink(linkId, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ link: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { linkId } = await params;
  const ok = await deleteShareLink(linkId);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
