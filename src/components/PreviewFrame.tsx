"use client";

import { useEffect, useRef, useState } from "react";

const BASE_W = 1280;
const BASE_H = 820;

/** Lazy, scaled-down live preview of a template (zoomed-out thumbnail). */
export function PreviewFrame({ id, title }: { id: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);

    const ro = new ResizeObserver(() => {
      if (el.clientWidth) setScale(el.clientWidth / BASE_W);
    });
    ro.observe(el);

    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden bg-mist"
      style={{ aspectRatio: "16 / 10" }}
    >
      {visible && (
        <iframe
          src={`/preview/${id}`}
          title={title}
          tabIndex={-1}
          aria-hidden
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => setLoaded(true)}
          style={{
            width: BASE_W,
            height: BASE_H,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            opacity: loaded ? 1 : 0,
            transition: "opacity .4s ease",
          }}
        />
      )}
      {!loaded && <div className="skeleton absolute inset-0" />}
    </div>
  );
}
