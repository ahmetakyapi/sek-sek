import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { medalFor } from '@/components/medal'
import { CHARACTERS } from '@/game/characters'
import { CHARACTERS_EN, LEVELS_EN } from '@/game/content.en'
import { LEVELS } from '@/game/levels'
import { UI_EN } from '@/lib/ui.en'
import { PORTRAITS } from '@/game/portraits'
import { parseShare } from '@/lib/share'
import { formatTime } from '@/lib/storage'

export const runtime = 'nodejs'

const file = (p: string) => readFile(join(process.cwd(), p))
const dataUrl = (b: Buffer, type = 'image/png') => `data:${type};base64,${b.toString('base64')}`

/** Piksel portreyi SVG'ye çevirir (aynı renkli yatay dizileri birleştirir). */
function portraitSvg(id: 'uktun' | 'memo') {
  const p = PORTRAITS[id]
  let rects = ''
  p.rows.forEach((r, y) => {
    let x = 0
    while (x < r.length) {
      const ch = r[x]
      let n = 1
      while (x + n < r.length && r[x + n] === ch) n++
      if (ch !== '.' && p.pal[ch]) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${p.pal[ch]}"/>`
      x += n
    }
  })
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" shape-rendering="crispEdges"><rect width="64" height="76" fill="#2a2438"/>${rects}</svg>`).toString('base64')}`
}

const SEAL = {
  altin: { label: 'ALTIN', bg: '#e3a92c', ring: '#9a6a12', ink: '#3a2408' },
  gumus: { label: 'GÜMÜŞ', bg: '#c9d0da', ring: '#7c8696', ink: '#232a36' },
  bronz: { label: 'BRONZ', bg: '#c97a44', ring: '#7a4220', ink: '#2a1408' },
} as const

const INK = '#3a2a1e'
const RED = '#8a3a24'

