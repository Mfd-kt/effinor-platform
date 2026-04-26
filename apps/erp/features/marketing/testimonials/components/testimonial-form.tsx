"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, Loader2, Save, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button-variants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  archiveTestimonialAction,
  createTestimonialAction,
  deleteTestimonialAction,
  publishTestimonialAction,
  updateTestimonialAction,
} from "../actions/testimonial-actions"
import type { TestimonialDetail } from "../queries/get-testimonials"
import {
  TESTIMONIAL_STATUS,
  type TestimonialInput,
} from "../schemas/testimonial.schema"

import { TestimonialStatusBadge } from "./testimonial-status-badge"

type TestimonialFormProps = {
  testimonial?: TestimonialDetail | null
}

export function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const router = useRouter()
  const isEdit = Boolean(testimonial)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<TestimonialInput>>({
    author_name: testimonial?.author_name ?? "",
    author_city: testimonial?.author_city ?? "",
    author_initials: testimonial?.author_initials ?? "",
    rating: testimonial?.rating ?? 5,
    text: testimonial?.text ?? "",
    service_type: testimonial?.service_type ?? "",
    date_label: testimonial?.date_label ?? "",
    featured: testimonial?.featured ?? false,
    status: testimonial?.status ?? "draft",
  })

  const set = <K extends keyof TestimonialInput>(
    key: K,
    value: TestimonialInput[K] | null | undefined
  ) => setForm((prev) => ({ ...prev, [key]: value as TestimonialInput[K] }))

  const handleSave = async (publish = false) => {
    setLoading(true)
    try {
      if (isEdit && testimonial) {
        const res = await updateTestimonialAction(testimonial.id, form)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        if (publish) {
          const res2 = await publishTestimonialAction(testimonial.id)
          if (!res2.ok) {
            toast.error(res2.error)
            return
          }
        }
        toast.success(publish ? "Témoignage publié !" : "Sauvegardé")
        router.refresh()
      } else {
        const payload = {
          ...form,
          status: publish ? "published" : (form.status ?? "draft"),
        } as TestimonialInput
        const res = await createTestimonialAction(payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(publish ? "Témoignage publié !" : "Témoignage créé")
        router.push(`/marketing/testimonials/${res.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!testimonial || !window.confirm("Archiver ce témoignage ?")) return
    setLoading(true)
    try {
      const res = await archiveTestimonialAction(testimonial.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Témoignage archivé")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!testimonial || !window.confirm("Supprimer définitivement ce témoignage ?")) return
    setLoading(true)
    try {
      const res = await deleteTestimonialAction(testimonial.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Témoignage supprimé")
      router.push("/marketing/testimonials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {isEdit && testimonial ? (
        <div className="flex flex-wrap items-center gap-2">
          <TestimonialStatusBadge status={testimonial.status} />
          {testimonial.published_at ? (
            <span className="text-xs text-muted-foreground">
              Publié le {new Date(testimonial.published_at).toLocaleString("fr-FR")}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="author_name">Auteur (ex. Sophie L.)</Label>
          <Input
            id="author_name"
            value={form.author_name ?? ""}
            onChange={(e) => set("author_name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="author_initials">Initiales (avatar)</Label>
          <Input
            id="author_initials"
            value={form.author_initials ?? ""}
            onChange={(e) => set("author_initials", e.target.value)}
            maxLength={8}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="author_city">Ville (ex. Lyon (69))</Label>
          <Input
            id="author_city"
            value={form.author_city ?? ""}
            onChange={(e) => set("author_city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rating">Note</Label>
          <select
            id="rating"
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
            )}
            value={form.rating ?? 5}
            onChange={(e) => set("rating", Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="date_label">Période affichée</Label>
          <Input
            id="date_label"
            value={form.date_label ?? ""}
            onChange={(e) => set("date_label", e.target.value)}
            placeholder="Mars 2026"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="service_type">Type de prestation</Label>
          <Input
            id="service_type"
            value={form.service_type ?? ""}
            onChange={(e) => set("service_type", e.target.value)}
            placeholder="Pompe à chaleur air-eau"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="text">Texte du témoignage</Label>
          <Textarea
            id="text"
            rows={8}
            value={form.text ?? ""}
            onChange={(e) => set("text", e.target.value)}
            className="min-h-[120px] resize-y"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="status">Statut (brouillon / publié)</Label>
          <select
            id="status"
            className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
            value={form.status ?? "draft"}
            onChange={(e) =>
              set("status", e.target.value as (typeof TESTIMONIAL_STATUS)[number])
            }
            disabled={Boolean(isEdit && testimonial?.status === "archived")}
          >
            {TESTIMONIAL_STATUS.map((s) => (
              <option key={s} value={s}>
                {s === "draft" ? "Brouillon" : s === "published" ? "Publié" : "Archivé"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            id="featured"
            className="size-4 rounded border-input"
            checked={form.featured ?? false}
            onChange={(e) => set("featured", e.target.checked)}
          />
          <Label htmlFor="featured" className="font-normal">
            Mettre en avant sur la home (vignette &quot;featured&quot;)
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => void handleSave(false)}
          disabled={loading}
          className={buttonVariants({ variant: "secondary" })}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Save className="size-4" data-icon="inline-start" />
          )}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => void handleSave(true)}
          disabled={loading}
          className={buttonVariants()}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Send className="size-4" data-icon="inline-start" />
          )}
          Publier
        </button>
        {isEdit && testimonial && testimonial.status !== "archived" ? (
          <button
            type="button"
            onClick={() => void handleArchive()}
            disabled={loading}
            className={buttonVariants({ variant: "outline" })}
          >
            <Archive className="size-4" data-icon="inline-start" />
            Archiver
          </button>
        ) : null}
        {isEdit && testimonial ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={loading}
            className={buttonVariants({ variant: "destructive" })}
          >
            <Trash2 className="size-4" data-icon="inline-start" />
            Supprimer
          </button>
        ) : null}
      </div>
    </div>
  )
}
