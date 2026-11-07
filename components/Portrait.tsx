'use client'

import { useId } from 'react'
import type { CharacterId } from '@/game/characters'

/**
 * Çizim tarzında yüz portreleri (SVG). Göz kırpma ve saç salınımı CSS ile.
 * viewBox 240×280: omuzlardan yukarısı.
 */
export default function Portrait({ id, className = '', mood = 'smile' }: { id: CharacterId; className?: string; mood?: 'smile' | 'calm' }) {
  return id === 'uktun' ? <Uktun className={className} mood={mood} /> : <Kerem className={className} mood={mood} />
}

const SKIN = '#f3c8a4'
const SKIN_SH = '#e0a582'
const SKIN_DEEP = '#c98466'

function Eye({ x, y, flip = false, iris, lashes, uid }: { x: number; y: number; flip?: boolean; iris: string; lashes: boolean; uid: string }) {
  const s = flip ? -1 : 1
  return (
    <g transform={`translate(${x} ${y}) scale(${s * 1.15} 1.15)`}>
      <g className="portrait-blink">
        {/* göz akı */}
        <path d="M-13 1 C -8 -7, 8 -8, 13 -1 C 8 6, -8 7, -13 1 Z" fill="#fbf7f2" />
        <clipPath id={`${uid}-eye-${x}`}>
          <path d="M-13 1 C -8 -7, 8 -8, 13 -1 C 8 6, -8 7, -13 1 Z" />
        </clipPath>
        <g clipPath={`url(#${uid}-eye-${x})`}>
          <circle cx="1" cy="0" r="7.2" fill={iris} />
          <circle cx="1" cy="0" r="7.2" fill="none" stroke="#2a1810" strokeWidth="1.4" opacity="0.7" />
          <circle cx="1" cy="1.5" r="4.6" fill="#000" opacity="0.18" />
          <circle cx="1" cy="0" r="3.4" fill="#120c0a" />
          <circle cx="-1.6" cy="-2.4" r="2" fill="#fff" />
          <circle cx="3.4" cy="2.4" r="0.9" fill="#fff" opacity="0.8" />
          {/* üst kapak gölgesi */}
          <path d="M-14 -8 L 14 -8 L 14 -3 C 8 -6, -8 -5, -14 -1 Z" fill={SKIN_SH} opacity="0.45" />
        </g>
        {/* kirpik çizgisi */}
        <path d="M-14 1.5 C -9 -8, 8 -9.5, 14 -1" fill="none" stroke="#24150f" strokeWidth={lashes ? 3 : 2.2} strokeLinecap="round" />
        {lashes && <path d="M12.5 -2 L 18 -6.5 M 10 -4.6 L 14.5 -9.5" stroke="#24150f" strokeWidth="1.8" strokeLinecap="round" />}
        <path d="M-11 4.5 C -5 7.5, 6 7.5, 11 3" fill="none" stroke={SKIN_DEEP} strokeWidth="1" opacity="0.6" />
      </g>
      {/* kapak kıvrımı */}
      <path d="M-11 -8.5 C -5 -13, 7 -13, 12 -7" fill="none" stroke={SKIN_DEEP} strokeWidth="1.2" opacity="0.55" />
    </g>
  )
}

