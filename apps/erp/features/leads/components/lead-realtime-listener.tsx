"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LEAD_STATUS_LABELS } from "@/features/leads/constants";

type Props = {
  leadId: string;
};

/**
 * Invisible component that subscribes to Realtime changes on a single lead row.
 * On UPDATE (status change, field edit from another user), it refreshes the page
 * and shows a toast notification.
 */
export function LeadRealtimeListener({ leadId }: Props) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let pendingRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    const EDITING_GRACE_MS = 3500;
    const getLastInputAt = () => {
      const g = globalThis as typeof globalThis & {
        __effinorLeadFormLastInputAtByLeadId?: Record<string, number>;
      };
      return g.__effinorLeadFormLastInputAtByLeadId?.[leadId] ?? 0;
    };
    const triggerRefreshSafely = () => {
      const elapsed = Date.now() - getLastInputAt();
      if (elapsed < EDITING_GRACE_MS) {
        if (pendingRefreshTimer) clearTimeout(pendingRefreshTimer);
        pendingRefreshTimer = setTimeout(() => {
          if (!cancelled) router.refresh();
        }, EDITING_GRACE_MS - elapsed + 50);
        return;
      }
      router.refresh();
    };
    const supabaseRef: {
      current: Awaited<ReturnType<typeof createClient>> | null;
    } = { current: null };
    const channelRef: { current: ReturnType<
      Awaited<ReturnType<typeof createClient>>["channel"]
    > | null } = { current: null };

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;
      supabaseRef.current = supabase;
      const channel = supabase.channel(`rt-lead-${leadId}`);
      channelRef.current = channel;
      channel
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "leads",
            filter: `id=eq.${leadId}`,
          },
          (payload) => {
            const newRow = payload.new as Record<string, unknown>;
            const oldRow = payload.old as Record<string, unknown>;

            if (newRow.lead_status !== oldRow.lead_status) {
              const label =
                LEAD_STATUS_LABELS[newRow.lead_status as string] ??
                (newRow.lead_status as string);
              toast.info("Statut mis à jour", { description: label });
            }

            triggerRefreshSafely();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (pendingRefreshTimer) {
        clearTimeout(pendingRefreshTimer);
        pendingRefreshTimer = null;
      }
      const ch = channelRef.current;
      const sb = supabaseRef.current;
      if (ch && sb) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [leadId, router]);

  return null;
}
