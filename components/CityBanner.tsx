import { useLang, useT } from '@/lib/i18n'
import type { LevelDef } from '@/game/types'

/** Panel başlığı: şehrin piksel sahnesi, posta pulu biçiminde plaka ve şehir adı. */
export default function CityBanner({ level, index, total, eyebrow, height = 120, short, wide }: { level: LevelDef; index?: number; total?: number; eyebrow?: string; height?: number; short?: number; wide?: number }) {
  const plate = String(level.plate).padStart(2, '0')
  const t = useT()
  const lang = useLang()
  return (
    // short: yatay telefonda (alçak ekranda) daha basık şerit; giriş kartı kaydırmadan sığsın
    <div
      className="relative -mx-6 -mt-[calc(14px+1.25rem)] mb-4 wide:-mx-8 h-[var(--bh)] overflow-hidden [@media(max-height:500px)]:mb-2 [@media(max-height:500px)]:h-[var(--bh-short)] wide:h-[var(--bh-wide)]"
      style={{ '--bh': `${height}px`, '--bh-short': `${short ?? height}px`, '--bh-wide': `${wide ?? height}px` } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/sehirler/${level.id}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ imageRendering: 'pixelated', objectPosition: '50% 70%' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e1a29]/30 to-[#1e1a29]" />
      <div className="kilim absolute inset-x-0 top-0" />
      <div className="stamp absolute right-4 top-5 origin-top-right rotate-[5deg] text-center text-[#1a1420] shadow-lg short:top-3 short:scale-[0.7]">
        <div className="border-2 border-dashed border-[#1a1420]/40 px-2.5 py-1">
          <p className="font-display text-3xl leading-none">{plate}</p>
          <p className="text-[9px] font-bold tracking-[0.15em]">{level.name.toLocaleUpperCase('tr')}</p>
        </div>
      </div>
      <div className="absolute bottom-2 left-6 right-28">
        {eyebrow || index !== undefined ? (
          <p className="text-[11px] font-bold tracking-[0.25em] text-accent-2 [text-shadow:0_1px_0_#120f1a]">
            {eyebrow ?? `${String((index ?? 0) + 1).padStart(2, '0')} / ${String(total ?? 0).padStart(2, '0')} · ${t(level.difficulty).toLocaleUpperCase(lang)}`}
          </p>
        ) : null}
        <h2 className="font-display text-4xl leading-none text-cream [text-shadow:0_3px_0_#120f1a] short:text-2xl">
          {level.name}
          {level.nickname ? <span className="ml-2 whitespace-nowrap text-xl text-accent-2">({level.nickname})</span> : null}
        </h2>
      </div>
    </div>
  )
}

export function Toggle({ label, on, onChange, hint }: { label: string; on: boolean; onChange: () => void; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} className="flex w-full items-center justify-between gap-3 px-1 py-2 text-left short:py-1.5">
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-cream short:text-[13px]">{label}</span>
        {/* alçak ekranda açıklama gizlenir: ayarlar kaydırmadan sığsın (adı başlık olarak kalır) */}
        {hint && <span className="block text-[11px] text-muted short:hidden">{hint}</span>}
      </span>
      <span className="px-switch" data-on={on} />
    </button>
  )
}
