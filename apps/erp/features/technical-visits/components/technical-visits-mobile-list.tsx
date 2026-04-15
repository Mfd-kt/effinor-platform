import { TechnicalVisitMobileCard } from "@/features/technical-visits/components/technical-visit-mobile-card";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";

export function TechnicalVisitsMobileList({
  visits,
  canAdminDelete = false,
}: {
  visits: TechnicalVisitListRow[];
  canAdminDelete?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-4 px-0.5 pb-4 md:hidden"
      aria-label="Liste des visites techniques (vue mobile)"
    >
      {visits.map((v) => (
        <TechnicalVisitMobileCard key={v.id} visit={v} canAdminDelete={canAdminDelete} />
      ))}
    </div>
  );
}
