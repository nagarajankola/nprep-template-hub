"use client";

import { Modal } from "./ui/Modal";
import { LinksPanel } from "./LinksPanel";
import type { TemplateMeta } from "@/lib/types";

export function LinksModal({
  template,
  onClose,
}: {
  template: TemplateMeta;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} className="max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-midnight">Share links</h2>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted">{template.name}</p>
        </div>
        <button onClick={onClose} className="text-muted transition hover:text-midnight">
          ✕
        </button>
      </div>

      <div className="mt-4">
        <LinksPanel
          templateId={template.id}
          slug={template.slug}
          shareToken={template.share_token}
        />
      </div>
    </Modal>
  );
}
