/**
 * Şehir kayıt denetimi: bir şehrin (ya da bütün şehirlerin) oyunun her köşesine eksiksiz kaydedildiğini saniyeler içinde
 * söyler. Tip denetimi `Record<CityKey, …>` tablolarını (art, boss, bossDraw, enemyDraw, music, flagMoments, terrainDraw,
 * finales, NEXT_CITY) zaten yakalar; bu betik tipin göremediklerine bakar: CI matrisi, madalya süreleri, şehir görselleri,
 * hikâye diyalogları, İngilizce metin, harita koordinatı, düzenleyici kodu, eski şehir sırası, plaka testi, README, haritanın
 * toplanabilirleri, metin sayıları ve iskeletten kalan TASLAK işaretleri (scripts/new-city.ts). Yeni şehirde (`/yeni-sehir`) her adımdan sonra koş; FAIL kalan şehir bitmemiştir.
 *
 *   npx tsx scripts/city-check.ts balikesir elazig     (argümansız: bütün şehirler)
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEVELS } from '../game/levels'
import { LEVELS_EN } from '../game/content.en'
import { PRELUDES } from '../game/finales'
import { talkOf } from '../game/stories'
import { BOSS_TIME, SOLVER_TIME } from '../game/medals'
import { BOSSES } from '../game/boss'
import { BOSS_LINES } from '../game/bossLines'
import { FEATURES } from '../game/features'
import { FLAG_MOMENTS } from '../game/flagMoments'
import { CITY_CODES } from '../lib/customLevel'
import { MAP_VERSION } from '../lib/storage'

const root = join(import.meta.dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const ci = read('.github/workflows/ci.yml')
const map = read('components/TurkeyMap.tsx')
const storage = read('lib/storage.ts')
const simTest = read('tests/sim.test.ts')
const readme = read('README.md')
const allNames = LEVELS.flatMap((l) => l.npcs.map((n) => n.name))
const medals = read('game/medals.ts')
const bossAt = medals.indexOf('export const BOSS_TIME')
/** scripts/new-city.ts'in iskelet işareti: kalan her yer doldurulmamış demektir */
const DRAFT = 'TASLAK'
const DRAFT_FILES: ((id: string) => string)[] = [
  (id) => `game/cities/${id}.ts`,
  (id) => `game/finales/${id}.ts`,
  (id) => `game/stories/${id}.ts`,
  () => 'game/art.ts',
  () => 'game/bossDraw.ts',
  () => 'game/enemyDraw.ts',
  () => 'game/music.ts',
  () => 'game/terrainDraw.ts',
  () => 'components/Game.tsx',
  () => 'README.md',
]

const ids = process.argv.slice(2)
const list = ids.length ? LEVELS.filter((l) => ids.includes(l.id)) : LEVELS
for (const id of ids) if (!LEVELS.some((l) => l.id === id)) console.log(`FAIL ${id}: LEVELS'te yok (game/levels.ts)`)

