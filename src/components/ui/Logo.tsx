export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white"
        style={{
          background: "linear-gradient(135deg,#131b63,#15cae8)",
          boxShadow: "0 6px 16px rgba(21,202,232,.35)",
        }}
      >
        N
      </div>
      <div className="leading-tight">
        <div className="font-bold tracking-tight text-midnight">NPrep</div>
        {subtitle && (
          <div className="-mt-0.5 text-[11px] font-medium text-muted">
            Template Hub
          </div>
        )}
      </div>
    </div>
  );
}
