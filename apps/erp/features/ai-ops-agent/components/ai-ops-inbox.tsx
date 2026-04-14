"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  escalateAiOpsConversationAction,
  resolveAiOpsConversationAction,
  snoozeAiOpsConversationAction,
} from "../actions/ai-ops-conversation-actions";
import {
  postAiOpsQuickReply,
  postAiOpsUserMessage,
} from "../actions/post-ai-ops-user-message";
import { rankAiOpsConversations } from "../lib/ai-ops-priority";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type ConversationRow = Database["public"]["Tables"]["ai_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];

type Props = {
  userId: string;
  initialConversations: ConversationRow[];
};

type Tab = "priority" | "waiting" | "snoozed" | "resolved" | "escalated" | "all";

function groupedCount(c: ConversationRow): number | null {
  const m = c.metadata_json;
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  const rec = m as Record<string, unknown>;
  if (typeof rec.grouped_count === "number") return rec.grouped_count;
  const rel = rec.related_entities;
  if (Array.isArray(rel)) return rel.length;
  return null;
}

function lastMessagePreview(messages: MessageRow[]): string {
  if (!messages.length) return "—";
  const last = messages[messages.length - 1];
  const prefix = last.sender_type === "user" ? "Vous : " : "Agent : ";
  const t = last.body.trim().replace(/\s+/g, " ");
  return prefix + (t.length > 120 ? `${t.slice(0, 117)}…` : t);
}

function tabFilter(tab: Tab, c: ConversationRow): boolean {
  if (tab === "resolved") return c.status === "resolved";
  if (tab === "escalated") return c.status === "escalated";
  if (tab === "snoozed") return c.status === "snoozed";
  if (tab === "waiting") return c.status === "awaiting_user" || (c.status === "open" && c.awaiting_user_reply);
  if (tab === "priority") {
    const sev = c.severity ?? "info";
    const pri = c.priority ?? "normal";
    return (
      (c.status === "open" ||
        c.status === "awaiting_user" ||
        c.status === "snoozed" ||
        c.status === "escalated") &&
      (pri === "high" || pri === "critical" || sev === "high" || sev === "critical")
    );
  }
  if (tab === "all") return c.status !== "auto_closed";
  return false;
}

function priorityBadgeVariant(p: string): "default" | "secondary" | "destructive" | "outline" {
  if (p === "critical") return "destructive";
  if (p === "high") return "default";
  if (p === "low") return "outline";
  return "secondary";
}

function severityBadgeVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "critical" || s === "high") return "destructive";
  if (s === "warning") return "default";
  return "outline";
}

