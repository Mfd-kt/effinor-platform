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

            router.refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      const ch = channelRef.current;
      const sb = supabaseRef.current;
      if (ch && sb) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [leadId, router]);

  return null;
}
