"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createDocument } from "@/features/documents/actions/create-document";
import { updateDocument } from "@/features/documents/actions/update-document";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import { EMPTY_DOCUMENT_FORM } from "@/features/documents/lib/form-defaults";
import {
  DOCUMENT_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES,
  DocumentInsertSchema,
  type DocumentFormInput,
  type DocumentInsertInput,
} from "@/features/documents/schemas/document.schema";
import type { DocumentFormOptions } from "@/features/documents/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const checkboxClassName =
  "mt-0.5 h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type DocumentFormProps = {
  mode: "create" | "edit";
  documentId?: string;
  defaultValues?: DocumentFormInput;
  options: DocumentFormOptions;
  className?: string;
};

export function DocumentForm({
  mode,
  documentId,
  defaultValues,
  options,
  className,
}: DocumentFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const mergedDefaults = defaultValues ?? EMPTY_DOCUMENT_FORM;

  const form = useForm<DocumentFormInput, unknown, DocumentInsertInput>({
    resolver: zodResolver(DocumentInsertSchema),
    defaultValues: mergedDefaults,
  });

  const { register, handleSubmit } = form;

  async function onSubmit(values: DocumentInsertInput) {
    setFormError(null);

    if (mode === "create") {
      const result = await createDocument(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/documents/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!documentId) {
      setFormError("Identifiant document manquant.");
      return;
    }

    const result = await updateDocument({ id: documentId, ...values });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-8", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle>Type & statut</CardTitle>
          <CardDescription>Typologie documentaire et cycle de vie.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="document_type">Type *</Label>
            <select
              id="document_type"
              className={selectClassName}
              {...register("document_type")}
            >
              {DOCUMENT_TYPE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {DOCUMENT_TYPE_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_subtype">Sous-type</Label>
            <Input id="document_subtype" {...register("document_subtype")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              type="number"
              min={1}
              step={1}
              {...register("version", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_status">Statut *</Label>
            <select
              id="document_status"
              className={selectClassName}
              {...register("document_status")}
            >
              {DOCUMENT_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {DOCUMENT_STATUS_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-2 md:col-span-2">
            <input
              id="is_required"
              type="checkbox"
              className={checkboxClassName}
              {...register("is_required")}
            />
            <Label htmlFor="is_required" className="font-normal leading-snug">
              Document obligatoire dans le dossier
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates & validation</CardTitle>
          <CardDescription>Émission, signature et contrôle interne.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issued_at">Émis le</Label>
            <Input id="issued_at" type="datetime-local" {...register("issued_at")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signed_at">Signé le</Label>
            <Input id="signed_at" type="datetime-local" {...register("signed_at")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checked_at">Contrôlé le</Label>
            <Input id="checked_at" type="datetime-local" {...register("checked_at")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checked_by_user_id">Contrôlé par</Label>
            <select
              id="checked_by_user_id"
              className={selectClassName}
              {...register("checked_by_user_id")}
            >
              <option value="">—</option>
              {options.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-2">
            <input
              id="is_signed_by_client"
              type="checkbox"
              className={checkboxClassName}
              {...register("is_signed_by_client")}
            />
            <Label htmlFor="is_signed_by_client" className="font-normal leading-snug">
              Signé par le client
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <input
              id="is_signed_by_company"
              type="checkbox"
              className={checkboxClassName}
              {...register("is_signed_by_company")}
            />
            <Label htmlFor="is_signed_by_company" className="font-normal leading-snug">
              Signé par l’entreprise
            </Label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="is_compliant">Conformité</Label>
            <select id="is_compliant" className={selectClassName} {...register("is_compliant")}>
              <option value="">Non renseigné</option>
              <option value="true">Conforme</option>
              <option value="false">Non conforme</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Références documentaires</CardTitle>
          <CardDescription>Numéro, date pièce et montants indicatifs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="document_number">Numéro de pièce</Label>
            <Input id="document_number" {...register("document_number")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document_date">Date document</Label>
            <Input id="document_date" type="date" {...register("document_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_ht">Montant HT</Label>
            <Input id="amount_ht" inputMode="decimal" {...register("amount_ht")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_ttc">Montant TTC</Label>
            <Input id="amount_ttc" inputMode="decimal" {...register("amount_ttc")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fichier & signature</CardTitle>
          <CardDescription>
            Métadonnées et chemins Storage — pas d’upload automatisé dans cette phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mime_type">Type MIME</Label>
            <Input id="mime_type" placeholder="application/pdf" {...register("mime_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_size_bytes">Taille (octets)</Label>
            <Input id="file_size_bytes" inputMode="numeric" {...register("file_size_bytes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_bucket">Bucket principal</Label>
            <Input id="storage_bucket" {...register("storage_bucket")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="storage_path">Chemin fichier</Label>
            <Input id="storage_path" {...register("storage_path")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signed_storage_bucket">Bucket signé</Label>
            <Input id="signed_storage_bucket" {...register("signed_storage_bucket")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signed_storage_path">Chemin fichier signé</Label>
            <Input id="signed_storage_path" {...register("signed_storage_path")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signature_provider_url">URL fournisseur signature</Label>
            <Input id="signature_provider_url" type="url" {...register("signature_provider_url")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commentaires internes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="internal_comments"
            rows={4}
            className="min-h-[100px]"
            {...register("internal_comments")}
          />
        </CardContent>
      </Card>

      <Separator />

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{mode === "create" ? "Créer le document" : "Enregistrer"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
