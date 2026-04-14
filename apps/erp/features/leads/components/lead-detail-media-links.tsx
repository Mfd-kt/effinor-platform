import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LeadRow } from "@/features/leads/types";

function MediaLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Ouvrir le lien
      </Link>
    </div>
  );
}

type LeadDetailMediaLinksProps = {
  lead: LeadRow;
};

function firstUrlFromJson(json: unknown): string | null {
  if (typeof json === "string" && json.trim()) return json.trim();
  if (Array.isArray(json) && json.length > 0 && typeof json[0] === "string") {
    return json[0].trim() || null;
  }
  return null;
}

export function LeadDetailMediaLinks({ lead }: LeadDetailMediaLinksProps) {
  const aerial = firstUrlFromJson(lead.aerial_photos);
  const cadastre = firstUrlFromJson(lead.cadastral_parcel_files);
  const recording = firstUrlFromJson(lead.recording_files);

  if (!aerial && !cadastre && !recording) {
    return null;
  }

  return (
    <Card className="mb-8 border-border shadow-sm">
      <CardHeader>
        <CardTitle>Médias</CardTitle>
        <CardDescription>Liens vers fichiers hébergés (storage ou URL).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {aerial ? <MediaLink href={aerial} label="Photo aérienne" /> : null}
        {cadastre ? <MediaLink href={cadastre} label="Parcelle cadastrale" /> : null}
        {recording ? <MediaLink href={recording} label="Enregistrement audio" /> : null}
      </CardContent>
    </Card>
  );
}
