'use client'

import { useEffect, useState } from 'react'
import Portrait from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { sprite } from '@/game/art'
import { CHARACTERS } from '@/game/characters'
import { FEATURES } from '@/game/features'
import { LEVELS } from '@/game/levels'
import { STORY } from '@/game/story'
import { characterFor, localize, storyFor, useLang, useT } from '@/lib/i18n'

const DIFF_COLOR: Record<string, string> = { Kolay: '#7fc97a', Orta: '#f2c14e', Zor: '#f08a4a', 'Çok Zor': '#e5484d' }
const plate = (n: number) => String(n).padStart(2, '0')

/** Mekanik sözlüğünün küçük piksel simgeleri (10x10) */
const ICONS: Record<string, { rows: string[]; pal: Record<string, string> }> = {
  flag: { pal: { p: '#d8d8d8', r: '#e30a17', w: '#ffffff' }, rows: ['.p........', '.prrrrr...', '.prrwrrr..', '.prrrrr...', '.p........', '.p........', '.p........', '.p........', '.p........', 'ppp.......'] },
  crystal: { pal: { r: '#e5484d', k: '#2a2038', w: '#ffffff' }, rows: ['...rrrr...', '.rrkkkkrr.', '.rkkkkkkr.', 'rkwkkwkkkr', 'rkkwkkwkkr', 'rkkwkkwkkr', 'rkwkkwkkkr', '.rkkkkkkr.', '.rrkkkkrr.', '...rrrr...'] },
  key: { pal: { g: '#f2c14e', G: '#a8781c' }, rows: ['..........', '.ggg......', 'g...g.....', 'g...gggggg', 'g...g..G.G', '.ggg...G.G', '..........', '..........', '..........', '..........'] },
  plate: { pal: { o: '#e8794a', b: '#3fa8c8', k: '#5a3c26' }, rows: ['oooo..bbbb', 'o..o..b..b', 'o..o..b..b', 'oooo..bbbb', '..........', '..........', '...kkkk...', '..kkkkkk..', '..........', '..........'] },
  fake: { pal: { s: '#9aa3b5', d: '#3c4052', c: '#1a1420' }, rows: ['ssssdsssss', 'ssssdsssss', 'dddddddddd', 'ssdcccccds', 'sdcccccccs', 'dccccccccd', 'scccccccsc', 'scccccccss', 'dccccccccd', 'scccccccds'] },
  stamp: { pal: { w: '#f4ead8', r: '#c8302a', b: '#2a6ab8' }, rows: ['w.w.w.w.w.', '.wwwwwwww.', 'ww......ww', '.w.bbbb.w.', 'ww.brrb.ww', '.w.bbbb.w.', 'ww......ww', '.wwwwwwww.', 'w.w.w.w.w.', '..........'] },
  crumble: { pal: { s: '#c9a08a', d: '#6a3a30' }, rows: ['ssssdsssss', 'sss.dsss.s', 'ss..d.ss..', 'dddd.ddddd', 's.ss.s.sss', 's..s...ss.', '..........', '.s....s...', '...s.....s', '..........'] },
  orbit: { pal: { g: '#f2c14e', w: '#f4ead8', t: '#2f9a94', T: '#7ad8cc' }, rows: ['....g.....', '....w.....', '.....w....', '......w...', '.......w..', '.....TTTTT', '.....ttttt', '..........', '..........', '..........'] },
  balloon: { pal: { r: '#e8604a', y: '#f2c14e', b: '#3fa8c8', k: '#8a5a35', l: '#5a3c26' }, rows: ['..rryybb..', '.rrryybbb.', 'rrrryybbbb', 'rrrryybbbb', '.rrryybbb.', '..rryybb..', '..l....l..', '...l..l...', '...kkkk...', '...kkkk...'] },
  hammer: { pal: { w: '#5a3c26', c: '#b8682e', C: '#e8904a', d: '#7a3a14' }, rows: ['....ww....', '....ww....', '....ww....', '....ww....', '.CCCCCCCC.', '.cccccccc.', '.cccccccc.', '.dddddddd.', '..........', '..........'] },
  horon: { pal: { k: '#1d1a22', s: '#e0a880', g: '#c8d0dc', r: '#a8302a' }, rows: ['ssssssssss', 's...s...s.', '.kk..kk..k', '.sk..sk..s', '.kg..kg..k', '.kk..kk..k', '.kk..rr..k', '.k.k.r.r.k', '.k.k.r.r.k', 'kk.kkr.rkk'] },
  wind: { pal: { w: '#e6edf7' }, rows: ['..........', 'wwwwww....', '......w...', '.wwwwww...', '..........', 'wwwwwwww..', '........w.', '..wwwwww..', '..........', '..........'] },
  heart: { pal: { p: '#ff6a8a', P: '#ffb0c0' }, rows: ['..........', '.pp...pp..', 'pPpp.pppp.', 'pppppppp..', 'pppppppp..', '.pppppp...', '..pppp....', '...pp.....', '..........', '..........'] },
}

