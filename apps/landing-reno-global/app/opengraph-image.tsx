import { ImageResponse } from 'next/og'

import { landingConfig } from '@/lib/site-config'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = "Rénovation globale BAR-TH-174 — Jusqu'à 90 % financé | Effinor"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0C2B5C 0%, #1D4ED8 55%, #06B6D4 100%)',
          color: 'white',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(249, 115, 22, 0.25)',
            filter: 'blur(120px)',
          }}
        />

        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 600,
              color: '#A5F3FC',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            BAR-TH-174 · RGE · Délégataire CEE
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Rénovation globale maison</span>
            <span style={{ color: '#FDBA74' }}>jusqu&apos;à 90 % financé</span>
          </div>
          <div style={{ fontSize: 28, color: '#DBEAFE', maxWidth: 960, lineHeight: 1.35 }}>
            Bouquet de travaux (isolation + chauffage + VMC) · 2 sauts de classe DPE
            minimum · audit énergétique inclus.
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            fontSize: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
            {landingConfig.name}
          </div>
          <div style={{ color: '#A5F3FC' }}>{landingConfig.url.replace('https://', '')}</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
