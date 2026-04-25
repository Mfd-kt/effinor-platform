"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, Loader2, Save, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  archiveBlogArticleAction,
  createBlogArticleAction,
  deleteBlogArticleAction,
  publishBlogArticleAction,
  updateBlogArticleAction,
} from "../actions/blog-article-actions"
import type { BlogArticleDetail } from "../queries/get-blog-articles"
import type { BlogArticleInput } from "../schemas/blog-article.schema"

import { BlogStatusBadge } from "./blog-status-badge"
import { TipTapEditor } from "./tiptap-editor"

interface BlogArticleFormProps {
  article?: BlogArticleDetail | null
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

export function BlogArticleForm({ article }: BlogArticleFormProps) {
  const router = useRouter()
  const isEdit = Boolean(article)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<BlogArticleInput>>({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content_html: article?.content_html ?? "",
    content_json: article?.content_json ?? undefined,
    category: article?.category ?? "",
    tags: article?.tags ?? [],
    status: article?.status ?? "draft",
    featured: article?.featured ?? false,
    seo_title: article?.seo_title ?? "",
    seo_description: article?.seo_description ?? "",
    cover_image_url: article?.cover_image_url ?? "",
    cover_image_alt: article?.cover_image_alt ?? "",
  })
  const [slugLocked, setSlugLocked] = useState(isEdit)

  const set = <K extends keyof BlogArticleInput>(
    key: K,
    value: BlogArticleInput[K] | null | undefined,
  ) => setForm((prev) => ({ ...prev, [key]: value as BlogArticleInput[K] }))

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
    [],
  )

  const handleSave = async (publish = false) => {
    setLoading(true)
    try {
      if (isEdit && article) {
        const res = await updateBlogArticleAction(article.id, form)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        if (publish) {
          const res2 = await publishBlogArticleAction(article.id)
          if (!res2.ok) {
            toast.error(res2.error)
            return
          }
        }
        toast.success(publish ? "Article publié !" : "Article sauvegardé")
        router.refresh()
      } else {
        const payload = {
          ...form,
          status: publish ? "published" : "draft",
        } as BlogArticleInput
        const res = await createBlogArticleAction(payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(publish ? "Article publié !" : "Article créé")
        router.push(`/marketing/blog/${res.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!article) return
    if (!window.confirm("Archiver cet article ?")) return
    setLoading(true)
    try {
      const res = await archiveBlogArticleAction(article.id)
      if (res.ok) {
        toast.success("Article archivé")
        router.push("/marketing/blog")
      } else {
        toast.error(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!article) return
    if (
      !window.confirm(
        "Supprimer définitivement cet article ? Cette action est irréversible.",
      )
    ) {
      return
    }
    setLoading(true)
    try {
      const res = await deleteBlogArticleAction(article.id)
      if (res.ok) {
        toast.success("Article supprimé")
        router.push("/marketing/blog")
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
            {isEdit ? "Modifier l'article" : "Nouvel article"}
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
            <label className="text-sm font-medium" htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Mon article sur la pompe à chaleur"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="slug">
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
              <span className="px-3 text-sm text-muted-foreground">/blog/</span>
              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugLocked(true)
                  set("slug", e.target.value)
                }}
                placeholder="mon-article"
                className="flex-1 border-0 bg-transparent py-2 pr-3 font-mono text-sm focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="excerpt">
              Extrait <span className="text-destructive">*</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({form.excerpt?.length ?? 0}/280 caractères)
              </span>
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              placeholder="Résumé de l'article affiché sur les cards (20-280 caractères)"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Contenu <span className="text-destructive">*</span>
            </label>
            <TipTapEditor
              content={form.content_json ?? null}
              onChange={handleEditorChange}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Image de couverture</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="cover_url"
              >
                URL de l&apos;image
              </label>
              <input
                id="cover_url"
                type="url"
                value={form.cover_image_url ?? ""}
                onChange={(e) =>
                  set("cover_image_url", e.target.value || null)
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {form.cover_image_url && (
              <div className="space-y-1.5">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="cover_alt"
                >
                  Texte alternatif (accessibilité)
                </label>
                <input
                  id="cover_alt"
                  type="text"
                  value={form.cover_image_alt ?? ""}
                  onChange={(e) =>
                    set("cover_image_alt", e.target.value || null)
                  }
                  placeholder="Description de l'image"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">Catégorisation</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="category"
              >
                Catégorie
              </label>
              <select
                id="category"
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value || null)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sans catégorie</option>
                <option value="pompe-a-chaleur">Pompe à chaleur</option>
                <option value="systeme-solaire-combine">
                  Système solaire combiné
                </option>
                <option value="renovation-globale">Rénovation globale</option>
                <option value="aides">Aides &amp; financement</option>
                <option value="conseils">Conseils pratiques</option>
                <option value="actualites">Actualités</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="tags">
                Tags (séparés par des virgules)
              </label>
              <input
                id="tags"
                type="text"
                value={form.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  set(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="CEE, pompe à chaleur, aides 2026"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

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

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="seo_title"
              >
                Titre SEO ({form.seo_title?.length ?? 0}/60)
              </label>
              <input
                id="seo_title"
                type="text"
                value={form.seo_title ?? ""}
                onChange={(e) => set("seo_title", e.target.value || null)}
                placeholder={form.title}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="seo_desc"
              >
                Description SEO ({form.seo_description?.length ?? 0}/160)
              </label>
              <textarea
                id="seo_desc"
                value={form.seo_description ?? ""}
                onChange={(e) =>
                  set("seo_description", e.target.value || null)
                }
                rows={3}
                placeholder={form.excerpt}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
