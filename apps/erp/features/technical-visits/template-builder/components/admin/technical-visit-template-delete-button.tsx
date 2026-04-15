"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteTechnicalVisitTemplate } from "@/features/technical-visits/template-builder/actions/template-builder-actions";
import { cn } from "@/lib/utils";

type Props = {
  templateId: string;
  label: string;
  templateKey: string;
  className?: string;
};

export function TechnicalVisitTemplateDeleteButton({ templateId, label, templateKey, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const confirmed = window.confirm(
      `Supprimer définitivement le gabarit « ${label} » (${templateKey}) ?\n\n` +
        `Toutes les versions (brouillon, publiées, archivées) seront supprimées. Cette action est irréversible.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteTechnicalVisitTemplate({ templateId });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Gabarit supprimé.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className={cn(
        "gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10",
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={`Supprimer le gabarit ${templateKey}`}
    >
      <Trash2 className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{pending ? "…" : "Supprimer"}</span>
    </Button>
  );
}
