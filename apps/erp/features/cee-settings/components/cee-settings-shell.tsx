"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { DelegatorsReferenceSection } from "@/features/cee-settings/components/delegators-reference-section";
import { ReferencePdfAttachment } from "@/features/cee-settings/components/reference-pdf-attachment";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getCeeSheetOfficialPdfSignedUrl,
  removeCeeSheetOfficialPdf,
  softDeleteCeeSheet,
  uploadCeeSheetOfficialPdf,
  upsertCeeSheet,
} from "@/features/cee-settings/actions/cee-sheet-settings-actions";
import type { CeeReferenceData } from "@/features/cee-settings/queries/get-cee-reference-data";
import { cn } from "@/lib/utils";

type CeeSettingsShellProps = {
  initial: CeeReferenceData;
};

function InlineNotice({ message, variant }: { message: string | null; variant: "ok" | "err" }) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "mb-4 rounded-lg border px-3 py-2 text-sm",
        variant === "ok"
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100"
          : "border-destructive/40 bg-destructive/5 text-destructive",
      )}
    >
      {message}
    </p>
  );
}

export function CeeSettingsShell({ initial }: CeeSettingsShellProps) {
  return (
    <div className="space-y-10">
      <DelegatorsReferenceSection rows={initial.delegators} />
      <CeeSheetsSection rows={initial.ceeSheets} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = label.replace(/\s/g, "-").slice(0, 24);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CeeSheetsSection({ rows }: { rows: CeeReferenceData["ceeSheets"] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ text: string; variant: "ok" | "err" } | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [storedPdfName, setStoredPdfName] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    label: "",
    description: "",
    sort_order: "0",
    simulator_key: "",
    presentation_template_key: "",
    agreement_template_key: "",
    workflow_key: "",
    requires_technical_visit: false,
    requires_quote: true,
    is_commercial_active: true,
    control_points: "",
    pdfFile: null as File | null,
  });

  const reset = () => {
    setEditingId(null);
    setStoredPdfName(null);
    setForm({
      code: "",
      label: "",
      description: "",
      sort_order: "0",
      simulator_key: "",
      presentation_template_key: "",
      agreement_template_key: "",
      workflow_key: "",
      requires_technical_visit: false,
      requires_quote: true,
      is_commercial_active: true,
      control_points: "",
      pdfFile: null,
    });
  };

  const openEdit = (r: (typeof rows)[0]) => {
    setEditingId(r.id);
    setStoredPdfName(r.official_pdf_file_name ?? null);
    setForm({
      code: r.code,
      label: r.label,
      description: r.description ?? "",
      sort_order: String(r.sort_order ?? 0),
      simulator_key: r.simulator_key ?? "",
      presentation_template_key: r.presentation_template_key ?? "",
      agreement_template_key: r.agreement_template_key ?? "",
      workflow_key: r.workflow_key ?? "",
      requires_technical_visit: r.requires_technical_visit ?? false,
      requires_quote: r.requires_quote ?? true,
      is_commercial_active: r.is_commercial_active ?? true,
      control_points: r.control_points ?? "",
      pdfFile: null,
    });
    setOpen(true);
  };

  const submit = async () => {
    setPending(true);
    const res = await upsertCeeSheet({
      id: editingId ?? undefined,
      code: form.code,
      label: form.label,
      description: form.description || null,
      sort_order: Number(form.sort_order) || 0,
      simulator_key: form.simulator_key.trim() || null,
      presentation_template_key: form.presentation_template_key.trim() || null,
      agreement_template_key: form.agreement_template_key.trim() || null,
      workflow_key: form.workflow_key.trim() || null,
      requires_technical_visit: form.requires_technical_visit,
      requires_quote: form.requires_quote,
      is_commercial_active: form.is_commercial_active,
      control_points: form.control_points.trim() || null,
    });
    if (!res.ok) {
      setPending(false);
      setNotice({ text: res.message, variant: "err" });
      return;
    }

    if (form.pdfFile) {
      const fd = new FormData();
      fd.append("sheetId", res.id);
      fd.append("file", form.pdfFile);
      const up = await uploadCeeSheetOfficialPdf(fd);
      if (!up.ok) {
        setPending(false);
        setNotice({
          text: `Fiche enregistrée, mais échec de l’envoi du PDF : ${up.message}`,
          variant: "err",
        });
        router.refresh();
        return;
      }
    }

    setPending(false);
    setOpen(false);
    reset();
    setNotice({ text: "Fiche CEE enregistrée.", variant: "ok" });
    router.refresh();
  };

  const downloadPdf = async (sheetId: string) => {
    const r = await getCeeSheetOfficialPdfSignedUrl(sheetId);
    if (!r.ok) {
      setNotice({ text: r.message, variant: "err" });
      return;
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const removeStoredPdf = async () => {
    if (!editingId) return;
    if (!window.confirm("Retirer le PDF officiel de cette fiche ?")) return;
    setPending(true);
    const r = await removeCeeSheetOfficialPdf({ id: editingId });
    setPending(false);
    if (!r.ok) {
      setNotice({ text: r.message, variant: "err" });
      return;
    }
    setStoredPdfName(null);
    setNotice({ text: "PDF retiré.", variant: "ok" });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Retirer cette fiche du référentiel ?")) return;
    const res = await softDeleteCeeSheet({ id });
    if (!res.ok) {
      setNotice({ text: res.message, variant: "err" });
      return;
    }
    setNotice({ text: "Fiche archivée.", variant: "ok" });
    router.refresh();
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60">
        <div>
          <CardTitle>Fiches CEE</CardTitle>
          <CardDescription>Codes de fiches utilisables sur les dossiers (référentiel).</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <InlineNotice message={notice?.text ?? null} variant={notice?.variant ?? "ok"} />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune fiche — ajoutez un code (ex. BAT-SECT-104).</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Ordre</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="w-12 text-center" title="PDF officiel">
                    PDF
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums text-muted-foreground text-sm">{r.sort_order}</TableCell>
                    <TableCell className="font-mono text-sm">{r.code}</TableCell>
                    <TableCell className="text-sm">{r.label}</TableCell>
                    <TableCell className="text-center">
                      {r.official_pdf_path ? (
                        <FileText className="mx-auto size-4 text-emerald-600" aria-label="PDF joint" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => openEdit(r)} aria-label="Modifier">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void remove(r.id)}
                        aria-label="Archiver"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Modifier la fiche" : "Nouvelle fiche CEE"}</SheetTitle>
            <SheetDescription>Code et libellé affichés dans les opérations.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 px-4 pb-2">
            <Field label="Code fiche *" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
            <Field label="Libellé *" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} />
            <Field label="Ordre d’affichage" value={form.sort_order} onChange={(v) => setForm((f) => ({ ...f, sort_order: v }))} />
            <Field
              label="Clé simulateur"
              value={form.simulator_key}
              onChange={(v) => setForm((f) => ({ ...f, simulator_key: v }))}
            />
            <Field
              label="Clé template présentation"
              value={form.presentation_template_key}
              onChange={(v) => setForm((f) => ({ ...f, presentation_template_key: v }))}
            />
            <Field
              label="Clé template accord"
              value={form.agreement_template_key}
              onChange={(v) => setForm((f) => ({ ...f, agreement_template_key: v }))}
            />
            <Field
              label="Clé workflow"
              value={form.workflow_key}
              onChange={(v) => setForm((f) => ({ ...f, workflow_key: v }))}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.requires_technical_visit}
                onChange={(e) => setForm((f) => ({ ...f, requires_technical_visit: e.target.checked }))}
              />
              Nécessite une visite technique
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.requires_quote}
                onChange={(e) => setForm((f) => ({ ...f, requires_quote: e.target.checked }))}
              />
              Nécessite un devis
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_commercial_active}
                onChange={(e) => setForm((f) => ({ ...f, is_commercial_active: e.target.checked }))}
              />
              Fiche commercialement active
            </label>
            <div>
              <Label htmlFor="cs-desc">Description</Label>
              <Textarea
                id="cs-desc"
                className="mt-1.5 min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cs-control">Points de contrôle (dossier)</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Critères ou liste à vérifier pour contrôler le dossier (usage ultérieur dans l’app).
              </p>
              <Textarea
                id="cs-control"
                className="mt-1.5 min-h-[100px]"
                value={form.control_points}
                onChange={(e) => setForm((f) => ({ ...f, control_points: e.target.value }))}
                placeholder="Ex. : présence du devis signé, photos avant/après, conformité puissance…"
              />
            </div>
            <ReferencePdfAttachment
              inputId="cs-pdf"
              title="PDF officiel de la fiche"
              selectedFile={form.pdfFile}
              storedFileName={storedPdfName}
              pending={pending}
              showStoredActions={Boolean(editingId && storedPdfName)}
              onInvalidFile={(msg) => setNotice({ text: msg, variant: "err" })}
              onFileAccepted={(file) => setForm((prev) => ({ ...prev, pdfFile: file }))}
              onDownloadStored={editingId ? () => void downloadPdf(editingId) : undefined}
              onRemoveStored={editingId ? () => void removeStoredPdf() : undefined}
              pendingUploadHint="Ce PDF sera envoyé lors de l’enregistrement de la fiche."
            />
          </div>
          <SheetFooter className="border-t border-border/60 pt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={pending || !form.code.trim() || !form.label.trim()} onClick={() => void submit()}>
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
