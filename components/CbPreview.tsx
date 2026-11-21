'use client'

import { cbFor, type CbMode } from '@/game/colorBlind'

/**
 * Renk körü paleti önizlemesi (Ayarlar → Kolaylıklar): diken, su (öldüren ve yüzülen), düşman, iki blok ve hatıra.
 * Oyundaki aynı eşleme (`cbFor`) ve ikinci işaretlerle çizilir; seçenek değişince canlı güncellenir.
 */
export default function CbPreview({ mode }: { mode: CbMode }) {
  const c = (h: string) => cbFor(h, mode)
  const on = mode !== 'yok'
  const spikeL = on ? c('#spikeLight') : '#8fb06a'
  const spikeD = on ? c('#spikeDark') : '#3a5a2a'
  const halo = mode === 'kirmizi-yesil' ? '#ff9f1c' : mode === 'mavi-sari' ? '#ff2b3a' : '#e23a3a'
  const A = c('#e8794a')
  const B = c('#4aa8e0')
  return (
    <svg viewBox="0 0 252 40" className="h-10 w-full" role="img" aria-hidden="true">
      {/* diken */}
      <g stroke="#14121f" strokeWidth="1">
        {[0, 11].map((o) => (
          <g key={o}>
            <polygon points={`${4 + o},34 ${9 + o},20 ${14 + o},34`} fill={spikeD} />
            <polygon points={`${5.5 + o},33 ${9 + o},22 ${8 + o},33`} fill={spikeL} stroke="none" />
          </g>
        ))}
        {on && [0, 11].map((o) => <circle key={o} cx={9 + o} cy={21.5} r="1.3" fill="#fff8e0" stroke="none" />)}
      </g>
      {/* öldüren su (köpük dişli, renk körüyken çizgili) ve yüzülen su */}
      <rect x="34" y="22" width="26" height="12" fill="#26325a" />
      {on && [38, 42, 46, 50, 54, 58].map((x) => <rect key={x} x={x} y="22" width="1" height="12" fill="#ffecbe" opacity="0.4" />)}
      <path d="M34 22 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l2 5z" fill="#f4f6ff" stroke="#14121f" strokeWidth="0.6" />
      <rect x="64" y="22" width="22" height="12" fill="#5ac6d8" />
      <path d="M64 24 q3 -3 6 0 t6 0 t6 0 t4 0" fill="none" stroke="#e8fbff" strokeWidth="1.2" />
      {/* düşman: kalın hale */}
      <ellipse cx="108" cy="27" rx="10" ry="8" fill="#8a6a9a" stroke={halo} strokeWidth={on ? 3.4 : 2} />
      <ellipse cx="108" cy="27" rx="10" ry="8" fill="#8a6a9a" stroke="#14121f" strokeWidth="1" />
      <circle cx="105" cy="25" r="1.4" fill="#fff" />
      <circle cx="111" cy="25" r="1.4" fill="#fff" />
      {/* iki blok: daire ve üçgen */}
      <rect x="132" y="18" width="16" height="16" fill={A} stroke="#14121f" strokeWidth="1" />
      <rect x="152" y="18" width="16" height="16" fill={B} stroke="#14121f" strokeWidth="1" />
      {on && (
        <>
          <circle cx="140" cy="26" r="2.4" fill="#14121f" />
          <polygon points="160,23 156.4,29 163.6,29" fill="#14121f" />
        </>
      )}
      {/* hatıra, pul, nazar */}
      <polygon points="186,16 189,24 197,24 190.5,29 193,37 186,32 179,37 181.5,29 175,24 183,24" fill="#ffcc66" stroke="#14121f" strokeWidth="1" />
      <circle cx="210" cy="27" r="7" fill="#f2efe4" stroke="#14121f" strokeWidth="1" />
      <circle cx="210" cy="27" r="3" fill="#2a7ab0" />
      <circle cx="210" cy="27" r="1.2" fill="#14121f" />
      <rect x="226" y="20" width="14" height="14" rx="3" fill="#ffd9a0" stroke="#14121f" strokeWidth="1" />
    </svg>
  )
}
