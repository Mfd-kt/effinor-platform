"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, Loader2, Save, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ImageUploader } from "../../components/image-uploader"
import { TipTapEditor } from "../../blog/components/tiptap-editor"
import {
  archiveReEnergieArticleAction,
  createReEnergieArticleAction,
  deleteReEnergieArticleAction,
  publishReEnergieArticleAction,
  updateReEnergieArticleAction,
} from "../actions/re-energie-article-actions"
import type {
  ReEnergieArticleDetail,
  ReEnergieCategoryRow,
} from "../queries/get-re-energie"
import {
  RE_ENERGIE_ICON_KEYS,
  type ReEnergieArticleInput,
} from "../schemas/re-energie-article.schema"

import { BlogStatusBadge } from "../../blog/components/blog-status-badge"

interface ReEnergieArticleFormProps {
  article?: ReEnergieArticleDetail | null
  categories: ReEnergieCategoryRow[]
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

export function ReEnergieArticleForm({
  article,
  categories,
}: ReEnergieArticleFormProps) {
  const router = useRouter()
  const isEdit = Boolean(article)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<ReEnergieArticleInput>>({
    category_id: article?.category_id ?? categories[0]?.id ?? "",
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content_html: article?.content_html ?? "",
    content_json: article?.content_json ?? undefined,
    status: article?.status ?? "draft",
    sort_order: article?.sort_order ?? 0,
    icon_key: (article?.icon_key as ReEnergieArticleInput["icon_key"]) ?? null,
    external_href: article?.external_href ?? null,
    seo_title: article?.seo_title ?? "",
    seo_description: article?.seo_description ?? "",
    cover_image_url: article?.cover_image_url ?? "",
    cover_image_alt: article?.cover_image_alt ?? "",
  })
  const [slugLocked, setSlugLocked] = useState(isEdit)

  const categorySlug = useMemo(() => {
    const c = categories.find((x) => x.id === form.category_id)
    return c?.slug ?? "cat"
  }, [categories, form.category_id])

  const set = <K extends keyof ReEnergieArticleInput>(
    key: K,
    value: ReEnergieArticleInput[K] | null | undefined
  ) => setForm((prev) => ({ ...prev, [key]: value as ReEnergieArticleInput[K] }))

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugLocked ? prev.slug : slugify(title),
    }))
  }

  const handleEditorChange = useCallback(
    (html: string, json: Record<string, unknown>) => {
      setForm((prev) => ({ ...prev, content_html: html, content_json: json }))
    },
    []
  )

  const handleSave = async (publish = false) => {
    setLoading(true)
    try {
      if (isEdit && article) {
        const res = await updateReEnergieArticleAction(article.id, form)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        if (publish) {
          const res2 = await publishReEnergieArticleAction(article.id)
          if (!res2.ok) {
            toast.error(res2.error)
            return
          }
        }
        toast.success(publish ? "Fiche publiée !" : "Fiche sauvegardée")
        router.refresh()
      } else {
        const payload = {
          ...form,
          category_id: form.category_id!,
          title: form.title!,
          slug: form.slug!,
          excerpt: form.excerpt!,
          content_html: form.content_html ?? "",
          status: publish ? "published" : "draft",
        } as ReEnergieArticleInput
        const res = await createReEnergieArticleAction(payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(publish ? "Fiche publiée !" : "Fiche créée")
        router.push(`/marketing/re-energie/${res.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!article) return
    if (!window.confirm("Archiver cette fiche ?")) return
    setLoading(true)
    try {
      const res = await archiveReEnergieArticleAction(article.id)
      if (res.ok) {
        toast.success("Fiche archivée")
        router.push("/marketing/re-energie")
      } else {
        toast.error(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!article) return
    if (!window.confirm("Supprimer définitivement cette fiche ?")) return
    setLoading(true)
    try {
      const res = await deleteReEnergieArticleAction(article.id)
      if (res.ok) {
        toast.success("Fiche supprimée")
        router.push("/marketing/re-energie")
      } else {
        toast.error(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEdit ? "Modifier la fiche" : "Nouvelle fiche"}
          </h1>
          {article ? <BlogStatusBadge status={article.status} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && article?.status === "published" && (
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
            disabled={loading || article?.status === "published"}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {article?.status === "published" ? "Déjà publié" : "Publier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="re-category">
              Catégorie (pilier) <span className="text-destructive">*</span>
            </label>
            <select
              id="re-category"
              value={form.category_id ?? ""}
              onChange={(e) => set("category_id", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="re-title">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              id="re-title"
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="re-slug">
                Slug <span className="text-destructive">*</span>
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
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">
                <span className="px-2.5">/services/re/{categorySlug}/</span>
                <input
                  id="re-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true)
                    set("slug", e.target.value)
                  }}
                  className="flex-1 border-0 bg-transparent py-2 pr-3 font-mono text-sm text-foreground focus-visible:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="re-excerpt">
              Accroche (menu + SEO) <span className="text-destructive">*</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({form.excerpt?.length ?? 0}/500)
              </span>
            </label>
            <textarea
              id="re-excerpt"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="re-external">
              Lien personnalisé (optionnel)
            </label>
            <input
              id="re-external"
              type="text"
              value={form.external_href ?? ""}
              onChange={(e) =>
                set("external_href", e.target.value.trim() || null)
              }
              placeholder="/services/... ou https://"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Si rempli, le menu pointe vers ce lien. Sinon, fiche hébergée sur le site
              (contenu ci-dessous).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Contenu</label>
            <TipTapEditor
              content={form.content_json ?? null}
              onChange={handleEditorChange}
              entityId={article?.id}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Image de couverture</h3>
            <ImageUploader
              folder="blog"
              entityId={article?.id}
              value={form.cover_image_url ?? null}
              onChange={(url) => set("cover_image_url", url)}
              hint="Optionnel — 16/9 recommandé"
            />
            {form.cover_image_url ? (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground" htmlFor="re-cover-alt">
                  Texte alternatif
                </label>
                <input
                  id="re-cover-alt"
                  type="text"
                  value={form.cover_image_alt ?? ""}
                  onChange={(e) =>
                    set("cover_image_alt", e.target.value || null)
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Affichage</h3>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="re-icon">
                Icône (liste)
              </label>
              <select
                id="re-icon"
                value={form.icon_key ?? ""}
                onChange={(e) =>
                  set(
                    "icon_key",
                    (e.target.value || null) as ReEnergieArticleInput["icon_key"]
                  )
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Par défaut</option>
                {RE_ENERGIE_ICON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="re-sort">
                Ordre dans la colonne
              </label>
              <input
                id="re-sort"
                type="number"
                min={0}
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  set("sort_order", parseInt(e.target.value, 10) || 0)
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="re-seo-t">
                Titre SEO ({form.seo_title?.length ?? 0}/60)
              </label>
              <input
                id="re-seo-t"
                type="text"
                value={form.seo_title ?? ""}
                onChange={(e) => set("seo_title", e.target.value || null)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="re-seo-d">
                Description SEO ({form.seo_description?.length ?? 0}/160)
              </label>
              <textarea
                id="re-seo-d"
                value={form.seo_description ?? ""}
                onChange={(e) =>
                  set("seo_description", e.target.value || null)
                }
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
