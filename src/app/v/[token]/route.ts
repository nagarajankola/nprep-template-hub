import { createHash, randomUUID } from "node:crypto";
import {
  getShareLinkByToken,
  getTemplate,
  getTemplateBySlug,
  getTemplateByToken,
  recordVisit,
} from "@/lib/db";
import type { Template } from "@/lib/types";
import { noticeHtml } from "@/lib/serve-html";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };
const VID_COOKIE = "nprep_vid";

function readCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function serve(html: string, setCookie?: string): Response {
  const headers = new Headers(HTML_HEADERS);
  headers.set("cache-control", "no-store");
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(html, { status: 200, headers });
}

// Public share link. Resolves in three steps, old links first:
//   1. a share_links.token  → any existing default or named link (unchanged)
//   2. a template slug       → that template's default link (pretty /v/<slug>)
//   3. legacy template.share_token with no link row
// Slug hits are recorded against the template's default link, so /v/<slug> and
// the older /v/<token> share one set of stats.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let link = await getShareLinkByToken(token);

  // Pretty default link: /v/<slug> → the template's default share link.
  let slugTemplate: Template | null = null;
  if (!link) {
    slugTemplate = await getTemplateBySlug(token);
    if (slugTemplate) {
      link = await getShareLinkByToken(slugTemplate.share_token);
    }
  }

  if (link) {
    if (!link.enabled) {
      return new Response(
        noticeHtml({
          title: "Link disabled",
          message:
            "Sharing for this link has been turned off. Ask for a new link.",
          code: 410,
          emoji: "🚫",
        }),
        { status: 410, headers: HTML_HEADERS }
      );
    }
    const tpl = slugTemplate ?? (await getTemplate(link.template_id));
    if (!tpl) {
      return new Response(
        noticeHtml({
          title: "Not found",
          message: "This prototype no longer exists.",
          code: 404,
          emoji: "🔍",
        }),
        { status: 404, headers: HTML_HEADERS }
      );
    }

    // Record the visit (best-effort — never block the page on analytics).
    let setCookie: string | undefined;
    try {
      let vid = readCookie(request, VID_COOKIE);
      if (!vid) {
        vid = randomUUID();
        const secure =
          (request.headers.get("x-forwarded-proto") || "http").toLowerCase() === "https"
            ? "; Secure"
            : "";
        setCookie = `${VID_COOKIE}=${vid}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`;
      }
      const ip = (request.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim();
      const ua = request.headers.get("user-agent") || "";
      const ipHash = createHash("sha256")
        .update(`${ip}|${ua}|nprep-hub`)
        .digest("hex")
        .slice(0, 32);
      await recordVisit(link.id, vid, ipHash);
    } catch {
      // ignore analytics failures
    }

    return serve(tpl.html, setCookie);
  }

  // Legacy fallback: a slug'd template (or original share_token) with no link row.
  const legacy = slugTemplate ?? (await getTemplateByToken(token));
  if (legacy && legacy.share_enabled) {
    return serve(legacy.html);
  }

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
