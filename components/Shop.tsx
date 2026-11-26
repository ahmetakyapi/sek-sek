'use client'

import { useEffect, useState } from 'react'
import Portrait from '@/components/Portrait'
import { Overlay, SectionTitle, ic } from '@/components/ui'
import { HEROES, SLOTS, forHero, hasAccessory, kitFor, kitKey, walletOf, ACCESSORIES, type Accessory, type AccessoryId, type Hero, type Kit, type Slot } from '@/game/accessories'
import { CHARACTERS, type CharacterId } from '@/game/characters'
import HeroPicker from '@/components/HeroPicker'
import { LOOKS } from '@/game/heroDraw'
import HeroTurntable from '@/components/HeroTurntable'
import { LOOK_AXES, axisDef, hasLook, normalizeLook, optionsFor, type Axis, type LookOption } from '@/game/looks'
import type { DemoMode } from '@/game/stance'
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
  // döner sahne kendiliğinden dönsün mü (sürükleme ve ←/→ her zaman çalışır)
  const [spin, setSpin] = useState(false)
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
  const buyBtn = (price: number, onClick: () => void) => (
    <button className="pixel-btn primary w-full justify-center" disabled={wallet < price} onClick={onClick}>
      {wallet < price ? t('{n} Parça Daha Bul', { n: price - wallet }) : t('Al ve Giy · {n} Parça', { n: price })}
    </button>
  )
  const action = lockedFocus ? (
    lockedFocus.seals !== undefined ? (
      <p className="border-2 border-dashed border-line px-2 py-1.5 text-center text-[13px] leading-snug text-cream/85">{t('Şehir ustalarının görevlerini yap: {n} mühür daha.', { n: lockedFocus.seals - seals })}</p>
    ) : (
      buyBtn(lockedFocus.price, () => onBuy(hero, lockedFocus.id))
    )
  ) : lockedLook && focus.k === 'look' ? (
    buyBtn(lockedLook.price, () => onBuyLook(hero, focus.axis, lockedLook.id))
  ) : changed ? (
    <button className="pixel-btn primary w-full justify-center" disabled={!!missingName} onClick={() => onWear(hero, draft)}>
      {missingName ? t('Önce {name} Al', { name: missingName }) : t('Kombini Giy')}
    </button>
  ) : (
    <p className="flex min-h-[40px] items-center justify-center gap-1.5 border-2 border-teal/40 short:min-h-[32px] short:text-[12px] bg-teal/10 text-center text-[13px] font-semibold text-teal">✓ {t('Bu kombin üstünde.')}</p>
  )

  // önizlemenin üstündeki etiket: odaktaki parçanın yeri, adı ve durumu
  const focusPlace = focus.k === 'acc' ? SLOTS.find((x) => x.id === (item ? item.slot : tab)) : axisDef(focus.axis)
  const focusName = focus.k === 'acc' ? (item ? nameOf(item) : t('Yok')) : lookItem ? nameOf(lookItem) : ''
  const focusWearing = focus.k === 'acc' ? !!item && kit[item.slot] === item.id : (kit.look?.[focus.axis] ?? axisDef(focus.axis).base) === focus.id
  const focusMine = focus.k === 'acc' ? !item || isMine(item) : !lookItem || lookMine(focus.axis, lookItem)
  const focusPrice = lockedFocus ? priceLabel(lockedFocus) : lockedLook ? t('{n} Parça', { n: lockedLook.price }) : ''
  const focusReach = lockedFocus ? lockedFocus.seals === undefined && wallet >= lockedFocus.price : lockedLook ? wallet >= lockedLook.price : false

  /** kartın durum hapı: Takılı (altın, dolu) · Senin (turkuaz) · fiyat (alınabilirse altın çerçeveli, değilse kilitli ve soluk) */
  const pill = (wearing: boolean, mine: boolean, reach: boolean, price: string, free: string) =>
    wearing ? (
      <span className="shop-pill bg-gold text-ink">{t('Takılı')}</span>
    ) : mine ? (
      free ? <span className="shop-pill text-teal">{free}</span> : null
    ) : (
      <span className={`shop-pill ${reach ? 'border-gold/70 text-gold' : 'text-muted'}`}>
        {reach ? '' : '🔒 '}
        {price}
      </span>
    )
  /** seçenek kartı: denenen (altın çerçeve), takılı (köşede tik), sahip (düz), kilitli (kesik çizgi) */
  const cardCls = (on: boolean, mine: boolean, reach: boolean) =>
    `shop-card relative flex flex-col items-center gap-1 border-2 p-2 max-sm:p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${on ? 'border-gold bg-gold/10' : mine || reach ? 'border-line bg-panel-2 hover:border-accent-2' : 'border-dashed border-line bg-ink/30 hover:border-muted'}`
  const tick = (wearing: boolean) =>
    wearing ? (
      <span className="absolute -right-1.5 -top-1.5 z-[1] grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-gold text-[11px] font-bold leading-none text-ink" aria-hidden>
        ✓
      </span>
    ) : null

  /** bir görünüm ekseninin seçicisi */
  const axisPicker = (axis: Axis) => {
    const def = axisDef(axis)
    const kind = AXIS_KIND[axis]
    const list = optionsFor(hero, axis)
    const mineN = list.filter((o) => lookMine(axis, o)).length
    return (
      <div key={axis} className="mb-3">
        <SectionTitle title={nameOf(def)} note={t('{a}/{b} Senin', { a: mineN, b: list.length })} className="mb-2" />
        <div className={kind === 'swatch' ? 'grid grid-cols-4 gap-1.5 sm:grid-cols-5' : kind === 'text' ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-3 gap-2 max-sm:gap-1.5 wide:grid-cols-4'}>
          {list.map((o) => {
            const mine = lookMine(axis, o)
            const reach = o.price > 0 && wallet >= o.price
            const on = sel(axis) === o.id
            const wearing = (kit.look?.[axis] ?? def.base) === o.id
            const price = t('{n} Parça', { n: o.price })
            if (kind === 'card') {
              return (
                <button key={o.id} aria-pressed={on} onClick={() => pickLook(axis, o.id)} className={cardCls(on, mine, reach)}>
                  {tick(wearing)}
                  <Portrait id={hero} scarf={scarf.id === 'al' ? null : scarf} accessory={{ ...draft, look: normalizeLook(hero, { ...draft.look, [axis]: o.id }) }} className={`w-[72px] max-sm:w-[58px] short:w-[50px] ${mine ? '' : 'opacity-80'}`} />
                  <span className="text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                  {pill(wearing, mine, reach, price, t('Senin'))}
                </button>
              )
            }
            if (kind === 'text') {
              return (
                <button key={o.id} aria-pressed={on} onClick={() => pickLook(axis, o.id)} className={`${cardCls(on, mine, reach)} min-h-[56px] justify-center`}>
                  {tick(wearing)}
                  <span className="text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                  {pill(wearing, mine, reach, price, t('Senin'))}
                </button>
              )
            }
            return (
              <button key={o.id} aria-pressed={on} aria-label={nameOf(o)} onClick={() => pickLook(axis, o.id)} className={`${cardCls(on, mine, reach)} !gap-0.5 !p-1.5`}>
                {tick(wearing)}
                <span className="relative block h-7 w-7 rounded-full border-2 border-ink shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.18),inset_2px_2px_0_rgba(255,255,255,0.25)]" style={{ background: o.swatch ?? 'conic-gradient(#efb440, #2fb3c0, #d83c36, #efb440)' }}>
                  {!mine && <span className="absolute -right-1.5 -top-1.5 text-[11px]">🔒</span>}
                </span>
                <span className="text-center text-[12px] font-semibold leading-tight text-cream">{nameOf(o)}</span>
                {wearing ? null : !mine ? <span className={`text-[11px] leading-none ${reach ? 'text-gold' : 'text-muted'}`}>{price}</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const lookTab = LOOK_TABS.find((x) => x.id === tab)
  const tabs: { id: Tab; name: string; nameEn: string }[] = [...SLOTS, { id: 'scarf' as const, name: 'Atkı', nameEn: 'Scarf' }, ...LOOK_TABS]
  const nextMode = () => setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length])

  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-4xl flex-col p-4 sm:h-[min(calc(100dvh-32px),820px)] sm:p-6 short:max-w-[min(1000px,100%)] short:py-3 wide:max-w-[min(1120px,100%)]">
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
          {/* sol: döner sahne, karakter, odaktaki parça ve eylem; altta parçanın nereden geldiği (son öbek dibe yaslı) */}
          <div className="mode-card flex min-h-0 flex-col p-3 [--tone:var(--color-gold)] max-sm:p-2.5">
            <div className="flex min-h-0 gap-3 sm:flex-1 sm:flex-col short:!flex-row">
              <div className="shop-stage relative h-[160px] w-[124px] shrink-0 overflow-hidden border-2 border-line sm:h-auto sm:min-h-[150px] sm:w-full sm:flex-1 short:!h-[128px] short:!min-h-0 short:!w-[96px] short:!flex-none">
                <HeroTurntable hero={hero} kit={draft} scarf={scarf.id === 'al' ? null : scarf} mode={mode} spin={spin} onStopSpin={() => setSpin(false)} label={t('Karakteri Döndür')} className="absolute inset-0" />
                {/* odaktaki parça: yeri, adı, durumu */}
                {focusName && (
                  <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 max-sm:hidden short:hidden">
                    <div className="min-w-0">
                      {focusPlace && <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{nameOf(focusPlace)}</p>}
                      <p className="truncate font-display text-[19px] leading-tight text-cream [text-shadow:0_2px_0_rgba(0,0,0,0.45)]">{focusName}</p>
                    </div>
                    <span className="shrink-0">{pill(focusWearing, focusMine, focusReach, focusPrice, t('Senin'))}</span>
                  </div>
                )}
                {/* poz ve dönüş: geniş sahnede bölmeli düğmeler, küçük sahnede tek düğme */}
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 max-sm:hidden short:hidden">
                  <div className="seg !m-0 flex-1" role="group" aria-label={t('Önizleme: Döngü, Dur, Koş, Zıpla')}>
                    {MODES.map((m) => (
                      <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className="!min-h-[32px] flex-1 !px-1 text-[12px]">
                        {t(MODE_NAME[m])}
                      </button>
                    ))}
                  </div>
                  <button aria-pressed={spin} onClick={() => setSpin((v) => !v)} title={t('Sürükle ya da ←/→ ile döndür')} className={`shop-spin min-h-[32px] border-2 px-2 text-[12px] font-semibold ${spin ? 'border-gold bg-gold/20 text-gold' : 'border-line bg-ink/70 text-cream hover:border-accent-2'}`}>
                    ⟳ {t('Döndür')}
                  </button>
                </div>
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 sm:hidden short:!flex">
                  <button aria-pressed={spin} aria-label={t('Döndür')} onClick={() => setSpin((v) => !v)} className={`min-h-[28px] min-w-[28px] border-2 text-[13px] ${spin ? 'border-gold bg-gold/20 text-gold' : 'border-line bg-ink/70 text-cream'}`}>
                    ⟳
                  </button>
                  <button className="border-2 border-line bg-ink/70 px-1.5 py-0.5 text-[12px] font-semibold text-cream" onClick={nextMode} title={t('Önizleme: Döngü, Dur, Koş, Zıpla')}>
                    {t(MODE_NAME[mode])}
                  </button>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:mt-3 sm:flex-none short:!mt-0 short:!flex-1">
                <HeroPicker size="sm" className="max-sm:grid-cols-1 max-sm:!gap-1 short:!grid-cols-1 short:!gap-1" label={t('Karakter')} value={hero} onChange={(id) => (setNote(''), onHero(id))} scarfOf={scarfFor} kitOf={(id) => drafts[id]} />
                <ul className="grid gap-0.5 text-[13px] max-sm:hidden short:hidden [@media(max-height:800px)]:hidden">
                  {SLOTS.map((s) => {
                    const a = ACCESSORIES.find((x) => x.id === draft[s.id])
                    return (
                      <li key={s.id}>
                        <button onClick={() => setTab(s.id)} className={`flex w-full items-center justify-between gap-2 border-b border-line/60 px-1 py-0.5 text-left hover:bg-panel-2 ${tab === s.id ? 'bg-panel-2' : ''}`}>
                          <span className="text-muted">{nameOf(s)}</span>
                          <span className={`truncate font-semibold ${a && !isMine(a) ? 'text-gold' : 'text-cream'}`}>
                            {a && !isMine(a) ? '🔒 ' : ''}
                            {a ? nameOf(a) : t('Yok')}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-auto flex flex-col gap-1.5">
                  {action}
                  <div className="flex gap-1.5">
                    {changed && (
                      <button className="pixel-btn flex-1 justify-center py-1.5 text-[13px]" onClick={() => (setDrafts((d) => ({ ...d, [hero]: kit })), setNote(''))} title={t('Denediklerini bırakır, takılı kombine döner')}>
                        {t('Denemeyi Bırak')}
                      </button>
                    )}
                    <button className="pixel-btn flex-1 justify-center py-1.5 text-[13px]" onClick={copyOver} title={t('Takılı kombini öbür yolcuya giydirir')}>
                      {t('Öbürüne Kopyala')}
                    </button>
                  </div>
                  {note && (
                    <p className="text-[12px] leading-snug text-teal" role="status">
                      {note}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* cüzdan: nereden kazanıldığı açıkça */}
            <dl className="mt-3 grid shrink-0 grid-cols-4 gap-[2px] border-2 border-line bg-line/70 text-center max-sm:hidden short:hidden">
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
            <p className="mt-1.5 shrink-0 text-[12px] leading-snug text-muted max-sm:hidden short:hidden [@media(max-height:800px)]:hidden">{t('Parça yolda kazanılır: hatıra, gizli pul ve nazar boncuğu 1, yendiğin her boss 2, her Usta Mührü 3 parça.')}</p>
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
            <div className="overlay-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1 pt-1.5">
              {lookTab ? (
                lookTab.axes.map(axisPicker)
              ) : tab === 'scarf' ? (
                <>
                  <SectionTitle title={t('Atkı Rengi')} note={t('Nazar boncuğu buldukça açılır')} className="mb-2" />
                  <div className="grid grid-cols-3 gap-2 max-sm:gap-1.5 wide:grid-cols-4">
                    {SCARVES.map((sc) => {
                      const open = charms >= sc.need
                      const on = scarfId === sc.id
                      const col = scarfOf(sc)
                      return (
                        <button key={sc.id} disabled={!open} aria-pressed={on} onClick={() => onScarf(hero, sc.id)} className={`${cardCls(on, open, false)} ${open ? '' : 'opacity-60'}`}>
                          {tick(on)}
                          <Portrait id={hero} scarf={sc.id === 'al' ? null : col} accessory={draft} className="w-[64px] max-sm:w-[54px] short:w-[48px]" />
                          <span className="text-center text-[13px] font-semibold leading-tight text-cream">{nameOf(sc)}</span>
                          {on ? <span className="shop-pill bg-gold text-ink">{t('Takılı')}</span> : open ? <span className="shop-pill text-teal">{t('Açık')}</span> : <span className="shop-pill text-muted">🔒 {t('{n} nazar', { n: sc.need })}</span>}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <SectionTitle title={nameOf(SLOTS.find((x) => x.id === tab)!)} note={t('{a}/{b} Senin', { a: closet.filter((a) => a.slot === tab && isMine(a)).length, b: closet.filter((a) => a.slot === tab).length })} className="mb-2" />
                  <div className="grid grid-cols-3 gap-2 max-sm:gap-1.5 wide:grid-cols-4">
                    {[null, ...closet.filter((a) => a.slot === tab)].map((a) => {
                      const id: AccessoryId = a ? a.id : 'yok'
                      const mine = !a || isMine(a)
                      const reach = !!a && a.seals === undefined && wallet >= a.price
                      const on = draft[tab as Slot] === id
                      const wearing = kit[tab as Slot] === id
                      return (
                        <button key={id} aria-pressed={on} onClick={() => pick(tab as Slot, id)} className={cardCls(on, mine, reach)}>
                          {tick(wearing)}
                          <Portrait id={hero} scarf={scarf.id === 'al' ? null : scarf} accessory={{ ...draft, [tab]: id }} className={`w-[72px] max-sm:w-[58px] short:w-[50px] ${mine ? '' : 'opacity-80'}`} />
                          <span className="text-center text-[13px] font-semibold leading-tight text-cream">{a ? nameOf(a) : t('Yok')}</span>
                          {pill(wearing, mine, reach, a ? priceLabel(a) : '', a ? t('Senin') : t('Boş'))}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
