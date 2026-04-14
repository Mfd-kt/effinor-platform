"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
};

export function AiOpsAgentHeaderButton({ userId }: Props) {
  const [openCount, setOpenCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = await createClient();
    const { count } = await supabase
      .from("ai_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["open", "escalated"])
      .eq("awaiting_user_reply", true);
    setOpenCount(count ?? 0);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const instanceId = crypto.randomUUID();

    const setup = async () => {
      const supabase = await createClient();
      if (cancelled) return null;
      const ch = supabase
        .channel(`ai-ops-header-${userId}-${instanceId}`)
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
    <Link
      href="/agent-operations"
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      aria-label="Agent opérations"
    >
      <Bot className="size-5" />
      {openCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
          {openCount > 9 ? "9+" : openCount}
        </span>
      ) : null}
    </Link>
  );
}
