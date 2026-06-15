"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, inputCls } from "./ui/Field";
import { useToast } from "./ui/Toaster";
import { cn } from "@/lib/format";
import type { TemplateMeta } from "@/lib/types";

export function EditModal({
  template,
  onClose,
  onSaved,
  onDelete,
}: {
  template: TemplateMeta;
  onClose: () => void;
  onSaved: (t: TemplateMeta) => void;
  onDelete: (t: TemplateMeta) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [category, setCategory] = useState(template.category);
  const [tags, setTags] = useState(template.tags.join(", "));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, category, tags }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        template?: TemplateMeta;
        error?: string;
      };
      if (!res.ok || !d.template) {
        toast(d.error || "Save failed", "err");
        setBusy(false);
        return;
      }
      toast("Saved");
      onSaved(d.template);
    } catch {
      toast("Save failed", "err");
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-midnight">Edit details</h2>
        <button onClick={onClose} className="text-muted transition hover:text-midnight">
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Name">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={cn(inputCls, "resize-none")}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              className={inputCls}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => onDelete(template)}
          className="text-sm font-semibold text-red-600 transition hover:underline"
        >
          Delete
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
