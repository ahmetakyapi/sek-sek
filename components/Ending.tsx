'use client'

import { useEffect, useState } from 'react'
import Portrait from '@/components/Portrait'
import { BossFigure } from '@/components/Figures'
import { ItemIcon } from '@/components/HudBits'
import TurkeyMap from '@/components/TurkeyMap'
import { Overlay, displayName } from '@/components/ui'
import type { AccessoryId } from '@/game/accessories'
import { BOSSES } from '@/game/boss'
import type { CharacterId } from '@/game/characters'
import { LEVELS } from '@/game/levels'
import { ENDING, fill } from '@/game/story'
import type { Scarf } from '@/lib/extras'
import { endingFor, localize, useLang, useT } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'

/**
 * Yolun sonu: dört sahne. Harita (gezilen otuz şehir sırayla yanar), Gezgin'in son sözü, jenerik (boss'lar ve yolda
 * tanışılan herkes) ve Ayna Yolu'nun açılışı. Son şehir ilk kez bitince açılır; sonra her bitişte Ayna Yolu'na kapı olarak kalır.
 */
export default function Ending({
  hero,
  heroShort,
  scarf,
  accessory,
  totalFound,
  totalMs,
  notebookLeft,
  onCities,
  onMirror,
  onScores,
}: {
  hero: CharacterId
  heroShort: string
  scarf: Scarf | null
  accessory?: AccessoryId
  totalFound: number
  totalMs: number
  notebookLeft: number
  onCities: () => void
  onMirror: () => void
  onScores: () => void
}) {
  const t = useT()
  const lng = useLang()
  const [page, setPage] = useState(0)
  const [lit, setLit] = useState(0)
  // harita sahnesi: şehirler yol sırasıyla tek tek yanar
  useEffect(() => {
    if (page !== 0) return
    setLit(0)
    const id = setInterval(() => setLit((n) => (n >= LEVELS.length ? n : n + 1)), 110)
    return () => clearInterval(id)
  }, [page])
  const ending = endingFor(lng) ?? ENDING
  const people = LEVELS.flatMap((l) => localize(l, lng).npcs.map((n) => ({ name: n.name, city: l.name })))
  const next = () => setPage((p) => Math.min(3, p + 1))
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col p-5 text-center sm:p-6 short:py-3">
        <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{[t('OTUZ ŞEHİR'), notebookLeft === 0 ? t('DEFTER EKSİKSİZ TAMAM') : t('YOLUN SONU'), t('JENERİK'), t('YENİ OYUN+')][page]}</p>
        <div className="mt-2 min-h-0 flex-1 overflow-hidden" key={page}>
          {page === 0 && (
            <div className="flex h-full flex-col items-center">
              <h2 className="font-display text-3xl text-cream short:text-2xl">{t('Bütün Yol, Bir Bakışta')}</h2>
              <div className="mt-2 w-full max-w-xl short:max-w-sm">
                <TurkeyMap unlocked={Math.max(0, lit - 1)} selected={Math.max(0, lit - 1)} />
              </div>
              <p className="mt-2 text-[13px] text-muted">
                {t('{n} şehir · {found} hatıra · toplam {time}', { n: Math.min(lit, LEVELS.length), found: totalFound, time: formatTime(totalMs) })}
              </p>
            </div>
          )}
          {page === 1 && (
            <div className="flex h-full flex-col items-center overflow-y-auto">
              <div className="portrait-frame w-[150px] max-sm:w-[110px] short:hidden">
                <Portrait id={hero} scarf={scarf} accessory={accessory} className="block w-full" />
              </div>
              <h2 className="mt-3 font-display text-4xl text-cream short:mt-0 short:text-3xl">{ending.title}</h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-cream/90">{fill(ending.text, heroShort)}</p>
              {notebookLeft > 0 && (
                <p className="mt-3 border-2 border-dashed border-gold/60 px-3 py-2 text-[13px] leading-snug text-gold">
                  {t('Yol bitti ama defter henüz dolmadı: {n} sayfa boş (hatıra, gizli pul, nazar boncuğu). Defteri Yol Defteri’nden izle, eksik şehirlere dön.', { n: notebookLeft })}
                </p>
              )}
            </div>
          )}
          {page === 2 && (
            <div className="credits-mask relative h-[min(52vh,420px)] overflow-hidden short:h-[46vh]">
              <div className="credits-roll mx-auto max-w-md">
                <p className="font-display text-3xl text-cream">Sek-Sek</p>
                <p className="mt-1 text-[13px] text-muted">{t('Türkiye’nin otuz şehrinde bir yol defteri')}</p>
                <p className="mt-8 text-[11px] font-bold tracking-[0.3em] text-gold">{t('YOLCULAR')}</p>
                <div className="mt-2 flex justify-center gap-3">
                  <Portrait id="uktun" className="w-[64px]" />
                  <Portrait id="memo" className="w-[64px]" />
                </div>
                <p className="mt-1 text-[14px] text-cream">Uktun · Memo</p>
                <p className="mt-8 text-[11px] font-bold tracking-[0.3em] text-gold">{t('MEYDAN BEKÇİLERİ')}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                  {LEVELS.map((l) => (
                    <p key={l.id} className="flex items-center gap-2 text-[13px] text-cream/90">
                      <BossFigure city={l.city} className="h-[26px] w-[30px] shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate">{lng === 'en' ? BOSSES[l.city].nameEn : BOSSES[l.city].name}</span>
                        <span className="block text-[11px] text-muted">{displayName(l)}</span>
                      </span>
                    </p>
                  ))}
                </div>
                <p className="mt-8 text-[11px] font-bold tracking-[0.3em] text-gold">{t('YOLDA TANIŞTIKLARIN')}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                  {people.map((p, i) => (
                    <p key={i} className="truncate text-cream/85">
                      {p.name} <span className="text-[11px] text-muted">· {p.city}</span>
                    </p>
                  ))}
                </div>
                <p className="mt-8 text-[11px] font-bold tracking-[0.3em] text-gold">{t('HATIRALAR')}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {LEVELS.map((l) => (
                    <ItemIcon key={l.id} city={l.city} taken size={22} />
                  ))}
                </div>
                <p className="mt-10 font-display text-2xl text-cream">{t('İyi yolculuklar.')}</p>
              </div>
            </div>
          )}
          {page === 3 && (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex items-end gap-1" aria-hidden>
                <Portrait id={hero} scarf={scarf} accessory={accessory} className="w-[84px]" />
                <Portrait id={hero} scarf={scarf} accessory={accessory} className="w-[84px] -scale-x-100 opacity-70" />
              </div>
              <h2 className="mt-3 font-display text-4xl text-cream short:text-3xl">{t('Ayna Yolu Açıldı')}</h2>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-cream/90">{t('Otuz şehir şimdi bir de aynada: haritalar sağdan sola döndü, rüzgâr ters esiyor, oklar öbür yandan geliyor. Hatıra yok, tabela yok; yalnız yol ve süre.')}</p>
              <p className="mt-2 text-[13px] text-muted">{t('Modlar → Ayna Yolu. Her şehrin ayna rekoru ayrı tutulur.')}</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 short:mt-2">
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i === page ? 'bg-gold' : 'bg-line'}`} />
            ))}
          </span>
          {page < 3 ? (
            <button className="pixel-btn primary px-5" onClick={next} autoFocus>
              {t('Devam →')}
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button className="pixel-btn primary" onClick={onMirror} autoFocus>
                {t('◐ Ayna Yolu')}
              </button>
              <button className="pixel-btn" onClick={onCities}>
                {t('Şehirler')}
              </button>
              <button className="pixel-btn" onClick={onScores}>
                {t('Skor Tablosu')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
