'use client'
import { DAILY_RULES, type DailyRule } from '@/lib/extras'

/** Kural aileleri: Sinir Bozucu ekranında modlar bu başlıklar altında durur (kolaydan zora), renk aileyi söyler */
export type RuleFamily = 'zemin' | 'gorus' | 'fizik' | 'baski' | 'karisim' | 'kural'

export const FAMILIES: Record<RuleFamily, { name: string; tagline: string; color: string }> = {
  zemin: { name: 'Zemin', tagline: 'Ayağının altı güvenilmez', color: '#7fd3ff' },
  gorus: { name: 'Görüş', tagline: 'Gözüne güvenme', color: '#b9a4ff' },
  fizik: { name: 'Fizik', tagline: 'Dünyanın kuralı değişti', color: '#ffd166' },
  baski: { name: 'Baskı', tagline: 'Peşinde biri var ya da tek canın', color: '#ff7a7a' },
  karisim: { name: 'Karışım', tagline: 'Hepsi bir arada', color: '#ff9a6b' },
  kural: { name: 'Kurallar', tagline: 'Aynı şehir, başka oyun', color: '#a9b4ff' },
}

/** Ekranda sıra: aileler kolaydan zora, her ailenin içi zorluğa göre (eşitse tanımdaki sıra). Günlük kuralın seçimi
 * `RULES` dizisinin sırasına bağlıdır, o dizi değişmez: sıralama yalnız gösterimdir. */
export const FAMILY_ORDER: RuleFamily[] = ['kural', 'zemin', 'gorus', 'fizik', 'baski', 'karisim']
export function byHeat<R extends DailyRule>(list: readonly R[]): R[] {
  return [...list].sort((a, b) => RULE_ART[a].heat - RULE_ART[b].heat || list.indexOf(a) - list.indexOf(b))
}

/** Her kuralın ailesi ve zorluğu (1-5 alev): elle, oynanışa göre */
export const RULE_ART: Record<DailyRule, { family: RuleFamily; heat: 1 | 2 | 3 | 4 | 5 }> = {
  ceza: { family: 'kural', heat: 1 },
  hiz: { family: 'kural', heat: 2 },
  hatira: { family: 'kural', heat: 2 },
  tekcan: { family: 'kural', heat: 3 },
  bayraksiz: { family: 'kural', heat: 3 },
  zaman: { family: 'kural', heat: 3 },
  dashsiz: { family: 'kural', heat: 2 },
  kaygan: { family: 'zemin', heat: 2 },
  coken: { family: 'zemin', heat: 3 },
  hayalet: { family: 'zemin', heat: 2 },
  gorunmez: { family: 'zemin', heat: 3 },
  karanlik: { family: 'gorus', heat: 2 },
  basasagi: { family: 'gorus', heat: 3 },
  aynaekran: { family: 'gorus', heat: 3 },
  dar: { family: 'gorus', heat: 2 },
  turbo: { family: 'fizik', heat: 3 },
  ay: { family: 'fizik', heat: 2 },
  firtina: { family: 'fizik', heat: 3 },
  ters: { family: 'fizik', heat: 3 },
  cehennem: { family: 'baski', heat: 4 },
  sonnefes: { family: 'baski', heat: 5 },
  geceyarisi: { family: 'baski', heat: 4 },
  kabus: { family: 'karisim', heat: 5 },
  kaos: { family: 'karisim', heat: 5 },
  korkabus: { family: 'karisim', heat: 5 },
  kovala: { family: 'baski', heat: 3 },
  agir: { family: 'fizik', heat: 3 },
  kisadash: { family: 'fizik', heat: 3 },
  afyok: { family: 'fizik', heat: 4 },
  deprem: { family: 'zemin', heat: 2 },
}

const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
const MOON = 'M15.5 3.5a8.5 8.5 0 1 0 5 13.2A7 7 0 0 1 15.5 3.5z'

