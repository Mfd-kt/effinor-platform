import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { OperationSiteForm } from "@/features/operation-sites/components/operation-site-form";
import { OperationSiteOperationSection } from "@/features/operation-sites/components/operation-site-operation-section";
import { OperationSiteSummaryCards } from "@/features/operation-sites/components/operation-site-summary-cards";
import { operationSiteRowToFormValues } from "@/features/operation-sites/lib/form-defaults";
import { getOperationSiteById } from "@/features/operation-sites/queries/get-operation-site-by-id";
import { getOperationSiteFormOptions } from "@/features/operation-sites/queries/get-operation-site-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationSitesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OperationSiteDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationSitesModule(access)) {
    notFound();
  }
  const { id } = await params;
  const [row, options] = await Promise.all([
    getOperationSiteById(id),
    getOperationSiteFormOptions(),
  ]);

  if (!row) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={row.label}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-mono text-xs text-foreground/90">{row.id}</span>
            <span>Màj {formatDateFr(row.updated_at)}</span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/operation-sites" className={cn(buttonVariants({ variant: "outline" }))}>
              Retour à la liste
            </Link>
          </div>
        }
      />

      <OperationSiteSummaryCards site={row} />

      <OperationSiteOperationSection site={row} />

      <OperationSiteForm
        key={row.id}
        mode="edit"
        operationSiteId={row.id}
        defaultValues={operationSiteRowToFormValues(row)}
        options={options}
        className="max-w-4xl"
      />
    </div>
  );
}