export async function GET(req: NextRequest) {
  const d = parseShare(Object.fromEntries(req.nextUrl.searchParams))
  const level = LEVELS.find((l) => l.id === d?.level) ?? LEVELS[0]
  const idx = LEVELS.indexOf(level)
  const [pixel, bold, semi, scene, paper, stamp, kh, kv] = await Promise.all([
    file('assets/fonts/PixelifySans-Bold.ttf'),
    file('assets/fonts/IBMPlexMono-Bold.ttf'),
    file('assets/fonts/IBMPlexMono-SemiBold.ttf'),
    file(`assets/cities/${level.id}.png`),
    file('assets/card/paper.png'),
    file('assets/card/stamp.png'),
    file('assets/card/kilim-h.png'),
    file('assets/card/kilim-v.png'),
  ])
  const ch = CHARACTERS[d?.character ?? 'uktun']
  const medal = d ? medalFor(level, d.timeMs) : null
  const seal = medal ? SEAL[medal] : null
  const plate = String(level.plate).padStart(2, '0')
  const en = d?.lang === 'en'
  const T = (s: string) => (en ? (UI_EN[s] ?? s) : s)
  const lv = en && LEVELS_EN[level.id] ? { ...level, ...LEVELS_EN[level.id] } : level
  const role = en ? CHARACTERS_EN[ch.id].role : ch.role
  const sceneUrl = dataUrl(scene)
  const who = d?.name || ch.short
  const host = req.nextUrl.host.replace(/^www\./, '')

  const stats: [string, string][] = d
    ? [
        [T('Süre'), formatTime(d.timeMs)],
        [T('Düşüş'), String(d.deaths)],
        [T('Hatıra'), `${d.items} / 3 ${en ? lv.item : lv.item.toLocaleLowerCase('tr')}`],
      ]
    : []

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', background: '#120f1a', fontFamily: 'Plex' }}>
        {/* ── illüstrasyon levhası: şehrin piksel sahnesi */}
        <div style={{ position: 'absolute', left: 20, top: 20, width: 720, height: 590, display: 'flex' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sceneUrl} width={720} height={590} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: 720, height: 590, display: 'flex', background: 'linear-gradient(180deg, rgba(18,15,26,0.55) 0%, rgba(18,15,26,0) 28%, rgba(18,15,26,0) 48%, rgba(18,15,26,0.92) 100%)' }} />
          <div style={{ position: 'absolute', left: 36, top: 30, display: 'flex', color: '#f5a571', fontSize: 20, letterSpacing: 5, fontWeight: 700 }}>
            {`${en ? 'THE HOMELAND NOTEBOOK · PAGE' : 'MEMLEKET DEFTERİ · SAYFA'} ${String(idx + 1).padStart(2, '0')} / ${String(LEVELS.length).padStart(2, '0')}`}
          </div>
          {/* posta damgası */}
          <div style={{ position: 'absolute', left: 520, top: 70, width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 75, border: '4px solid rgba(244,234,216,0.55)', transform: 'rotate(-14deg)' }}>
            <div style={{ width: 124, height: 124, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 62, border: '2px solid rgba(244,234,216,0.55)', color: 'rgba(244,234,216,0.8)' }}>
              <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 22 }}>SEK-SEK</div>
              <div style={{ display: 'flex', width: 96, height: 2, background: 'rgba(244,234,216,0.55)', margin: '6px 0' }} />
              <div style={{ display: 'flex', fontSize: 15, letterSpacing: 2 }}>{`${plate} · ${level.name.toLocaleUpperCase('tr')}`}</div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 36, bottom: 34, display: 'flex', flexDirection: 'column' }}>
            {level.nickname ? <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 34, color: '#f5a571', textShadow: '0 4px 0 #120f1a', marginBottom: 4 }}>{`(${level.nickname})`}</div> : null}
            <div style={{ display: 'flex', color: '#f4ead8', fontFamily: 'Pixel', fontSize: 104, lineHeight: 1, textShadow: '0 6px 0 #120f1a', whiteSpace: 'nowrap' }}>{level.name}</div>
            <div style={{ display: 'flex', marginTop: 10, color: '#d8cfe6', fontSize: 24, fontWeight: 600 }}>{`${lv.subtitle} · ${T(level.difficulty)}`}</div>
          </div>
        </div>

        {/* ── defter sayfası */}
        <div style={{ position: 'absolute', left: 740, top: 20, width: 440, height: 590, display: 'flex' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl(paper)} width={440} height={590} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: 10, height: 590, display: 'flex', background: 'linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0))' }} />

          {/* yolcu */}
          <div style={{ position: 'absolute', left: 60, top: 34, display: 'flex', flexDirection: 'column', color: INK }}>
            <div style={{ display: 'flex', fontSize: 15, letterSpacing: 4, color: RED, fontWeight: 700 }}>{en ? 'TRAVELLER' : 'YOLCU'}</div>
            <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 40, lineHeight: 1.05, marginTop: 4 }}>{who}</div>
            <div style={{ display: 'flex', fontSize: 17, fontWeight: 600, marginTop: 2 }}>{who === ch.short ? role : en ? `with ${ch.name}` : `${ch.name} ile`}</div>
          </div>

          {/* pul */}
          <div style={{ position: 'absolute', left: 246, top: 26, width: 168, height: 188, display: 'flex', transform: 'rotate(5deg)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl(stamp)} width={168} height={188} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
            <div style={{ position: 'absolute', left: 20, top: 20, width: 128, height: 92, display: 'flex', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sceneUrl} width={420} height={344} alt="" style={{ position: 'absolute', left: -150, top: -150 }} />
            </div>
            <div style={{ position: 'absolute', left: 20, top: 116, width: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1a1420' }}>
              <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 40, lineHeight: 1 }}>{plate}</div>
              <div style={{ display: 'flex', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>{level.name.toLocaleUpperCase('tr')}</div>
            </div>
          </div>

          {/* sonuçlar: defter satırlarına yazılmış */}
          <div style={{ position: 'absolute', left: 60, top: 226, width: 340, display: 'flex', flexDirection: 'column' }}>
            {stats.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'flex-end', height: 34, color: INK }}>
                <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, color: RED, width: en ? 120 : 88, flexShrink: 0 }}>{k}</div>
                <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, whiteSpace: 'nowrap' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* mühür madalya */}
          {seal ? (
            <div style={{ position: 'absolute', left: 290, top: 372, width: 124, height: 124, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 62, background: seal.bg, border: `6px solid ${seal.ring}`, boxShadow: '0 6px 0 rgba(0,0,0,0.25)', transform: 'rotate(-10deg)' }}>
              <div style={{ width: 92, height: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 46, border: `2px dashed ${seal.ring}`, color: seal.ink }}>
                <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 25 }}>{T(seal.label)}</div>
                <div style={{ display: 'flex', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>{en ? 'MEDAL' : 'MADALYA'}</div>
              </div>
            </div>
          ) : null}

          <div style={{ position: 'absolute', left: 230, bottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 190, color: INK }}>
            <div style={{ display: 'flex', fontFamily: 'Pixel', fontSize: 24, color: RED, whiteSpace: 'nowrap' }}>{en ? 'Your turn →' : 'Sıra sende →'}</div>
            <div style={{ display: 'flex', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{host}</div>
          </div>
        </div>

        {/* ── bantlı portre: levha ile sayfanın arasında */}
        <div style={{ position: 'absolute', left: 682, top: 392, width: 176, height: 212, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8f4ec', padding: 12, boxShadow: '0 10px 18px rgba(0,0,0,0.45)', transform: 'rotate(-6deg)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portraitSvg(ch.id)} width={152} height={156} alt="" style={{ objectFit: 'cover', objectPosition: 'top' }} />
          <div style={{ display: 'flex', marginTop: 8, fontFamily: 'Pixel', fontSize: 20, color: INK, whiteSpace: 'nowrap' }}>{ch.name}</div>
          <div style={{ position: 'absolute', left: 50, top: -14, width: 76, height: 26, display: 'flex', background: 'rgba(242,193,78,0.6)', transform: 'rotate(4deg)' }} />
        </div>

        {/* ── kilim çerçeve */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(kh)} width={1200} height={20} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(kh)} width={1200} height={20} alt="" style={{ position: 'absolute', left: 0, top: 610 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(kv)} width={20} height={630} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(kv)} width={20} height={630} alt="" style={{ position: 'absolute', left: 1180, top: 0 }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Pixel', data: pixel, weight: 700, style: 'normal' },
        { name: 'Plex', data: bold, weight: 700, style: 'normal' },
        { name: 'Plex', data: semi, weight: 600, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  )
}
