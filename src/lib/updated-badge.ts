// Standard "Last updated" badge baked into every prototype. The date reflects
// when the prototype's CODE was last edited (source file mtime / edit time) —
// never the push/deploy time. Idempotent: re-injecting replaces the old badge.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MARKER = "data-nprep-updated";

export function formatUpdated(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function badgeHtml(when: Date): string {
  // Local-date parts so the marker matches the visible (local-tz) label.
  const iso = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}`;
  const label = formatUpdated(when);
  return (
    `<div ${MARKER}="${iso}" style="position:fixed;bottom:12px;right:12px;z-index:2147483646;` +
    `font-family:'Poppins',system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;` +
    `line-height:1;color:#131b63;background:rgba(255,255,255,.92);border:1px solid #e3e8f4;` +
    `border-radius:9999px;padding:6px 11px;box-shadow:0 2px 10px rgba(19,27,99,.12);` +
    `-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);pointer-events:none;` +
    `display:flex;align-items:center;gap:6px;">` +
    `<span style="width:6px;height:6px;border-radius:9999px;background:#15cae8;display:inline-block;"></span>` +
    `Updated ${label}</div>`
  );
}

/** Insert (or replace) the standard last-updated badge in an HTML document. */
export function injectUpdatedBadge(html: string, when: Date): string {
  // strip any existing badge first (idempotent)
  const stripped = html.replace(
    new RegExp(`<div ${MARKER}=[\\s\\S]*?<\\/div>`, "i"),
    ""
  );
  const badge = badgeHtml(when);
  const idx = stripped.toLowerCase().lastIndexOf("</body>");
  if (idx === -1) return stripped + badge;
  return stripped.slice(0, idx) + badge + stripped.slice(idx);
}
