"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, Loader2, Save, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ImageUploader } from "../../components/image-uploader"
import {
  archiveRealisationAction,
  createRealisationAction,
  deleteRealisationAction,
  publishRealisationAction,
  updateRealisationAction,
} from "../actions/realisation-actions"
import type { RealisationDetail } from "../queries/get-realisations"
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type RealisationInput,
  type ServiceType,
} from "../schemas/realisation.schema"

import { RealisationStatusBadge } from "./realisation-status-badge"

interface RealisationFormProps {
  realisation?: RealisationDetail | null
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function RealisationForm({ realisation }: RealisationFormProps) {
  const router = useRouter()
  const isEdit = Boolean(realisation)

  const [loading, setLoading] = useState(false)
  const [slugLocked, setSlugLocked] = useState(isEdit)
  const [form, setForm] = useState<Partial<RealisationInput>>({
    title: realisation?.title ?? "",
    slug: realisation?.slug ?? "",
    excerpt: realisation?.excerpt ?? "",
    description_html: realisation?.description_html ?? "",
    city: realisation?.city ?? "",
    postal_code: realisation?.postal_code ?? "",
    region: realisation?.region ?? "",
    service_type: (realisation?.service_type as ServiceType) ?? "pac-maison",
    surface_m2: realisation?.surface_m2 ?? undefined,
    year_completed: realisation?.year_completed ?? new Date().getFullYear(),
    total_cost_eur: realisation?.total_cost_eur ?? undefined,
    total_aids_eur: realisation?.total_aids_eur ?? undefined,
    cover_image_url: realisation?.cover_image_url ?? "",
    cover_image_alt: realisation?.cover_image_alt ?? "",
    gallery_urls: realisation?.gallery_urls ?? [],
    status: realisation?.status ?? "draft",
    featured: realisation?.featured ?? false,
  })

  const set = <K extends keyof RealisationInput>(
    key: K,
    value: RealisationInput[K] | null | undefined,
  ) => setForm((prev) => ({ ...prev, [key]: value as RealisationInput[K] }))

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugLocked ? prev.slug : slugify(title),
    }))
  }

  const handleSave = async (publish = false) => {
    setLoading(true)
    try {
      if (isEdit && realisation) {
        const res = await updateRealisationAction(realisation.id, form)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        if (publish) {
          const res2 = await publishRealisationAction(realisation.id)
          if (!res2.ok) {
            toast.error(res2.error)
            return
          }
        }
        toast.success(publish ? "Réalisation publiée !" : "Sauvegardé")
        router.refresh()
      } else {
        const payload = {
          ...form,
          status: publish ? "published" : "draft",
        } as RealisationInput
        const res = await createRealisationAction(payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(publish ? "Réalisation publiée !" : "Réalisation créée")
        router.push(`/marketing/realisations/${res.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!realisation || !window.confirm("Archiver cette réalisation ?")) return
    setLoading(true)
    try {
      const res = await archiveRealisationAction(realisation.id)
      if (res.ok) {
        toast.success("Archivé")
        router.push("/marketing/realisations")
      } else {
        toast.error(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !realisation ||
      !window.confirm(
        "Supprimer définitivement cette réalisation ? Cette action est irréversible.",
      )
    ) {
      return
    }
    setLoading(true)
    try {
      const res = await deleteRealisationAction(realisation.id)
      if (res.ok) {
        toast.success("Supprimé")
        router.push("/marketing/realisations")
      } else {
        toast.error(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fundingPct =
    form.total_cost_eur && form.total_aids_eur && form.total_cost_eur > 0
      ? Math.round((form.total_aids_eur / form.total_cost_eur) * 100)
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEdit ? "Modifier la réalisation" : "Nouvelle réalisation"}
          </h1>
          {realisation ? (
            <RealisationStatusBadge status={realisation.status} />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && realisation?.status === "published" && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archiver
            </button>
          )}
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading || realisation?.status === "published"}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {realisation?.status === "published" ? "Déjà publié" : "Publier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="r-title">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              id="r-title"
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Installation PAC air-eau — Maison individuelle Lyon"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="r-slug">
                Slug URL <span className="text-destructive">*</span>
              </label>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setSlugLocked(!slugLocked)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {slugLocked ? "🔒 Déverrouiller" : "🔓 Verrouiller"}
                </button>
              )}
            </div>
            <div className="flex items-center rounded-lg border border-input bg-muted/30">
              <span className="px-3 text-sm text-muted-foreground">
                /realisations/
              </span>
              <input
                id="r-slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugLocked(true)
                  set("slug", e.target.value)
                }}
                placeholder="pac-maison-lyon"
                className="flex-1 border-0 bg-transparent py-2 pr-3 font-mono text-sm focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="r-excerpt">
              Extrait <span className="text-destructive">*</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({form.excerpt?.length ?? 0}/400 caractères)
              </span>
            </label>
            <textarea
              id="r-excerpt"
              value={form.excerpt}
              rows={3}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Description courte affichée sur les cards (10-400 caractères)"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="r-desc">
              Description complète
            </label>
            <textarea
              id="r-desc"
              value={form.description_html}
              rows={8}
              onChange={(e) => set("description_html", e.target.value)}
              placeholder="Description détaillée du chantier : contexte, solution mise en place, résultats obtenus…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              HTML simple accepté : &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;,
              &lt;strong&gt;, &lt;em&gt;.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Projet */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Projet</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="r-service"
              >
                Type de service <span className="text-destructive">*</span>
              </label>
              <select
                id="r-service"
                value={form.service_type}
                onChange={(e) =>
                  set("service_type", e.target.value as ServiceType)
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SERVICE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-surface"
                >
                  Surface (m²)
                </label>
                <input
                  id="r-surface"
                  type="number"
                  min={1}
                  max={10000}
                  value={form.surface_m2 ?? ""}
                  onChange={(e) =>
                    set(
                      "surface_m2",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-year"
                >
                  Année
                </label>
                <input
                  id="r-year"
                  type="number"
                  min={2015}
                  max={2030}
                  value={form.year_completed ?? ""}
                  onChange={(e) =>
                    set(
                      "year_completed",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Localisation</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="r-city"
              >
                Ville <span className="text-destructive">*</span>
              </label>
              <input
                id="r-city"
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Lyon"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-cp"
                >
                  Code postal
                </label>
                <input
                  id="r-cp"
                  type="text"
                  value={form.postal_code ?? ""}
                  onChange={(e) =>
                    set("postal_code", e.target.value || null)
                  }
                  placeholder="69001"
                  inputMode="numeric"
                  pattern="\d{5}"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-region"
                >
                  Région
                </label>
                <input
                  id="r-region"
                  type="text"
                  value={form.region ?? ""}
                  onChange={(e) => set("region", e.target.value || null)}
                  placeholder="Auvergne-Rhône-Alpes"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Financement */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Financement</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="r-cost"
              >
                Coût total (€ HT)
              </label>
              <input
                id="r-cost"
                type="number"
                min={0}
                value={form.total_cost_eur ?? ""}
                onChange={(e) =>
                  set(
                    "total_cost_eur",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="18000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="r-aids"
              >
                Aides obtenues (€)
              </label>
              <input
                id="r-aids"
                type="number"
                min={0}
                value={form.total_aids_eur ?? ""}
                onChange={(e) =>
                  set(
                    "total_aids_eur",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="14000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {fundingPct !== null && (
              <p className="text-xs font-medium text-green-700">
                ✅ {fundingPct}% du projet financé par les aides
              </p>
            )}
          </div>

          {/* Image cover */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Image de couverture</h3>
            <ImageUploader
              folder="realisations"
              entityId={realisation?.id}
              value={form.cover_image_url ?? null}
              onChange={(url) => set("cover_image_url", url)}
              hint="Photo principale du chantier — 16/9 recommandé"
            />
            {form.cover_image_url ? (
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-cover-alt"
                >
                  Texte alternatif (accessibilité)
                </label>
                <input
                  id="r-cover-alt"
                  type="text"
                  value={form.cover_image_alt ?? ""}
                  onChange={(e) =>
                    set("cover_image_alt", e.target.value || null)
                  }
                  placeholder="Description de l'image"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ) : null}
          </div>

          {/* Options */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Options</h3>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured ?? false}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">Épingler en tête de liste</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