let bad = 0
for (const l of list) {
  const errs: string[] = []
  const need = (ok: unknown, msg: string) => {
    if (!ok) errs.push(msg)
  }
  const count = (ch: string) => l.map.reduce((n, r) => n + [...r].filter((c) => c === ch).length, 0)
  // harita: toplanabilirler ve kapılar (finale eklendikten sonraki birleşik harita)
  need(count('P') === 1, `başlangıç P: ${count('P')}`)
  need(count('E') === 1, `çıkış E: ${count('E')}`)
  need(count('@') === 1, `meydan kapısı @: ${count('@')}`)
  need(count('C') === 3, `hatıra C: ${count('C')} (3 olmalı)`)
  need(count('$') === 1, `gizli pul $: ${count('$')}`)
  need(count('!') === 1, `nazar boncuğu !: ${count('!')}`)
  need(count('Q') === 1, `boss Q: ${count('Q')}`)
  // metin sayıları: haritadaki tabela/kişi kadar metin; boş metin yok
  need(count('?') === l.hints.length, `tabela ? ${count('?')} ama hints ${l.hints.length}`)
  need(l.hints.every((h) => h.trim().length > 0), 'boş tabela metni var')
  need(count('n') === l.npcs.length, `kişi n ${count('n')} ama npcs ${l.npcs.length}`)
  for (const n of l.npcs) need(allNames.filter((x) => x === n.name).length === 1, `kişi adı tekrar ediyor: ${n.name}`)
  need(l.facts.length === 3 && l.secret?.title, 'üç bilgi (facts) ve gizli bilgi (secret) eksik')
  // İngilizce
  const en = LEVELS_EN[l.id]
  need(en, 'content.en.ts LEVELS_EN kaydı yok')
  // yeni düzendeki şehirler (game/cities/<id>.ts): ana yolun metinleri tek yerde, sayılar birebir tutar
  // (eski şehirlerin bir kısım metni imza ve ek parça dosyalarında, İngilizcesiyle birlikte durur)
  if (en && existsSync(join(root, `game/cities/${l.id}.ts`))) {
    const pre = PRELUDES[l.city]
    const roadHints = l.finaleAt ? l.finaleAt.hint : l.hints.length
    need(en.hints.length === roadHints, `EN hints ${en.hints.length}, ana yol tabelası ${roadHints}`)
    const roadNpcs = l.finaleAt ? l.finaleAt.npc : l.npcs.length
    need(en.npcs.length === roadNpcs, `EN npcs ${en.npcs.length}, ana yol kişisi ${roadNpcs}`)
    need(en.facts.length === 3 && en.secret, 'EN facts/secret eksik')
    need(pre.hintsEn.length === pre.hints.length && (pre.npcsEn?.length ?? 0) === (pre.npcs?.length ?? 0), 'meydan yolunun EN metinleri eksik (finales hintsEn / npcsEn)')
  }
  // Hikâye Gezisi: en az iki diyaloglu kişi
  need(l.npcs.filter((n) => talkOf(n.name)).length >= 2, 'game/stories: en az iki şehir insanına diyalog yaz')
  // madalya ve hile önleme
  const draftLine = (src: string) => new RegExp(`\\n  ${l.id}: [\\d.]+, // ${DRAFT}`).test(src)
  need(SOLVER_TIME[l.id] > 0 && !draftLine(medals.slice(0, bossAt)), `medals.ts SOLVER_TIME ${SOLVER_TIME[l.id] ? 'taslak' : 'yok'} (npx tsx scripts/solver-time.ts ${l.id})`)
  need(BOSS_TIME[l.id] > 0 && !draftLine(medals.slice(bossAt)), `medals.ts BOSS_TIME ${BOSS_TIME[l.id] ? 'taslak' : 'yok'} (bossbot "insan paylı" süresi)`)
  // iskeletten kalan TASLAK (scripts/new-city.ts): metin tabloları ve kaynak satırları
  const draftData = Object.entries({
    'levels.ts': l,
    'content.en.ts': LEVELS_EN[l.id],
    'finales (metin)': { h: PRELUDES[l.city]?.hints, he: PRELUDES[l.city]?.hintsEn, n: PRELUDES[l.city]?.npcs, ne: PRELUDES[l.city]?.npcsEn },
    'stories': l.npcs.map((x) => talkOf(x.name)),
    'flagMoments.ts': FLAG_MOMENTS[l.city],
    'features.ts': FEATURES[l.id],
    'boss.ts': BOSSES[l.city],
    'bossLines.ts': BOSS_LINES[l.city],
  })
    .filter(([, v]) => JSON.stringify(v ?? '').includes(DRAFT))
    .map(([k]) => k)
  need(!draftData.length, `taslak metin kaldı: ${draftData.join(', ')}`)
  const draftSrc = DRAFT_FILES.map((f) => [f, existsSync(join(root, f(l.id))) ? read(f(l.id)) : ''] as const)
    .filter(([f, src]) => src.split('\n').some((ln) => ln.includes(DRAFT) && (f(l.id).includes(l.id) || ln.includes(l.id) || ln.includes(l.name))))
    .map(([f]) => f(l.id))
  need(!draftSrc.length, `taslak kod/çizim kaldı: ${draftSrc.join(', ')}`)
  // kayıtlar
  need(new RegExp(`\\b${l.id}: \\[`).test(map), 'components/TurkeyMap.tsx COORDS koordinatı yok')
  need(new RegExp(`level: \\[[^\\]]*\\b${l.id}\\b`).test(ci), '.github/workflows/ci.yml matrisinde yok')
  need((CITY_CODES as readonly string[]).includes(l.id), 'lib/customLevel.ts CITY_CODES sonuna ekle (düzenleyici kodu)')
  need(simTest.includes(`['${l.name}', ${l.plate}]`), `tests/sim.test.ts plaka listesinde yok: ['${l.name}', ${l.plate}]`)
  need(readme.includes(`| ${l.name} ·`), 'README.md şehir tablosunda satırı yok')
  need(existsSync(join(root, `public/sehirler/${l.id}.webp`)), `public/sehirler/${l.id}.webp yok (node scripts/art/banners.cjs ${l.id})`)
  need(existsSync(join(root, `assets/cities/${l.id}.png`)), `assets/cities/${l.id}.png yok (node scripts/art/banners.cjs ${l.id})`)
  need(existsSync(join(root, `game/finales/${l.city}.ts`)), `game/finales/${l.city}.ts yok`)
  if (errs.length) {
    bad++
    console.log(`FAIL ${l.id}\n${errs.map((e) => '     · ' + e).join('\n')}`)
  } else console.log(`OK   ${l.id}`)
}
// şehir sırası: bu sürümden önceki sıra ORDERS'ta olmalı (yeni şehir eklenince MAP_VERSION artar)
if (!new RegExp(`\\n  ${MAP_VERSION - 1}: `).test(storage)) {
  bad++
  console.log(`FAIL lib/storage.ts ORDERS[${MAP_VERSION - 1}] yok: şehir sırası değiştiyse eski sırayı yaz`)
}
process.exit(bad ? 1 : 0)
