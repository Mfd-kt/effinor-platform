"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { ReferencePdfAttachment } from "@/features/cee-settings/components/reference-pdf-attachment";
import {
  getDelegatorOfficialPdfSignedUrl,
  removeDelegatorOfficialPdf,
  softDeleteDelegator,
  uploadDelegatorOfficialPdf,
  upsertDelegator,
} from "@/features/cee-settings/actions/delegator-settings-actions";
import type { CeeReferenceData } from "@/features/cee-settings/queries/get-cee-reference-data";
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

function InlineNotice({ message, variant }: { message: string | null; variant: "ok" | "err" }) {
  if (!message) return null;
  return (
    <p
      className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
        variant === "ok"
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100"
          : "border-destructive/40 bg-destructive/5 text-destructive"
      }`}
    >
      {message}
    </p>
  );
}

type DelegatorsReferenceSectionProps = {
  rows: CeeReferenceData["delegators"];
};

export function DelegatorsReferenceSection({ rows }: DelegatorsReferenceSectionProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ text: string; variant: "ok" | "err" } | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storedPdfName, setStoredPdfName] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    siret: "",
    address: "",
    contract_start_date: "",
    invoice_note: "",
    prime_per_kwhc_note: "",
    notes: "",
    control_points: "",
    pdfFile: null as File | null,
  });

  const reset = () => {
    setEditingId(null);
    setStoredPdfName(null);
    setForm({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      siret: "",
      address: "",
      contract_start_date: "",
      invoice_note: "",
      prime_per_kwhc_note: "",
      notes: "",
      control_points: "",
      pdfFile: null,
    });
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (r: CeeReferenceData["delegators"][number]) => {
    reset();
    setEditingId(r.id);
    setStoredPdfName(r.official_pdf_file_name ?? null);
    setForm({
      name: r.name,
      company_name: r.company_name ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      contact_name: r.contact_name ?? "",
      contact_phone: r.contact_phone ?? "",
      contact_email: r.contact_email ?? "",
      siret: r.siret ?? "",
      address: r.address ?? "",
      contract_start_date: r.contract_start_date ?? "",
      invoice_note: r.invoice_note ?? "",
      prime_per_kwhc_note: r.prime_per_kwhc_note ?? "",
      notes: r.notes ?? "",
      control_points: r.control_points ?? "",
      pdfFile: null,
    });
    setOpen(true);
  };

  const submit = async () => {
    setPending(true);
    const res = await upsertDelegator({
      ...form,
      id: editingId ?? undefined,
      control_points: form.control_points.trim() || null,
    });
    if (!res.ok) {
      setPending(false);
      setNotice({ text: res.message, variant: "err" });
      return;
    }
    if (form.pdfFile) {
      const fd = new FormData();
      fd.append("delegatorId", res.id);
      fd.append("file", form.pdfFile);
      const up = await uploadDelegatorOfficialPdf(fd);
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
    setNotice({ text: "Délégataire enregistré.", variant: "ok" });
    router.refresh();
  };

  const downloadPdf = async (id: string) => {
    const r = await getDelegatorOfficialPdfSignedUrl(id);
    if (!r.ok) {
      setNotice({ text: r.message, variant: "err" });
      return;
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const removeStoredPdf = async () => {
    if (!editingId) return;
    if (!window.confirm("Retirer le PDF de ce délégataire ?")) return;
    setPending(true);
    const r = await removeDelegatorOfficialPdf({ id: editingId });
    setPending(false);
    if (!r.ok) {
      setNotice({ text: r.message, variant: "err" });
      return;
    }
    setStoredPdfName(null);
    setNotice({ text: "PDF retiré.", variant: "ok" });
    router.refresh();
  };

  const removeRow = async (id: string) => {
    if (!window.confirm("Retirer ce délégataire du référentiel ?")) return;
    const res = await softDeleteDelegator({ id });
    if (!res.ok) {
      setNotice({ text: res.message, variant: "err" });
      return;
    }
    setNotice({ text: "Délégataire archivé.", variant: "ok" });
    router.refresh();
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60">
        <div>
          <CardTitle>Délégataires</CardTitle>
          <CardDescription>
            Partenaires CEE, obligés et rattachement opérations — un seul référentiel.
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <InlineNotice message={notice?.text ?? null} variant={notice?.variant ?? "ok"} />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun délégataire — cliquez sur « Ajouter ».</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Société</TableHead>
                  <TableHead className="hidden lg:table-cell">Prime (kWhc)</TableHead>
                  <TableHead className="hidden md:table-cell">Contact / SIRET</TableHead>
                  <TableHead className="w-12 text-center" title="PDF">
                    PDF
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const detail =
                    r.contact_email?.trim() ||
                    r.email?.trim() ||
                    r.siret?.trim() ||
                    "—";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {r.company_name ?? "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:table-cell">
                        {r.prime_per_kwhc_note?.trim() ? r.prime_per_kwhc_note : "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] truncate font-mono text-xs md:table-cell">
                        {detail}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.official_pdf_path ? (
                          <FileText className="mx-auto size-4 text-emerald-600" aria-label="PDF joint" />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(r)}
                          aria-label="Modifier"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void removeRow(r.id)}
                          aria-label="Archiver"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Modifier le délégataire" : "Nouveau délégataire"}</SheetTitle>
            <SheetDescription>Coordonnées, mentions de facturation et documents de référence.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 px-4 pb-2">
            <Field
              label="Nom / libellé interne *"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <Field
              label="Raison sociale"
              value={form.company_name}
              onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <Field label="Téléphone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            </div>
            <Field
              label="Contact (nom)"
              value={form.contact_name}
              onChange={(v) => setForm((f) => ({ ...f, contact_name: v }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Contact (tél.)"
                value={form.contact_phone}
                onChange={(v) => setForm((f) => ({ ...f, contact_phone: v }))}
              />
              <Field
                label="Contact (e-mail)"
                value={form.contact_email}
                onChange={(v) => setForm((f) => ({ ...f, contact_email: v }))}
              />
            </div>
            <Field label="SIRET" value={form.siret} onChange={(v) => setForm((f) => ({ ...f, siret: v }))} />
            <div>
              <Label htmlFor="dlg-address">Adresse</Label>
              <Textarea
                id="dlg-address"
                className="mt-1.5 min-h-[72px]"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <Field
              label="Début contrat (AAAA-MM-JJ)"
              value={form.contract_start_date}
              onChange={(v) => setForm((f) => ({ ...f, contract_start_date: v }))}
            />
            <div>
              <Label htmlFor="dlg-inv">Note facture</Label>
              <Textarea
                id="dlg-inv"
                className="mt-1.5 min-h-[60px]"
                value={form.invoice_note}
                onChange={(e) => setForm((f) => ({ ...f, invoice_note: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dlg-prime">Montant de la prime (par kWhc)</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ex. 0,0073 € par kWhc — saisie libre (virgule ou point).
              </p>
              <Input
                id="dlg-prime"
                className="mt-1.5 font-mono text-sm"
                value={form.prime_per_kwhc_note}
                onChange={(e) => setForm((f) => ({ ...f, prime_per_kwhc_note: e.target.value }))}
                placeholder="0,0073 € par kWhc"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="dlg-control">Points de contrôle (dossier)</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Critères pour contrôler les dossiers liés à ce délégataire.
              </p>
              <Textarea
                id="dlg-control"
                className="mt-1.5 min-h-[80px]"
                value={form.control_points}
                onChange={(e) => setForm((f) => ({ ...f, control_points: e.target.value }))}
              />
            </div>
            <ReferencePdfAttachment
              inputId="dlg-pdf"
              title="Document PDF (contrat, cadre, etc.)"
              selectedFile={form.pdfFile}
              storedFileName={storedPdfName}
              pending={pending}
              showStoredActions={Boolean(editingId && storedPdfName)}
              onInvalidFile={(msg) => setNotice({ text: msg, variant: "err" })}
              onFileAccepted={(file) => setForm((f) => ({ ...f, pdfFile: file }))}
              onDownloadStored={editingId ? () => void downloadPdf(editingId) : undefined}
              onRemoveStored={editingId ? () => void removeStoredPdf() : undefined}
              pendingUploadHint="Ce PDF sera envoyé lors de l’enregistrement."
            />
            <div>
              <Label htmlFor="dlg-notes">Notes</Label>
              <Textarea
                id="dlg-notes"
                className="mt-1.5 min-h-[72px]"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter className="border-t border-border/60 pt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={pending || !form.name.trim()} onClick={() => void submit()}>
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