function PixelIcon({ id }: { id: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const ic = ICONS[id]
    const cv = document.createElement('canvas')
    cv.width = 10
    cv.height = 10
    sprite(cv.getContext('2d')!, ic.rows, ic.pal, 0, 0)
    setSrc(cv.toDataURL())
  }, [id])
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center bg-ink [box-shadow:inset_0_0_0_2px_#3d3550]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" width={30} height={30} className="h-[30px] w-[30px]" style={{ imageRendering: 'pixelated' }} />}
    </span>
  )
}

const MECHANICS: [string, string, string][] = [
  ['flag', 'Bayrak', 'Dokununca kontrol noktası olur; düşersen buradan başlarsın.'],
  ['crystal', 'Dash Halkası', 'Toplanmaz, içinden geçilir: havada dash’ini yeniler. Dash at, halkadan geç, bir daha dash at.'],
  ['key', 'Anahtar ve Kapı', 'Kapı anahtarsız açılmaz. Anahtar çoğu zaman en zor köşededir.'],
  ['plate', 'Basınç Plakası', 'Bastıkça turuncu ve mavi bloklar yer değiştirir. Sıra önemlidir.'],
  ['crumble', 'Çatlak Taş', 'Üstüne basınca dağılır, biraz sonra yerine gelir. Durma, sek.'],
  ['fake', 'Tünel Ağzı', 'Kayadaki karanlık aralıklardan içeri girilir. Gizli pullar ve nazar boncukları oralarda saklı.'],
  ['stamp', 'Gizli Pul', 'Her şehirde bir tane: bulunca defterine gizli bir sayfa açılır.'],
  ['orbit', 'Sema Halkası', 'Konya’da bir merkezin etrafında döner. Ritmini yakala, tepede atla.'],
  ['balloon', 'Balon', 'Kapadokya’da sepete binince yükselir, inince yavaşça çöker.'],
  ['hammer', 'Bakır Tokmak', 'Gaziantep’te titreyip iner. Bekle, kalkarken altından geç.'],
  ['horon', 'Horon ve Koçari', 'Trabzon’da oyuncular kol kola zıplar; ellerine bin, en tepede atla. Koçari daha ağır vurur.'],
  ['wind', 'Rüzgâr', 'Doğuda rüzgâr seni geri iter. Uzun boşluklarda tepede dash at.'],
  ['heart', 'Dost ve Düşman', 'Şehrin hayvanları dosttur: yanına git, sev. Kırmızı hatla parlayan canlılar tehlikelidir.'],
]

