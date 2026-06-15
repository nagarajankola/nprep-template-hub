import { getSession } from "@/lib/auth";
import { getTemplate } from "@/lib/db";
import { noticeHtml } from "@/lib/serve-html";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

// Admin-only render used by gallery card iframes and the "Open" action.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return new Response(
      noticeHtml({
        title: "Sign in required",
        message: "Please sign in to preview this template.",
        code: 401,
      }),
      { status: 401, headers: HTML_HEADERS }
    );
  }

  const { id } = await params;
  const tpl = await getTemplate(id);
  if (!tpl) {
    return new Response(
      noticeHtml({
        title: "Not found",
        message: "This template no longer exists.",
        code: 404,
        emoji: "🔍",
      }),
      { status: 404, headers: HTML_HEADERS }
    );
  }

  return new Response(tpl.html, {
    status: 200,
    headers: { ...HTML_HEADERS, "cache-control": "no-store" },
  });
}
