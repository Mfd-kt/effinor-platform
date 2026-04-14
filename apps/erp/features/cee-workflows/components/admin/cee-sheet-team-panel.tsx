"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCeeSheetTeam, updateCeeSheetTeam } from "@/features/cee-workflows/actions/admin-cee-sheet-actions";
import { CeeSheetTeamMembersManager } from "@/features/cee-workflows/components/admin/cee-sheet-team-members-manager";
import type { AdminCeeSheetTeamDetail } from "@/features/cee-workflows/queries/get-cee-sheet-team-with-members";
import type { AssignableProfileOption } from "@/features/cee-workflows/queries/list-assignable-profiles";

export function CeeSheetTeamPanel({
  sheetId,
  sheetName,
  team,
  profiles,
  onChanged,
}: {
  sheetId: string | null;
  sheetName: string | null;
  team: AdminCeeSheetTeamDetail | null;
  profiles: AssignableProfileOption[];
  onChanged: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTeamName(team?.name ?? (sheetName ? `Équipe ${sheetName}` : ""));
    setFeedback(null);
  }, [team, sheetName]);

  if (!sheetId) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Équipe de la fiche</CardTitle>
          <CardDescription>Sélectionnez d’abord une fiche CEE.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  function createOrUpdate() {
    setFeedback(null);
    startTransition(async () => {
      const action = team ? updateCeeSheetTeam : createCeeSheetTeam;
      const result = await action(
        team
          ? { teamId: team.id, sheetId, teamName }
          : { sheetId, teamName: teamName.trim() || `Équipe ${sheetName ?? ""}`.trim() },
      );
      setFeedback(result.ok ? (team ? "Équipe mise à jour." : "Équipe créée.") : result.message);
      if (result.ok) {
        onChanged();
      }
    });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Équipe de la fiche</CardTitle>
        <CardDescription>Créez l’équipe de référence de la fiche puis affectez les membres métier.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cee-team-name">Nom de l’équipe</Label>
          <div className="flex gap-2">
            <Input id="cee-team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            <Button onClick={createOrUpdate} disabled={isPending || !teamName.trim()}>
              {team ? "Mettre à jour" : "Créer l’équipe"}
            </Button>
          </div>
        </div>

        {feedback ? <div className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">{feedback}</div> : null}

        {team ? (
          <CeeSheetTeamMembersManager sheetId={sheetId} team={team} profiles={profiles} onChanged={onChanged} />
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
            Aucune équipe configurée pour cette fiche.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
