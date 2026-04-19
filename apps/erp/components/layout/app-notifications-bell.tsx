"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button-variants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CALLBACK_PRIORITY_LABELS,
  type CallbackPriority,
} from "@/features/commercial-callbacks/domain/callback-status";
import { partitionAgentCallbackViews } from "@/features/commercial-callbacks/domain/callback-buckets";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import {
  loadCloserBellReminders,
  type CloserBellReminderRow,
} from "@/features/cee-workflows/actions/load-closer-bell-reminders";
import {
  phoneRdvReminderLabelFr,
  phoneRdvReminderLevel,
  type PhoneRdvReminderLevel,
} from "@/features/cee-workflows/lib/closer-phone-rdv-reminder";
import { markAppNotificationRead, markAllAppNotificationsRead } from "@/features/notifications/actions/mark-app-notification-read";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AppNotificationRow = Database["public"]["Tables"]["app_notifications"]["Row"];

type AppNotificationsBellProps = {
  userId: string;
  /** Profils closer / direction : relances leads dans la cloche. */
  includeCloserLeadReminders?: boolean;
};

function isCallbackAppNotificationType(type: string | null): boolean {
  return Boolean(type?.startsWith("callback_"));
}

function notificationDisplayTitle(type: string | null, title: string | null): string {
  const t = title?.trim();
  if (t) return t;
  if (type === "cockpit_ai_recommendation") return "Recommandation cockpit";
  if (type?.startsWith("callback_")) return "Rappel commercial";
  return "Notification";
}

function formatCallbackWhen(row: CommercialCallbackRow): string {
  const d = row.callback_date?.trim() ?? "";
  const t = row.callback_time?.trim();
  if (d && t) return `${d} · ${t.slice(0, 5)}`;
  if (d) return d;
  return "—";
}

/** Lien profond : ouvre la fiche rappel sur le poste Agent. */
function agentCommercialCallbackHref(callbackId: string): string {
  return `/agent?callback=${encodeURIComponent(callbackId)}`;
}

function appNotificationOpenHref(n: AppNotificationRow): string {
  const direct = n.action_url?.trim();
  if (direct) return direct;
  if (isCallbackAppNotificationType(n.type) && n.entity_id) {
    return agentCommercialCallbackHref(n.entity_id);
  }
  if (n.type === "cockpit_ai_recommendation") return "/cockpit";
  return "/agent";
}

/** Fiche lead (outils closer : relance, accord, signature). */
function closerLeadDetailHref(leadId: string): string {
  return `/leads/${encodeURIComponent(leadId)}`;
}

