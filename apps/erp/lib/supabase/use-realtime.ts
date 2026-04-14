"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, unknown> & { id: string };

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

type UseRealtimeRowsOptions<T extends Row> = {
  table: string;
  /** Column=value filter sent to Supabase Realtime (e.g. lead_id=eq.xxx) */
  filter?: string;
  /** Initial data loaded from server */
  initialData: T[];
  /** Which events to listen for (default: all) */
  events?: RealtimeEvent[];
  /** Called when a relevant change arrives */
  onEvent?: (event: RealtimeEvent, row: T) => void;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
};

/**
 * Generic hook that subscribes to Supabase Realtime postgres_changes
 * and keeps a local array of rows in sync (INSERT / UPDATE / DELETE).
 */
export function useRealtimeRows<T extends Row>({
  table,
  filter,
  initialData,
  events = ["INSERT", "UPDATE", "DELETE"],
  onEvent,
  enabled = true,
}: UseRealtimeRowsOptions<T>) {
  const [rows, setRows] = useState<T[]>(initialData);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const initialDataKey = useMemo(
    () => initialData.map((r) => r.id).join(","),
    [initialData],
  );

  useEffect(() => {
    setRows(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataKey]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const supabaseRef: {
      current: Awaited<ReturnType<typeof createClient>> | null;
    } = { current: null };
    const channelRef: { current: RealtimeChannel | null } = { current: null };

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;
      supabaseRef.current = supabase;

      const channelName = `rt-${table}-${filter ?? "all"}-${Date.now()}`;

      const subscriptions: { event: string; schema: string; table: string; filter?: string }[] =
        events.map((event) => ({
          event,
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        }));

      let channel: RealtimeChannel = supabase.channel(channelName);

      for (const sub of subscriptions) {
        channel = (channel as unknown as {
          on: (
            type: "postgres_changes",
            filter: { event: string; schema: string; table: string; filter?: string },
            callback: (payload: RealtimePostgresChangesPayload<T>) => void,
          ) => RealtimeChannel;
        }).on(
          "postgres_changes",
          sub,
          (payload: RealtimePostgresChangesPayload<T>) => {
            const eventType = payload.eventType as RealtimeEvent;

            if (eventType === "INSERT") {
              const newRow = payload.new as T;
              setRows((prev) => {
                if (prev.some((r) => r.id === newRow.id)) return prev;
                return [newRow, ...prev];
              });
              onEventRef.current?.(eventType, newRow);
            }

            if (eventType === "UPDATE") {
              const updated = payload.new as T;
              setRows((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r)),
              );
              onEventRef.current?.(eventType, updated);
            }

            if (eventType === "DELETE") {
              const old = payload.old as Partial<T>;
              if (old.id) {
                setRows((prev) => prev.filter((r) => r.id !== old.id));
                onEventRef.current?.(eventType, old as T);
              }
            }
          },
        );
      }

      channel.subscribe();
      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      const ch = channelRef.current;
      const sb = supabaseRef.current;
      if (ch && sb) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled, events.join(",")]);

  const refresh = useCallback((newData: T[]) => {
    setRows(newData);
  }, []);

  return { rows, refresh };
}

type UseRealtimeRecordOptions<T extends Row> = {
  table: string;
  id: string;
  initialData: T;
  onUpdate?: (row: T) => void;
  enabled?: boolean;
};

/**
 * Hook to subscribe to a single record's changes.
 */
export function useRealtimeRecord<T extends Row>({
  table,
  id,
  initialData,
  onUpdate,
  enabled = true,
}: UseRealtimeRecordOptions<T>) {
  const [record, setRecord] = useState<T>(initialData);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    setRecord(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!enabled || !id) return;

    let cancelled = false;
    const supabaseRef: {
      current: Awaited<ReturnType<typeof createClient>> | null;
    } = { current: null };
    const channelRef: { current: RealtimeChannel | null } = { current: null };

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;
      supabaseRef.current = supabase;

      const channelName = `rt-${table}-${id}-${Date.now()}`;

      const realtimeChannel = supabase.channel(channelName);
      const channel = (realtimeChannel as unknown as {
        on: (
          type: "postgres_changes",
          filter: { event: "UPDATE"; schema: string; table: string; filter: string },
          callback: (payload: RealtimePostgresChangesPayload<T>) => void,
        ) => RealtimeChannel;
      })
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table,
            filter: `id=eq.${id}`,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            const updated = payload.new as T;
            setRecord(updated);
            onUpdateRef.current?.(updated);
          },
        )
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      const ch = channelRef.current;
      const sb = supabaseRef.current;
      if (ch && sb) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [table, id, enabled]);

  return record;
}
