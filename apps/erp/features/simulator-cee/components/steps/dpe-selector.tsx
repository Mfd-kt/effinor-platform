"use client";

import type { DpeLetter } from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";

const DPE_OPTIONS: { value: DpeLetter; letter: string; tone: string; label: string }[] = [
  { value: "A", letter: "A", tone: "bg-emerald-600 text-white", label: "Très performant" },
  { value: "B", letter: "B", tone: "bg-emerald-500 text-white", label: "Performant" },
  { value: "C", letter: "C", tone: "bg-lime-500 text-white", label: "Assez performant" },
  { value: "D", letter: "D", tone: "bg-yellow-500 text-slate-900", label: "Assez peu performant" },
  { value: "E", letter: "E", tone: "bg-orange-500 text-white", label: "Peu performant" },
  { value: "F", letter: "F", tone: "bg-red-600 text-white", label: "Très peu performant" },
  { value: "G", letter: "G", tone: "bg-rose-900 text-white", label: "Extrêmement peu performant" },
  { value: "inconnu", letter: "?", tone: "bg-slate-500 text-white", label: "Je ne sais pas" },
];

export function DpeSelector({
  value,
  onChange,
}: {
  value: DpeLetter | undefined;
  onChange: (v: DpeLetter) => void;
}) {
  return (
    <div className="grid gap-2">
      {DPE_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition-colors",
              active ? "border-violet-600 bg-white shadow-sm" : "border-violet-100 bg-white hover:border-violet-200",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm",
                o.tone,
              )}
            >
              {o.letter}
            </span>
            <span>
              <span className="block font-semibold text-slate-900">
                {o.value === "inconnu" ? "DPE inconnu" : `Classe ${o.letter}`}
              </span>
              <span className="block text-sm text-slate-600">{o.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