function closerRelanceBadgeClass(level: PhoneRdvReminderLevel): string {
  switch (level) {
    case "overdue":
      return "border-destructive/40 bg-destructive/15 text-destructive";
    case "imminent":
      return "border-orange-600/35 bg-orange-500/15 text-orange-900 dark:text-orange-100";
    case "soon":
      return "border-amber-600/35 bg-amber-500/15 text-amber-950 dark:text-amber-100";
    case "upcoming":
      return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-50";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function formatRelanceWhen(iso: string | null): string {
  if (!iso?.trim()) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppNotificationsBell({
  userId,
  includeCloserLeadReminders = false,
}: AppNotificationsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AppNotificationRow[]>([]);
  const [callbacks, setCallbacks] = useState<CommercialCallbackRow[]>([]);
  const [closerFollowUps, setCloserFollowUps] = useState<CloserBellReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null>(null);
  const callbackChannelRef = useRef<ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null>(null);
  const closerWorkflowBellChannelRef = useRef<ReturnType<
    Awaited<ReturnType<typeof createClient>>["channel"]
  > | null>(null);
  const leadsBellChannelRef = useRef<ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null>(null);
  const leadsBellDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef<Awaited<ReturnType<typeof createClient>> | null>(null);
  /** Horloge pour pastilles relance closer (évite Date.now() impur au rendu). */
  const [closerReminderNowMs, setCloserReminderNowMs] = useState(() => Date.now());

  const unread = rows.filter((r) => !r.is_read && !r.is_dismissed).length;

  const now = new Date();
  const callbackViews = partitionAgentCallbackViews(callbacks, now);
  const upcomingPriority = callbackViews.upcoming.filter(
    (r) => r.priority === "high" || r.priority === "critical",
  );
  const urgentTaskCount =
    callbackViews.due_now.length +
    callbackViews.overdue.length +
    callbackViews.today.length +
    upcomingPriority.length;

  const displayedCloserFollowUps = includeCloserLeadReminders ? closerFollowUps : [];
  const closerReminderCount = displayedCloserFollowUps.length;
  const badgeTotal = unread + urgentTaskCount + closerReminderCount;

  const loadCallbacks = useCallback(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("commercial_callbacks")
      .select("*")
      .is("deleted_at", null)
      .or(`assigned_agent_user_id.eq.${userId},created_by_user_id.eq.${userId}`)
      .order("callback_date", { ascending: true })
      .order("callback_time", { ascending: true, nullsFirst: false })
      .limit(120);

    if (!error && data) {
      setCallbacks(data as CommercialCallbackRow[]);
    }
  }, [userId]);

  const loadCloserReminders = useCallback(async () => {
    if (!includeCloserLeadReminders) return;
    const data = await loadCloserBellReminders();
    setCloserFollowUps(data);
  }, [includeCloserLeadReminders]);

  useEffect(() => {
    if (!includeCloserLeadReminders) return;
    const id = window.setInterval(() => setCloserReminderNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [includeCloserLeadReminders]);

  const load = useCallback(async () => {
    const supabase = await createClient();
    const notifResult = await supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(80);

    if (!notifResult.error && notifResult.data) {
      setRows(notifResult.data as AppNotificationRow[]);
    }

    await loadCallbacks();
    if (includeCloserLeadReminders) {
      await loadCloserReminders();
    }
    setLoading(false);
  }, [userId, loadCallbacks, includeCloserLeadReminders, loadCloserReminders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial centre de notifications
    void load();
  }, [load]);

  const refetchNotificationsQuiet = useCallback(async () => {
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
  }, [userId]);

  /** Onglet repassé au premier plan : resync complet (file rappels + alertes). */
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      void Promise.all([
        refetchNotificationsQuiet(),
        loadCallbacks(),
        ...(includeCloserLeadReminders ? [loadCloserReminders()] : []),
      ]);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refetchNotificationsQuiet, loadCallbacks, includeCloserLeadReminders, loadCloserReminders]);

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
            event: "*",
            schema: "public",
            table: "app_notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string })?.id;
              if (oldId) {
                setRows((prev) => prev.filter((x) => x.id !== oldId));
              }
              return;
            }

            if (payload.eventType === "UPDATE") {
              const n = payload.new as AppNotificationRow;
              if (n.is_dismissed) {
                setRows((prev) => prev.filter((x) => x.id !== n.id));
              } else {
                setRows((prev) => {
                  const i = prev.findIndex((x) => x.id === n.id);
                  if (i === -1) {
                    return [n, ...prev].slice(0, 80);
                  }
                  const next = [...prev];
                  next[i] = n;
                  return next;
                });
              }
              return;
            }

            if (payload.eventType === "INSERT") {
              const n = payload.new as AppNotificationRow;
              if (n.is_dismissed) return;
              setRows((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 80));

              const openHref = appNotificationOpenHref(n);
              const sev = n.severity;
              const toastTitle = notificationDisplayTitle(n.type, n.title);
              if (sev === "critical" || sev === "high") {
                toast.warning(toastTitle, {
                  description: n.body?.trim() || undefined,
                  action: {
                    label: "Ouvrir",
                    onClick: () => {
                      window.location.href = openHref;
                    },
                  },
                });
              } else if (isCallbackAppNotificationType(n.type) || n.type === "cockpit_ai_recommendation") {
                toast.info(toastTitle, {
                  description: n.body?.trim() || undefined,
                  action: {
                    label: "Ouvrir",
                    onClick: () => {
                      window.location.href = openHref;
                    },
                  },
                });
              }
            }
          },
        )
        .subscribe();

      channelRef.current = ch;

      const cbCh = supabase
        .channel(`commercial-callbacks-bell-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "commercial_callbacks" },
          (payload) => {
            const row = (payload.new ?? payload.old) as CommercialCallbackRow | null;
            if (!row) return;
            const mine =
              row.assigned_agent_user_id === userId || row.created_by_user_id === userId;
            if (!mine) return;

            void loadCallbacks();

            const assignedToMe = row.assigned_agent_user_id === userId;
            const createdByOther =
              row.created_by_user_id != null && row.created_by_user_id !== userId;
            if (payload.eventType === "INSERT" && assignedToMe && createdByOther) {
              toast.info("Nouveau rappel commercial", {
                description: `${row.company_name?.trim() || "Prospect"} — ${row.contact_name?.trim() || ""}`.trim(),
                action: {
                  label: "Ouvrir",
                  onClick: () => {
                    window.location.href = agentCommercialCallbackHref(row.id);
                  },
                },
              });
            }
          },
        )
        .subscribe();

      callbackChannelRef.current = cbCh;

      if (includeCloserLeadReminders) {
        closerWorkflowBellChannelRef.current = supabase
          .channel(`closer-wf-bell-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "lead_sheet_workflows",
              filter: `assigned_closer_user_id=eq.${userId}`,
            },
            () => {
              void loadCloserReminders();
            },
          )
          .subscribe();

        leadsBellChannelRef.current = supabase
          .channel(`leads-bell-${userId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "leads" },
            () => {
              if (leadsBellDebounceRef.current) clearTimeout(leadsBellDebounceRef.current);
              leadsBellDebounceRef.current = setTimeout(() => {
                leadsBellDebounceRef.current = null;
                void loadCloserReminders();
              }, 750);
            },
          )
          .subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (leadsBellDebounceRef.current) {
        clearTimeout(leadsBellDebounceRef.current);
        leadsBellDebounceRef.current = null;
      }
      const sb = supabaseRef.current;
      const ch = channelRef.current;
      const cbCh = callbackChannelRef.current;
      const cwCh = closerWorkflowBellChannelRef.current;
      const lCh = leadsBellChannelRef.current;
      if (sb && ch) sb.removeChannel(ch);
      if (sb && cbCh) sb.removeChannel(cbCh);
      if (sb && cwCh) sb.removeChannel(cwCh);
      if (sb && lCh) sb.removeChannel(lCh);
      channelRef.current = null;
      callbackChannelRef.current = null;
      closerWorkflowBellChannelRef.current = null;
      leadsBellChannelRef.current = null;
      supabaseRef.current = null;
    };
  }, [userId, loadCallbacks, includeCloserLeadReminders, loadCloserReminders]);

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

  const systemNotifications = rows.filter((n) => !isCallbackAppNotificationType(n.type));
  const hasRappelSection =
    callbackViews.due_now.length > 0 ||
    callbackViews.overdue.length > 0 ||
    callbackViews.today.length > 0 ||
    upcomingPriority.length > 0;
  const hasCloserSection = displayedCloserFollowUps.length > 0;

  function callbackTierBadgeClasses(tier: "now" | "late" | "today" | "prio"): string {
    if (tier === "now" || tier === "late") {
      return "bg-destructive/15 text-destructive";
    }
    if (tier === "today") {
      return "bg-amber-500/15 text-amber-900 dark:text-amber-200";
    }
    return "bg-orange-500/15 text-orange-800 dark:text-orange-200";
  }

  function renderCallbackBlock(
    label: string,
    tier: "now" | "late" | "today" | "prio",
    blockRows: CommercialCallbackRow[],
  ) {
    if (blockRows.length === 0) return null;
    return (
      <div key={label} className="border-b border-border">
        <p className="bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          <span className="ml-1.5 tabular-nums font-normal normal-case text-muted-foreground">
            ({blockRows.length})
          </span>
        </p>
        <ul className="divide-y divide-border/80">
          {blockRows.map((row) => {
            const pri = row.priority as CallbackPriority;
            const subtitleParts = [row.contact_name?.trim(), formatCallbackWhen(row)];
            if (pri === "high" || pri === "critical") {
              subtitleParts.push(CALLBACK_PRIORITY_LABELS[pri]);
            }
            return (
              <li key={row.id}>
                <div className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={agentCommercialCallbackHref(row.id)}
                      className="min-w-0 text-sm font-semibold leading-snug text-foreground hover:underline"
                    >
                      {row.company_name?.trim() || "—"}
                    </Link>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                        callbackTierBadgeClasses(tier),
                      )}
                    >
                      {tier === "now" ?
                        "Maintenant"
                      : tier === "late" ?
                        "Retard"
                      : tier === "today" ?
                        "Jour J"
                      : "Priorité"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {subtitleParts.filter(Boolean).join(" · ")}
                  </p>
                  <Link
                    href={agentCommercialCallbackHref(row.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ouvrir la fiche rappel
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setCloserReminderNowMs(Date.now());
          void loadCallbacks();
          if (includeCloserLeadReminders) void loadCloserReminders();
        }
      }}
    >
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative shrink-0",
        )}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {badgeTotal > 0 ? (
          <span
            className={cn(
              "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
              unread > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
            )}
          >
            {badgeTotal > 99 ? "99+" : badgeTotal}
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
          <p className="pt-1 text-xs font-normal text-muted-foreground">
            Rappels téléprospection, relances closer sur leads, actions urgentes et alertes applicatives.
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)]">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
          ) : !hasRappelSection && !hasCloserSection && systemNotifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune notification pour l’instant.</p>
          ) : (
            <div>
              {hasRappelSection ? (
                <div className="border-b border-border bg-muted/15">
                  <p className="px-4 py-2.5 text-sm font-semibold text-foreground">Rappels et actions urgentes</p>
                  {renderCallbackBlock("À faire maintenant", "now", callbackViews.due_now)}
                  {renderCallbackBlock("En retard", "late", callbackViews.overdue)}
                  {renderCallbackBlock("Aujourd’hui (plus tard)", "today", callbackViews.today)}
                  {renderCallbackBlock("Priorité élevée à venir", "prio", upcomingPriority)}
                </div>
              ) : null}

              {hasCloserSection ? (
                <div className="border-b border-border bg-muted/15">
                  <p className="px-4 py-2.5 text-sm font-semibold text-foreground">
                    Relances closer — leads à rappeler
                    <span className="ml-2 tabular-nums text-sm font-normal text-muted-foreground">
                      ({displayedCloserFollowUps.length})
                    </span>
                  </p>
                  <ul className="divide-y divide-border/80">
                    {displayedCloserFollowUps.map((item) => {
                      const level = phoneRdvReminderLevel(item.relanceAt, closerReminderNowMs);
                      const levelLabel = phoneRdvReminderLabelFr(level) ?? "Relance";
                      return (
                        <li key={`${item.workflowId}-${item.leadId}`}>
                          <div className="flex flex-col gap-1 px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={closerLeadDetailHref(item.leadId)}
                                className="min-w-0 text-sm font-semibold leading-snug text-foreground hover:underline"
                              >
                                {item.companyName?.trim() || "—"}
                              </Link>
                              <span
                                className={cn(
                                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase",
                                  closerRelanceBadgeClass(level),
                                )}
                              >
                                {levelLabel}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {[item.contactLabel?.trim(), item.sheetCode, formatRelanceWhen(item.relanceAt)]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            <Link
                              href={closerLeadDetailHref(item.leadId)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Ouvrir la fiche lead
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {systemNotifications.length > 0 ? (
                <div>
                  <p className="bg-background px-4 py-2.5 text-sm font-semibold text-foreground">Alertes et messages</p>
                  <ul className="divide-y divide-border">
                    {systemNotifications.map((n) => {
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
                </div>
              ) : null}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
