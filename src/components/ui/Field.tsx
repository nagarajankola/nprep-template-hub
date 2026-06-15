"use client";

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-midnight outline-none transition placeholder:text-muted/60 focus:border-sky focus:shadow-[0_0_0_3px_rgba(21,202,232,.2)]";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-midnight">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
