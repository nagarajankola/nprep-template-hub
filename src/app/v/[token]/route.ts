import { getTemplateByToken } from "@/lib/db";
import { noticeHtml } from "@/lib/serve-html";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

// Public, unguessable share link — serves exactly one template, full-screen.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tpl = await getTemplateByToken(token);

  if (!tpl) {
    return new Response(
      noticeHtml({
        title: "Link not found",
        message:
          "This share link doesn't exist. Double-check the URL, or ask for a fresh link.",
        code: 404,
        emoji: "🔍",
      }),
      { status: 404, headers: HTML_HEADERS }
    );
  }

  if (!tpl.share_enabled) {
    return new Response(
      noticeHtml({
        title: "Link disabled",
        message:
          "Sharing for this prototype has been turned off. Ask for a new link.",
        code: 410,
        emoji: "🚫",
      }),
      { status: 410, headers: HTML_HEADERS }
    );
  }

  return new Response(tpl.html, {
    status: 200,
    headers: { ...HTML_HEADERS, "cache-control": "no-store" },
  });
}
