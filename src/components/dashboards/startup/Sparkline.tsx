import React from "react";

export function Sparkline({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
      ))}
    </div>
  );
}

export const mkTrend = (base?: number): number[] => {
  const b = typeof base === "number" && !Number.isNaN(base) ? base : 50;
  const arr: number[] = [];
  for (let i = 0; i < 10; i++) {
    const jitter = ((i % 2 === 0 ? 1 : -1) * (6 + (i % 4))) / 2;
    arr.push(Math.max(5, Math.min(100, b + jitter)));
  }
  return arr;
};
