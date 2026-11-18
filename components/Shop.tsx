'use client'

import { useEffect, useRef, useState } from 'react'
import Portrait from '@/components/Portrait'
import { Overlay, SectionTitle, ic } from '@/components/ui'
import { ACCESSORIES, SLOTS, kitKey, type Accessory, type AccessoryId, type Kit, type Slot } from '@/game/accessories'
import type { CharacterId } from '@/game/characters'
import { LOOKS, POSES, drawHero, gait } from '@/game/heroDraw'
import { SCARVES, type Scarf } from '@/lib/extras'
import { useLang, useT } from '@/lib/i18n'

type Tab = Slot | 'scarf'

/** cüzdanın dökümü: parçanın nereden geldiği (game/accessories.ts `earned`) */
export interface WalletParts {
  found: number
  bosses: number
  seals: number
}

/**
 * Tam boy canlı önizleme: karakter seçilen kombinle durur ya da koşar (pelerin, heybe ve saç savrulur).
 * Saate bağlı, ~30 kare; hareket azaltma seçiliyse tek kare.
 */
function HeroPreview({ hero, kit, scarf, run }: { hero: CharacterId; kit: Kit; scarf: Scarf | null; run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const key = kitKey(kit)
  const kitRef = useRef(kit)
  kitRef.current = kit
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c = cv.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
      const size = h * 0.74
      const ground = h * 0.9
      // zemin gölgesi
      c.fillStyle = 'rgba(14,13,34,0.45)'
      c.beginPath()
      c.ellipse(w / 2, ground, size * 0.26, size * 0.045, 0, 0, Math.PI * 2)
      c.fill()
      const pose = run && !still ? gait((t * 1.6) % 1) : POSES.idle
      drawHero(c, hero, pose, w / 2, ground, size, false, t, { moving: run && !still, flow: run ? 1 : 0.2, scarf: scarf?.color, scarfS: scarf?.shade, acc: kitRef.current })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [hero, key, scarf?.color, scarf?.shade, run])
  return <canvas ref={ref} className="block h-full w-full" aria-hidden />
}

/**
 * Kılık Dükkânı: karakterin bütün kılığı tek yerde. Baş, yüz ve sırtta birer parça (kombin) ve atkı rengi.
 * Bir parçaya dokunmak onu deneme kombinine koyar (önizleme hemen giyer); sahip olunan parçalar "Giy" ile takılır,
 * olmayan "Al" ile alınıp takılır. Para birimi parçadır: hatıra, pul, nazar 1 · boss 2 · Usta Mührü 3.
 */
