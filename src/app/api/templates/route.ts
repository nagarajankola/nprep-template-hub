import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTemplate, listTemplates } from "@/lib/db";
import { toMeta, parseTags } from "@/lib/util";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ templates: await listTemplates() });
}

export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const html = typeof body.html === "string" ? body.html : "";
  if (!html.trim() || !/<[a-z!]/i.test(html)) {
    return NextResponse.json(
      { error: "That file doesn't look like HTML." },
      { status: 422 }
    );
  }

  const template = await createTemplate({
    name: String(body.name ?? "").trim() || "Untitled template",
    description: String(body.description ?? ""),
    category: String(body.category ?? "Uncategorized"),
    type: String(body.type ?? "").trim() || undefined,
    project: String(body.project ?? "").trim() || undefined,
    tags: parseTags(body.tags),
    html,
    source: "upload",
  });

  return NextResponse.json({ template: toMeta(template) }, { status: 201 });
}
