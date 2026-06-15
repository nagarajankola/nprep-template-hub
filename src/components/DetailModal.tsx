"use client";

import { Modal } from "./ui/Modal";
import { CardPreview } from "./CardPreview";
import { LinksPanel } from "./LinksPanel";
import { useToast } from "./ui/Toaster";
import { formatBytes, formatRelative, fullDate } from "@/lib/format";
import type { TemplateMeta } from "@/lib/types";

/**
 * One-click detail popup for a template — shows everything at once: the
 * screenshot preview, type/project, last-updated, size, full description,
 * tags, quick actions, and the full share-links manager with per-link stats.
 */
export function DetailModal({
  template,
  thumbBase,
  onClose,
  onEdit,
  onDelete,
}: {
  template: TemplateMeta;
  thumbBase: string | null;
  onClose: () => void;
  onEdit: (t: TemplateMeta) => void;
  onDelete: (t: TemplateMeta) => void;
}) {
  const toast = useToast();

  function openPreview() {
    window.open(`/preview/${template.id}`, "_blank", "noopener");
  }

  async function copyDefault() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${origin}/v/${template.share_token}`);
      toast("Default link copied");
    } catch {
      toast("Couldn't copy link", "err");
    }
  }

  return (
    <Modal open onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {template.type && template.type !== "Other" && (
              <span className="rounded-full bg-midnight px-2 py-0.5 text-[10px] font-semibold text-white">
                {template.type}
              </span>
            )}
            {template.project && template.project !== "Unsorted" && (
              <span className="rounded-full bg-ice px-2 py-0.5 text-[10px] font-semibold text-midnight">
                {template.project}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-xl font-bold text-midnight">{template.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
            <span title={fullDate(template.updated_at)}>
              Updated {formatRelative(template.updated_at)}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>{formatBytes(template.size_bytes)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span className="capitalize">{template.source}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-lg text-muted transition hover:text-midnight"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Preview + facts / description / tags / actions */}
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,360px)_1fr]">
        <div>
          <button
            onClick={openPreview}
            className="group/preview relative block w-full overflow-hidden rounded-xl border border-line text-left"
            title="Open full screen"
          >
            <CardPreview id={template.id} title={template.name} thumbBase={thumbBase} />
            <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover/preview:opacity-100">
              <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-midnight shadow">
                Open full screen ↗
              </span>
            </span>
          </button>
          {template.source_path && (
            <p
              className="mt-2 truncate text-[11px] text-muted"
              title={template.source_path}
            >
              📁 {template.source_path}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <p className="whitespace-pre-line text-sm leading-relaxed text-midnight/80">
            {template.description || "No description yet."}
          </p>

          {template.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-ice px-2 py-0.5 text-[11px] font-medium text-midnight"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={copyDefault}
              className="interactive rounded-xl bg-sky px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-600"
            >
              🔗 Copy default link
            </button>
            <button
              onClick={openPreview}
              className="interactive rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-midnight hover:bg-ice"
            >
              Open full screen ↗
            </button>
            <button
              onClick={() => onEdit(template)}
              className="interactive rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-midnight hover:bg-ice"
            >
              ✎ Edit details
            </button>
            <button
              onClick={() => onDelete(template)}
              className="interactive rounded-xl border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Share links & stats */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-bold text-midnight">Share links &amp; stats</h3>
        <p className="mt-0.5 text-[12px] text-muted">
          Each link opens only this prototype. Disable or rotate any link any time.
        </p>
        <div className="mt-3">
          <LinksPanel templateId={template.id} statsDefaultOpen />
        </div>
      </div>
    </Modal>
  );
}
