"use client";

import { useEffect, useState } from "react";
import type { TemplateMeta } from "@/lib/types";
import { CardPreview } from "./CardPreview";
import { useToast } from "./ui/Toaster";
import { cn, formatBytes, formatRelative, fullDate } from "@/lib/format";

export function TemplateCard({
  template,
  index,
  onEdit,
  onManageLinks,
  onDelete,
  thumbBase,
}: {
  template: TemplateMeta;
  index: number;
  onEdit: (t: TemplateMeta) => void;
  onManageLinks: (t: TemplateMeta) => void;
  onDelete: (t: TemplateMeta) => void;
  thumbBase: string | null;
}) {
  const toast = useToast();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  async function copyDefault() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${origin}/v/${template.share_token}`);
      toast("Default link copied");
    } catch {
      toast("Couldn't copy link", "err");
    }
  }

  function openPreview() {
    window.open(`/preview/${template.id}`, "_blank", "noopener");
  }

  return (
    <div
      className="anim-pop group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
    >
      <button
        onClick={openPreview}
        className="relative block w-full text-left"
        title="Open preview"
      >
        <CardPreview id={template.id} title={template.name} thumbBase={thumbBase} />
        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-midnight shadow">
            Open ↗
          </span>
        </span>
        {template.type && template.type !== "Other" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-midnight backdrop-blur">
            {template.type}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold text-midnight">{template.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-muted">
          {template.description || "No description yet."}
        </p>

        {template.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {template.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md bg-ice px-2 py-0.5 text-[11px] font-medium text-midnight"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <span title={fullDate(template.updated_at)}>
            Updated {formatRelative(template.updated_at)}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{formatBytes(template.size_bytes)}</span>
          {template.project && template.project !== "Unsorted" && (
            <>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="truncate">{template.project}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={copyDefault}
            className="interactive flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600"
          >
            🔗 Copy link
          </button>
          <button
            onClick={() => onManageLinks(template)}
            className="interactive rounded-xl border border-line px-3 py-2 text-xs font-semibold text-midnight hover:bg-ice"
          >
            📊 Links
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenu((m) => !m);
              }}
              className="interactive grid h-9 w-9 place-items-center rounded-xl border border-line text-lg leading-none text-midnight hover:bg-ice"
              aria-label="More actions"
            >
              ⋯
            </button>
            {menu && (
              <div
                className="anim-fade-in absolute bottom-full right-0 z-20 mb-2 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lift"
                onClick={(e) => e.stopPropagation()}
              >
                <MenuItem onClick={() => { setMenu(false); onManageLinks(template); }}>
                  Links & stats
                </MenuItem>
                <MenuItem onClick={() => { setMenu(false); onEdit(template); }}>
                  Edit details
                </MenuItem>
                <MenuItem onClick={() => { setMenu(false); openPreview(); }}>
                  Open preview
                </MenuItem>
                <div className="my-1 h-px bg-line" />
                <MenuItem danger onClick={() => { setMenu(false); onDelete(template); }}>
                  Delete
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full px-3.5 py-2 text-left text-[13px] font-medium transition",
        danger ? "text-red-600 hover:bg-red-50" : "text-midnight hover:bg-ice"
      )}
    >
      {children}
    </button>
  );
}