function Uktun({ className, mood }: { className: string; mood: 'smile' | 'calm' }) {
  const uid = useId().replace(/:/g, '')
  const hair = '#5a2414'
  const hairMid = '#7a3420'
  const hairHi = '#a8553a'
  return (
    <svg viewBox="0 0 240 280" className={className} role="img" aria-label="Uktun portresi">
      <defs>
        <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hairMid} />
          <stop offset="1" stopColor={hair} />
        </linearGradient>
        <radialGradient id={`${uid}-face`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f8d6b6" />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_SH} />
        </radialGradient>
      </defs>

      {/* arka saç: omuzların altına kadar dalgalı */}
      <g className="portrait-sway">
        <path
          d="M64 96 C 50 140, 46 190, 40 236 C 52 248, 70 252, 84 246 C 78 222, 80 196, 86 176 L 154 176 C 160 196, 162 222, 156 246 C 170 252, 188 248, 200 236 C 194 190, 190 140, 176 96 Z"
          fill={`url(#${uid}-hair)`}
        />
        <path d="M58 150 C 54 182, 52 212, 48 236" stroke={hairHi} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M184 150 C 188 182, 190 212, 194 236" stroke={hairHi} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
      </g>

      {/* ceket + omuzlar */}
      <path d="M22 280 C 26 236, 56 214, 96 206 L 144 206 C 184 214, 214 236, 218 280 Z" fill="#e0a23a" />
      <path d="M96 206 L 120 262 L 144 206 Z" fill="#f6e7c8" />
      <path d="M96 206 C 92 232, 98 256, 112 280 L 120 262 Z" fill="#c4862a" />
      <path d="M144 206 C 148 232, 142 256, 128 280 L 120 262 Z" fill="#c4862a" />
      <circle cx="120" cy="252" r="2.2" fill="#8a5a1a" />

      {/* boyun */}
      <path d="M102 168 L 102 208 C 112 216, 128 216, 138 208 L 138 168 Z" fill={SKIN_SH} />
      <path d="M102 190 C 112 200, 128 200, 138 190 L 138 176 L 102 176 Z" fill={SKIN_DEEP} opacity="0.35" />

      {/* atkı */}
      <path d="M86 200 C 100 216, 140 216, 154 200 C 160 208, 158 220, 150 226 C 132 236, 108 236, 90 226 C 82 220, 80 208, 86 200 Z" fill="#d6403a" />
      <path d="M92 222 C 110 230, 130 230, 148 222" stroke="#9e2a2a" strokeWidth="2" fill="none" />
      <path d="M140 222 C 146 236, 144 252, 150 266 L 162 262 C 156 248, 158 234, 152 220 Z" fill="#c4362f" />

      {/* kulaklar + küpe */}
      <ellipse cx="73" cy="134" rx="7" ry="12" fill={SKIN_SH} />
      <ellipse cx="167" cy="134" rx="7" ry="12" fill={SKIN_SH} />
      <circle cx="72" cy="150" r="3.2" fill="#f2c14e" stroke="#b8862a" strokeWidth="1" />
      <circle cx="168" cy="150" r="3.2" fill="#f2c14e" stroke="#b8862a" strokeWidth="1" />

      {/* yüz */}
      <path d="M120 62 C 160 62, 169 98, 167 128 C 165 160, 147 192, 120 198 C 93 192, 75 160, 73 128 C 71 98, 80 62, 120 62 Z" fill={`url(#${uid}-face)`} />
      <path d="M167 128 C 165 160, 147 192, 120 198 C 140 186, 156 160, 158 128 Z" fill={SKIN_SH} opacity="0.6" />

      {/* yanaklar */}
      <ellipse cx="94" cy="152" rx="12" ry="7" fill="#f08a80" opacity="0.32" />
      <ellipse cx="146" cy="152" rx="12" ry="7" fill="#f08a80" opacity="0.32" />

      {/* kaşlar: ince, kemerli */}
      <path d="M86 110 C 93 102, 104 101, 111 106" stroke="#4a1e10" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M129 106 C 136 101, 147 102, 154 110" stroke="#4a1e10" strokeWidth="3" fill="none" strokeLinecap="round" />

      <Eye x={99} y={127} flip iris="#7a4422" lashes uid={uid} />
      <Eye x={141} y={127} iris="#7a4422" lashes uid={uid} />

      {/* burun */}
      <path d="M121 132 C 123 142, 126 150, 122 155" stroke={SKIN_DEEP} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M114 156 C 117 159, 124 159, 127 156" stroke={SKIN_DEEP} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* dudaklar */}
      {mood === 'smile' ? (
        <>
          <path d="M106 170 C 112 166, 116 167, 120 168 C 124 167, 128 166, 134 170 C 128 174, 112 174, 106 170 Z" fill="#c4505a" />
          <path d="M107 170 C 114 181, 126 181, 133 170 C 126 174, 114 174, 107 170 Z" fill="#d9666e" />
          <path d="M114 175 C 118 177, 122 177, 126 175" stroke="#fff" strokeWidth="1.2" opacity="0.5" fill="none" />
        </>
      ) : (
        <>
          <path d="M108 171 C 114 168, 126 168, 132 171 C 126 173, 114 173, 108 171 Z" fill="#c4505a" />
          <path d="M109 171 C 115 178, 125 178, 131 171 Z" fill="#d9666e" />
        </>
      )}

      {/* ön saç: yandan ayrılmış perçem + yüzü çerçeveleyen tutamlar */}
      <g className="portrait-sway">
        <path
          d="M70 118 C 62 76, 88 44, 124 44 C 160 44, 182 72, 172 120 C 166 98, 156 82, 140 74 C 126 92, 100 100, 80 100 C 76 106, 72 112, 70 118 Z"
          fill={hairMid}
        />
        <path d="M80 100 C 96 94, 118 84, 134 70 C 128 88, 108 102, 86 108 Z" fill={hair} opacity="0.7" />
        <path d="M70 118 C 66 150, 70 182, 80 210 C 84 196, 82 170, 84 146 C 82 132, 78 124, 76 116 Z" fill={hairMid} />
        <path d="M172 120 C 178 152, 172 186, 160 212 C 156 196, 158 170, 156 146 C 158 132, 164 124, 166 116 Z" fill={hairMid} />
        <path d="M72 96 C 70 62, 94 36, 126 38 C 158 40, 178 64, 174 104 C 168 76, 150 56, 126 54 C 102 54, 82 70, 72 96 Z" fill={hairMid} />
        <path d="M134 40 C 128 56, 120 70, 110 80" stroke={hair} strokeWidth="2.5" fill="none" opacity="0.6" />
        <path d="M92 54 C 106 44, 124 42, 140 46" stroke={hairHi} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.75" />
        <path d="M148 52 C 160 60, 168 74, 170 90" stroke={hairHi} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M76 140 C 74 160, 76 180, 80 196" stroke={hairHi} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function Kerem({ className, mood }: { className: string; mood: 'smile' | 'calm' }) {
  const uid = useId().replace(/:/g, '')
  const hair = '#22170f'
  const hairMid = '#33241a'
  const hairHi = '#5a4232'
  return (
    <svg viewBox="0 0 240 280" className={className} role="img" aria-label="Kerem portresi">
      <defs>
        <radialGradient id={`${uid}-face`} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f2cfae" />
          <stop offset="0.7" stopColor="#e9b892" />
          <stop offset="1" stopColor="#d49a74" />
        </radialGradient>
      </defs>

      {/* ceket: geniş omuzlar */}
      <path d="M10 280 C 14 232, 50 208, 94 200 L 146 200 C 190 208, 226 232, 230 280 Z" fill="#2f7a8a" />
      <path d="M94 200 L 120 254 L 146 200 Z" fill="#e8eef0" />
      <path d="M94 200 C 88 228, 96 256, 110 280 L 120 254 Z" fill="#215a68" />
      <path d="M146 200 C 152 228, 144 256, 130 280 L 120 254 Z" fill="#215a68" />
      {/* fotoğraf makinesi askısı ve makine */}
      <path d="M70 214 L 156 280" stroke="#1d1a22" strokeWidth="7" />
      <rect x="136" y="244" width="46" height="30" rx="4" fill="#1d1a22" />
      <rect x="140" y="240" width="14" height="6" rx="2" fill="#1d1a22" />
      <circle cx="162" cy="259" r="10" fill="#3a3a48" stroke="#9aa3b5" strokeWidth="2.5" />
      <circle cx="162" cy="259" r="4.5" fill="#5a7aa8" />
      <circle cx="160" cy="257" r="1.5" fill="#fff" opacity="0.8" />

      {/* boyun */}
      <path d="M100 166 L 100 204 C 112 212, 128 212, 140 204 L 140 166 Z" fill="#d49a74" />
      <path d="M100 186 C 112 196, 128 196, 140 186 L 140 172 L 100 172 Z" fill={SKIN_DEEP} opacity="0.35" />

      {/* atkı */}
      <path d="M82 196 C 98 214, 142 214, 158 196 C 164 206, 162 218, 154 224 C 134 234, 106 234, 86 224 C 78 218, 76 206, 82 196 Z" fill="#d6403a" />
      <path d="M88 220 C 108 228, 132 228, 152 220" stroke="#9e2a2a" strokeWidth="2" fill="none" />
      <path d="M86 220 C 80 234, 82 248, 76 262 L 64 258 C 70 246, 70 232, 76 218 Z" fill="#c4362f" />

      {/* kulaklar */}
      <ellipse cx="71" cy="132" rx="8" ry="13" fill="#d49a74" />
      <ellipse cx="169" cy="132" rx="8" ry="13" fill="#d49a74" />

      {/* yüz: daha köşeli çene */}
      <path d="M120 58 C 162 58, 170 96, 168 128 C 167 158, 157 184, 140 196 Q 120 206, 100 196 C 83 184, 73 158, 72 128 C 70 96, 78 58, 120 58 Z" fill={`url(#${uid}-face)`} />
      <path d="M168 128 C 167 158, 157 184, 140 196 Q 130 201, 120 202 C 142 190, 156 164, 158 128 Z" fill="#c98a66" opacity="0.5" />
      {/* hafif sakal gölgesi */}
      <path d="M80 158 C 86 182, 104 198, 120 200 C 136 198, 154 182, 160 158 C 152 176, 138 186, 120 188 C 102 186, 88 176, 80 158 Z" fill="#3a2a22" opacity="0.13" />
      <path d="M104 166 C 112 162, 128 162, 136 166 C 130 168, 110 168, 104 166 Z" fill="#3a2a22" opacity="0.18" />

      {/* kaşlar: kalın, düz */}
      <path d="M84 110 C 92 104, 104 104, 112 107" stroke="#22170f" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M128 107 C 136 104, 148 104, 156 110" stroke="#22170f" strokeWidth="5" fill="none" strokeLinecap="round" />

      <Eye x={99} y={127} flip iris="#4a3020" lashes={false} uid={uid} />
      <Eye x={141} y={127} iris="#4a3020" lashes={false} uid={uid} />

      {/* burun: biraz daha belirgin */}
      <path d="M121 128 C 124 140, 128 150, 123 156" stroke={SKIN_DEEP} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M112 156 C 116 160, 125 160, 129 156" stroke={SKIN_DEEP} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />

      {/* ağız */}
      {mood === 'smile' ? (
        <>
          <path d="M106 174 C 114 182, 126 182, 134 174" stroke="#8a4434" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M112 182 C 117 185, 123 185, 128 182" stroke={SKIN_DEEP} strokeWidth="1.4" fill="none" opacity="0.7" />
        </>
      ) : (
        <path d="M108 175 C 116 177, 124 177, 132 175" stroke="#8a4434" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}

      {/* kısa, dağınık saç */}
      <path
        d="M70 122 C 62 80, 84 42, 122 40 C 160 38, 180 70, 172 120 C 170 106, 166 94, 160 86 C 150 92, 138 90, 128 84 C 120 92, 104 94, 92 88 C 84 96, 76 108, 70 122 Z"
        fill={hairMid}
      />
      <path d="M78 76 C 76 50, 98 30, 128 32 C 150 33, 168 44, 170 64 C 160 52, 146 48, 132 50 C 140 42, 128 38, 118 44 C 104 44, 88 56, 78 76 Z" fill={hairMid} />
      <path d="M100 48 C 112 36, 136 34, 150 42 C 140 40, 126 42, 118 50 Z" fill={hair} opacity="0.8" />
      <path d="M92 88 C 98 78, 102 70, 104 62 M 128 84 C 132 74, 134 66, 134 58 M 160 86 C 160 76, 158 68, 154 62" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M96 52 C 110 44, 134 44, 150 54" stroke={hairHi} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M70 122 C 70 112, 72 104, 76 98" stroke={hair} strokeWidth="4" fill="none" />
      <path d="M172 120 C 172 110, 170 102, 166 96" stroke={hair} strokeWidth="4" fill="none" />
    </svg>
  )
}
