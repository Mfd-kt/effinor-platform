"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { archiveTechnicalVisitTemplateVersion } from "@/features/technical-visits/template-builder/actions/template-builder-actions";

export function TechnicalVisitTemplateArchiveButton({
  versionId,
  templateId,
}: {
  versionId: string;
  templateId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onArchive() {
    if (!confirm("Archiver cette version ? Elle ne sera plus proposée sur les fiches CEE.")) return;
    setPending(true);
    try {
      const r = await archiveTechnicalVisitTemplateVersion({ versionId });
      if (!r.ok) {
        alert(r.message);
        return;
      }
      router.push(`/admin/technical-visit-templates/${templateId}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onArchive} disabled={pending}>
      {pending ? "Archivage…" : "Archiver cette version"}
    </Button>
  );
}
