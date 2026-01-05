// app/dashboard/tree/[id]/graph/CanvasEdges.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Edge, LayoutResult } from "./types";

type Props = {
  edges: Edge[];
  layout: LayoutResult;
  cam: { x: number; y: number; z: number };
  selectedId?: string | null;
  size: { w: number; h: number };
};

export function CanvasEdges({ edges, layout, cam, selectedId, size }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const relevant = useMemo(() => {
    return edges.filter((e) => layout.byId[e.source] && layout.byId[e.target]);
  }, [edges, layout]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    c.width = Math.floor(size.w * dpr);
    c.height = Math.floor(size.h * dpr);
    c.style.width = `${size.w}px`;
    c.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size.w, size.h);

    for (const e of relevant) {
      const s = layout.byId[e.source];
      const t = layout.byId[e.target];

      const sx = s.x * cam.z + cam.x;
      const sy = (s.y + 28) * cam.z + cam.y;

      const tx = t.x * cam.z + cam.x;
      const ty = (t.y - 28) * cam.z + cam.y;

      const isActive =
        !!selectedId && (e.source === selectedId || e.target === selectedId);

      ctx.beginPath();
ctx.lineWidth = isActive ? 2 : 1;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "rgba(255,255,255,0.65)";
ctx.globalAlpha = isActive ? 0.95 : 0.25;


// IMPORTANT: pick a visible stroke on dark bg
ctx.strokeStyle = "rgba(255,255,255,0.65)";
ctx.globalAlpha = isActive ? 0.95 : 0.25;

      // Downward curve
      const mx = (sx + tx) / 2;
      const c1x = mx;
      const c1y = sy + (ty - sy) * 0.25;
      const c2x = mx;
      const c2y = sy + (ty - sy) * 0.75;

      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [relevant, layout, cam, selectedId, size, dpr]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    />
  );
}
