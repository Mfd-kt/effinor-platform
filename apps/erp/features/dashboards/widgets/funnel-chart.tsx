"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type FunnelStep = {
  /** Identifiant stable (ex. "stock", "qualified", "appointment"). */
  key: string;
  /** Libellé court affiché sur l'axe Y. */
  label: string;
  value: number;
};

type Props = {
  steps: FunnelStep[];
  /** Couleur de remplissage (utilisable depuis Tailwind via CSS var, ex. "var(--color-primary)"). */
  color?: string;
};

/**
 * Funnel horizontal : chaque étape est une barre dont la longueur est proportionnelle au volume.
 * Les valeurs s'affichent à droite de chaque barre.
 *
 * Mock-friendly : aucune normalisation interne, la première étape doit être la plus large.
 */
export function FunnelChart({ steps, color = "#0ea5e9" }: Props) {
  if (steps.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={steps}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide domain={[0, max]} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "currentColor", fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {steps.map((step, i) => (
            <Cell
              key={step.key}
              fill={color}
              fillOpacity={1 - i * (0.6 / Math.max(steps.length - 1, 1))}
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground"
            style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            formatter={(value: unknown) =>
              typeof value === "number" ? value.toLocaleString("fr-FR") : String(value)
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
