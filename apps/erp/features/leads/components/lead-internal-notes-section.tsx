"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addLeadInternalNote } from "@/features/leads/actions/add-lead-internal-note";
import type { LeadInternalNoteWithAuthor } from "@/features/leads/types";
import { formatDateTimeFr } from "@/lib/format";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

function authorLabel(note: LeadInternalNoteWithAuthor): string {
  const a = note.author;
  if (!a) return "—";
  const name = a.full_name?.trim();
  if (name) return name;
  return a.email?.trim() || "—";
}

function authorInitials(note: LeadInternalNoteWithAuthor): string {
  const a = note.author;
  if (!a) return "?";
  return profileInitials(a.full_name, a.email);
}

type LeadInternalNotesSectionProps = {
  leadId: string;
  initialNotes: LeadInternalNoteWithAuthor[];
  /** Colonne droite type CRM (large écran) : hauteur limitée, défilement du fil. */
  variant?: "default" | "sidebar";
  className?: string;
  /** Masquer la saisie (ex. agent en lecture seule). */
  readOnly?: boolean;
};

export function LeadInternalNotesSection({
  leadId,
  initialNotes,
  variant = "default",
  className,
  readOnly = false,
}: LeadInternalNotesSectionProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const channel = supabase.channel(`rt-notes-${leadId}`);
      channelRef.current = channel;
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lead_internal_notes",
            filter: `lead_id=eq.${leadId}`,
          },
          () => {
            router.refresh();
            toast.info("Nouvelle note ajoutée");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await addLeadInternalNote({ leadId, body: draft });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDraft("");
    router.refresh();
  }

  const sidebar = variant === "sidebar";
  const [open, setOpen] = useState(true);

  return (
    <Card
      className={cn(
        "w-full",
        !sidebar && "max-w-4xl",
        sidebar && "flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <CardHeader
        className={cn(sidebar && "shrink-0 space-y-1 pb-3", "cursor-pointer select-none")}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className={cn(sidebar && "text-base")}>
            Notes internes
            {!open && initialNotes.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({initialNotes.length})
              </span>
            )}
          </CardTitle>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
          />
        </div>
        {open && (
          <CardDescription className={cn(sidebar && "text-xs leading-snug")}>
            {sidebar
              ? "Fil chronologique — auteur et horodatage."
              : "Historique des notes (auteur et date). Visible sur la fiche lead uniquement."}
          </CardDescription>
        )}
      </CardHeader>
      {open && (
      <CardContent
        className={cn(
          "space-y-6",
          sidebar && "flex flex-1 flex-col gap-0 overflow-hidden pt-0 lg:min-h-0",
        )}
      >
        <div
          className={cn(
            "space-y-4",
            sidebar && "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-0.5",
          )}
        >
          {initialNotes.length ? (
            <ul className="space-y-3">
              {initialNotes.map((note) => (
                <li
                  key={note.id}
                  className="flex gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm"
                >
                  <Avatar className="size-7 shrink-0">
                    {note.author?.avatar_url ? (
                      <AvatarImage src={note.author.avatar_url} alt="" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="text-[0.65rem] font-medium">{authorInitials(note)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeFr(note.created_at)} · {authorLabel(note)}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-foreground">{note.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune note pour l’instant.</p>
          )}
        </div>

        {readOnly ? (
          <p className={cn("text-sm text-muted-foreground", sidebar && "shrink-0 border-t pt-4")}>
            Notes en lecture seule pour votre compte sur ce dossier.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className={cn("space-y-3", sidebar && "shrink-0 border-t pt-4")}
          >
            <div className="space-y-2">
              <Label htmlFor="lead_internal_note" className={cn(sidebar && "text-xs")}>
                Ajouter une note
              </Label>
              <Textarea
                id="lead_internal_note"
                rows={sidebar ? 3 : 4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Saisissez votre note…"
                disabled={submitting}
                className={cn(sidebar && "min-h-[4.5rem] text-sm")}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" size={sidebar ? "sm" : "default"} disabled={submitting || !draft.trim()}>
              {submitting ? "Enregistrement…" : "Enregistrer la note"}
            </Button>
          </form>
        )}
      </CardContent>
      )}
    </Card>
  );
}
