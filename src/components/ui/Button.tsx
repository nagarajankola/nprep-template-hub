"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-sky text-white hover:bg-sky-600 shadow-[0_4px_16px_rgba(21,202,232,.3)]",
  secondary: "bg-midnight text-white hover:bg-midnight-700",
  ghost: "bg-white text-midnight border border-line hover:bg-ice",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        "interactive inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold active:scale-[.97] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
    />
  );
}
