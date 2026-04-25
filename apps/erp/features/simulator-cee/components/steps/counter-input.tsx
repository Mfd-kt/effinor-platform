"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CounterInput({
  label,
  value,
  onChange,
  min = 1,
  max = 12,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-800">{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[3ch] text-center text-2xl font-semibold tabular-nums text-violet-950">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
