import { ImportBatchesKpis } from "@/features/lead-generation/components/import-batches-kpis";
import {
  getImportBatchesKpis,
  type ImportBatchesKpis as ImportBatchesKpisType,
} from "@/features/lead-generation/queries/get-import-batches-kpis";

const FALLBACK: ImportBatchesKpisType = {
  active: 0,
  monthTotal: 0,
  monthCompleted: 0,
  monthFailed: 0,
};

type Props = {
  kpiOwner: string | null;
  /** True quand l’utilisateur n’a accès qu’à ses propres lots (rôle quantifier seul). */
  quantifierOnly: boolean;
};

export async function ImportBatchesKpisSectionAsync({ kpiOwner, quantifierOnly }: Props) {
  const kpis = await getImportBatchesKpis({ createdByUserId: kpiOwner }).catch(() => FALLBACK);
  return <ImportBatchesKpis kpis={kpis} scopedToMe={quantifierOnly} />;
}
