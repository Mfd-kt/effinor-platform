import { ImageResponse } from 'next/og'

import { siteConfig } from '@/lib/site-config'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${siteConfig.name} — Rénovation énergétique, aides CEE et MaPrimeRénov'`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #047857 55%, #d97706 120%)',
          color: 'white',
          padding: 72,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: -40,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.25)',
            filter: 'blur(100px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: 40,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            filter: 'blur(90px)',
          }}
        />
        <div
          style={{
            display: 'flex',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#a7f3d0',
          }}
        >
          {siteConfig.name} — RGE QualiPAC
        </div>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            Rénovation énergétique
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.05, color: '#fde68a' }}>
            financée jusqu&apos;à 90%
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4, marginTop: 8 }}>
            PAC, solaire thermique, rénovation globale — Effinor pilote CEE, MaPrimeRénov&apos; et
            éco-PTZ.
          </div>
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <span>effinor.fr</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
