"use client";

import { useMemo } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatMyQueueCeeSheetOptionLabel } from "../lib/my-queue-cee-sheet-option";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";

const SHEET_NONE = "__lg_cee_sheet_none__";
const TEAM_NONE = "__lg_cee_team_none__";

export type LeadGenerationCeeTeamDisplayFallbacks = {
  ceeSheetCode?: string | null;
  ceeSheetLabel?: string | null;
  targetTeamName?: string | null;
};

export type LeadGenerationCeeTeamPickersProps = {
  scope: LeadGenerationCeeImportScope;
  ceeSheetId: string;
  targetTeamId: string;
  onCeeSheetIdChange: (ceeSheetId: string) => void;
  onTargetTeamIdChange: (targetTeamId: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Libellés issus du lot (jointure) quand l’UUID n’apparaît pas dans `scope`. */
  displayFallbacks?: LeadGenerationCeeTeamDisplayFallbacks;
};

export function LeadGenerationCeeTeamPickers({
  scope,
  ceeSheetId,
  targetTeamId,
  onCeeSheetIdChange,
  onTargetTeamIdChange,
  disabled,
  idPrefix = "lg-cee",
  displayFallbacks,
}: LeadGenerationCeeTeamPickersProps) {
  const sheetSelectValue = ceeSheetId.trim() ? ceeSheetId : SHEET_NONE;
  const teamSelectValue = targetTeamId.trim() ? targetTeamId : TEAM_NONE;

  const sheets = useMemo(() => {
    const base = [...scope.sheets];
    const sid = ceeSheetId.trim();
    if (sid && !base.some((s) => s.id === sid)) {
      base.push({
        id: sid,
        code: displayFallbacks?.ceeSheetCode?.trim() ?? "",
        label: displayFallbacks?.ceeSheetLabel?.trim() ?? "",
      });
    }
    return base;
  }, [
    scope.sheets,
    ceeSheetId,
    displayFallbacks?.ceeSheetCode,
    displayFallbacks?.ceeSheetLabel,
  ]);

  const teamsForSheet = useMemo(() => {
    const sid = ceeSheetId.trim();
    const base = sid ? scope.teams.filter((t) => t.ceeSheetId === sid) : [];
    const tid = targetTeamId.trim();
    if (tid && !base.some((t) => t.id === tid)) {
      const name = displayFallbacks?.targetTeamName?.trim() ?? "";
      base.push({
        id: tid,
        ceeSheetId: sid,
        name: name.length > 0 ? name : "Équipe (hors liste)",
      });
    }
    return base;
  }, [
    scope.teams,
    ceeSheetId,
    targetTeamId,
    displayFallbacks?.targetTeamName,
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-sheet`}>Fiche CEE</Label>
        <p className="text-[11px] text-muted-foreground">
          Chaque import est rattaché à une fiche et à l’équipe qui la traite (distribution du stock sur cette équipe
          uniquement).
        </p>
        <Select
          value={sheetSelectValue}
          onValueChange={(v) => {
            const raw = v ?? SHEET_NONE;
            const next = raw === SHEET_NONE ? "" : raw;
            onCeeSheetIdChange(next);
            onTargetTeamIdChange("");
          }}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-sheet`} className="w-full">
            {/* Pas d’enfants : Base UI dérive le libellé depuis le SelectItem correspondant au value. */}
            <SelectValue placeholder="— Choisir —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SHEET_NONE}>— Choisir —</SelectItem>
            {sheets.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {formatMyQueueCeeSheetOptionLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sheets.length === 0 ? (
          <p className="text-xs text-destructive">
            Aucune fiche CEE chargée (référentiel vide ou droits insuffisants). Les sélecteurs restent ouverts pour
            diagnostic.
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-team`}>Équipe cible</Label>
        <Select
          value={teamSelectValue}
          onValueChange={(v) => {
            const raw = v ?? TEAM_NONE;
            onTargetTeamIdChange(raw === TEAM_NONE ? "" : raw);
          }}
          disabled={disabled || !ceeSheetId.trim() || teamsForSheet.length === 0}
        >
          <SelectTrigger id={`${idPrefix}-team`} className="w-full">
            <SelectValue
              placeholder={
                ceeSheetId.trim()
                  ? teamsForSheet.length === 0
                    ? "Aucune équipe pour cette fiche"
                    : "— Choisir —"
                  : "Choisissez d’abord une fiche"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TEAM_NONE}>— Choisir —</SelectItem>
            {teamsForSheet.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ceeSheetId.trim() && teamsForSheet.length === 0 ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Aucune équipe active pour cette fiche : créez-en une dans l’administration CEE.
          </p>
        ) : null}
      </div>
    </div>
  );
}
