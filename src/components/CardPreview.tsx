"use client";

import { useEffect, useRef, useState } from "react";
import { PreviewFrame } from "./PreviewFrame";

/**
 * Card preview: shows the cached screenshot thumbnail when one exists, and
 * falls back to the live (lazy) iframe for templates that don't have one yet.
 */
export function CardPreview({
  id,
  title,
  thumbBase,
}: {
  id: string;
  title: string;
  thumbBase: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const thumbUrl = thumbBase ? `${thumbBase}/${id}.jpg` : null;

  useEffect(() => {
    // A cached image can finish loading before React attaches onLoad — detect it.
    const img = imgRef.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, [thumbUrl]);

  if (!thumbUrl || failed) {
    return <PreviewFrame id={id} title={title} />;
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-mist"
      style={{ aspectRatio: "16 / 10" }}
    >
      {!loaded && <div className="skeleton absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={thumbUrl}
        alt={title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}
