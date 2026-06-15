"use client";

import { useRef, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, inputCls } from "./ui/Field";
import { useToast } from "./ui/Toaster";
import { cn } from "@/lib/format";
import type { TemplateMeta } from "@/lib/types";

function extractTitle(html: string): string {
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  if (t) return t;
  const h1 = html
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  return h1 || "";
}

export function UploadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (t: TemplateMeta) => void;
}) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setFileName("");
    setHtml("");
    setName("");
    setDescription("");
    setCategory("");
    setTags("");
    setBusy(false);
  }
  function close() {
    reset();
    onClose();
  }

  async function ingest(file: File) {
    if (!/\.html?$/i.test(file.name)) {
      toast("Please choose an .html file", "err");
      return;
    }
    const text = await file.text();
    setHtml(text);
    setFileName(file.name);
    setName((n) => n || extractTitle(text) || file.name.replace(/\.html?$/i, ""));
  }

  async function submit() {
    if (!html) {
      toast("Choose an HTML file first", "err");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, category, tags, html }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        template?: TemplateMeta;
        error?: string;
      };
      if (!res.ok || !d.template) {
        toast(d.error || "Upload failed", "err");
        setBusy(false);
        return;
      }
      toast("Template added");
      onCreated(d.template);
      close();
    } catch {
      toast("Upload failed", "err");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-midnight">Add a template</h2>
        <button onClick={close} className="text-muted transition hover:text-midnight">
          ✕
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Upload a self-contained HTML prototype.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) ingest(f);
        }}
        onClick={() => fileInput.current?.click()}
        className={cn(
          "mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-5 py-8 text-center transition",
          drag ? "border-sky bg-ice" : "border-line hover:border-sky/60 hover:bg-cloud"
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept=".html,text/html"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) ingest(f);
          }}
        />
        <div className="text-3xl">{fileName ? "📄" : "⬆️"}</div>
        <div className="mt-2 text-sm font-semibold text-midnight">
          {fileName || "Drop an .html file, or click to browse"}
        </div>
        {fileName && (
          <div className="mt-1 text-xs font-medium text-emerald-600">
            Loaded ✓ {(html.length / 1024).toFixed(0)} KB
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Name">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Onboarding — 4 flows"
          />
        </Field>
        <Field label="Description">
          <textarea
            className={cn(inputCls, "resize-none")}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One line on what this prototype shows"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Onboarding"
            />
          </Field>
          <Field label="Tags (comma-separated)">
            <input
              className={inputCls}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="mobile, hindi"
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy || !html}>
          {busy ? "Adding…" : "Add template"}
        </Button>
      </div>
    </Modal>
  );
}
