'use client'

import { useEffect, useRef, useState } from 'react'
import Portrait from '@/components/Portrait'
import { Overlay, SectionTitle, ic } from '@/components/ui'
import { HEROES, SLOTS, forHero, hasAccessory, kitFor, kitKey, walletOf, ACCESSORIES, type Accessory, type AccessoryId, type Hero, type Kit, type Slot } from '@/game/accessories'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import HeroPicker from '@/components/HeroPicker'
import { LOOKS, drawHero } from '@/game/heroDraw'
import { LOOK_AXES, axisDef, hasLook, normalizeLook, optionsFor, type Axis, type LookOption } from '@/game/looks'
import { demoPose, newDemo, type DemoMode } from '@/game/stance'
import { SCARVES, type Scarf } from '@/lib/extras'
import { useLang, useT } from '@/lib/i18n'

/** sekmeler: aksesuar yuvaları ve atkı (Kılık), görünüm eksenleri (saç, ten, kıyafet, ifade, duruş) */
type Tab = Slot | 'scarf' | 'hair' | 'skin' | 'outfit' | 'expr' | 'stance'
const LOOK_TABS: { id: Tab; name: string; nameEn: string; axes: Axis[] }[] = [
  { id: 'hair', name: 'Saç', nameEn: 'Hair', axes: ['hs', 'hc'] },
  { id: 'skin', name: 'Ten ve Göz', nameEn: 'Skin and Eyes', axes: ['sk', 'ey'] },
  { id: 'outfit', name: 'Kıyafet', nameEn: 'Outfit', axes: ['oc', 'op'] },
  { id: 'expr', name: 'İfade', nameEn: 'Expression', axes: ['ex'] },
  { id: 'stance', name: 'Duruş', nameEn: 'Stance', axes: ['st', 'rs'] },
]
/** seçici türü: renk yuvarlağı, portreli kart ya da yazı kartı */
const AXIS_KIND: Record<Axis, 'swatch' | 'card' | 'text'> = { hs: 'card', hc: 'swatch', sk: 'swatch', oc: 'swatch', op: 'card', ey: 'swatch', ex: 'card', st: 'text', rs: 'text' }
const MODES: DemoMode[] = ['dongu', 'dur', 'kos', 'zipla']
const MODE_NAME: Record<DemoMode, string> = { dongu: 'Döngü', dur: 'Dur', kos: 'Koş', zipla: 'Zıpla' }

/** odaktaki şey: bir aksesuar ya da bir görünüm seçeneği (fiyatı, sahipliği ve "Al" düğmesi buna göre) */
type Focus = { k: 'acc'; id: AccessoryId } | { k: 'look'; axis: Axis; id: string }

/** cüzdanın dökümü: parçanın nereden geldiği (game/accessories.ts `earned`) */
export interface WalletParts {
  found: number
  bosses: number
  seals: number
}

/**
 * Tam boy canlı önizleme: karakter seçilen kombin ve görünümle dururken (nefes, göz kırpma, duruşun canlı hareketleri),
 * koşarken (seçili koşu tarzı), zıplarken (squash ve stretch, iniş) ya da hepsini sırayla gösterir. Oyundaki poz kodunun
 * aynısı (game/stance.ts), saate bağlı, ~30 kare; hareket azaltma seçiliyse tek kare.
 */
function HeroPreview({ hero, kit, scarf, mode }: { hero: CharacterId; kit: Kit; scarf: Scarf | null; mode: DemoMode }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const key = kitKey(kit)
  const kitRef = useRef(kit)
  kitRef.current = kit
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c = cv.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const demo = newDemo()
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(cv.clientWidth * dpr)
      const h = Math.round(cv.clientHeight * dpr)
      if (!w || !h) return
      const resized = cv.width !== w || cv.height !== h
      if (!resized && (still ? last >= 0 : now - last < 33)) return
      if (resized) {
        cv.width = w
        cv.height = h
      }
      last = now
      const t = (now - t0) / 1000
      c.clearRect(0, 0, w, h)
      const size = h * 0.7
      const ground = h * 0.9
      const k = kitRef.current
      const d = demoPose(demo, still ? 'dur' : mode, t, k.look?.st, k.look?.rs)
      // zemin gölgesi: zıplarken küçülür
      const lift = d.dy * size
      c.fillStyle = `rgba(14,13,34,${0.45 - Math.min(0.25, d.dy * 0.3)})`
      c.beginPath()
      c.ellipse(w / 2, ground, size * 0.26 * (1 - d.dy * 0.35), size * 0.045, 0, 0, Math.PI * 2)
      c.fill()
      drawHero(c, hero, d.pose, w / 2, ground - lift, size, false, t, { moving: d.moving, flow: d.flow, sx: d.kx, sy: d.ky, scarf: scarf?.color, scarfS: scarf?.shade, acc: k })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [hero, key, scarf?.color, scarf?.shade, mode])
  return <canvas ref={ref} className="block h-full w-full" aria-hidden />
}

