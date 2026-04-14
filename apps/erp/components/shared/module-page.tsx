import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

type ModuleListShellProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function ModuleListShell({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: ModuleListShellProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </>
  );
}

type ModuleDetailShellProps = {
  title: string;
  description: string;
  entityLabel: string;
  id: string;
};

export function ModuleDetailShell({
  title,
  description,
  entityLabel,
  id,
}: ModuleDetailShellProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Fiche détaillée"
        description={`${entityLabel} · identifiant ${id}. Contenu et relations seront branchés en Phase 4.`}
      />
    </>
  );
}
