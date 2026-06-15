const FONT =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";

/** A branded full-page notice (used for revoked / missing share links, etc.). */
export function noticeHtml(opts: {
  title: string;
  message: string;
  code: number;
  emoji?: string;
}): string {
  const { title, message, code, emoji = "🔒" } = opts;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} · NPrep Template Hub</title>
<link href="${FONT}" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Poppins',system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;
       background:#fafbff;color:#131b63;padding:24px}
  .card{max-width:460px;width:100%;text-align:center;background:#fff;border:1px solid #e3e8f4;
        border-radius:24px;padding:48px 36px;box-shadow:0 16px 44px rgba(19,27,99,.10)}
  .badge{width:72px;height:72px;border-radius:20px;display:grid;place-items:center;margin:0 auto 22px;
         font-size:34px;background:#e5f0f8}
  .code{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#15cae8;margin-bottom:10px}
  h1{font-size:24px;font-weight:700;margin-bottom:10px}
  p{font-size:15px;line-height:1.6;color:#6b73a6}
  .mark{margin-top:26px;font-size:12px;color:#9aa3c9;letter-spacing:.04em}
</style></head>
<body><div class="card">
  <div class="badge">${emoji}</div>
  <div class="code">${code}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <div class="mark">NPrep Template Hub</div>
</div></body></html>`;
}