export default function Shop({
  hero,
  onHero,
  scarf,
  scarfId,
  charms,
  onScarf,
  owned,
  seals,
  kit,
  wallet,
  parts,
  onBuy,
  onWear,
  onBack,
}: {
  hero: CharacterId
  /** önizlemede ve oyunda karakteri değiştirir */
  onHero: (id: CharacterId) => void
  scarf: Scarf | null
  scarfId: string
  /** bulunan nazar boncuğu: atkı renkleri bununla açılır */
  charms: number
  onScarf: (id: string) => void
  owned: Record<string, boolean>
  seals: number
  kit: Kit
  wallet: number
  parts: WalletParts
  onBuy: (id: AccessoryId) => void
  onWear: (k: Kit) => void
  onBack: () => void
}) {
  const t = useT()
  const lng = useLang()
  const [tab, setTab] = useState<Tab>('head')
  const [draft, setDraft] = useState<Kit>(kit)
  const [focus, setFocus] = useState<AccessoryId>(kit.head)
  const [run, setRun] = useState(true)
  // takılı kombin dışarıda değişince (alınca takılır) deneme de onu izler
  const worn = kitKey(kit)
  useEffect(() => setDraft(kit), [worn]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMine = (a: Accessory) => !!owned[a.id] || (a.seals !== undefined && seals >= a.seals)
  const nameOf = (a: { name: string; nameEn: string }) => (lng === 'en' ? a.nameEn : a.name)
  const priceLabel = (a: Accessory) => (a.seals !== undefined ? t('{n} Usta Mührü', { n: a.seals }) : t('{n} Parça', { n: a.price }))
  const item = ACCESSORIES.find((a) => a.id === focus)
  const draftItems = SLOTS.map((s) => ACCESSORIES.find((a) => a.id === draft[s.id])).filter(Boolean) as Accessory[]
  const missing = draftItems.filter((a) => !isMine(a))
  const changed = kitKey(draft) !== worn
  const pick = (slot: Slot, id: AccessoryId) => {
    setDraft((d) => ({ ...d, [slot]: id }))
    setFocus(id)
  }
  const mineCount = ACCESSORIES.filter(isMine).length
  const scarfOf = (sc: Scarf) => (sc.id === 'al' ? { color: LOOKS[hero].scarf, shade: LOOKS[hero].scarfS } : sc)

  // eylem: odaktaki parça alınmamışsa "Al"; deneme kombini farklı ve hepsi seninse "Giy"
  const action =
    item && !isMine(item) ? (
      item.seals !== undefined ? (
        <p className="text-[13px] leading-snug text-cream/85">{t('Şehir ustalarının görevlerini yap: {n} mühür daha.', { n: item.seals - seals })}</p>
      ) : (
        <button className="pixel-btn primary w-full justify-center" disabled={wallet < item.price} onClick={() => onBuy(item.id)}>
          {wallet < item.price ? t('{n} Parça Daha Bul', { n: item.price - wallet }) : t('Al ve Giy · {n} Parça', { n: item.price })}
        </button>
      )
    ) : changed ? (
      <button className="pixel-btn primary w-full justify-center" disabled={missing.length > 0} onClick={() => onWear(draft)}>
        {missing.length ? t('Önce {name} Al', { name: nameOf(missing[0]) }) : t('Kombini Giy')}
      </button>
    ) : (
      <p className="py-2 text-center text-[13px] text-teal">{t('Bu kombin üstünde.')}</p>
    )

  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-4xl flex-col p-4 sm:p-6 short:max-w-[min(1000px,100%)] short:py-3 wide:max-w-[min(1120px,100%)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-cream short:text-2xl">
              {t('Kılık Dükkânı')}
              <span className="border-2 border-gold/80 bg-gold/10 px-2 py-0.5 font-mono text-[14px] font-bold leading-snug tabular-nums text-gold" title={t('Cüzdan')}>
                {t('{n} Parça', { n: wallet })}
              </span>
            </h2>
            <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Baş, yüz ve sırtta birer parça: kombinini kur, atkını seç.')}</p>
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
                <HeroPreview hero={hero} kit={draft} scarf={scarf} run={run} />
                <button className="absolute right-1.5 top-1.5 border-2 border-line bg-ink/70 px-1.5 py-0.5 text-[12px] font-semibold text-cream" onClick={() => setRun((r) => !r)} aria-pressed={run}>
                  {run ? t('Dur') : t('Koş')}
                </button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:mt-3 short:!mt-0">
                <div className="seg w-full" role="group" aria-label={t('Karakter')}>
                  {(['uktun', 'memo'] as const).map((id) => (
                    <button key={id} className="flex-1" aria-pressed={hero === id} onClick={() => onHero(id)}>
                      {id === 'uktun' ? 'Uktun' : 'Memo'}
                    </button>
                  ))}
                </div>
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
                <div className="mt-auto">{action}</div>
              </div>
            </div>
            {/* cüzdan: nereden kazanıldığı açıkça */}
            <dl className="mt-3 grid grid-cols-4 gap-[2px] border-2 border-line bg-line/70 text-center max-sm:hidden short:hidden">
              {(
                [
                  [parts.found, t('Hatıra · Pul · Nazar'), '×1'],
                  [parts.bosses, t('Boss'), '×2'],
                  [parts.seals, t('Usta Mührü'), '×3'],
                  [`${mineCount}/${ACCESSORIES.length}`, t('Kılık'), ''],
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

          {/* sağ: yuva sekmeleri ve parçalar */}
          <div className="flex min-h-0 flex-col">
            <div className="seg seg-tabs" role="tablist">
              {[...SLOTS, { id: 'scarf' as const, name: 'Atkı', nameEn: 'Scarf' }].map((s) => (
                <button key={s.id} role="tab" aria-selected={tab === s.id} onClick={() => setTab(s.id)}>
                  {nameOf(s)}
                </button>
              ))}
            </div>
            <div className="overlay-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              {tab === 'scarf' ? (
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
                          onClick={() => onScarf(sc.id)}
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
                  {[null, ...ACCESSORIES.filter((a) => a.slot === tab)].map((a) => {
                    const id: AccessoryId = a ? a.id : 'yok'
                    const mine = !a || isMine(a)
                    const reach = !!a && a.seals === undefined && wallet >= a.price
                    const sel = draft[tab] === id
                    const wearing = kit[tab] === id
                    return (
                      <button
                        key={id}
                        aria-pressed={sel}
                        onClick={() => pick(tab, id)}
                        className={`flex flex-col items-center border-2 p-2 transition-colors max-sm:p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${sel ? 'border-gold bg-gold/10' : mine || reach ? 'border-line bg-panel-2 hover:border-accent-2' : 'border-dashed border-line bg-ink/30 hover:border-muted'}`}
                      >
                        <Portrait id={hero} scarf={scarf} accessory={{ ...draft, [tab]: id }} className={`w-[72px] max-sm:w-[58px] short:w-[50px] ${mine ? '' : 'opacity-80'}`} />
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
