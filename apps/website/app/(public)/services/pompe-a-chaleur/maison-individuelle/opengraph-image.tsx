import { ImageResponse } from 'next/og'

import { siteConfig } from '@/lib/site-config'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Pompe à chaleur air-eau & air-air — maison individuelle | Effinor'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #047857 60%, #0f172a 100%)',
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
            color: '#6ee7b7',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          PAC · Maison individuelle
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05 }}>Pompe à chaleur</div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05, color: '#fde68a' }}>
            air-eau &amp; air-air
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
          Jusqu&apos;à 11 000 € d&apos;aides cumulables — installation RGE QualiPAC.
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
