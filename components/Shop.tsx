'use client'

import { useState } from 'react'
import Portrait from '@/components/Portrait'
import { Overlay, ic } from '@/components/ui'
import { ACCESSORIES, type AccessoryId } from '@/game/accessories'
import type { CharacterId } from '@/game/characters'
import type { Scarf } from '@/lib/extras'
import { useLang, useT } from '@/lib/i18n'

/**
 * Kılık Dükkânı: yolda bulunan her parça (hatıra, gizli pul, nazar boncuğu) bir akçe sayılır; aksesuarlar bununla
 * alınır, bir kez alınan her zaman takılabilir. Önizleme seçilen aksesuarla portrede görünür.
 */
export default function Shop({ hero, scarf, owned, seals, wearing, wallet, onBuy, onWear, onBack }: { hero: CharacterId; scarf: Scarf | null; owned: Record<string, boolean>; seals: number; wearing: AccessoryId; wallet: number; onBuy: (id: AccessoryId) => void; onWear: (id: AccessoryId) => void; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [pick, setPick] = useState<AccessoryId>(wearing)
  const item = ACCESSORIES.find((a) => a.id === pick)!
  // mühürle açılanlar parayla alınmaz: yeterli Usta Mührü varsa senindir
  const isMine = (a: (typeof ACCESSORIES)[number]) => a.id === 'yok' || !!owned[a.id] || (a.seals !== undefined && seals >= a.seals)
  const has = isMine(item)
  const priceLabel = (a: (typeof ACCESSORIES)[number]) => (a.seals !== undefined ? t('{n} Usta Mührü', { n: a.seals }) : t('{n} parça', { n: a.price }))
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-3xl flex-col p-4 sm:p-6 short:py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] text-accent">{t('CÜZDAN: {n} PARÇA', { n: wallet })}</p>
            <h2 className="mt-1 font-display text-3xl text-cream short:text-2xl">{t('Kılık Dükkânı')}</h2>
          </div>
          <button className="pixel-btn shrink-0 whitespace-nowrap" onClick={onBack}>
            {ic(t('← Geri'))}
          </button>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted short:hidden">{t('Yolda bulduğun her hatıra, gizli pul ve nazar boncuğu bir parça sayılır. Aldığın aksesuar senindir; istediğin zaman tak, çıkar.')}</p>
        <div className="mt-3 grid min-h-0 flex-1 gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] short:mt-2 short:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] short:gap-3">
          {/* sol: çerçeveli kart sağdaki ızgara kadar uzar (iki sütun dengeli); altta cüzdan özeti */}
          <div className="flex min-h-0 flex-col items-center border-2 border-line bg-ink/30 p-3 max-sm:flex-row max-sm:gap-3 max-sm:border-0 max-sm:bg-transparent max-sm:p-0 short:flex-row short:items-start short:gap-2 short:border-0 short:bg-transparent short:p-0">
            <div className="portrait-frame w-full max-w-[220px] shrink-0 max-sm:w-[110px] short:w-[84px]">
              <Portrait id={hero} scarf={scarf} accessory={pick} className="block w-full" />
            </div>
            <div className="mt-3 w-full text-center max-sm:mt-0 max-sm:text-left short:mt-0 short:text-left">
              <p className="font-display text-xl text-cream short:text-base">{lng === 'en' ? item.nameEn : item.name}</p>
              <p className="text-[13px] text-muted">{pick === 'yok' ? t('Sade yolcu') : has ? (wearing === pick ? t('Takılı') : t('Senin')) : priceLabel(item)}</p>
              <div className="mt-2">
                {has ? (
                  <button className="pixel-btn primary w-full justify-center" disabled={wearing === pick} onClick={() => onWear(pick)}>
                    {wearing === pick ? t('Takılı') : t('Tak')}
                  </button>
                ) : item.seals !== undefined ? (
                  <p className="text-[13px] leading-snug text-cream/85">{t('Şehir ustalarının görevlerini yap: {n} mühür daha.', { n: item.seals - seals })}</p>
                ) : (
                  <button className="pixel-btn primary w-full justify-center" disabled={wallet < item.price} onClick={() => onBuy(pick)}>
                    {wallet < item.price ? t('{n} parça daha bul', { n: item.price - wallet }) : t('Al · {n} Parça', { n: item.price })}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-auto grid w-full grid-cols-3 gap-1.5 pt-3 text-center max-sm:hidden short:hidden">
              {(
                [
                  [wallet, t('Parça')],
                  [seals, t('Mühür')],
                  [`${ACCESSORIES.filter(isMine).length}/${ACCESSORIES.length}`, t('Kılık')],
                ] as const
              ).map(([v, k]) => (
                <div key={k} className="border-2 border-line bg-ink/40 py-1.5">
                  <p className="font-display text-lg leading-none tabular-nums text-cream">{v}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{k}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overlay-scroll grid min-h-0 grid-cols-2 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-3 short:grid-cols-3">
            {ACCESSORIES.map((a) => {
              const mine = isMine(a)
              return (
                <button key={a.id} aria-pressed={pick === a.id} onClick={() => setPick(a.id)} className={`flex flex-col items-center border-2 bg-panel-2 p-2 ${pick === a.id ? 'border-gold' : 'border-line hover:border-accent-2'}`}>
                  <Portrait id={hero} scarf={scarf} accessory={a.id} className={`w-[72px] short:w-[52px] ${mine ? '' : 'opacity-80'}`} />
                  <span className="mt-1 truncate text-[13px] font-semibold text-cream">{lng === 'en' ? a.nameEn : a.name}</span>
                  <span className={`text-[12px] ${wearing === a.id ? 'text-gold' : 'text-muted'}`}>{wearing === a.id ? t('Takılı') : mine ? t('Senin') : priceLabel(a)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
