"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { recordLeadGenerationCallLaunchAction } from "@/features/lead-generation/actions/record-lead-generation-call-launch-action";
import { cn } from "@/lib/utils";

type Props = {
  assignmentId: string;
  telHref: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Enregistre une activité « appel lancé » puis ouvre le lien tel: / Aircall.
 */
export function LeadGenAircallCallLink({ assignmentId, telHref, className, children }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-1">
      <Link
        href={telHref}
        className={cn(buttonVariants({ variant: "default", size: "default" }), className)}
        aria-busy={pending}
        onClick={async (e) => {
          e.preventDefault();
          setError(null);
          setPending(true);
          const res = await recordLeadGenerationCallLaunchAction({ assignmentId });
          setPending(false);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          window.location.href = telHref;
        }}
      >
        {children}
      </Link>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
