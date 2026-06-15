"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateMeta } from "@/lib/types";
import { Logo } from "./ui/Logo";
import { Button } from "./ui/Button";
import { Toaster, useToast } from "./ui/Toaster";
import { TemplateCard } from "./TemplateCard";
import { UploadModal } from "./UploadModal";
import { EditModal } from "./EditModal";

type SortKey = "recent" | "name" | "oldest";

export function Dashboard({
  initialTemplates,
  username,
}: {
  initialTemplates: TemplateMeta[];
  username: string;
}) {
  return (
    <Toaster>
      <DashboardInner initialTemplates={initialTemplates} username={username} />
    </Toaster>
  );
}

function DashboardInner({
  initialTemplates,
  username,
}: {
  initialTemplates: TemplateMeta[];
  username: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateMeta[]>(initialTemplates);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [category, setCategory] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateMeta | null>(null);

  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [templates]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = templates.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!term) return true;
      return `${t.name} ${t.description} ${t.tags.join(" ")} ${t.category}`
        .toLowerCase()
        .includes(term);
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return a.updated_at < b.updated_at ? -1 : 1;
      return a.updated_at < b.updated_at ? 1 : -1;
    });
  }, [templates, q, sort, category]);

  function upsert(t: TemplateMeta) {
    setTemplates((prev) => {
      const i = prev.findIndex((x) => x.id === t.id);
      if (i === -1) return [t, ...prev];
      const next = [...prev];
      next[i] = t;
      return next;
    });
  }

  async function shareAction(t: TemplateMeta, action: "toggle" | "rotate") {
    try {
      const res = await fetch(`/api/templates/${t.id}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        template?: TemplateMeta;
        error?: string;
      };
      if (!res.ok || !d.template) {
        toast(d.error || "Action failed", "err");
        return;
      }
      upsert(d.template);
      toast(
        action === "rotate"
          ? "New link generated — the old link no longer works"
          : d.template.share_enabled
            ? "Sharing enabled"
            : "Sharing disabled"
      );
    } catch {
      toast("Action failed", "err");
    }
  }

  async function remove(t: TemplateMeta) {
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("Delete failed", "err");
        return;
      }
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      setEditing(null);
      toast("Template deleted");
    } catch {
      toast("Delete failed", "err");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">Hi, {username}</span>
            <button
              onClick={logout}
              className="interactive rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-midnight hover:bg-ice"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="anim-fade-up">
            <h1 className="text-2xl font-bold tracking-tight text-midnight">
              Your templates
            </h1>
            <p className="mt-1 text-sm text-muted">
              {templates.length} prototype{templates.length !== 1 ? "s" : ""} · click
              any card to open, copy a link to share
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="px-4 py-2.5">
            <span className="text-base leading-none">＋</span> Add template
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              ⌕
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates…"
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-midnight outline-none transition focus:border-sky focus:shadow-[0_0_0_3px_rgba(21,202,232,.2)]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-midnight outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-midnight outline-none"
          >
            <option value="recent">Recently updated</option>
            <option value="name">Name A–Z</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            hasAny={templates.length > 0}
            onAdd={() => setUploadOpen(true)}
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((t, i) => (
              <TemplateCard
                key={t.id}
                template={t}
                index={i}
                onEdit={setEditing}
                onToggleShare={(x) => shareAction(x, "toggle")}
                onRotate={(x) => shareAction(x, "rotate")}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={upsert}
      />
      {editing && (
        <EditModal
          key={editing.id}
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            upsert(t);
            setEditing(null);
          }}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function EmptyState({
  hasAny,
  onAdd,
}: {
  hasAny: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="anim-fade-up mt-10 grid place-items-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ice text-3xl">
        🗂️
      </div>
      <h3 className="mt-4 text-lg font-bold text-midnight">
        {hasAny ? "No matches" : "No templates yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {hasAny
          ? "Try a different search or filter."
          : "Upload your first HTML prototype, or run the folder import to bulk-load everything at once."}
      </p>
      {!hasAny && (
        <Button onClick={onAdd} className="mt-5">
          ＋ Add your first template
        </Button>
      )}
    </div>
  );
}
