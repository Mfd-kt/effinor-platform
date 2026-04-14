"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { executeAiRecommendation } from "../ai-actions/execute-ai-recommendation";
import type { CockpitAiExecutionUiStatus, CockpitAiRecommendation } from "../types";

type Props = {
  recommendation: CockpitAiRecommendation;
};

export function CockpitRecommendationExecuteButton({ recommendation }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<CockpitAiExecutionUiStatus | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const mergedStatus = localStatus ?? recommendation.executionStatus;
  const mergedMessage = localMessage ?? recommendation.executionMessage;

  const applyClientFollowUps = useCallback(
    (openTel?: string, clientRedirect?: string) => {
      if (openTel) {
        window.location.href = openTel;
      }
      if (clientRedirect) {
        router.push(clientRedirect);
      }
    },
    [router],
  );

  if (!recommendation.executable) return null;

  const disabled = pending || mergedStatus === "success" || mergedStatus === "pending";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button
        type="button"
        size="xs"
        variant="default"
        disabled={disabled}
        title={
          mergedStatus === "success"
            ? "Cette priorité a déjà été exécutée une fois (journal d’audit). Utilisez « Ouvrir » pour accéder à la page, ou « Rafraîchir » si la situation a changé."
            : mergedStatus === "pending"
              ? "Exécution en cours…"
              : undefined
        }
        className={cn(
          "min-w-[5.5rem]",
          mergedStatus === "success" && "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600",
          mergedStatus === "failed" && "border-destructive bg-destructive text-white hover:bg-destructive",
          mergedStatus !== "success" &&
            mergedStatus !== "failed" &&
            "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
        )}
        onClick={() => {
          setLocalStatus("pending");
          setLocalMessage(null);
          startTransition(async () => {
            const r = await executeAiRecommendation(recommendation.id);
            if (r.ok) {
              setLocalStatus("success");
              setLocalMessage(r.message);
              applyClientFollowUps(r.openTel, r.clientRedirect);
            } else {
              setLocalStatus("failed");
              setLocalMessage(r.message);
            }
          });
        }}
      >
        {pending || mergedStatus === "pending" ? "…" : mergedStatus === "success" ? "Exécuté" : "Exécuter"}
      </Button>
      {mergedMessage ? (
        <span
          className={cn(
            "max-w-[14rem] text-right text-[10px] leading-snug",
            mergedStatus === "failed" ? "text-destructive" : "text-muted-foreground",
          )}
          title={mergedMessage}
        >
          {mergedMessage.length > 96 ? `${mergedMessage.slice(0, 96)}…` : mergedMessage}
        </span>
      ) : null}
    </div>
  );
}
