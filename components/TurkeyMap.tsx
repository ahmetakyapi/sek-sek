'use client'

import { LEVELS } from '@/game/levels'

/** Kaba Türkiye silueti (boylam, enlem) — dekoratif, ölçekli değil. */
const OUTLINE: [number, number][] = [
  [26.0, 40.6], [26.6, 41.7], [28.0, 41.98], [29.1, 41.25], [31.2, 41.1], [33.3, 41.95], [35.1, 42.0], [36.3, 41.3],
  [37.6, 41.1], [38.9, 40.95], [39.7, 41.0], [41.5, 41.5], [42.8, 41.55], [43.4, 41.1], [43.7, 40.7], [44.8, 39.7],
  [44.4, 39.3], [44.2, 38.4], [44.6, 37.6], [44.8, 37.2], [42.3, 37.1], [40.5, 37.05], [38.0, 36.85], [36.7, 36.85],
  [36.4, 36.2], [36.0, 35.9], [35.9, 36.4], [36.2, 36.7], [34.6, 36.8], [32.8, 36.05], [31.4, 36.65], [30.6, 36.85],
  [29.6, 36.2], [28.0, 36.6], [27.2, 37.0], [26.3, 38.3], [26.7, 39.4], [26.1, 39.5], [26.2, 40.0], [26.2, 40.4],
]

const COORDS: Record<string, [number, number]> = {
  istanbul: [28.98, 41.01],
  kocaeli: [29.92, 40.77],
  canakkale: [26.41, 40.15],
  edirne: [26.56, 41.68],
  bursa: [29.06, 40.19],
  antalya: [30.71, 36.9],
  sanliurfa: [38.79, 37.16],
  van: [43.38, 38.5],
  erzurum: [41.27, 39.9],
  izmir: [27.14, 38.42],
  sinop: [35.15, 42.03],
  diyarbakir: [40.22, 37.91],
  ankara: [32.86, 39.93],
  konya: [32.48, 37.87],
  nevsehir: [34.71, 38.62],
  gaziantep: [37.38, 37.07],
  adana: [35.32, 37.0],
  mardin: [40.73, 37.31],
  malatya: [38.31, 38.35],
  corum: [34.95, 40.55],
  ordu: [37.88, 40.98],
  trabzon: [39.72, 41.0],
  sivas: [37.02, 39.75],
  ardahan: [42.7, 41.11],
  bayburt: [40.23, 40.26],
}

/** Etiketin düğüme göre yeri (dx, dy): komşu şehirlerin adları üst üste binmesin, harita dışına taşmasın */
const LABEL: Record<string, [number, number]> = {
  kocaeli: [14, 12],
  edirne: [10, -8],
  bursa: [2, 15],
  antalya: [0, 15],
  sanliurfa: [14, 15],
  van: [-14, -6],
  erzurum: [12, 14],
  canakkale: [6, -8],
  izmir: [4, 15],
  sinop: [0, 15],
  corum: [-14, 13],
  ordu: [-4, -8],
  trabzon: [4, -8],
  bayburt: [-16, -5],
  sivas: [-6, 15],
  malatya: [-16, 12],
  diyarbakir: [6, -8],
  mardin: [12, 14],
  gaziantep: [-2, 15],
  adana: [-14, 15],
  konya: [-4, 15],
}

const X = (lon: number) => (lon - 25.4) * 20
const Y = (lat: number) => (42.4 - lat) * 20

export default function TurkeyMap({ unlocked, selected, onSelect }: { unlocked: number; selected: number; onSelect?: (i: number) => void }) {
  const pts = OUTLINE.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join(' ')
  const route = LEVELS.map((l) => COORDS[l.id])
  return (
<svg viewBox="0 -6 400 152" className="h-auto w-full" role="img" aria-label={`Yolculuk rotası: ${LEVELS.map((l) => l.name).join(', ')}`}>
      <polygon points={pts} fill="#2a2438" stroke="#4a4160" strokeWidth="1.5" strokeLinejoin="round" />
      <polyline
        points={route.map(([lo, la]) => `${X(lo)},${Y(la)}`).join(' ')}
        fill="none"
        stroke="#e8794a"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.8"
      />
      {LEVELS.map((l, i) => {
        const [lo, la] = COORDS[l.id]
        const locked = i > unlocked
        const on = i === selected
        return (
          <g
            key={l.id}
            onClick={() => !locked && onSelect?.(i)}
            style={{ cursor: locked ? 'not-allowed' : onSelect ? 'pointer' : 'default' }}
            aria-label={`${l.name}${locked ? ' (kilitli)' : ''}`}
          >
            <circle cx={X(lo)} cy={Y(la)} r={on ? 6 : 4.5} fill={locked ? '#4a4160' : on ? '#f2c14e' : '#e8794a'} stroke="#120f1a" strokeWidth="1.5" />
            <text x={X(lo) + (LABEL[l.id]?.[0] ?? 0)} y={Y(la) + (LABEL[l.id]?.[1] ?? -8)} textAnchor="middle" fontSize="8" fill={locked ? '#9a90b0' : '#f4ead8'} stroke="#1a1626" strokeWidth="2.4" paintOrder="stroke" fontFamily="var(--font-pixel)">
              {l.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
