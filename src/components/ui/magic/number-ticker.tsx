"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
}: {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let start = 0;
    const end = value;
    const duration = 1200;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      el.textContent = Intl.NumberFormat("en-US").format(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums tracking-wider text-foreground",
        className
      )}
      ref={ref}
    >
      {value}
    </span>
  );
}
