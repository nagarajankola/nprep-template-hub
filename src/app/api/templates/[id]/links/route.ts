import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listShareLinks, createShareLink } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  return NextResponse.json({ links: await listShareLinks(id) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const link = await createShareLink({
    template_id: id,
    label: String(body.label ?? "").trim() || "Untitled link",
    description: String(body.description ?? ""),
    shared_with: String(body.shared_with ?? ""),
    purpose: String(body.purpose ?? ""),
  });
  return NextResponse.json({ link }, { status: 201 });
}
