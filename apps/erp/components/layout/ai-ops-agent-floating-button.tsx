"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

import { AiOpsInbox } from "@/features/ai-ops-agent/components/ai-ops-inbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchAiOpsPendingInteractionCount } from "@/features/ai-ops-agent/lib/fetch-ai-ops-pending-interaction-count";

type Props = {
  userId: string;
};

function formatInteractionBadge(n: number): string {
  if (n <= 0) return "";
  if (n > 99) return "99+";
  return String(n);
}

/** Bouton fixe bas-droite : ouvre l’agent opérations en panneau (pas de navigation pleine page). */
export function AiOpsAgentFloatingButton({ userId }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = await createClient();
    const n = await fetchAiOpsPendingInteractionCount(supabase, userId);
    setInteractionCount(n);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (sheetOpen) void load();
  }, [sheetOpen, load]);

  useEffect(() => {
    let cancelled = false;
    const instanceId = crypto.randomUUID();

    const setup = async () => {
      const supabase = await createClient();
      if (cancelled) return null;
      const ch = supabase
        .channel(`ai-ops-floating-${userId}-${instanceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ai_conversations", filter: `user_id=eq.${userId}` },
          () => {
            if (!cancelled) void load();
          },
        )
        .subscribe();
      return { supabase, ch };
    };

    const ready = setup();

    return () => {
      cancelled = true;
      void ready.then((pair) => {
        if (!pair) return;
        void pair.supabase.removeChannel(pair.ch);
      });
    };
  }, [userId, load]);

  return (
    <>
      <button
        type="button"
        title={
          interactionCount > 0
            ? `Agent opérations — ${interactionCount} remarque${interactionCount > 1 ? "s" : ""} en attente`
            : "Agent opérations — aide et suivi"
        }
        onClick={() => setSheetOpen(true)}
        className={cn(
          "fixed z-[45] flex size-14 touch-manipulation items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg ring-2 ring-background transition-[box-shadow,transform] hover:shadow-xl active:scale-[0.97]",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]",
        )}
        aria-label={
          interactionCount > 0
            ? `Ouvrir l’agent opérations, ${interactionCount} interaction${interactionCount > 1 ? "s" : ""} en attente`
            : "Ouvrir l’agent opérations"
        }
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
      >
        <Bot className="size-6" aria-hidden />
        {interactionCount > 0 ? (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-1 tabular-nums text-xs font-bold text-white ring-2 ring-background",
              interactionCount >= 10 && "min-w-7 px-1.5 text-[11px]",
            )}
          >
            {formatInteractionBadge(interactionCount)}
          </span>
        ) : null}
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className={cn(
            "gap-0 overflow-hidden p-0",
            "flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col",
            /* Largeur : jusqu’à la moitié de l’écran (override des styles Sheet w-3/4 / max-w-sm) */
            "!w-full sm:!w-[50vw] sm:!max-w-[50vw] sm:!min-w-[min(100%,36rem)]",
          )}
        >
          <SheetHeader className="shrink-0 space-y-2 border-b border-border px-4 pb-4 pt-4 pr-14 text-left sm:px-6">
            <SheetTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
              Agent opérations
              {interactionCount > 0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                  {formatInteractionBadge(interactionCount)}
                </span>
              ) : null}
            </SheetTitle>
            <SheetDescription className="text-pretty text-left text-sm leading-relaxed">
              {interactionCount > 0
                ? `${interactionCount} conversation${interactionCount > 1 ? "s" : ""} avec une remarque ou une action attendue de ta part.`
                : "Conversations et actions rapides. La vue pleine page inclut aussi le digest du rôle."}
            </SheetDescription>
            <Link
              href="/agent-operations"
              className="inline-flex w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setSheetOpen(false)}
            >
              Ouvrir la page dédiée
            </Link>
          </SheetHeader>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 pb-4 pt-4 sm:px-5">
            {sheetOpen ? (
              <AiOpsInbox userId={userId} initialConversations={[]} embedInSheet />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
