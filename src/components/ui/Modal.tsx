"use client";

import { useEffect } from "react";
import { cn } from "@/lib/format";

export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
      style={{ background: "rgba(19,27,99,.28)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "anim-pop my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(19,27,99,.25)]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
