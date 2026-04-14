"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button-variants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { markAppNotificationRead, markAllAppNotificationsRead } from "@/features/notifications/actions/mark-app-notification-read";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AppNotificationRow = Database["public"]["Tables"]["app_notifications"]["Row"];

type AppNotificationsBellProps = {
  userId: string;
};

function notificationDisplayTitle(type: string | null, title: string | null): string {
  const t = title?.trim();
  if (t) return t;
  if (type === "cockpit_ai_recommendation") return "Recommandation cockpit";
  if (type?.startsWith("callback_")) return "Rappel commercial";
  return "Notification";
}

export function AppNotificationsBell({ userId }: AppNotificationsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AppNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null>(null);
  const supabaseRef = useRef<Awaited<ReturnType<typeof createClient>> | null>(null);

  const unread = rows.filter((r) => !r.is_read && !r.is_dismissed).length;

  const load = useCallback(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(80);

    if (!error && data) {
      setRows(data as AppNotificationRow[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;
      supabaseRef.current = supabase;

      const ch = supabase
        .channel(`app-notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "app_notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as AppNotificationRow;
            setRows((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);

            const sev = n.severity;
            const toastTitle = notificationDisplayTitle(n.type, n.title);
            if (sev === "critical" || sev === "high") {
              toast.warning(toastTitle, {
                description: n.body?.trim() || undefined,
                action:
                  n.action_url ?
                    {
                      label: "Ouvrir",
                      onClick: () => {
                        window.location.href = n.action_url ?? "/agent";
                      },
                    }
                  : undefined,
              });
            } else if (n.type?.startsWith("callback_") || n.type === "cockpit_ai_recommendation") {
              toast.info(toastTitle, {
                description: n.body?.trim() || undefined,
                action:
                  n.action_url ?
                    {
                      label: "Ouvrir",
                      onClick: () => {
                        window.location.href = n.action_url ?? "/cockpit";
                      },
                    }
                  : undefined,
              });
            }
          },
        )
        .subscribe();

      channelRef.current = ch;
    })();

    return () => {
      cancelled = true;
      const sb = supabaseRef.current;
      const ch = channelRef.current;
      if (sb && ch) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [userId]);

  async function onReadOne(id: string) {
    const res = await markAppNotificationRead(id);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true, read_at: new Date().toISOString() } : r)));
      router.refresh();
    }
  }

  async function onReadAll() {
    const res = await markAllAppNotificationsRead();
    if (res.ok) {
      const now = new Date().toISOString();
      setRows((prev) => prev.map((r) => ({ ...r, is_read: true, read_at: r.read_at ?? now })));
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative shrink-0",
        )}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-4 py-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => void onReadAll()}
              >
                Tout marquer lu
              </button>
            ) : null}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)]">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((n) => {
                const displayTitle = notificationDisplayTitle(n.type, n.title);
                const titleEl = n.action_url ? (
                  <Link
                    href={n.action_url}
                    className="text-sm font-semibold leading-snug text-foreground hover:underline"
                    onClick={() => void onReadOne(n.id)}
                  >
                    {displayTitle}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold leading-snug">{displayTitle}</p>
                );
                return (
                  <li key={n.id} className={cn(!n.is_read && "bg-muted/40")}>
                    <div className="flex flex-col gap-1.5 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">{titleEl}</div>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            n.severity === "critical" && "bg-destructive/15 text-destructive",
                            n.severity === "high" && "bg-orange-500/15 text-orange-700",
                            n.severity === "warning" && "bg-amber-500/15 text-amber-800",
                            n.severity === "info" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {n.severity}
                        </span>
                      </div>
                      {n.body?.trim() ? (
                        <p className="text-xs leading-relaxed text-muted-foreground">{n.body.trim()}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        {n.action_url ? (
                          <Link
                            href={n.action_url}
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => void onReadOne(n.id)}
                          >
                            Ouvrir le lien
                          </Link>
                        ) : null}
                        {!n.is_read ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => void onReadOne(n.id)}
                          >
                            Marquer lu
                          </button>
                        ) : null}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.created_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
