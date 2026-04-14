import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitStopImpersonationForm } from "@/features/auth/impersonation/actions";

type ImpersonationBannerProps = {
  effectiveEmail: string;
  effectiveName: string | null;
  actorEmail: string | null;
  actorName: string | null;
};

export function ImpersonationBanner({
  effectiveEmail,
  effectiveName,
  actorEmail,
  actorName,
}: ImpersonationBannerProps) {
  const eff = effectiveName?.trim() || effectiveEmail;
  const act = actorName?.trim() || actorEmail || "Super administrateur";

  return (
    <div
      className="sticky top-0 z-40 border-b border-amber-700/30 bg-amber-500 px-4 py-2 text-amber-950 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 text-sm font-medium">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="min-w-0 leading-snug">
            <span className="font-semibold">Mode impersonation</span> — vous naviguez avec le compte{" "}
            <span className="break-all">{eff}</span> ({effectiveEmail}
            ). Compte réel : <span className="break-all">{act}</span>
            {actorEmail ? ` (${actorEmail})` : null}.
          </p>
        </div>
        <form action={submitStopImpersonationForm} className="shrink-0">
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="w-full border-amber-900/20 bg-amber-100 text-amber-950 hover:bg-amber-200 sm:w-auto"
          >
            Revenir à mon compte
          </Button>
        </form>
      </div>
    </div>
  );
}
