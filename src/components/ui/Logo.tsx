export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/nprep-logo.svg" alt="NPrep" className="h-9 w-auto" />
      {subtitle && (
        <>
          <span aria-hidden className="h-5 w-px bg-line" />
          <span className="text-[13px] font-semibold text-muted">Template Hub</span>
        </>
      )}
    </div>
  );
}
