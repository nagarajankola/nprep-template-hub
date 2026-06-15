import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLinkVisits } from "@/lib/db";
import { computeStats } from "@/lib/analytics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { linkId } = await params;
  const visits = await getLinkVisits(linkId);
  return NextResponse.json({ stats: computeStats(visits) });
}
