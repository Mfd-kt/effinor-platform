import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { formatPhoneE164 } from '@effinor/lib'

import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import {
  simulatorSubmitSchema,
  type ChauffageValue,
  type LogementValue,
} from '@/lib/simulator/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapLogementToBuildingType(l: LogementValue): string {
  switch (l) {
    case 'maison':
      return 'maison_individuelle'
    case 'appartement':
      return 'appartement'
    case 'immeuble':
      return 'immeuble_collectif'
  }
}

function mapChauffageToHeatingType(c: ChauffageValue): string[] {
  switch (c) {
    case 'gaz':
      return ['gaz']
    case 'fioul':
      return ['fioul']
    case 'electrique':
      return ['electricite']
    case 'autre':
      return ['autres']
  }
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  const parsed = simulatorSubmitSchema.safeParse(payload)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json(
      {
        ok: false,
        error: first?.message ?? 'Données invalides.',
        field: first?.path.join('.') ?? null,
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  const phoneE164 = formatPhoneE164(data.telephone)
  if (!phoneE164) {
    return NextResponse.json(
      { ok: false, error: 'Numéro de téléphone invalide (ex: 06 12 34 56 78).' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()
  if (!supabase) {
    console.error('[api/simulator] service-role client unavailable — env vars manquantes')
    return NextResponse.json(
      {
        ok: false,
        error:
          'Le service est temporairement indisponible. Merci de réessayer plus tard ou nous appeler directement.',
      },
      { status: 503 }
    )
  }

  const hdrs = await headers()
  const userAgent = hdrs.get('user-agent') ?? null
  const referer = hdrs.get('referer') ?? null

  const firstName = data.prenom.trim()
  const lastName = data.nom.trim().toUpperCase()
  const contactName = `${firstName} ${lastName}`.trim()
  const companyName = contactName || 'Prospect landing PAC'

  const simPayload = {
    source: 'website_simulator',
    origin_label: 'landing pompe-a-chaleur.effinor.fr',
    version: 'website-simulator-v1',
    answers: {
      logement: data.logement,
      statut: data.statut,
      chauffage: data.chauffage,
      nb_personnes: data.nb_personnes,
      tranche_revenus: data.tranche_revenus,
      travaux: data.travaux,
      code_postal: data.code_postal,
    },
    contact: {
      first_name: firstName,
      last_name: lastName,
      email: data.email.trim().toLowerCase(),
      phone_e164: phoneE164,
    },
    consent: {
      rgpd: data.rgpd_consent,
      at: new Date().toISOString(),
    },
    meta: {
      user_agent: userAgent,
      referer,
    },
  }

  const { data: row, error } = await supabase
    .from('leads')
    .insert({
      // Valeur d'enum dédiée landing PAC (libellé ERP : « Landing PAC »)
      // — ajoutée via migration 20260426170000_lead_source_landing_pac.sql.
      // Le simulateur garde sim_version='website-simulator-v1' pour que
      // l'ERP reconnaisse le payload via extractWebsiteSimulatorPayload().
      source: 'landing_pac',
      lead_status: 'new',
      qualification_status: 'pending',
      company_name: companyName,
      first_name: firstName || null,
      last_name: lastName || null,
      contact_name: contactName || null,
      email: data.email.trim().toLowerCase(),
      phone: phoneE164,
      worksite_postal_code: data.code_postal,
      worksite_city: '',
      worksite_address: '',
      head_office_postal_code: data.code_postal,
      head_office_city: '',
      head_office_address: '',
      building_type: mapLogementToBuildingType(data.logement),
      heating_type: mapChauffageToHeatingType(data.chauffage),
      sim_payload_json: simPayload,
      sim_version: 'website-simulator-v1',
      simulated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[api/simulator] insert leads failed:', error)
    return NextResponse.json(
      {
        ok: false,
        error:
          'Une erreur technique est survenue. Merci de réessayer dans quelques instants.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
}
