import { ImageResponse } from 'next/og'

import { landingConfig } from '@/lib/site-config'

// Route segment config
export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = "Pompe à chaleur air-eau — Aides CEE et MaPrimeRénov' | Effinor"

/**
 * Image Open Graph générée dynamiquement par Next 16 (@vercel/og).
 * Rend un PNG 1200×630 à partir d'un composant JSX inline.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0C2B5C 0%, #1D4ED8 60%, #06B6D4 100%)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            RGE QualiPAC · Délégataire CEE
          </div>
        </div>

        <div
          style={{
            marginTop: 64,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, display: 'flex', flexDirection: 'column' }}>
            <span>Pompe à chaleur air-eau</span>
            <span style={{ color: '#FDBA74' }}>jusqu&apos;à 75 % d&apos;économies</span>
          </div>
          <div style={{ fontSize: 30, color: '#DBEAFE', maxWidth: 960, lineHeight: 1.35 }}>
            Jusqu&apos;à 11 000 € d&apos;aides CEE + MaPrimeRénov&apos; déduites du devis.
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
