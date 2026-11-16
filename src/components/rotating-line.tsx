"use client";

import { useEffect, useState } from "react";

export function RotatingLine({ lines }: { lines: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || lines.length < 2) return;

    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % lines.length);
        setVisible(true);
      }, 280);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [lines.length]);

  return (
    <span className="block h-[1.15em] overflow-hidden text-brand" aria-live="polite">
      <span
        className={`block transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
      >
        {lines[index]}
      </span>
    </span>
  );
}