/** Kuralın piktogramı: 24'lük ızgarada tek çizgi kalınlığı, renk currentColor (aile rengi) */
function glyph(rule: DailyRule) {
  switch (rule) {
    case 'cehennem':
      return <path d="M12 2.5c1.2 3.4 5 5.4 5 10.2a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.4-4.8 0 2.2 1 3.4 2.4 3.6-.6-3.4-.6-6 .2-9z" fill="currentColor" fillOpacity=".25" />
    case 'kovala':
      // koşan Kangal: gövde, baş, dik kuyruk, dörtnala bacaklar
      return (
        <>
          <path d="M4 12.5c2-1.6 5-2 8.5-1.6l3.2-2.4 3.4.6 1.4 2.2-2.2 1.2-2 .2-1.3 2.8" fill="currentColor" fillOpacity=".25" />
          <path d="M4 12.5 2.5 9M6.5 14l-2.5 4M9 14.5l1 4M14.5 15l2.2 3.2M12 14.8l-1.5 3.6" />
          <path d="M18 9.2l1-2.2" />
        </>
      )
    case 'kaygan':
      return (
        <>
          <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
          <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
        </>
      )
    case 'ters':
      return <path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5" />
    case 'coken':
      return (
        <>
          <rect x="3.5" y="6" width="17" height="13" rx="1" fill="currentColor" fillOpacity=".18" />
          <path d="M12.5 6 10.5 10.5l3 2.5-2 6" />
          <path d="M6 22l1-2M18 22l-1-2" />
        </>
      )
    case 'kabus':
      return (
        <>
          <path d={MOON} fill="currentColor" fillOpacity=".2" />
          <path d="M8 11.5q1.5 1.6 3 0M8.5 15.5q2 -1.2 4 0" />
        </>
      )
    case 'sonnefes':
      return (
        <>
          <path d={HEART} fill="currentColor" fillOpacity=".2" />
          <path d="M12 7.4 10.4 10.6l3 2-1.4 3" />
        </>
      )
    case 'karanlik':
      return (
        <>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="8.5" strokeDasharray="2.2 2.6" />
        </>
      )
    case 'basasagi':
      return (
        <>
          <path d="M5 10h14L12 3z" fill="currentColor" fillOpacity=".35" />
          <path d="M5 14h14l-7 7z" />
        </>
      )
    case 'aynaekran':
      return (
        <>
          <path d="M10 5 3 19h7z" fill="currentColor" fillOpacity=".35" />
          <path d="M14 5l7 14h-7z" />
          <path d="M12 2.5v19" strokeDasharray="1.6 2" />
        </>
      )
    case 'turbo':
      return <path d="M13.5 2 4.5 13.5h6.5L10 22l9-12h-6.5z" fill="currentColor" fillOpacity=".25" />
    case 'geceyarisi':
      return (
        <>
          <path d={MOON} fill="currentColor" fillOpacity=".2" />
          <path d="M18.5 3.5v3M17 5h3" />
        </>
      )
    case 'kaos':
      return <path d="M12 12a1.2 1.2 0 1 1 1.2 1.2 3 3 0 1 1 -3-3 5 5 0 1 1 -5 5 7.5 7.5 0 0 1 7.5-7.5" />
    case 'ay':
      return (
        <>
          <circle cx="12" cy="8" r="4.2" fill="currentColor" fillOpacity=".25" />
          <path d="M5.5 16q6.5 3.6 13 0M8 20q4 2 8 0" />
        </>
      )
    case 'firtina':
      return <path d="M3 8.5h11.5a3 3 0 1 0-3-3M3 12.5h16a3 3 0 1 1-3 3M3 16.5h8" />
    case 'gorunmez':
      return (
        <>
          <path d="M3 19.5 6 12l3 7.5 3-7.5 3 7.5 3-7.5 3 7.5" strokeDasharray="2 2" />
          <path d="M3 21.5h18" />
        </>
      )
    case 'hayalet':
      return (
        <>
          <path d="M6 20.5V11a6 6 0 0 1 12 0v9.5l-2-2-2 2-2-2-2 2-2-2z" fill="currentColor" fillOpacity=".2" />
          <circle cx="10" cy="11" r=".9" fill="currentColor" />
          <circle cx="14" cy="11" r=".9" fill="currentColor" />
        </>
      )
    case 'dar':
      return (
        <>
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        </>
      )
    case 'korkabus':
      return (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          <path d="M4 4l16 16" />
        </>
      )
    case 'agir':
      // ağırlık: aşağı çeken kütle ve ok
      return (
        <>
          <path d="M7 9h10l2.5 11h-15z" fill="currentColor" fillOpacity=".25" />
          <path d="M9.5 9a2.5 2.5 0 1 1 5 0M12 12.5v4M10 14.8l2 2 2-2" />
        </>
      )
    case 'kisadash':
      return (
        <>
          <path d="M3 12h6M3 8.5h3M3 15.5h3" />
          <path d="M12 12h3.5M14 9l3 3-3 3" />
          <path d="M19.5 7v10" strokeDasharray="1.8 2" />
        </>
      )
    case 'afyok':
      // kenar ve boşluk: zıplama hakkı kalmadı
      return (
        <>
          <path d="M3 10h8v2H3z" fill="currentColor" fillOpacity=".3" />
          <path d="M11 11c3 0 6 3 8 9M16 15l3 5-5-.5" />
          <path d="M16 4l4 4M20 4l-4 4" />
        </>
      )
    case 'deprem':
      return (
        <>
          <path d="M2.5 14l3-4 3 8 3-12 3 12 3-8 3 4" />
          <path d="M3 21h18" />
        </>
      )
    case 'ceza':
      return (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l3 2M10 2.5h4" />
        </>
      )
    case 'hiz':
      return <path d="M3.5 6l7.5 6-7.5 6zM12.5 6l8 6-8 6z" fill="currentColor" fillOpacity=".25" />
    case 'hatira':
      return (
        <>
          <path d="M12 3l7.5 7L12 21 4.5 10z" fill="currentColor" fillOpacity=".2" />
          <path d="M4.5 10h15M9 10l3 11 3-11" />
        </>
      )
    case 'tekcan':
      return <path d={HEART} fill="currentColor" fillOpacity=".3" />
    case 'bayraksiz':
      return (
        <>
          <path d="M6.5 21V4M6.5 4.5h10l-2 3.8 2 3.7h-10" />
          <path d="M3 3l18 18" />
        </>
      )
    case 'zaman':
      return <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />
    case 'dashsiz':
      return (
        <>
          <path d="M3 9h4M3 15h4M9 12h9M14.5 8l4 4-4 4" />
          <path d="M4 3.5l16 17" />
        </>
      )
  }
}

