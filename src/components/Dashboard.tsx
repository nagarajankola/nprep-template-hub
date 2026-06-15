"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateMeta } from "@/lib/types";
import { DEFAULT_PROJECTS } from "@/lib/taxonomy";
import { Logo } from "./ui/Logo";
import { Button } from "./ui/Button";
import { Toaster, useToast } from "./ui/Toaster";
import { TemplateCard } from "./TemplateCard";
import { UploadModal } from "./UploadModal";
import { EditModal } from "./EditModal";
import { LinksModal } from "./LinksModal";
import { cn } from "@/lib/format";

type SortKey = "recent" | "name" | "oldest";
type GroupKey = "none" | "type" | "project";

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

function groupTemplates(
  list: TemplateMeta[],
  by: "type" | "project"
): { key: string; items: TemplateMeta[] }[] {
  const map = new Map<string, TemplateMeta[]>();
  for (const t of list) {
    const k = (by === "type" ? t.type : t.project) || (by === "type" ? "Other" : "Unsorted");
    const arr = map.get(k);
    if (arr) arr.push(t);
    else map.set(k, [t]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => ({ key, items }));
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
  const [groupBy, setGroupBy] = useState<GroupKey>("project");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateMeta | null>(null);
  const [managingLinks, setManagingLinks] = useState<TemplateMeta | null>(null);

  const projects = useMemo(() => {
    const set = new Set<string>(DEFAULT_PROJECTS);
    for (const t of templates) {
      if (t.project && t.project !== "Unsorted") set.add(t.project);
    }
    return [...set].sort();
  }, [templates]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = templates.filter((t) => {
      if (!term) return true;
      return `${t.name} ${t.description} ${t.tags.join(" ")} ${t.type} ${t.project}`
        .toLowerCase()
        .includes(term);
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return a.updated_at < b.updated_at ? -1 : 1;
      return a.updated_at < b.updated_at ? 1 : -1;
    });
  }, [templates, q, sort]);

  const groups = useMemo(
    () => (groupBy === "none" ? [] : groupTemplates(visible, groupBy)),
    [visible, groupBy]
  );

  function upsert(t: TemplateMeta) {
    setTemplates((prev) => {
      const i = prev.findIndex((x) => x.id === t.id);
      if (i === -1) return [t, ...prev];
      const next = [...prev];
      next[i] = t;
      return next;
    });
  }

  async function remove(t: TemplateMeta) {
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Delete failed", "err");
      return;
    }
    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
    setEditing(null);
    toast("Template deleted");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function cardGrid(items: TemplateMeta[]) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((t, i) => (
          <TemplateCard
            key={t.id}
            template={t}
            index={i}
            onEdit={setEditing}
            onManageLinks={setManagingLinks}
            onDelete={remove}
          />
        ))}
      </div>
    );
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
            <h1 className="text-2xl font-bold tracking-tight text-midnight">Your templates</h1>
            <p className="mt-1 text-sm text-muted">
              {templates.length} prototype{templates.length !== 1 ? "s" : ""} ·{" "}
              {groupBy === "none" ? "flat list" : `grouped by ${groupBy}`}
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="px-4 py-2.5">
            <span className="text-base leading-none">＋</span> Add template
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
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

          <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
            <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Group
            </span>
            {(["project", "type", "none"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition",
                  groupBy === g ? "bg-midnight text-white" : "text-midnight hover:bg-ice"
                )}
              >
                {g === "none" ? "Flat" : g}
              </button>
            ))}
          </div>

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
          <EmptyState hasAny={templates.length > 0} onAdd={() => setUploadOpen(true)} />
        ) : groupBy === "none" ? (
          <div className="mt-6">{cardGrid(visible)}</div>
        ) : (
          <div className="mt-2">
            {groups.map((g) => (
              <section key={g.key} className="mt-7">
                <div className="mb-3 flex items-center gap-2.5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-midnight">
                    {g.key}
                  </h2>
                  <span className="rounded-full bg-ice px-2 py-0.5 text-[11px] font-semibold text-midnight">
                    {g.items.length}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                {cardGrid(g.items)}
              </section>
            ))}
          </div>
        )}
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={upsert}
        projects={projects}
      />
      {editing && (
        <EditModal
          key={editing.id}
          template={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            upsert(t);
            setEditing(null);
          }}
          onDelete={remove}
        />
      )}
      {managingLinks && (
        <LinksModal
          key={managingLinks.id}
          template={managingLinks}
          onClose={() => setManagingLinks(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ hasAny, onAdd }: { hasAny: boolean; onAdd: () => void }) {
  return (
    <div className="anim-fade-up mt-10 grid place-items-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ice text-3xl">🗂️</div>
      <h3 className="mt-4 text-lg font-bold text-midnight">
        {hasAny ? "No matches" : "No templates yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {hasAny
          ? "Try a different search."
          : "Upload your first HTML prototype, or run the folder import."}
      </p>
      {!hasAny && (
        <Button onClick={onAdd} className="mt-5">
          ＋ Add your first template
        </Button>
      )}
    </div>
  );
}
