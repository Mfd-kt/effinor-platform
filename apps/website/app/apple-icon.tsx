import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '24px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '110px',
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