/** Oyun içi "Oyun Hakkında": bir artbook gibi sayfa sayfa okunur. */
export default function About({ onClose, onPlay, heroName }: { onClose: () => void; onPlay: () => void; heroName: string }) {
  const t = useT()
  const lang = useLang()
  const story = storyFor(lang) ?? STORY
  return (
    <div className="rise pixel-panel w-full max-w-3xl overflow-hidden p-0">
      {/* kapak */}
      <header className="relative h-[220px] overflow-hidden sm:h-[260px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sehirler/nevsehir.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_70%]" style={{ imageRendering: 'pixelated' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1a29]/0 via-[#1e1a29]/55 to-[#1e1a29]" />
        <div className="kilim absolute inset-x-0 top-0" />
        <button className="pixel-btn absolute right-4 top-6 z-10 py-1.5 text-sm" onClick={onClose}>
          {t('← Geri')}
        </button>
        <div className="absolute bottom-4 left-4 right-4 bg-[#1e1a29]/80 px-4 py-3 sm:left-6 sm:right-auto sm:max-w-[560px] [box-shadow:0_0_0_2px_#3d3550]">
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent-2">{t('SEK-SEK · ARTBOOK')}</p>
          <h2 className="mt-1 font-display text-[clamp(36px,8vw,60px)] leading-[0.95] text-cream [text-shadow:0_4px_0_#120f1a]">{t('Şehir Şehir Anadolu')}</h2>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-cream/85">{t('Gezgin’in yarım kalmış defteri, iki yolcu ve {n} şehir. Her sayfa bir şehrin sesi, tadı ve insanı.', { n: LEVELS.length })}</p>
        </div>
      </header>

      <div className="grid gap-10 px-5 pb-8 pt-6 sm:px-8">
        {/* hikâye */}
        <section className="grid gap-6 md:grid-cols-[1fr_1.15fr] md:items-center">
          <div className="notebook rotate-[-1.2deg] p-5">
            <p className="font-display text-2xl">{t('Memleket')}</p>
            <p className="mt-0.5 text-[12px] opacity-70">{t('Gezgin’in Yol Defteri')}</p>
            <ul className="mt-3 grid grid-cols-2 gap-1 text-[12px]">
              {LEVELS.map((l) => (
                <li key={l.id} className="flex items-center gap-1.5 border border-[#5a3c26]/30 px-1.5 py-0.5">
                  <span className="font-bold">{plate(l.plate)}</span>
                  <span className="truncate">{l.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] italic">{t('“Yolun sonu, başladığım yer.”')}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('HİKÂYE')}</p>
            {story.map((p) => (
              <div key={p.title} className="mt-3">
                <h3 className="font-display text-2xl text-cream">{p.title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{p.text.replaceAll('{name}', heroName)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* yolcular */}
        <section>
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YOLCULAR')}</p>
          <h3 className="mt-1 font-display text-3xl text-cream">{t('İki Yolcu, Tek Defter')}</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {(['uktun', 'memo'] as const).map((id, k) => {
              const c = CHARACTERS[id]
              const en = characterFor(lang, id)
              return (
                <article key={id} className="flex gap-4">
                  <figure className={`polaroid w-[112px] shrink-0 self-start sm:w-[132px] ${k ? 'rotate-[3deg]' : 'rotate-[-3deg]'}`}>
                    <span className="tape" />
                    <Portrait id={id} className="w-full" />
                    <figcaption>{c.short}</figcaption>
                  </figure>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-accent">{(en?.role ?? c.role).toLocaleUpperCase(lang)}</p>
                    <h4 className="font-display text-2xl text-cream">{c.name}</h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{en?.bio ?? c.bio}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* rota */}
        <section>
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('ROTA')}</p>
          <h3 className="mt-1 font-display text-3xl text-cream">{t('{n} Şehir, Artan Zorluk', { n: LEVELS.length })}</h3>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
            {t('Her şehir yeni bir şey öğretir, bir sonraki onu sınar. Her şehirde üç hatıra, bir gizli pul, süre madalyaları ve konuşmayı seven insanlar var.')}
          </p>
          <div className="mt-4 bg-ink/40 p-2 [box-shadow:inset_0_0_0_2px_#3d3550]">
            <TurkeyMap unlocked={LEVELS.length - 1} selected={-1} />
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {LEVELS.map((l0) => {
              const l = localize(l0, lang)
              return (
                <li key={l.id} className="flex gap-3 border-2 border-line bg-ink/50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/sehirler/${l.id}.webp`} alt="" loading="lazy" className="aspect-[40/21] w-[112px] shrink-0 object-cover" style={{ imageRendering: 'pixelated' }} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="bg-cream px-1 text-ink">{plate(l.plate)}</span>
                      <span style={{ color: DIFF_COLOR[l.difficulty] }}>{t(l.difficulty).toLocaleUpperCase(lang)}</span>
                    </p>
                    <p className="mt-0.5 truncate font-display text-lg leading-tight text-cream">{l.name}</p>
                    <p className="text-[12px] text-muted">{l.subtitle}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-cream/70">{FEATURES[l.id]?.[lang]}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* mekanikler */}
        <section>
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('YOLDA NELER VAR')}</p>
          <h3 className="mt-1 font-display text-3xl text-cream">{t('Küçük Bir Sözlük')}</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {MECHANICS.map(([icon, title, text]) => (
              <li key={icon} className="flex items-start gap-3">
                <PixelIcon id={icon} />
                <span>
                  <span className="block font-display text-[17px] leading-tight text-cream">{t(title)}</span>
                  <span className="block text-[13px] leading-snug text-muted">{t(text)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* künye */}
        <section className="border-t-2 border-line pt-5">
          <p className="text-[11px] font-bold tracking-[0.3em] text-accent">{t('KÜNYE')}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {t('Tasarım ve geliştirme: Ahmet Akyapı. Her şehrin müziği kendi makamında, oyun oynanırken üretilir. Bilgi kartları şehirlerin tarihinden ve mutfağından derlendi.')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="pixel-btn primary" onClick={onPlay}>
              {t('▶ Yolculuğa Dön')}
            </button>
            <button className="pixel-btn" onClick={onClose}>
              {t('← Geri')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
