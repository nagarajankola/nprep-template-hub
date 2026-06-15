"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Kind = "ok" | "err";
type Toast = { id: number; msg: string; kind: Kind };

const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, kind: Kind = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-bounce rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(19,27,99,.25)]"
            style={{ background: t.kind === "ok" ? "#131b63" : "#dc2626" }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
