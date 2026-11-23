import { createContext, useContext } from 'react'
import { useT } from '@/lib/i18n'
import type { LevelDef } from '@/game/types'

/** Panel başlığı: şehrin piksel sahnesi, posta pulu biçiminde plaka ve şehir adı. */
export default function CityBanner({ level, index, total, eyebrow, height = 120, short, wide }: { level: LevelDef; index?: number; total?: number; eyebrow?: string; height?: number; short?: number; wide?: number }) {
  const plate = String(level.plate).padStart(2, '0')
  const t = useT()
  return (
    // short: yatay telefonda (alçak ekranda) daha basık şerit; giriş kartı kaydırmadan sığsın
    <div
      className="relative -mx-6 -mt-[calc(14px+1.25rem)] mb-4 wide:-mx-8 h-[var(--bh)] overflow-hidden [@media(max-height:500px)]:mb-2 [@media(max-height:500px)]:h-[var(--bh-short)] wide:h-[var(--bh-wide)] wide:[@media(max-height:700px)]:h-[var(--bh)]"
      style={{ '--bh': `${height}px`, '--bh-short': `${short ?? height}px`, '--bh-wide': `${wide ?? height}px` } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/sehirler/${level.id}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ imageRendering: 'pixelated', objectPosition: '50% 70%' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#171538]/30 to-[#171538]" />
      <div className="kilim absolute inset-x-0 top-0" />
      <div className="stamp absolute right-4 top-5 origin-top-right rotate-[5deg] text-center text-[#12112c] shadow-lg short:top-3 short:scale-[0.7]">
        <div className="border-2 border-dashed border-[#12112c]/40 px-2.5 py-1">
          <p className="font-display text-3xl leading-none">{plate}</p>
          <p className="text-[12px] font-bold tracking-[0.1em]">{level.name.toLocaleUpperCase('tr')}</p>
        </div>
      </div>
      <div className="absolute bottom-2 left-6 right-28">
        {eyebrow || index !== undefined ? (
          <p className="text-[14px] font-semibold text-accent-2 [text-shadow:0_1px_0_#0e0d22]">
            {eyebrow ?? `${(index ?? 0) + 1} / ${total ?? 0} · ${t(level.difficulty)}`}
          </p>
        ) : null}
        <h2 className="font-display text-4xl leading-none text-cream [text-shadow:0_3px_0_#0e0d22] short:text-2xl">
          {level.name}
          {level.nickname ? <span className="ml-2 whitespace-nowrap text-xl text-accent-2">({level.nickname})</span> : null}
        </h2>
      </div>
    </div>
  )
}

/** Sıkı ayar kutucukları (mola): açıklama kutucuğun ipucunda, ad ve anahtar tek satırda; iki sütunlu ızgaraya dizilir */
export const CompactToggles = createContext(false)
/** Ayarlar ekranının kart görünümü: adı ve anahtarı üstte, ne işe yaradığı altta (iki sütunlu ızgarada) */
export const CardToggles = createContext(false)

export function Toggle({ label, on, onChange, hint, tag }: { label: string; on: boolean; onChange: () => void; hint?: string; /** adın yanında hep görünen kısa uyarı (alçak ekranda açıklama gizlenir, bu kalır) */ tag?: string }) {
  const compact = useContext(CompactToggles)
  const card = useContext(CardToggles)
  if (card)
    return (
      <button type="button" role="switch" aria-checked={on} onClick={onChange} className={`flex h-full w-full flex-col border-2 px-3 py-2.5 text-left transition-colors ${on ? 'border-gold/45 bg-gold/[0.06]' : 'border-line bg-ink/30 hover:bg-panel-2/60'}`}>
        <span className="flex w-full items-center justify-between gap-2">
          <span className="min-w-0 text-[14px] font-semibold leading-tight text-cream">
            {label}
            {tag && <span className="ml-1.5 whitespace-nowrap text-[12px] font-bold text-accent-2">{tag}</span>}
          </span>
          <span className="px-switch shrink-0" data-on={on} />
        </span>
        {hint && <span className="card-hint mt-1 overflow-hidden text-[13px] leading-snug text-muted">{hint}</span>}
      </button>
    )
  if (compact)
    return (
      <button type="button" role="switch" aria-checked={on} onClick={onChange} title={hint} className={`flex w-full items-center justify-between gap-2 border-2 px-2.5 py-2 text-left transition-colors short:py-1.5 ${on ? 'border-gold/50 bg-gold/5' : 'border-line bg-ink/30 hover:bg-panel-2/60'}`}>
        <span className="min-w-0 text-[13px] font-semibold leading-tight text-cream">
          {label}
          {tag && <span className="block text-[12px] font-bold text-accent-2">{tag}</span>}
        </span>
        <span className="px-switch shrink-0" data-on={on} />
      </button>
    )
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} className="flex w-full items-center justify-between gap-3 px-1 py-2 text-left short:py-1.5">
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-cream short:text-[13px]">
          {label}
          {tag && <span className="ml-2 whitespace-nowrap text-[12px] font-bold tracking-[0.06em] text-accent-2">{tag}</span>}
        </span>
        {/* alçak ekranda açıklama gizlenir: ayarlar kaydırmadan sığsın (adı başlık olarak kalır) */}
        {hint && <span className="block text-[13px] leading-snug text-muted short:hidden">{hint}</span>}
      </span>
      <span className="px-switch" data-on={on} />
    </button>
  )
}

/** Açık/kapalı ayarın altında ince ses düzeyi çubuğu (0-100). Kapalıyken gizlenir: liste kısa kalsın. */
export function Level({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 px-1 pb-2 pt-0.5 text-[13px] text-muted short:pb-1.5">
      <span className="w-14 shrink-0">{label}</span>
      <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} className="px-range min-w-0 flex-1" aria-label={label} />
      <span className="w-9 shrink-0 text-right tabular-nums text-cream">{Math.round(value * 100)}</span>
    </label>
  )
}

/** Birkaç seçenekten biri: küçük, yan yana düğmeler (Rahat Mod hızı gibi) */
export function Choice<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-3 px-1 pb-2 pt-0.5 text-[13px] text-muted short:pb-1.5" role="group" aria-label={label}>
      <span className="shrink-0">{label}</span>
      <span className="ml-auto flex gap-1">
        {options.map((o) => (
          <button key={String(o.v)} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)} className={`min-h-[28px] min-w-[42px] px-2 py-1 text-[13px] font-bold tabular-nums ${value === o.v ? 'bg-gold text-ink' : 'bg-ink/40 text-muted hover:text-cream [box-shadow:inset_0_0_0_2px_#37337a]'}`}>
            {o.label}
          </button>
        ))}
      </span>
    </div>
  )
}
