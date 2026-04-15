"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  publishTechnicalVisitTemplateVersion,
  updateTechnicalVisitTemplateVersionSchema,
} from "@/features/technical-visits/template-builder/actions/template-builder-actions";
import type { VisitTemplateBuilderPayload } from "@/features/technical-visits/template-builder/schemas/visit-template-builder.schema";
import { cn } from "@/lib/utils";

const FIELD_TYPES = ["text", "textarea", "number", "select", "radio", "boolean", "photo", "calculated"] as const;

type FieldType = (typeof FIELD_TYPES)[number];

function normalizeOrders(schema: VisitTemplateBuilderPayload): VisitTemplateBuilderPayload {
  const sections = [...schema.sections]
    .sort((a, b) => a.order - b.order)
    .map((s, si) => ({
      ...s,
      order: si + 1,
      fields: [...s.fields]
        .sort((a, b) => a.order - b.order)
        .map((f, fi) => ({ ...f, order: fi + 1 })),
    }));
  return { ...schema, sections };
}

export function TechnicalVisitTemplateVersionEditor({
  versionId,
  templateId,
  initialSchema,
  readOnly,
  masterLabel,
}: {
  versionId: string;
  templateId: string;
  initialSchema: VisitTemplateBuilderPayload;
  readOnly: boolean;
  masterLabel: string;
}) {
  const router = useRouter();
  const [schema, setSchema] = useState(() => normalizeOrders(initialSchema));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const renumber = useCallback((next: VisitTemplateBuilderPayload) => normalizeOrders(next), []);

  const saveDraft = async () => {
    setFeedback(null);
    setSaving(true);
    try {
      const payload = renumber(schema);
      const result = await updateTechnicalVisitTemplateVersionSchema({
        versionId,
        schema_json: payload,
      });
      if (!result.ok) {
        setFeedback({ text: result.message, ok: false });
        return;
      }
      setSchema(payload);
      setFeedback({ text: "Brouillon enregistré.", ok: true });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setFeedback(null);
    setPublishing(true);
    try {
      const payload = renumber(schema);
      const saveFirst = await updateTechnicalVisitTemplateVersionSchema({
        versionId,
        schema_json: payload,
      });
      if (!saveFirst.ok) {
        setFeedback({ text: saveFirst.message, ok: false });
        return;
      }
      const pub = await publishTechnicalVisitTemplateVersion({ versionId });
      if (!pub.ok) {
        setFeedback({ text: pub.message, ok: false });
        return;
      }
      setFeedback({ text: "Version publiée.", ok: true });
      router.push(`/admin/technical-visit-templates/${templateId}`);
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  const addSection = () => {
    if (readOnly) return;
    setSchema((prev) =>
      renumber({
        ...prev,
        sections: [
          ...prev.sections,
          {
            id: `section-${crypto.randomUUID()}`,
            title: `Section ${prev.sections.length + 1}`,
            order: prev.sections.length + 1,
            fields: [],
          },
        ],
      }),
    );
  };

  const removeSection = (idx: number) => {
    if (readOnly || schema.sections.length <= 1) return;
    setSchema((prev) => renumber({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (readOnly) return;
    const j = idx + dir;
    if (j < 0 || j >= schema.sections.length) return;
    const secs = [...schema.sections];
    [secs[idx], secs[j]] = [secs[j]!, secs[idx]!];
    setSchema(renumber({ ...schema, sections: secs }));
  };

  const updateSectionTitle = (idx: number, title: string) => {
    if (readOnly) return;
    setSchema((prev) => {
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx]!, title };
      return { ...prev, sections };
    });
  };

  const addField = (sectionIdx: number) => {
    if (readOnly) return;
    setSchema((prev) => {
      const sections = [...prev.sections];
      const sec = sections[sectionIdx]!;
      const n = sec.fields.length + 1;
      sections[sectionIdx] = {
        ...sec,
        fields: [
          ...sec.fields,
          {
            id: `field-${crypto.randomUUID()}`,
            type: "text" as FieldType,
            label: `Champ ${n}`,
            required: false,
            order: n,
          },
        ],
      };
      return renumber({ ...prev, sections });
    });
  };

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    if (readOnly) return;
    setSchema((prev) => {
      const sections = [...prev.sections];
      const sec = sections[sectionIdx]!;
      sections[sectionIdx] = {
        ...sec,
        fields: sec.fields.filter((_, i) => i !== fieldIdx),
      };
      return renumber({ ...prev, sections });
    });
  };

  const moveField = (sectionIdx: number, fieldIdx: number, dir: -1 | 1) => {
    if (readOnly) return;
    const sec = schema.sections[sectionIdx]!;
    const j = fieldIdx + dir;
    if (j < 0 || j >= sec.fields.length) return;
    const fields = [...sec.fields];
    [fields[fieldIdx], fields[j]] = [fields[j]!, fields[fieldIdx]!];
    const sections = [...schema.sections];
    sections[sectionIdx] = { ...sec, fields };
    setSchema(renumber({ ...schema, sections }));
  };

  const updateField = (
    sectionIdx: number,
    fieldIdx: number,
    patch: Partial<VisitTemplateBuilderPayload["sections"][0]["fields"][0]>,
  ) => {
    if (readOnly) return;
    setSchema((prev) => {
      const sections = [...prev.sections];
      const sec = sections[sectionIdx]!;
      const fields = [...sec.fields];
      fields[fieldIdx] = { ...fields[fieldIdx]!, ...patch };
      sections[sectionIdx] = { ...sec, fields };
      return { ...prev, sections };
    });
  };

  const updateSchemaLabel = (label: string) => {
    if (readOnly) return;
    setSchema((prev) => ({ ...prev, label }));
  };

  const versionLabel = useMemo(() => `v${schema.version} — ${masterLabel}`, [schema.version, masterLabel]);

  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            feedback.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {feedback.text}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Formulaire ({versionLabel})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé du formulaire (schema.label)</Label>
            <Input
              value={schema.label}
              onChange={(e) => updateSchemaLabel(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Clé « {schema.template_key} » et version {schema.version} sont figées pour cette ligne de version.
          </p>
        </CardContent>
      </Card>

      {schema.sections.map((section, si) => (
        <Card key={section.id}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-muted-foreground text-xs font-medium">Section {si + 1}</span>
              <Input
                value={section.title}
                onChange={(e) => updateSectionTitle(si, e.target.value)}
                disabled={readOnly}
                className="max-w-md font-medium"
              />
            </div>
            {!readOnly ? (
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => moveSection(si, -1)}>
                  Monter
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveSection(si, 1)}>
                  Descendre
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSection(si)}
                  disabled={schema.sections.length <= 1}
                >
                  Supprimer
                </Button>
                <Button type="button" size="sm" onClick={() => addField(si)}>
                  + Champ
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucun champ — ajoutez-en pour publier.</p>
            ) : null}
            {section.fields.map((field, fi) => (
              <div
                key={field.id}
                className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Clé (id)</Label>
                    <Input
                      value={field.id}
                      onChange={(e) => updateField(si, fi, { id: e.target.value })}
                      disabled={readOnly}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const t = e.target.value as FieldType;
                        const patch: Partial<typeof field> = { type: t };
                        if (t !== "select" && t !== "radio") patch.options = undefined;
                        if (t !== "photo") {
                          patch.min_files = undefined;
                          patch.max_files = undefined;
                        }
                        updateField(si, fi, patch);
                      }}
                      disabled={readOnly}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[160px] flex-1 space-y-1">
                    <Label className="text-xs">Libellé</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(si, fi, { label: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(si, fi, { required: e.target.checked })}
                      disabled={readOnly}
                    />
                    Obligatoire
                  </label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Texte d&apos;aide (hint)</Label>
                  <Input
                    value={field.hint ?? ""}
                    onChange={(e) => updateField(si, fi, { hint: e.target.value || undefined })}
                    disabled={readOnly}
                    placeholder="Optionnel"
                  />
                </div>
                {(field.type === "select" || field.type === "radio") && !readOnly ? (
                  <OptionsEditor
                    options={field.options ?? []}
                    onChange={(opts) => updateField(si, fi, { options: opts })}
                  />
                ) : null}
                {(field.type === "select" || field.type === "radio") && readOnly ? (
                  <p className="text-muted-foreground text-xs">
                    {(field.options ?? []).map((o) => `${o.value}=${o.label}`).join(" · ") || "—"}
                  </p>
                ) : null}
                {field.type === "photo" ? (
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">min_files</Label>
                      <Input
                        type="number"
                        min={0}
                        value={field.min_files ?? 0}
                        onChange={(e) =>
                          updateField(si, fi, { min_files: Number(e.target.value) || 0 })
                        }
                        disabled={readOnly}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">max_files (vide = illimité)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={field.max_files ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateField(si, fi, {
                            max_files: v === "" ? undefined : Number(v),
                          });
                        }}
                        disabled={readOnly}
                        className="w-24"
                      />
                    </div>
                  </div>
                ) : null}
                {!readOnly ? (
                  <div className="flex flex-wrap gap-1 border-t border-border/60 pt-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => moveField(si, fi, -1)}>
                      Monter
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveField(si, fi, 1)}>
                      Descendre
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeField(si, fi)}>
                      Supprimer le champ
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={addSection}>
            + Section
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving || publishing}>
              {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
            </Button>
            <Button type="button" onClick={publish} disabled={saving || publishing}>
              {publishing ? "Publication…" : "Valider et publier"}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Les champs calculés et règles de visibilité ne sont pas disponibles en V1 du builder.
      </p>
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; label: string }[];
  onChange: (o: { value: string; label: string }[]) => void;
}) {
  const rows = options.length > 0 ? options : [{ value: "", label: "" }];

  const setRow = (i: number, patch: Partial<{ value: string; label: string }>) => {
    const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  const addRow = () => onChange([...rows, { value: "", label: "" }]);

  return (
    <div className="space-y-2">
      <Label className="text-xs">Options (valeur / libellé)</Label>
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-2">
          <Input
            placeholder="valeur"
            value={row.value}
            onChange={(e) => setRow(i, { value: e.target.value })}
            className="max-w-[140px] font-mono text-xs"
          />
          <Input
            placeholder="libellé"
            value={row.label}
            onChange={(e) => setRow(i, { label: e.target.value })}
            className="max-w-xs flex-1"
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        + Option
      </Button>
    </div>
  );
}
