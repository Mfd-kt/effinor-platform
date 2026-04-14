/** Ligne de référence sous le chiffre principal (période précédente). */
export function DashboardKpiPreviousLine({
  title,
  contextLabel,
  value,
}: {
  title: string;
  contextLabel: string;
  value: number;
}) {
  return (
    <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:text-xs">
      <span className="font-medium text-muted-foreground/95">{title}</span>
      {contextLabel ? (
        <span className="opacity-80">
          {" "}
          ({contextLabel})
        </span>
      ) : null}
      <span className="opacity-80"> : </span>
      <span className="tabular-nums font-semibold text-foreground/80">{value.toLocaleString("fr-FR")}</span>
    </p>
  );
}
