import { ImageResponse } from 'next/og'

import { siteConfig } from '@/lib/site-config'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = "Rénovation globale BAR-TH-174 — parcours accompagné | Effinor"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #b45309 40%, #047857 100%)',
          color: 'white',
          padding: 72,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '8px 18px',
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fde68a',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          BAR-TH-174
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05 }}>Rénovation globale</div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: '#6ee7b7' }}>
            2 sauts de DPE
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 25, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
          Financement potentiellement jusqu&apos;à 90% — parcours accompagné MaPrimeRénov&apos;.
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 22,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span style={{ fontWeight: 700 }}>{siteConfig.name}</span>
          <span>effinor.fr</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
