"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { updateSiteSettingsAction } from "../actions/site-settings-actions"
import type { SiteSettingsForForm } from "../queries/get-site-settings"
import type { SiteSettingsUpdate } from "../schemas/site-settings.schema"

const STAT_LABELS = [
  "Stat 1 — ex. Chantiers",
  "Stat 2 — ex. Économies",
  "Stat 3 — ex. Note clients",
  "Stat 4 — ex. Certifications",
] as const

type SiteSettingsFormProps = {
  initial: SiteSettingsForForm
}

function cloneForm(data: SiteSettingsForForm): SiteSettingsUpdate {
  return {
    contact: {
      ...data.contact,
      address: { ...data.contact.address },
      hours: {
        label: data.contact.hours.label,
        schema: data.contact.hours.schema?.length
          ? data.contact.hours.schema.map((s) => ({ ...s }))
          : [
              {
                days: "Mo,Tu,We,Th,Fr",
                opens: "08:00",
                closes: "18:00",
              },
            ],
      },
    },
    stats: data.stats.map((s) => ({ ...s })),
  }
}

export function SiteSettingsForm({ initial }: SiteSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SiteSettingsUpdate>(() => cloneForm(initial))
  const baseline = initial

  const setContact = (patch: Partial<SiteSettingsUpdate["contact"]>) => {
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }))
  }

  const setAddress = (patch: Partial<SiteSettingsUpdate["contact"]["address"]>) => {
    setForm((prev) => ({
      ...prev,
      contact: { ...prev.contact, address: { ...prev.contact.address, ...patch } },
    }))
  }

  const setStat = (index: number, patch: Partial<SiteSettingsUpdate["stats"][0]>) => {
    setForm((prev) => {
      const stats = prev.stats.map((s, i) => (i === index ? { ...s, ...patch } : s))
      return { ...prev, stats }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await updateSiteSettingsAction(form)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Paramètres enregistrés — prise en compte sur le site sous ~5 min (ISR).")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm(cloneForm(baseline))
    toast.message("Formulaire réinitialisé (valeurs chargées au dernier rafraîchissement).")
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées & contact</CardTitle>
          <CardDescription>
            Affichées sur effinor.fr (en-tête, pied de page, CTA, page contact). Dernière mise à
            jour : {baseline.updatedAt.contact ? new Date(baseline.updatedAt.contact).toLocaleString("fr-FR") : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.contact.email}
              onChange={(e) => setContact({ email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone (affiché)</Label>
            <Input
              id="phone"
              value={form.contact.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phoneE164">Téléphone (lien tel: — E.164)</Label>
            <Input
              id="phoneE164"
              value={form.contact.phoneE164}
              onChange={(e) => setContact({ phoneE164: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="street">Adresse — rue</Label>
            <Input
              id="street"
              value={form.contact.address.street}
              onChange={(e) => setAddress({ street: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={form.contact.address.postalCode}
              onChange={(e) => setAddress({ postalCode: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={form.contact.address.city}
              onChange={(e) => setAddress({ city: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={form.contact.address.country}
              onChange={(e) => setAddress({ country: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="full">Ligne d&apos;adresse complète (affichée telle quelle)</Label>
            <Input
              id="full"
              value={form.contact.address.full}
              onChange={(e) => setAddress({ full: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="hours">Horaires (libellé unique)</Label>
            <Input
              id="hours"
              value={form.contact.hours.label}
              onChange={(e) =>
                setContact({
                  hours: { ...form.contact.hours, label: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques (bandeau de confiance)</CardTitle>
          <CardDescription>
            Quatre blocs, dans l&apos;ordre d&apos;affichage. Dernière mise à jour :{" "}
            {baseline.updatedAt.stats ? new Date(baseline.updatedAt.stats).toLocaleString("fr-FR") : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.stats.map((stat, i) => (
            <div
              key={i}
              className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
            >
              <p className="text-sm font-medium text-muted-foreground sm:col-span-2">
                {STAT_LABELS[i] ?? `Stat ${i + 1}`}
              </p>
              <div>
                <Label htmlFor={`stat-value-${i}`}>Valeur (grand chiffre)</Label>
                <Input
                  id={`stat-value-${i}`}
                  value={stat.value}
                  onChange={(e) => setStat(i, { value: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`stat-label-${i}`}>Libellé</Label>
                <Input
                  id={`stat-label-${i}`}
                  value={stat.label}
                  onChange={(e) => setStat(i, { label: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`stat-desc-${i}`}>Note / description (interne / SEO)</Label>
                <Textarea
                  id={`stat-desc-${i}`}
                  rows={2}
                  className="min-h-0"
                  value={stat.description ?? ""}
                  onChange={(e) => setStat(i, { description: e.target.value || null })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className={cn(buttonVariants())}
        >
          {loading ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : <Save className="size-4" data-icon="inline-start" />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <RotateCcw className="size-4" data-icon="inline-start" />
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
