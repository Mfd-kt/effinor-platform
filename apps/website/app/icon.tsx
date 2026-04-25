import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Favicon généré dynamiquement : carré emerald avec lettre E blanche.
 * Identique au composant Logo (components/brand/logo.tsx).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#10B981',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '700',
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          E
        </span>
      </div>
    ),
    { ...size }
  )
}
