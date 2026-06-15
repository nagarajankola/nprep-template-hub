"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Field, inputCls } from "./ui/Field";
import { useToast } from "./ui/Toaster";
import { cn, formatRelative } from "@/lib/format";
import type { ShareLink, LinkStats } from "@/lib/types";

/**
 * Share-links manager for a single template: create new links, list them, and
 * show per-link visit analytics. Reused by the standalone LinksModal and inline
 * inside the template DetailModal. Pass `statsDefaultOpen` to expand every
 * link's stats on mount (used in the detail view, where we show everything).
 */
export function LinksPanel({
  templateId,
  statsDefaultOpen = false,
}: {
  templateId: string;
  statsDefaultOpen?: boolean;
}) {
  const toast = useToast();
  const [links, setLinks] = useState<ShareLink[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [sharedWith, setSharedWith] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/templates/${templateId}/links`);
    const d = (await res.json().catch(() => ({}))) as { links?: ShareLink[] };
    setLinks(d.links ?? []);
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createLink() {
    if (!label.trim()) {
      toast("Give the link a label", "err");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/templates/${templateId}/links`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, shared_with: sharedWith, purpose }),
    });
    const d = (await res.json().catch(() => ({}))) as { link?: ShareLink; error?: string };
    setBusy(false);
    if (!res.ok || !d.link) {
      toast(d.error || "Couldn't create link", "err");
      return;
    }
    setLinks((prev) => [...(prev ?? []), d.link!]);
    setLabel("");
    setSharedWith("");
    setPurpose("");
    setCreating(false);
    toast("Link created");
  }

  return (
    <>
      <div className="rounded-2xl border border-line bg-cloud p-4">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="interactive flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky/50 py-2.5 text-sm font-semibold text-sky-600 hover:bg-ice"
          >
            ＋ Create a new link
          </button>
        ) : (
          <div className="space-y-3">
            <Field label="Label">
              <input
                className={inputCls}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. For the Tuesday investor call"
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Who's it for?">
                <input
                  className={inputCls}
                  value={sharedWith}
                  onChange={(e) => setSharedWith(e.target.value)}
                  placeholder="e.g. Ananya (investor)"
                />
              </Field>
              <Field label="Why this link?">
                <input
                  className={inputCls}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Funding deck review"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createLink} disabled={busy}>
                {busy ? "Creating…" : "Create link"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {links === null ? (
          <div className="py-8 text-center text-sm text-muted">Loading…</div>
        ) : links.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">No links yet.</div>
        ) : (
          links.map((l) => (
            <LinkRow
              key={l.id}
              link={l}
              statsDefaultOpen={statsDefaultOpen}
              onPatched={(u) =>
                setLinks((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)))
              }
              onRemoved={(id) =>
                setLinks((prev) => (prev ?? []).filter((x) => x.id !== id))
              }
            />
          ))
        )}
      </div>
    </>
  );
}

