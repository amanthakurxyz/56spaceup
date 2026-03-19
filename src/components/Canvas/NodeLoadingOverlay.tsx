"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const DESIGN_WORDS = [
  "Sconces",
  "Wainscoting",
  "Terrazzo",
  "Bespoke Millwork",
  "Herringbone",
  "Limewash",
  "Travertine",
  "Venetian Plaster",
  "Cove Lighting",
  "Parquet",
  "Patina",
  "Boucle",
  "Pilasters",
  "Tambour",
  "Tufted",
  "Ogee Moulding",
  "Fluted Column",
  "Reeded Glass",
  "Soffit",
  "Pelmet",
];

interface Props {
  nodeId: string;
  getScreenPos: (x: number, y: number) => { x: number; y: number };
  zoomLevel: number;
}

export function NodeLoadingOverlay({ nodeId, getScreenPos, zoomLevel }: Props) {
  const node = useAppStore((s) => s.nodes.find((n) => n.id === nodeId));
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % DESIGN_WORDS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  if (!node) return null;

  const pos = getScreenPos(node.x, node.y);
  const w = node.width * zoomLevel;
  const h = node.height * zoomLevel;

  return (
    <div
      className="absolute pointer-events-none overflow-hidden rounded-sm"
      style={{ left: pos.x, top: pos.y, width: w, height: h }}
    >
      {/* Dark frosted base */}
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-[2px]" />

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-sweep 2.2s ease-in-out infinite",
        }}
      />

      {/* Centre content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
        {/* Thin spinner ring */}
        <svg
          className="animate-spin"
          style={{ width: Math.max(20, w * 0.08), height: Math.max(20, w * 0.08) }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12" cy="12" r="10"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
          <path
            d="M12 2 A10 10 0 0 1 22 12"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Cycling word */}
        <span
          key={wordIndex}
          className="font-light tracking-[0.25em] uppercase text-white/60"
          style={{
            fontSize: Math.max(8, Math.min(13, w * 0.045)),
            animation: "word-fade 1.8s ease-in-out",
          }}
        >
          {DESIGN_WORDS[wordIndex]}
        </span>
      </div>

      <style>{`
        @keyframes shimmer-sweep {
          0%   { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes word-fade {
          0%   { opacity: 0; transform: translateY(4px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