/**
 * Mağaza: karakterin bütün görünümü tek yerde. Kılık: baş, yüz ve sırtta birer parça (kombin) ve atkı rengi. Görünüm: saç
 * stili ve rengi, ten ve göz, kıyafet rengi ve deseni, yüz ifadesi, bekleme duruşu ve koşu tarzı. Her şey yolcu başına.
 * Bir seçeneğe dokunmak onu deneme kombinine koyar (önizleme hemen giyer); sahip olunanlar "Giy" ile takılır,
 * olmayan "Al" ile alınıp takılır. Para birimi parçadır: hatıra, pul, nazar 1 · boss 2 · Usta Mührü 3.
 */
export default function Shop({
  hero,
  onHero,
  scarfIds,
  charms,
  onScarf,
  owned,
  seals,
  kits,
  earnedTotal,
  parts,
  onBuy,
  onBuyLook,
  onWear,
  onBack,
}: {
  /** kılığı kurulan yolcu: sekmeyi değiştirmek oyundaki yolcuyu da değiştirir */
  hero: CharacterId
  onHero: (id: CharacterId) => void
  /** her yolcunun atkı rengi kimliği */
  scarfIds: Record<Hero, string>
  /** bulunan nazar boncuğu: atkı renkleri bununla açılır */
  charms: number
  onScarf: (hero: Hero, id: string) => void
  owned: Record<string, boolean>
  seals: number
  /** her yolcunun takılı kombini (görünümü `look` ile birlikte) */
  kits: Record<Hero, Kit>
  /** kazanılan toplam parça (cüzdan yolcu başına: kazanç eksi o yolcunun aldıkları) */
  earnedTotal: number
  parts: WalletParts
  onBuy: (hero: Hero, id: AccessoryId) => void
  onBuyLook: (hero: Hero, axis: Axis, id: string) => void
  onWear: (hero: Hero, k: Kit) => void
  onBack: () => void
}) {
  const t = useT()
  const lng = useLang()
  const [tab, setTab] = useState<Tab>('head')
  const [drafts, setDrafts] = useState<Record<Hero, Kit>>(kits)
  const [mode, setMode] = useState<DemoMode>('dongu')
  const [note, setNote] = useState('')
  const kit = kits[hero]
  const draft = drafts[hero]
  const wallet = walletOf(earnedTotal, owned, hero)
  const scarfId = scarfIds[hero]
  const [focus, setFocus] = useState<Focus>({ k: 'acc', id: kit.head })
  const scarf = SCARVES.find((x) => x.id === scarfId) ?? SCARVES[0]
  // takılı kombin dışarıda değişince (alınca takılır, kopyalanınca) deneme de onu izler
  const worn = kitKey(kit)
  const wornAll = HEROES.map((h) => kitKey(kits[h])).join('|')
  useEffect(() => {
    setDrafts(kits)
    setNote('')
  }, [wornAll]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setFocus({ k: 'acc', id: kits[hero].head }), [hero]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMine = (a: Accessory) => hasAccessory(owned, hero, a.id) || (a.seals !== undefined && seals >= a.seals)
  const nameOf = (a: { name: string; nameEn: string }) => (lng === 'en' ? a.nameEn : a.name)
  const priceLabel = (a: Accessory) => (a.seals !== undefined ? t('{n} Usta Mührü', { n: a.seals }) : t('{n} Parça', { n: a.price }))
  const lookMine = (axis: Axis, o: LookOption) => hasLook(owned, hero, axis, o)
  const sel = (axis: Axis) => draft.look?.[axis] ?? axisDef(axis).base
  const opt = (axis: Axis, id: string) => optionsFor(hero, axis).find((o) => o.id === id)
  const item = focus.k === 'acc' ? ACCESSORIES.find((a) => a.id === focus.id) : undefined
  const lookItem = focus.k === 'look' ? opt(focus.axis, focus.id) : undefined
  const draftItems = SLOTS.map((s) => ACCESSORIES.find((a) => a.id === draft[s.id])).filter(Boolean) as Accessory[]
  // deneme kombinindeki alınmamış her şey: aksesuarlar ve ücretli görünüm seçenekleri
  const missingAcc = draftItems.filter((a) => !isMine(a))
  const missingLook = LOOK_AXES.map((a) => ({ axis: a.id, o: opt(a.id, sel(a.id)) })).filter((x) => x.o && !lookMine(x.axis, x.o))
  const missingName = missingAcc.length ? nameOf(missingAcc[0]) : missingLook.length ? nameOf(missingLook[0].o!) : ''
  const changed = kitKey(draft) !== worn
  const pick = (slot: Slot, id: AccessoryId) => {
    setDrafts((d) => ({ ...d, [hero]: { ...d[hero], [slot]: id } }))
    setFocus({ k: 'acc', id })
    setNote('')
  }
  const pickLook = (axis: Axis, id: string) => {
    setDrafts((d) => ({ ...d, [hero]: { ...d[hero], look: normalizeLook(hero, { ...d[hero].look, [axis]: id }) } }))
    setFocus({ k: 'look', axis, id })
    setNote('')
  }
  const closet = forHero(hero)
  const mineCount = closet.filter(isMine).length
  const lookCount = LOOK_AXES.reduce((a, ax) => a + optionsFor(hero, ax.id).filter((o) => lookMine(ax.id, o)).length, 0)
  const lookTotal = LOOK_AXES.reduce((a, ax) => a + optionsFor(hero, ax.id).length, 0)
  const other: Hero = hero === 'uktun' ? 'memo' : 'uktun'
  // öbür yolcuya kopya: yalnız onun dolabında olan ve ona uyan parçalar geçer; görünüm (saç, ten…) kopyalanmaz: herkes kendi yüzüyle
  const copyOver = () => {
    const mineFor = (a: Accessory) => hasAccessory(owned, other, a.id) || (a.seals !== undefined && seals >= a.seals)
    const fit = kitFor(other, kit)
    const next: Kit = { ...fit, look: kits[other].look }
    let skipped = 0
    for (const sl of SLOTS) {
      const a = ACCESSORIES.find((x) => x.id === kit[sl.id])
      if (!a) continue
      if (fit[sl.id] === 'yok' || !mineFor(a)) {
        next[sl.id] = 'yok'
        skipped++
      }
    }
    onWear(other, next)
    setNote(skipped ? t('{name} için kopyalandı; {n} parça onun dolabında yok.', { name: CHARACTERS[other].name, n: skipped }) : t('{name} için kopyalandı.', { name: CHARACTERS[other].name }))
  }
  const scarfOf = (sc: Scarf) => (sc.id === 'al' ? { color: LOOKS[hero].scarf, shade: LOOKS[hero].scarfS } : sc)
  const scarfFor = (h: Hero) => {
    const sc = SCARVES.find((x) => x.id === scarfIds[h]) ?? SCARVES[0]
    return sc.id === 'al' ? null : sc
  }

  // eylem: odaktaki şey alınmamışsa "Al"; deneme kombini farklı ve hepsi seninse "Giy"
  const lockedFocus = item && !isMine(item) ? item : undefined
  const lockedLook = lookItem && focus.k === 'look' && !lookMine(focus.axis, lookItem) ? lookItem : undefined
  const action = lockedFocus ? (
    lockedFocus.seals !== undefined ? (
      <p className="text-[13px] leading-snug text-cream/85">{t('Şehir ustalarının görevlerini yap: {n} mühür daha.', { n: lockedFocus.seals - seals })}</p>
    ) : (
      <button className="pixel-btn primary w-full justify-center" disabled={wallet < lockedFocus.price} onClick={() => onBuy(hero, lockedFocus.id)}>
        {wallet < lockedFocus.price ? t('{n} Parça Daha Bul', { n: lockedFocus.price - wallet }) : t('Al ve Giy · {n} Parça', { n: lockedFocus.price })}
      </button>
    )
  ) : lockedLook && focus.k === 'look' ? (
    <button className="pixel-btn primary w-full justify-center" disabled={wallet < lockedLook.price} onClick={() => onBuyLook(hero, focus.axis, lockedLook.id)}>
      {wallet < lockedLook.price ? t('{n} Parça Daha Bul', { n: lockedLook.price - wallet }) : t('Al ve Giy · {n} Parça', { n: lockedLook.price })}
    </button>
  ) : changed ? (
    <button className="pixel-btn primary w-full justify-center" disabled={!!missingName} onClick={() => onWear(hero, draft)}>
      {missingName ? t('Önce {name} Al', { name: missingName }) : t('Kombini Giy')}
    </button>
  ) : (
    <p className="py-2 text-center text-[13px] text-teal">{t('Bu kombin üstünde.')}</p>
  )

  const cardCls = (on: boolean, mine: boolean, reach: boolean) =>
    `flex flex-col items-center border-2 p-2 transition-colors max-sm:p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${on ? 'border-gold bg-gold/10' : mine || reach ? 'border-line bg-panel-2 hover:border-accent-2' : 'border-dashed border-line bg-ink/30 hover:border-muted'}`
  const stateText = (wearing: boolean, mine: boolean, reach: boolean, price: number, free: string) => (wearing ? t('Takılı') : mine ? free : `${reach ? '' : '🔒 '}${t('{n} Parça', { n: price })}`)

  /** bir görünüm ekseninin seçicisi */
  const axisPicker = (axis: Axis) => {
    const def = axisDef(axis)
    const kind = AXIS_KIND[axis]
    const list = optionsFor(hero, axis)
    return (
      <div key={axis} className="mb-3">
        <SectionTitle title={nameOf(def)} className="mb-2" />
        <div className={kind === 'swatch' ? 'grid grid-cols-4 gap-1.5 sm:grid-cols-5' : kind === 'text' ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-3 gap-2 max-sm:gap-1.5 wide:grid-cols-4'}>
          {list.map((o) => {
            const mine = lookMine(axis, o)
            const reach = o.price > 0 && wallet >= o.price
            const on = sel(axis) === o.id
            const wearing = (kit.look?.[axis] ?? def.base) === o.id
            if (kind === 'card') {
              return (
                <button key={o.id} aria-pressed={on} onClick={() => pickLook(axis, o.id)} className={cardCls(on, mine, reach)}>
                  <Portrait id={hero} scarf={scarf.id === 'al' ? null : scarf} accessory={{ ...draft, look: normalizeLook(hero, { ...draft.look, [axis]: o.id }) }} className={`w-[72px] max-sm:w-[58px] short:w-[50px] ${mine ? '' : 'opacity-80'}`} />
                  <span className="mt-1 text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                  <span className={`text-[12px] ${wearing ? 'text-gold' : mine ? 'text-teal' : 'text-muted'}`}>{stateText(wearing, mine, reach, o.price, t('Senin'))}</span>
                </button>
              )
            }
            if (kind === 'text') {
              return (
                <button key={o.id} aria-pressed={on} onClick={() => pickLook(axis, o.id)} className={`${cardCls(on, mine, reach)} min-h-[48px] justify-center`}>
                  <span className="text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                  <span className={`text-[12px] ${wearing ? 'text-gold' : mine ? 'text-teal' : 'text-muted'}`}>{stateText(wearing, mine, reach, o.price, t('Senin'))}</span>
                </button>
              )
            }
            return (
              <button key={o.id} aria-pressed={on} aria-label={nameOf(o)} onClick={() => pickLook(axis, o.id)} className={`${cardCls(on, mine, reach)} gap-0.5 !p-1.5`}>
                <span className="relative block h-7 w-7 rounded-full border-2 border-ink" style={{ background: o.swatch ?? 'conic-gradient(#efb440, #2fb3c0, #d83c36, #efb440)' }}>
                  {!mine && <span className="absolute -right-1 -top-1 text-[11px]">🔒</span>}
                </span>
                <span className="text-center text-[12px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                <span className={`text-[11px] leading-none ${wearing ? 'text-gold' : mine ? 'text-teal' : 'text-muted'}`}>{wearing ? t('Takılı') : mine ? (o.price ? t('Senin') : '') : t('{n} Parça', { n: o.price })}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const lookTab = LOOK_TABS.find((x) => x.id === tab)
  const tabs: { id: Tab; name: string; nameEn: string }[] = [...SLOTS, { id: 'scarf' as const, name: 'Atkı', nameEn: 'Scarf' }, ...LOOK_TABS]

  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-4xl flex-col p-4 sm:p-6 short:max-w-[min(1000px,100%)] short:py-3 wide:max-w-[min(1120px,100%)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-cream short:text-2xl">
              {t('Mağaza')}
              <span className="border-2 border-gold/80 bg-gold/10 px-2 py-0.5 font-mono text-[14px] font-bold leading-snug tabular-nums text-gold" title={t('Cüzdan')}>
                {t('{n} Parça', { n: wallet })}
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Her yolcunun görünümü ayrı: kombinini kur, saçını, kıyafetini ve duruşunu seç. Alınan parça yalnız seçili yolcunun olur.')}</p>
          </div>
          <button data-back className="pixel-btn back-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] short:mt-2 short:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] short:gap-3">
          {/* sol: canlı önizleme, karakter, deneme kombini ve eylem; altta parçanın nereden geldiği */}
          <div className="mode-card flex min-h-0 flex-col p-3 [--tone:var(--color-gold)] max-sm:p-2.5">
            <div className="flex gap-3 sm:flex-col short:!flex-row">
              <div className="relative h-[150px] w-[120px] shrink-0 overflow-hidden border-2 border-line bg-[radial-gradient(ellipse_at_50%_35%,#3a3478,#1a1838)] sm:h-[230px] sm:w-full short:!h-[120px] short:!w-[96px]">
                <HeroPreview hero={hero} kit={draft} scarf={scarf.id === 'al' ? null : scarf} mode={mode} />
                <button className="absolute bottom-1 right-1 border-2 border-line bg-ink/70 px-1.5 py-0.5 text-[12px] font-semibold text-cream" onClick={() => setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length])} title={t('Önizleme: Döngü, Dur, Koş, Zıpla')}>
                  {t(MODE_NAME[mode])}
                </button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:mt-3 short:!mt-0">
                <HeroPicker size="sm" label={t('Karakter')} value={hero} onChange={(id) => (setNote(''), onHero(id))} scarfOf={scarfFor} kitOf={(id) => drafts[id]} />
                <ul className="grid gap-1 text-[13px] short:hidden">
                  {SLOTS.map((s) => {
                    const a = ACCESSORIES.find((x) => x.id === draft[s.id])
                    return (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <span className="text-muted">{nameOf(s)}</span>
                        <span className={`truncate font-semibold ${a && !isMine(a) ? 'text-gold' : 'text-cream'}`}>{a ? nameOf(a) : t('Yok')}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-auto flex flex-col gap-1.5">
                  {action}
                  <button className="pixel-btn w-full justify-center py-1.5 text-[13px]" onClick={copyOver} title={t('Takılı kombini öbür yolcuya giydirir')}>
                    {t('Öbürüne Kopyala')}
                  </button>
                  {note && (
                    <p className="text-[12px] leading-snug text-teal" role="status">
                      {note}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* cüzdan: nereden kazanıldığı açıkça */}
            <dl className="mt-3 grid grid-cols-4 gap-[2px] border-2 border-line bg-line/70 text-center max-sm:hidden short:hidden">
              {(
                [
                  [parts.found, t('Hatıra · Pul · Nazar'), '×1'],
                  [parts.bosses, t('Boss'), '×2'],
                  [parts.seals, t('Usta Mührü'), '×3'],
                  [`${mineCount + lookCount}/${closet.length + lookTotal}`, t('Kılık'), ''],
                ] as const
              ).map(([v, k, m]) => (
                <div key={k} className="bg-panel px-1 py-1.5">
                  <dd className="font-display text-lg leading-none tabular-nums text-cream">
                    {v}
                    {m && <span className="ml-0.5 text-[12px] text-gold">{m}</span>}
                  </dd>
                  <dt className="mt-0.5 text-[11px] leading-tight text-muted">{k}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-1.5 text-[12px] leading-snug text-muted max-sm:hidden short:hidden">{t('Parça yolda kazanılır: hatıra, gizli pul ve nazar boncuğu 1, yendiğin her boss 2, her Usta Mührü 3 parça.')}</p>
          </div>

          {/* sağ: sekmeler (Kılık: baş, yüz, sırt, atkı · Görünüm: saç, ten, kıyafet, ifade, duruş) ve seçenekler */}
          <div className="flex min-h-0 flex-col">
            <div className="flex flex-wrap gap-x-1.5 gap-y-1" role="tablist">
              {[tabs.slice(0, 4), tabs.slice(4)].map((group, gi) => (
                <div key={gi} className="seg seg-tabs !m-0 flex-1 basis-[46%]">
                  {group.map((s) => (
                    <button key={s.id} role="tab" aria-selected={tab === s.id} onClick={() => setTab(s.id)}>
                      {nameOf(s)}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="overlay-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              {lookTab ? (
                lookTab.axes.map(axisPicker)
              ) : tab === 'scarf' ? (
                <>
                  <SectionTitle title={t('Atkı Rengi')} note={t('Nazar boncuğu buldukça açılır')} className="mb-2" />
                  <div className="grid grid-cols-3 gap-2 max-sm:gap-1.5">
                    {SCARVES.map((sc) => {
                      const open = charms >= sc.need
                      const on = scarfId === sc.id
                      const col = scarfOf(sc)
                      return (
                        <button
                          key={sc.id}
                          disabled={!open}
                          aria-pressed={on}
                          onClick={() => onScarf(hero, sc.id)}
                          className={`flex flex-col items-center border-2 p-2 transition-colors max-sm:p-1.5 ${on ? 'border-gold bg-gold/10' : open ? 'border-line bg-panel-2 hover:border-accent-2' : 'border-dashed border-line bg-ink/30 opacity-60'}`}
                        >
                          <Portrait id={hero} scarf={sc.id === 'al' ? null : col} accessory={draft} className="w-[64px] max-sm:w-[54px] short:w-[48px]" />
                          <span className="mt-1 text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(sc)}</span>
                          <span className={`text-[12px] ${on ? 'text-gold' : open ? 'text-teal' : 'text-muted'}`}>{on ? t('Takılı') : open ? t('Açık') : `🔒 ${t('{n} nazar', { n: sc.need })}`}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-sm:gap-1.5 wide:grid-cols-4">
                  {[null, ...closet.filter((a) => a.slot === tab)].map((a) => {
                    const id: AccessoryId = a ? a.id : 'yok'
                    const mine = !a || isMine(a)
                    const reach = !!a && a.seals === undefined && wallet >= a.price
                    const on = draft[tab as Slot] === id
                    const wearing = kit[tab as Slot] === id
                    return (
                      <button key={id} aria-pressed={on} onClick={() => pick(tab as Slot, id)} className={cardCls(on, mine, reach)}>
                        <Portrait id={hero} scarf={scarf.id === 'al' ? null : scarf} accessory={{ ...draft, [tab]: id }} className={`w-[72px] max-sm:w-[58px] short:w-[50px] ${mine ? '' : 'opacity-80'}`} />
                        <span className="mt-1 text-center text-[13px] font-semibold leading-tight text-cream">{a ? nameOf(a) : t('Yok')}</span>
                        <span className={`text-[12px] ${wearing ? 'text-gold' : mine ? 'text-teal' : 'text-muted'}`}>{wearing ? t('Takılı') : mine ? (a ? t('Senin') : t('Boş')) : `${reach ? '' : '🔒 '}${priceLabel(a!)}`}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