export function AiOpsInbox({ userId, initialConversations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    searchParams.get("conversation") ?? initialConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [tab, setTab] = useState<Tab>("priority");
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const ranked = useMemo(() => rankAiOpsConversations(conversations), [conversations]);
  const filtered = useMemo(() => ranked.filter((c) => tabFilter(tab, c)), [ranked, tab]);

  const loadConversations = useCallback(async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(120);
    if (data) setConversations(data);
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const t = requestAnimationFrame(() => {
      void loadMessages(activeId);
    });
    return () => cancelAnimationFrame(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    let cancelled = false;
    const instanceId = crypto.randomUUID();

    const setup = async () => {
      const supabase = await createClient();
      if (cancelled) return null;
      const ch = supabase
        .channel(`ai-ops-conv-${userId}-${instanceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ai_conversations", filter: `user_id=eq.${userId}` },
          () => {
            void loadConversations();
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
  }, [userId, loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    const instanceId = crypto.randomUUID();

    const setup = async () => {
      const supabase = await createClient();
      if (cancelled) return null;
      const ch = supabase
        .channel(`ai-ops-msg-${activeId}-${instanceId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ai_messages",
            filter: `conversation_id=eq.${activeId}`,
          },
          (payload) => {
            const row = payload.new as MessageRow;
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
            void loadConversations();
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
  }, [activeId, loadConversations]);

   const active = conversations.find((c) => c.id === activeId);
  const activeGroupedCount = active ? groupedCount(active) : null;

  function setConversationId(id: string) {
    setActiveId(id);
    router.replace(`/agent-operations?conversation=${id}`, { scroll: false });
  }

  function send() {
    if (!activeId || !draft.trim()) return;
    startTransition(async () => {
      const r = await postAiOpsUserMessage(activeId, draft);
      if (r.ok) {
        setDraft("");
        await loadMessages(activeId);
        await loadConversations();
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 space-y-2 lg:w-80">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["priority", "Prioritaires"],
              ["waiting", "En attente"],
              ["snoozed", "Snoozées"],
              ["resolved", "Résolues"],
              ["escalated", "Escaladées"],
              ["all", "Toutes"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ScrollArea className="h-[50vh] rounded-md border border-border">
          <ul className="divide-y divide-border p-1">
            {filtered.length === 0 ? (
              <li className="space-y-2 p-3 text-xs text-muted-foreground">
                <p>Aucune conversation dans cette vue.</p>
                <p className="text-[11px] leading-relaxed">
                  L’agent opérationnel surveille les rappels, leads, dossiers et complétude des fiches. Les alertes
                  apparaissent ici lorsqu’une action est utile — sans bruit inutile.
                </p>
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setConversationId(c.id)}
                    className={cn(
                      "w-full rounded-md px-2 py-2 text-left text-xs transition-colors",
                      c.id === activeId ? "bg-violet-500/15" : "hover:bg-muted/80",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      <p className="min-w-0 flex-1 font-medium leading-snug">{c.topic}</p>
                      <Badge variant={priorityBadgeVariant(c.priority)} className="text-[10px]">
                        {c.priority}
                      </Badge>
                      <Badge variant={severityBadgeVariant(c.severity ?? "info")} className="text-[10px]">
                        {c.severity ?? "info"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                      {c.status.replace("_", " ")}
                      {groupedCount(c) != null ? ` · ${groupedCount(c)} objets` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.updated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </ScrollArea>
      </aside>

      <section className="min-w-0 flex-1 space-y-3 rounded-lg border border-border bg-card p-3">
        {!active ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Sélectionne une conversation dans la liste.</p>
            <p className="text-xs leading-relaxed">
              Quand tout est calme, cette boîte reste vide : l’agent ne crée un fil que si un signal métier mérite ton
              attention.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{active.topic}</h2>
                  <Badge variant={priorityBadgeVariant(active.priority)}>{active.priority}</Badge>
                  <Badge variant={severityBadgeVariant(active.severity ?? "info")}>{active.severity ?? "info"}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {active.status.replace("_", " ")}
                  </Badge>
                </div>
                {activeGroupedCount != null ? (
                  <p className="text-xs text-muted-foreground">{activeGroupedCount} éléments regroupés dans ce fil.</p>
                ) : null}
                <p className="text-[11px] text-muted-foreground">{lastMessagePreview(messages)}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {active.entity_type === "lead" && active.entity_id ? (
                  <Link
                    href={`/leads/${active.entity_id}`}
                    className={buttonVariants({ variant: "secondary", size: "xs" })}
                  >
                    Ouvrir le lead
                  </Link>
                ) : null}
                {active.entity_type === "callback" && active.entity_id ? (
                  <Link href="/commercial-callbacks" className={buttonVariants({ variant: "secondary", size: "xs" })}>
                    Rappels
                  </Link>
                ) : null}
              </div>
            </div>

            <ScrollArea className="h-[42vh] rounded-md border border-border/80 bg-muted/20 p-2">
              <ul className="space-y-2">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "max-w-[95%] rounded-lg px-2 py-1.5 text-sm",
                      m.sender_type === "user" ? "ml-auto bg-primary/15" : "mr-auto bg-background shadow-sm",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      {m.sender_type === "ai" ? "Agent" : m.sender_type === "user" ? "Toi" : m.sender_type}
                    </p>
                    <p className="whitespace-pre-wrap leading-snug">{m.body}</p>
                    {m.action_type &&
                    m.action_payload &&
                    typeof m.action_payload === "object" &&
                    m.action_payload !== null &&
                    "href" in m.action_payload ? (
                      <Link
                        href={String((m.action_payload as { href?: string }).href ?? "/")}
                        className={cn(buttonVariants({ variant: "outline", size: "xs" }), "mt-1")}
                      >
                        Ouvrir
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <div className="flex flex-wrap gap-1 border-b border-border pb-2">
              <span className="w-full text-[10px] font-medium uppercase text-muted-foreground">Actions rapides</span>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await resolveAiOpsConversationAction(activeId, "ui_resolve");
                    await loadConversations();
 })
                }
              >
                Résoudre
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await snoozeAiOpsConversationAction(activeId, "1h");
                    await loadConversations();
                  })
                }
              >
1 h
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await snoozeAiOpsConversationAction(activeId, "4h");
                    await loadConversations();
                  })
                }
              >
                4 h
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await snoozeAiOpsConversationAction(activeId, "tomorrow");
                    await loadConversations();
                  })
                }
              >
                Demain
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await snoozeAiOpsConversationAction(activeId, "week");
                    await loadConversations();
                  })
                }
              >
                Cette semaine
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await escalateAiOpsConversationAction(activeId);
                    await loadMessages(activeId);
                    await loadConversations();
                  })
                }
              >
                Escalader
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await postAiOpsQuickReply(activeId, "take_care");
                    await loadMessages(activeId);
                    await loadConversations();
                  })
                }
              >
                Je m’en occupe
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await postAiOpsQuickReply(activeId, "show_me");
                    await loadMessages(activeId);
                    await loadConversations();
                  })
                }
              >
                Montre-moi
              </button>
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "xs" })}
                disabled={pending || !activeId}
                onClick={() =>
                  activeId &&
                  startTransition(async () => {
                    await postAiOpsQuickReply(activeId, "resolved");
                    await loadMessages(activeId);
                    await loadConversations();
                  })
                }
              >
                Marquer traité
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Répondre à l’agent…"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button type="button" className={buttonVariants({ size: "sm" })} disabled={pending} onClick={send}>
                Envoyer
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