export function RuleIcon({ rule, size = 24, className = '' }: { rule: DailyRule; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {glyph(rule)}
    </svg>
  )
}

/** Zorluk: beş alev, dolu olanlar kuralın zorluğu */
export function Heat({ n, className = '', label }: { n: number; className?: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-[2px] ${className}`} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((k) => (
        <svg key={k} viewBox="0 0 10 12" width="8" height="10" aria-hidden="true">
          <path d="M5 .5c.6 1.8 3.5 3 3.5 6.2a3.5 3.5 0 0 1-7 0C1.5 5 2.3 4.2 3 3.6c0 1.2.6 1.9 1.4 2C4 3.8 4.3 2.2 5 .5z" fill={k <= n ? '#ff8a5c' : 'rgba(255,255,255,0.14)'} />
        </svg>
      ))}
    </span>
  )
}

/** "Ne değişir" rozetleri: kuralın tanımından türer (metin elle yazılmaz, tanım değişince kendiliğinden doğru kalır) */
export function rulePerks(rule: DailyRule): Array<{ icon: DailyRule; text: string; vars?: Record<string, string | number> }> {
  const d = DAILY_RULES[rule]
  const v = d.view ?? {}
  const out: Array<{ icon: DailyRule; text: string; vars?: Record<string, string | number> }> = []
  if (d.oneLife) out.push({ icon: 'tekcan', text: 'Tek Can' })
  if (d.noFlags) out.push({ icon: 'bayraksiz', text: 'Bayrak Yok' })
  if (d.noDash) out.push({ icon: 'dashsiz', text: 'Dash Yok' })
  if (d.limit) out.push({ icon: 'zaman', text: 'Süre Sınırı' })
  if (d.speed > 1) out.push({ icon: 'hiz', text: '%{n} Hızlı', vars: { n: Math.round((d.speed - 1) * 100) } })
  if (d.slippery) out.push({ icon: 'kaygan', text: 'Buz Zemin' })
  if (d.crumbleAll) out.push({ icon: 'coken', text: 'Çöken Taş' })
  if (d.swapKeys) out.push({ icon: 'ters', text: 'Ters Tuşlar' })
  if (d.lowGravity) out.push({ icon: 'ay', text: 'Az Yerçekimi' })
  if (d.storm) out.push({ icon: 'firtina', text: 'Dönen Rüzgâr' })
  if (d.heavy) out.push({ icon: 'agir', text: 'Ağır Yerçekimi' })
  if (d.shortDash) out.push({ icon: 'kisadash', text: 'Kısa Dash' })
  if (d.noMercy) out.push({ icon: 'afyok', text: 'Zıplama Payı Yok' })
  if (d.chase) out.push({ icon: 'kovala', text: 'Kangal Kovalar' })
  if (v.dark) out.push({ icon: 'karanlik', text: 'Karanlık' })
  if (v.flipY) out.push({ icon: 'basasagi', text: 'Ters Ekran' })
  if (v.flipX) out.push({ icon: 'aynaekran', text: 'Ayna Görüntü' })
  if (v.hiddenSpikes) out.push({ icon: 'gorunmez', text: 'Gizli Diken' })
  if (v.ghostGround) out.push({ icon: 'hayalet', text: 'Sisli Zemin' })
  if (v.zoom) out.push({ icon: 'dar', text: 'Yakın Kamera' })
  if (v.quake) out.push({ icon: 'deprem', text: 'Sarsılan Kadraj' })
  if (d.perDeath) out.push({ icon: 'ceza', text: 'Düşüş +{n} sn', vars: { n: d.perDeath } })
  if (d.perMissing) out.push({ icon: 'hatira', text: 'Eksik Hatıra +{n} sn', vars: { n: d.perMissing } })
  return out
}
