"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addCeeSheetTeamMember, removeCeeSheetTeamMember, updateCeeSheetTeamMember } from "@/features/cee-workflows/actions/admin-cee-sheet-actions";
import { CEE_TEAM_ROLE_VALUES } from "@/features/cee-workflows/domain/constants";
import type { AdminCeeSheetTeamDetail } from "@/features/cee-workflows/queries/get-cee-sheet-team-with-members";
import type { AssignableProfileOption } from "@/features/cee-workflows/queries/list-assignable-profiles";

export function CeeSheetTeamMembersManager({
  sheetId,
  team,
  profiles,
  onChanged,
}: {
  sheetId: string;
  team: AdminCeeSheetTeamDetail;
  profiles: AssignableProfileOption[];
  onChanged: () => void;
}) {
  const [userId, setUserId] = useState<string>("");
  const [roleInTeam, setRoleInTeam] = useState<string>("agent");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableProfiles = useMemo(
    () => profiles.filter((profile) => profile.id !== userId || true),
    [profiles, userId],
  );

  function addMember() {
    setFeedback(null);
    if (!userId) return;
    startTransition(async () => {
      const result = await addCeeSheetTeamMember({
        sheetId,
        teamId: team.id,
        userId,
        roleInTeam,
        isActive: true,
      });
      setFeedback(result.ok ? "Membre ajouté." : result.message);
      if (result.ok) {
        setUserId("");
        setRoleInTeam("agent");
        onChanged();
      }
    });
  }

  function updateMember(memberId: string, patch: { roleInTeam?: string; isActive?: boolean }) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCeeSheetTeamMember({
        memberId,
        roleInTeam: patch.roleInTeam,
        isActive: patch.isActive,
      });
      setFeedback(result.ok ? "Membre mis à jour." : result.message);
      if (result.ok) onChanged();
    });
  }

  function removeMember(memberId: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await removeCeeSheetTeamMember({ memberId });
      setFeedback(result.ok ? "Membre supprimé." : result.message);
      if (result.ok) onChanged();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Select value={userId || undefined} onValueChange={(next) => setUserId(next ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir un utilisateur" />
          </SelectTrigger>
          <SelectContent>
            {availableProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.fullName || profile.email} - {profile.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleInTeam} onValueChange={(next) => setRoleInTeam(next ?? "agent")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CEE_TEAM_ROLE_VALUES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addMember} disabled={isPending || !userId}>
          Ajouter
        </Button>
      </div>

      {feedback ? <div className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">{feedback}</div> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membre</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Actif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Aucun membre affecté.
              </TableCell>
            </TableRow>
          ) : (
            team.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-medium">{member.fullName || member.email}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </TableCell>
                <TableCell>
                  <Select
                    value={member.roleInTeam}
                    onValueChange={(next) => updateMember(member.id, { roleInTeam: next ?? member.roleInTeam })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CEE_TEAM_ROLE_VALUES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMember(member.id, { isActive: !member.isActive })}
                  >
                    {member.isActive ? "Actif" : "Inactif"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => removeMember(member.id)}>
                    Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