function LinkRow({
  link,
  statsDefaultOpen = false,
  onPatched,
  onRemoved,
}: {
  link: ShareLink;
  statsDefaultOpen?: boolean;
  onPatched: (l: ShareLink) => void;
  onRemoved: (id: string) => void;
}) {
  const toast = useToast();
  const [showStats, setShowStats] = useState(statsDefaultOpen);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${link.token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast(link.enabled ? "Link copied" : "Copied — but this link is OFF");
    } catch {
      toast("Couldn't copy", "err");
    }
  }

  async function patch(body: Record<string, unknown>, ok: string) {
    const res = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = (await res.json().catch(() => ({}))) as { link?: ShareLink; error?: string };
    if (!res.ok || !d.link) {
      toast(d.error || "Failed", "err");
      return;
    }
    onPatched(d.link);
    toast(ok);
  }

  async function del() {
    if (!window.confirm(`Delete link "${link.label}"? Its visit stats go too.`)) return;
    const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    if (res.ok) {
      onRemoved(link.id);
      toast("Link deleted");
    } else {
      toast("Delete failed", "err");
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-midnight">{link.label}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            link.enabled ? "bg-emerald-50 text-emerald-600" : "bg-mist text-muted"
          )}
        >
          {link.enabled ? "Active" : "Off"}
        </span>
      </div>
      {(link.shared_with || link.purpose) && (
        <div className="mt-0.5 text-[12px] text-muted">
          {link.shared_with && (
            <span>
              For <b className="font-medium text-midnight">{link.shared_with}</b>
            </span>
          )}
          {link.shared_with && link.purpose && " · "}
          {link.purpose && <span>{link.purpose}</span>}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-mist px-2.5 py-1.5 text-[11px] text-midnight">
          /v/{link.token}
        </code>
        <button
          onClick={copy}
          className="interactive rounded-lg bg-sky px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-600"
        >
          Copy
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="interactive rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-midnight hover:bg-ice"
        >
          Open
        </a>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <button
          onClick={() => setShowStats((s) => !s)}
          className="font-semibold text-midnight transition hover:text-sky-600"
        >
          {showStats ? "Hide stats ▴" : "Stats ▾"}
        </button>
        <button
          onClick={() => patch({ enabled: !link.enabled }, link.enabled ? "Link disabled" : "Link enabled")}
          className="text-muted transition hover:text-midnight"
        >
          {link.enabled ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => {
            if (window.confirm("Generate a new URL? The current one stops working.")) {
              patch({ action: "rotate" }, "New URL generated");
            }
          }}
          className="text-muted transition hover:text-midnight"
        >
          New URL
        </button>
        <button onClick={del} className="text-red-500 transition hover:text-red-600">
          Delete
        </button>
      </div>

      {showStats && <LinkStatsView linkId={link.id} />}
    </div>
  );
}

function LinkStatsView({ linkId }: { linkId: string }) {
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [range, setRange] = useState<"by_day" | "by_week" | "by_month">("by_day");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/links/${linkId}/stats`);
      const d = (await res.json().catch(() => ({}))) as { stats?: LinkStats };
      setStats(d.stats ?? null);
    })();
  }, [linkId]);

  if (!stats) {
    return <div className="mt-2 py-3 text-center text-[11px] text-muted">Loading stats…</div>;
  }

  const series = stats[range];
  const max = Math.max(1, ...series.map((b) => b.visits));

  return (
    <div className="mt-3 rounded-xl bg-cloud p-3">
      <div className="flex items-center gap-5">
        <Stat n={stats.total_visits} label="visits" />
        <Stat n={stats.unique_users} label="unique users" />
        <Stat n={stats.unique_networks} label="networks" />
        {stats.last_visit && (
          <div className="ml-auto text-[11px] text-muted">last {formatRelative(stats.last_visit)}</div>
        )}
      </div>

      <div className="mt-3 flex gap-1">
        {(["by_day", "by_week", "by_month"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-semibold transition",
              range === r ? "bg-midnight text-white" : "border border-line bg-white text-muted"
            )}
          >
            {r === "by_day" ? "Day" : r === "by_week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {series.length === 0 ? (
        <div className="mt-3 py-4 text-center text-[11px] text-muted">No visits in this range yet.</div>
      ) : (
        <div className="mt-3 flex items-end gap-1.5" style={{ height: 72 }}>
          {series.map((b) => (
            <div
              key={b.key}
              className="flex flex-1 flex-col items-center justify-end"
              title={`${b.label}: ${b.visits} visits · ${b.uniques} unique`}
            >
              <div
                className="w-full rounded-t bg-sky transition-all"
                style={{ height: `${Math.max(4, (b.visits / max) * 56)}px` }}
              />
              <span className="mt-1 w-full truncate text-center text-[9px] text-muted">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-lg font-bold leading-none text-midnight">{n}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}
