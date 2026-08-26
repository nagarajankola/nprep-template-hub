import { getTemplate } from "@/lib/db";
import { noticeHtml } from "@/lib/serve-html";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

// Public render by id — serves exactly the same HTML as the /v/ share links, so
// it's safe to open or share without signing in. Used by gallery card iframes
// and the "Open full screen" action. (Managing templates still needs admin auth,
// which is enforced on the dashboard page and every /api admin route.)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
