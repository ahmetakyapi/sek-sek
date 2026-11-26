/**
 * Yeni şehrin iskeleti: bir şehrin oyunun her köşesine kaydını TASLAK değerlerle tek komutta yazar. Çıkan kod derlenir ve
 * testler geçer; harita, çizim, metin ve madalya sonra doldurulur (`/yeni-sehir` 2-5). Sonunda doldurulacakların listesini basar.
 *
 *   npx tsx scripts/new-city.ts <id> [--ad "Ad"] [--plaka 55] [--zorluk Orta] [--konum 36.33,41.29] [--sonra <son şehir>]
 *                                    [--surum yeni|ayni] [--kuru] [--zorla]
 *
 *   <id>       ASCII küçük harf kimlik (samsun). 81 ilden biriyse ad, plaka ve konum `scripts/iller.ts`ten gelir.
 *   --zorluk   Kolay | Orta | Zor | "Çok Zor" (varsayılan Orta): boss kademesi (1/2/3), taslak madalya ve CI süresi buna göre.
 *   --sonra    güvenlik: şehrin ardına ekleneceği son şehir bu olmalı (paralel oturumda sıra kaydıysa durur).
 *   --surum    `yeni`: MAP_VERSION artar, eski sıra ORDERS'a yazılır, "Bu Sürümde" notu açılır. `ayni`: bu sürüme daha önce
 *              eklenen şehrin yanına (iki şehir tek sürümde). Verilmezse kendisi seçer: çalışma dalındaki MAP_VERSION
 *              `origin/main`dekinden büyükse sürüm zaten artmıştır (ayni), değilse yeni.
 *   --kuru     hiçbir şey yazmaz; dokunacağı dosyaları ve yapacaklarını gösterir.
 *   --zorla    dokunacağı dosyalarda kaydedilmemiş değişiklik olsa da yazar (geri alma talimatı o zaman güvenli değildir).
 *
 * İdempotent: şehir zaten varsa (CityKey, LEVELS ya da game/cities/<id>.ts) hiçbir şeye dokunmadan hata verir. Bütün
 * düzenlemeler önce bellekte yapılır; bir çapa bulunamazsa hiçbir dosya yazılmaz ve hangi çapanın bulunamadığı söylenir.
 * Kod düzenlemeleri sabit çapalarla yapılır (tablonun açılış satırı → ilk sütun-0 kapanışı; son şehrin satırı).
 *
 * Geri almak (deneme için): betik sonunda tam komutu basar; kısaca `git checkout -- <dosyalar> && rm <yeni dosyalar>`.
 * Temiz ağaçta denediysen `git checkout -- . && git clean -fd game/cities game/finales game/stories` yeter.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEVELS } from '../game/levels'
import { MAP_VERSION, ORDERS } from '../lib/storage'
import { ilOf } from './iller'

const root = join(import.meta.dirname, '..')

// ---------- argümanlar ----------
const argv = process.argv.slice(2)
const flag = (name: string) => argv.includes(`--${name}`)
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}
const VALUED = ['--ad', '--plaka', '--zorluk', '--konum', '--sonra', '--surum']
const id = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.includes(argv[i - 1])))
const die = (msg: string): never => {
  console.error(`HATA: ${msg}`)
  process.exit(1)
}
if (!id || flag('yardim') || flag('help')) {
  console.log(readFileSync(import.meta.filename, 'utf8').split('*/')[0])
  process.exit(id ? 0 : 1)
}
if (!/^[a-z]+$/.test(id)) die(`kimlik yalnız ASCII küçük harf olmalı: "${id}" (ör. samsun, kahramanmaras)`)

const il = ilOf(id)
const name = opt('ad') ?? il?.ad ?? die(`"${id}" 81 il listesinde yok: --ad "Ad" ver`)
const plate = Number(opt('plaka') ?? il?.plaka ?? die('--plaka ver'))
if (!Number.isInteger(plate) || plate < 1 || plate > 81) die(`plaka 1-81 arası olmalı: ${plate}`)
const DIFFS = ['Kolay', 'Orta', 'Zor', 'Çok Zor'] as const
type Diff = (typeof DIFFS)[number]
const diffArg = opt('zorluk') ?? 'Orta'
const diff = (DIFFS.find((d) => d.toLocaleLowerCase('tr') === diffArg.toLocaleLowerCase('tr')) ?? die(`zorluk: ${DIFFS.join(' | ')}`)) as Diff
const konumArg = opt('konum')
const coords: [number, number] = konumArg
  ? (konumArg.split(',').map(Number) as [number, number])
  : (il?.konum ?? die('--konum boylam,enlem ver'))
if (coords.length !== 2 || coords.some((n) => !Number.isFinite(n))) die(`--konum "boylam,enlem" olmalı: ${konumArg}`)
const dry = flag('kuru')

// ---------- durum ----------
const prev = LEVELS[LEVELS.length - 1]
if (opt('sonra') && opt('sonra') !== prev.id) die(`son şehir "${prev.id}", --sonra "${opt('sonra')}" dedi: sıra değişmiş, önce bak (araya şehir ekleme desteklenmez)`)
const read = (p: string) => readFileSync(join(root, p), 'utf8')
if (LEVELS.some((l) => l.id === id)) die(`"${id}" zaten LEVELS'te: şehir var, betik hiçbir şeye dokunmadı`)
if (new RegExp(`'${id}'`).test(read('game/types.ts'))) die(`"${id}" zaten CityKey'de (game/types.ts): yarım bir iskelet olabilir, önce git ile geri al`)
for (const p of [`game/cities/${id}.ts`, `game/finales/${id}.ts`, `game/stories/${id}.ts`])
  if (existsSync(join(root, p))) die(`${p} zaten var: yarım bir iskelet olabilir, önce git ile geri al`)
if (LEVELS.some((l) => l.name === name)) die(`"${name}" adlı şehir zaten var`)

const n = LEVELS.length // eklemeden önceki şehir sayısı
const tier = diff === 'Kolay' ? 1 : diff === 'Orta' ? 2 : 3
const MEDALS: Record<Diff, [number, number, number]> = { Kolay: [120, 170, 230], Orta: [150, 210, 290], Zor: [180, 245, 330], 'Çok Zor': [200, 270, 360] }
const upper = name.toLocaleUpperCase('tr-TR')
const VAR = id.toUpperCase()

/** sürüm: çalışma dalında MAP_VERSION, main'dekinden büyükse bu sürüm zaten bir yeni şehir için artmıştır */
function mainVersion(): number | null {
  for (const ref of ['origin/main', 'main']) {
    try {
      const src = execFileSync('git', ['show', `${ref}:lib/storage.ts`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      const m = /export const MAP_VERSION = (\d+)/.exec(src)
      if (m) return Number(m[1])
    } catch {
      /* sonraki ref */
    }
  }
  return null
}
const surum = opt('surum')
if (surum && surum !== 'yeni' && surum !== 'ayni') die('--surum yeni | ayni')
const mv = mainVersion()
const bump = surum ? surum === 'yeni' : mv === null || MAP_VERSION <= mv
const ver = bump ? MAP_VERSION + 1 : MAP_VERSION

// ---------- yardımcılar ----------
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const VOW = 'aeıioöuü'
/** Türkçe yönelme eki (’e, ’a, ’ye, ’ya): son ünlüye göre */
function dative(word: string) {
  const w = word.toLocaleLowerCase('tr')
  const last = [...w].reverse().find((c) => VOW.includes(c)) ?? 'e'
  return `’${VOW.includes(w[w.length - 1]) ? 'y' : ''}${'aıou'.includes(last) ? 'a' : 'e'}`
}
/** ORDERS sabitinin adı: 46 → FORTY_SIX */
function words(k: number) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
  if (k < 10) return ones[k]
  if (k < 20) return teens[k - 10]
  return tens[Math.floor(k / 10)] + (k % 10 ? `_${ones[k % 10]}` : '')
}

class Plan {
  files = new Map<string, { orig: string; cur: string; notes: string[] }>()
  created = new Map<string, string>()
  edit(path: string, note: string, fn: (src: string) => string) {
    if (!this.files.has(path)) {
      if (!existsSync(join(root, path))) die(`${path} yok`)
      const s = read(path)
      this.files.set(path, { orig: s, cur: s, notes: [] })
    }
    const f = this.files.get(path)!
    try {
      f.cur = fn(f.cur)
    } catch (e) {
      die(`${path}: ${note}: ${(e as Error).message}\n  Hiçbir dosya yazılmadı. Çapa değiştiyse scripts/new-city.ts'i güncelle.`)
    }
    f.notes.push(note)
  }
  create(path: string, content: string) {
    this.created.set(path, content)
  }
}
const once = (src: string, needle: string) => {
  const i = src.indexOf(needle)
  if (i < 0) throw new Error(`çapa bulunamadı: ${JSON.stringify(needle.slice(0, 90))}`)
  if (src.indexOf(needle, i + 1) >= 0) throw new Error(`çapa birden çok yerde: ${JSON.stringify(needle.slice(0, 90))}`)
  return i
}
/** `opener` satırıyla açılan tablonun ilk sütun-0 kapanışından (`}` ya da `]`) hemen önce `entry` ekler */
const intoTable = (opener: string, entry: string, close = '\n}') => (src: string) => {
  const i = once(src, opener)
  const j = src.indexOf(close, i)
  if (j < 0) throw new Error(`"${opener}" tablosunun kapanışı bulunamadı`)
  return src.slice(0, j + 1) + entry + src.slice(j + 1)
}
/** `needle` ile başlayan satırın ardına ekler */
const afterLine = (needle: string, add: string) => (src: string) => {
  const i = once(src, needle)
  const e = src.indexOf('\n', i)
  return src.slice(0, e + 1) + add + src.slice(e + 1)
}
const beforeLine = (needle: string, add: string) => (src: string) => {
  const i = once(src, needle)
  const s = src.lastIndexOf('\n', i) + 1
  return src.slice(0, s) + add + src.slice(s)
}
const replaceOnce = (old: string, neu: string) => (src: string) => {
  const i = once(src, old)
  return src.slice(0, i) + neu + src.slice(i + old.length)
}
const replaceAll = (old: string, neu: string, min = 1) => (src: string) => {
  const k = src.split(old).length - 1
  if (k < min) throw new Error(`metin bulunamadı: ${JSON.stringify(old)} (elle değişmiş olabilir; düzelt ya da betiği güncelle)`)
  return src.split(old).join(neu)
}
/** tek satırlık listeyi (satırın sonunda `end`) uzatır: `end`den önce `add` */
const extendLine = (lineStart: string, end: string, add: string) => (src: string) => {
  const i = once(src, lineStart)
  const e = src.indexOf('\n', i)
  const line = src.slice(i, e)
  if (!line.endsWith(end)) throw new Error(`"${lineStart}…" satırı "${end}" ile bitmiyor`)
  return src.slice(0, i) + line.slice(0, line.length - end.length) + add + end + src.slice(e)
}

// ---------- taslak metinler ----------
const T = 'TASLAK'
const npcs = [
  { name: `${name} Ustası (${T})`, look: 'usta', en: `The Master of ${name} (${T})`, role: 'esnaf ve şehrin ustası: hatıranın üç yerini söyler' },
  { name: `${name} Teyzesi (${T})`, look: 'teyze', en: `The Auntie of ${name} (${T})`, role: 'şehri anlatır, ikinci parçanın nasıl geçileceğini söyler' },
  { name: `${name} Rehberi (${T})`, look: 'genc', en: `The Guide of ${name} (${T})`, role: 'gizli pulun yerini üstü kapalı söyler' },
  { name: `${name} Bekçisi (${T})`, look: 'amca', en: `The Watchman of ${name} (${T})`, role: 'son parçayı ve meydan kapısını anlatır' },
]
const finaleNpc = { name: `${name} Meydancısı (${T})`, en: `The Square Keeper of ${name} (${T})` }

const road = [
  ...Array.from({ length: 19 }, () => ' '.repeat(120)),
  '  P   ?   n     C     ?     n       C       ?     F     n     C       ?       n       $       ?                 E       ',
  ...Array.from({ length: 4 }, () => '#'.repeat(120)),
]
const fin = [
  ...Array.from({ length: 19 }, () => ' '.repeat(60)),
  ' ?  n                         !                             ',
  ...Array.from({ length: 4 }, () => '#'.repeat(60)),
]
const rows = (r: string[]) => r.map((x) => `      ${q(x)},`).join('\n')

const plan = new Plan()

// 1. tip
plan.edit('game/types.ts', 'CityKey', (s) => {
  const i = once(s, 'export type CityKey =')
  const e = s.indexOf('\n', i)
  return s.slice(0, e) + ` | '${id}'` + s.slice(e)
})

// 2. ana yol ve meydan yolu taslakları
plan.create(
  `game/cities/${id}.ts`,
  `import type { CityRoad } from './types'

/** ${name} ana yolu: ${T} (level-designer dolduracak; tabela ? ve kişi n sırası levels.ts hints / npcs sırasıdır). */
export const road: CityRoad = {
  chunks: [
    [
${rows(road)}
    ],
  ],
}
`,
)
plan.create(
  `game/finales/${id}.ts`,
  `import type { Prelude } from './types'

/** ${name} meydan yolu: ${T} (level-designer dolduracak: şehre özgü tek bulmaca + saklı nazar boncuğu !). */
export const prelude: Prelude = {
  medal: 50,
  hints: [${q(`${T}: meydan yolunun tabelası (${name}): bulmacanın kuralını tek cümlede söyle.`)}],
  hintsEn: [${q(`${T}: the square road sign (${name}): state the puzzle's rule in one sentence.`)}],
  npcs: [{ name: ${q(finaleNpc.name)}, look: 'amca', text: ${q(`${T}: ${name} meydanını anlatır, nazar boncuğunun yerini üstü kapalı söyler.`)} }],
  npcsEn: [{ name: ${q(finaleNpc.en)}, text: ${q(`${T}: describes the square of ${name} and hints where the evil eye bead hides.`)} }],
  chunks: [
    [
${rows(fin)}
    ],
  ],
}
`,
)
plan.edit('game/finales/index.ts', 'import + PRELUDES', (s) => {
  const imp = [...s.matchAll(/^import \{ prelude as \w+ \} from '\.\/\w+'$/gm)].pop()
  if (!imp) throw new Error("\"import { prelude as … } from './…'\" satırı yok")
  const e = imp.index! + imp[0].length
  s = s.slice(0, e) + `\nimport { prelude as ${id} } from './${id}'` + s.slice(e)
  return extendLine('export const PRELUDES: Record<CityKey, Prelude> = {', ' }', `, ${id}`)(s)
})

// 3. levels.ts
const decorPrev = (() => {
  const m = new RegExp(`\\n  ${prev.id}: '(\\w+)',`).exec(read('game/levels.ts'))
  return m?.[1]
})()
const decor = ['tzl', 'lzt', 'ztl', 'tlz', 'zlt', 'ltz'].find((d) => d !== decorPrev)!
plan.edit('game/levels.ts', 'import', beforeLine("import type { CityRoad } from './cities/types'", `import { road as ${id}Road } from './cities/${id}'\n`))
plan.edit('game/levels.ts', 'DECOR_CYCLE', intoTable('const DECOR_CYCLE: Record<string, string> = {', `  ${id}: '${decor}',\n`))
const npcLines = npcs.map((p, i) => `      { name: ${q(p.name)}, look: '${p.look}', text: ${q(`${T}: ${i + 1}. kişi (${p.role}).`)} },`).join('\n')
plan.edit(
  'game/levels.ts',
  'LEVELS kaydı',
  intoTable(
    'export const LEVELS: LevelDef[] = [',
    `  {
    // ${T}: ${name} iskeleti (scripts/new-city.ts). Metinleri harita bittikten sonra haritaya göre yaz.
    id: '${id}',
    city: '${id}',
    name: ${q(name)},
    nickname: ${q(`${T} takma ad`)},
    plate: ${plate},
    subtitle: ${q(`${T}: ${name} alt başlığı`)},
    difficulty: '${diff}',
    note: ${q(`${T}: Gezgin’in defter notu (${name}): sayfanın görünüşü, şehrin bir sırrı, bu yolun öğüdü.`)},
    npcs: [
${npcLines}
    ],
    medals: [${MEDALS[diff].join(', ')}],
    quips: [${[1, 2, 3, 4].map((k) => q(`${T}: ${name} düşüş lafı ${k}.`)).join(', ')}],
    item: ${q(`${T} hatıra`)},
    intro: ${q(`${T}: ${name} girişi: dört gerçek yer ve şehrin mekaniği.`)},
    facts: [
${[1, 2, 3].map((k) => `      { title: ${q(`${T} bilgi ${k}`)}, text: ${q(`${T}: ${name} hakkında doğrulanmış bilgi ${k}.`)} },`).join('\n')}
    ],
    secret: { title: ${q(`${T} gizli bilgi`)}, text: ${q(`${T}: ${name} gizli bilgisi (pul alınınca açılır).`)} },
    hints: [
${[1, 2, 3, 4, 5].map((k) => `      ${q(`${T}: ${name} ${k}. tabela: parçanın adı ve ne yapılacağı.`)},`).join('\n')}
    ],
    map: roadMap(${id}Road),
  },
`,
    '\n]',
  ),
)

// 4. İngilizce
plan.edit(
  'game/content.en.ts',
  'LEVELS_EN',
  intoTable(
    'export const LEVELS_EN: Record<string, LevelEn> = {',
    `  ${id}: {
    // ${T}: ${name} İngilizcesi (levels.ts ile aynı sayıda)
    subtitle: ${q(`${T}: ${name} subtitle`)},
    item: ${q(`${T} keepsake`)},
    nickname: ${q(`${T} nickname`)},
    intro: ${q(`${T}: ${name} intro.`)},
    note: ${q(`${T}: the Wanderer’s note on ${name}.`)},
    facts: [
${[1, 2, 3].map((k) => `      { title: ${q(`${T} fact ${k}`)}, text: ${q(`${T}: verified fact ${k} about ${name}.`)} },`).join('\n')}
    ],
    secret: { title: ${q(`${T} secret`)}, text: ${q(`${T}: secret fact about ${name}.`)} },
    hints: [
${[1, 2, 3, 4, 5].map((k) => `      ${q(`${T}: ${name} sign ${k}.`)},`).join('\n')}
    ],
    npcs: [
${npcs.map((p, i) => `      { name: ${q(p.en)}, text: ${q(`${T}: person ${i + 1} of ${name}.`)} },`).join('\n')}
    ],
    quips: [${[1, 2, 3, 4].map((k) => q(`${T}: ${name} quip ${k}.`)).join(', ')}],
  },
`,
  ),
)

// 5. görünüş, boss, ses, metin tabloları
plan.edit(
  'game/art.ts',
  'CITY paleti + buildLayers',
  (s) => {
    s = intoTable(
      'export const CITY: Record<CityKey, CityStyle> = {',
      `  ${id}: {
    // ${T}: ${name} paleti (artist ajanı şehre göre ayarlar; weather süzülenleri ve doğa sesini, sky + sun ışığı seçer)
    sky: ['#3e78b8', '#94c4e8', '#f4ecd4'],
    sun: { x: 0.3, y: 0.22, r: 14, color: '#fff4cc', glow: 'rgba(255,240,190,0.22)' },
    far: '#8aa4c0',
    mid: '#5a8a5e',
    near: '#345a3e',
    tileTop: '#9a8a6a',
    tile: '#7a6a4e',
    tileDark: '#4a3e2c',
    tileLight: '#bcae8a',
    plank: '#8a6a40',
    accent: '#e8a43a',
    water: ['#2a6a9a', '#18466e', '#cfe6f2'],
    spike: ['#3e3a34', '#1e1c18'],
    weather: 'leaves',
    enemyGround: 'boar',
    enemyFly: 'bee',
    animal: 'horse',
  },
`,
    )(s)
    const fn = once(s, 'export function buildLayers(')
    const c = s.indexOf(`\n    case '${prev.city}':`, fn)
    if (c < 0) throw new Error(`buildLayers içinde "case '${prev.city}':" yok`)
    return s.slice(0, c + 1) + `    case '${id}': // ${T}: artist ajanı kendi katmanını yazar\n` + s.slice(c + 1)
  },
)
plan.edit(
  'game/boss.ts',
  'BOSSES',
  intoTable(
    'export const BOSSES: Record<CityKey, BossDef> = {',
    `  ${id}: { name: ${q(`${T}: ${name} boss’u`)}, nameEn: ${q(`${T}: The ${name} Boss`)}, hp: ${tier === 1 ? 3 : tier === 2 ? 4 : 5}, moves: ${tier === 1 ? "['charge', 'hop']" : "['hop', 'throw', 'charge']"}, speed: ${tier === 1 ? 0.9 : 1.1}, tier: ${tier}, w: 24, h: 24, taunt: ${q(`${T}: ${name} boss’unun saldırısı ve nasıl yenileceği (işaret → saldırı → yorgunluk → üstüne bas).`)}, tauntEn: ${q(`${T}: how the ${name} boss attacks and how to beat it.`)} },\n`,
  ),
)
plan.edit(
  'game/bossLines.ts',
  'BOSS_LINES',
  intoTable(
    'export const BOSS_LINES:',
    `  ${id}: { wake: [${q(`${T}: ${name} uyanış`)}, ${q(`${T}: ${name} wake`)}], tired: [${q(`${T}: ${name} yorgun`)}, ${q(`${T}: ${name} tired`)}], ouch: [${q(`${T}: ${name} ah`)}, ${q(`${T}: ${name} ouch`)}] },\n`,
  ),
)
plan.edit('game/bossDraw.ts', 'PAINT', intoTable('const PAINT: Record<CityKey, Painter> = {', `  // ${T}: artist ajanı ${name} boss çizimini yazar\n  ${id}: (c, b, mood, t) => PAINT.${prev.city}(c, b, mood, t),\n`))
plan.edit('game/enemyDraw.ts', 'KEEPSAKES', intoTable('const KEEPSAKES: Record<CityKey, ItemPainter> = {', `  // ${T}: artist ajanı ${name} hatırasını çizer\n  ${id}: (c) => KEEPSAKES.${prev.city}(c),\n`))
plan.edit(
  'game/flagMoments.ts',
  'FLAG_MOMENTS',
  intoTable(
    'export const FLAG_MOMENTS: Record<CityKey, [string, string][]> = {',
    `  ${id}: [\n${[1, 2, 3, 4].map((k) => `    [${q(`${T}: ${name} bayrak sözü ${k}.`)}, ${q(`${T}: ${name} flag line ${k}.`)}],`).join('\n')}\n  ],\n`,
  ),
)
plan.edit(
  'game/features.ts',
  'FEATURES',
  intoTable('export const FEATURES: Record<string, { tr: string; en: string }> = {', `  ${id}: { tr: ${q(`${T}: ${name} mekaniği ve gerçek yerleri`)}, en: ${q(`${T}: ${name} mechanic and real places`)} },\n`),
)
plan.edit('game/music.ts', 'SCALES', intoTable('export const SCALES: Record<CityKey, Makam> = {', `  // ${T}: ${name} makamı (yalnız efektler; .claude/rules/ses.md)\n  ${id}: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12] },\n`))
plan.edit('game/terrainDraw.ts', 'LOOK', intoTable('const LOOK: Record<CityKey, Look> = {', `  // ${T}: ${name} zemin malzemesi ve örtüsü\n  ${id}: { mat: 'rock', cap: 'grass' },\n`))
plan.edit('game/render.ts', 'NEXT_CITY', (s) => {
  const i = once(s, 'const NEXT_CITY: Record<CityKey, string | null> = {')
  const line = `\n  ${prev.city}: null,\n`
  const j = s.indexOf(line, i)
  if (j < 0) throw new Error(`NEXT_CITY içinde "${prev.city}: null" yok`)
  return s.slice(0, j) + `\n  ${prev.city}: ${q(upper)},\n  ${id}: null,\n` + s.slice(j + line.length)
})

// 6. hikâye diyaloğu (ilk iki kişi)
const talkOf = (p: (typeof npcs)[number], k: number) => {
  const s = (tr: string, en: string) => `[${q(`${T}: ${tr}`)}, ${q(`${T}: ${en}`)}]`
  const short = p.name.replace(` (${T})`, '')
  return `  ${q(p.name)}: talk(
    ${s(`${short} selam verir, kendini ve işini bir cümleyle anlatır.`, `${p.en.replace(` (${T})`, '')} greets you and sums up their trade in a sentence.`)},
    [
      [${s(`${short} için merak sorusu`, `curious question for person ${k}`)}, ${s(`${short} merak sorusuna cevap verir.`, `person ${k} of ${name} answers the curious question.`)}],
      [${s(`${short} için şaka sorusu`, `joking question for person ${k}`)}, ${s(`${short} şakaya şakayla karşılık verir.`, `person ${k} of ${name} answers the joke with a joke.`)}],
      [${s(`${short} için saygı sorusu`, `respectful question for person ${k}`)}, ${s(`${short} saygılı soruya içten cevap verir.`, `person ${k} of ${name} answers the respectful question warmly.`)}],
    ],
    [${s(`${k}. defter sayfası`, `notebook page ${k}`)}, ${s(`${short} deftere şehre özgü bir söz yazdırır.`, `person ${k} of ${name} has you write a saying in the notebook.`)}],
  ),`
}
plan.create(
  `game/stories/${id}.ts`,
  `import { talk, type Talk } from './types'

/** ${name}: ilk iki şehir insanının Hikâye Gezisi konuşması. ${T} (yeni-sehir: metin ajanı yazar; ad levels.ts ile aynı). */
export const STORY_${VAR}: Record<string, Talk> = {
${talkOf(npcs[0], 1)}
${talkOf(npcs[1], 2)}
}
`,
)
plan.edit('game/stories/index.ts', 'import + STORIES', (s) => {
  s = beforeLine("import type { Talk } from './types'", `import { STORY_${VAR} } from './${id}'\n`)(s)
  return extendLine('export const STORIES: Record<string, Talk> = {', ' }', `, ...STORY_${VAR}`)(s)
})

// 7. kayıtlar: harita, düzenleyici, CI, testler
plan.edit('components/TurkeyMap.tsx', 'COORDS', intoTable('const COORDS: Record<string, [number, number]> = {', `  ${id}: [${coords[0]}, ${coords[1]}],\n`))
plan.edit('lib/customLevel.ts', 'CITY_CODES', (s) => {
  const i = once(s, 'export const CITY_CODES = [')
  const j = s.indexOf('\n] as const', i)
  if (j < 0) throw new Error('CITY_CODES kapanışı yok')
  return s.slice(0, j) + ` '${id}',` + s.slice(j)
})
plan.edit('.github/workflows/ci.yml', 'matris', (s) => {
  s = extendLine('        level: [', ']', `, ${id}`)(s)
  if (tier === 3) s = replaceOnce(`"]'), matrix.level) && 75`, `","${id}"]'), matrix.level) && 75`)(s)
  return s
})
// taslak madalya süreleri: hile önleme testi her şehirde SOLVER_TIME ister; city-check "TASLAK" yorumlu satırı eksik sayar
plan.edit('game/medals.ts', 'SOLVER_TIME + BOSS_TIME (taslak)', (s) => {
  s = intoTable('export const SOLVER_TIME: Record<string, number> = {', `  ${id}: 60, // ${T}: npx tsx scripts/solver-time.ts ${id}\n`)(s)
  return intoTable('export const BOSS_TIME: Record<string, number> = {', `  ${id}: 40, // ${T}: npx tsx scripts/bossbot.ts ${id} ("insan paylı")\n`)(s)
})
plan.edit('tests/sim.test.ts', 'plaka listesi', afterLine(`      ['${prev.name}', ${prev.plate}],`, `      [${q(name)}, ${plate}],\n`))

// 8. kayıt sürümü
if (bump) {
  const old = ORDERS[MAP_VERSION - 1]
  const ids = LEVELS.map((l) => l.id)
  const st = read('lib/storage.ts')
  const prevConst = new RegExp(`\\n  ${MAP_VERSION - 1}: (\\w+),`).exec(st)?.[1]
  const extra = old ? ids.filter((x) => !old.includes(x)) : ids
  const contiguous = old && prevConst && old.every((x, k) => ids[k] === x) && old.length + extra.length === ids.length
  let constName = words(n)
  if (new RegExp(`const ${constName}\\b`).test(st)) constName = `${constName}_V${MAP_VERSION}`
  const value = contiguous ? `[...${prevConst}, ${extra.map((x) => `'${x}'`).join(', ')}]` : `[${ids.map((x) => `'${x}'`).join(', ')}]`
  plan.edit('lib/storage.ts', `MAP_VERSION ${MAP_VERSION} → ${ver}, ORDERS[${MAP_VERSION}]`, (s) => {
    s = replaceOnce(`export const MAP_VERSION = ${MAP_VERSION}\n`, `export const MAP_VERSION = ${ver}\n`)(s)
    // eski sıra: son sabitin ardına (NINETEEN gibi sırasız sabitten önce de olsa olur: tanım sırası yeter)
    s = beforeLine('/** Eski sürümlerin şehir sırası', `/** ${name} eklenmeden önceki ${n} şehir (harita sürümü ${MAP_VERSION}) */\nconst ${constName} = ${value}\n\n`)(s)
    return intoTable('export const ORDERS: Record<number, string[]> = {', `  ${MAP_VERSION}: ${constName},\n`)(s)
  })
}
plan.edit('tests/cloud.test.ts', 'mapNews beklentileri', (s) => {
  const title = "it('sonradan eklenen şehirler yeni şehir olarak listelenir'"
  const a = once(s, title)
  const b = s.indexOf('\n  it(', a + 1)
  let block = s.slice(a, b < 0 ? undefined : b)
  let touched = 0
  block = block
    .split('\n')
    .map((line) => {
      if (!line.includes('expect(mapNews(') || !line.includes('.added')) return line
      const m = /\.toEqual\(\[(.*)\]\)$/.exec(line)
      if (!m) return line
      const items = m[1] ? m[1].split(', ').map((x) => x.slice(1, -1)) : []
      if (line.includes('.added.sort()')) items.push(id), items.sort()
      else items.push(id)
      touched++
      return line.slice(0, m.index) + `.toEqual([${items.map((x) => `'${x}'`).join(', ')}])`
    })
    .join('\n')
  if (!touched) throw new Error('mapNews(...).added beklentisi bulunamadı')
  if (bump) {
    const last = `    expect(LEVELS[s${MAP_VERSION - 1}.unlocked].id).toBe(`
    const k = block.indexOf(last)
    if (k < 0) throw new Error(`"${last}" satırı yok (son sürümün bloğu)`)
    const e = block.indexOf('\n', k)
    const idx = LEVELS.length - 1
    block =
      block.slice(0, e + 1) +
      `    // sürüm ${MAP_VERSION} kaydıyla gelen, ${prev.name} şehrini bitirmiş oyuncuya ${name} açılır\n` +
      `    const s${MAP_VERSION} = normalizeSave({ mapVersion: ${MAP_VERSION}, unlocked: ${idx}, best: { ${prev.id}: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })\n` +
      `    expect(mapNews(s${MAP_VERSION}).added).toEqual(['${id}'])\n` +
      `    expect(LEVELS[s${MAP_VERSION}.unlocked].id).toBe('${id}')\n` +
      block.slice(e + 1)
  }
  return s.slice(0, a) + block + (b < 0 ? '' : s.slice(b))
})

// 9. "Bu Sürümde" notu (sürümün ilk yeni şehri)
if (bump) {
  const head = `Yeni Şehir: ${name}`
  const body = `${T}: ${name} ile gelenler tek cümlede (şehrin mekaniği ve gerçek yerleri).`
  plan.edit('components/Game.tsx', 'RELEASE_NOTES', afterLine('const RELEASE_NOTES: Record<string, [string, string][]> = {', `  ${id}: [\n    [${q(head)}, ${q(body)}],\n  ],\n`))
  plan.edit('lib/ui.en.ts', 'RELEASE_NOTES İngilizcesi', afterLine('export const UI_EN: Record<string, string> = {', `  ${JSON.stringify(head)}: ${JSON.stringify(`New City: ${name}`)},\n  ${JSON.stringify(body)}: ${JSON.stringify(`${T}: what comes with ${name}, in one sentence.`)},\n`))
}

// 10. sayılar ve README
const fromOld = `İstanbul’dan ${prev.name}${dative(prev.name)} ${n} şehir`
const fromNew = `İstanbul’dan ${name}${dative(name)} ${n + 1} şehir`
plan.edit('app/layout.tsx', 'şehir ve hatıra sayısı', (s) => replaceAll(`${3 * n} hatıra`, `${3 * (n + 1)} hatıra`)(replaceAll(fromOld, fromNew, 2)(s)))
plan.edit('app/hakkinda/page.tsx', 'şehir ve hatıra sayısı', (s) => replaceAll(`${3 * n} hatıra`, `${3 * (n + 1)} hatıra`)(replaceAll(fromOld, fromNew)(s)))
plan.edit('scripts/art/icons.cjs', 'paylaşım görseli sayısı', replaceAll(`${n} şehir · ${3 * n} hatıra`, `${n + 1} şehir · ${3 * (n + 1)} hatıra`))
plan.edit(
  'README.md',
  'şehir tablosu',
  afterLine(`| ${n} | ${prev.name} ·`, `| ${n + 1} | ${name} · ${T} alt başlık | ${String(plate).padStart(2, '0')} | ${diff} | ${T}: öne çıkanlar | ${T} hatıra |\n`),
)

// ---------- yaz ----------
const touched = [...plan.files.keys()].filter((p) => plan.files.get(p)!.cur !== plan.files.get(p)!.orig)
const created = [...plan.created.keys()]
let dirty: string[] = []
try {
  dirty = execFileSync('git', ['status', '--porcelain', '--', ...touched], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
} catch {
  /* git yoksa denetim yok */
}

console.log(`${dry ? 'KURU ÇALIŞMA (hiçbir şey yazılmadı)' : 'YAZILDI'}: ${name} (${id}) · plaka ${plate} · ${diff} (boss kademe ${tier}) · konum [${coords.join(', ')}]`)
console.log(`  sıra: ${prev.name} ardından ${n + 1}. şehir · harita sürümü ${bump ? `${MAP_VERSION} → ${ver} (yeni sürüm)` : `${MAP_VERSION} (aynı sürüme ek${mv === null ? '' : `; main'de ${mv}`})`}`)
console.log('\nDeğişen dosyalar:')
for (const p of touched) console.log(`  ~ ${p.padEnd(30)} ${plan.files.get(p)!.notes.join(', ')}`)
console.log('Yeni dosyalar:')
for (const p of created) console.log(`  + ${p}`)

if (dry) process.exit(0)
if (dirty.length && !flag('zorla'))
  die(`dokunulacak dosyalarda kaydedilmemiş değişiklik var (geri alma talimatı onları da silerdi):\n  ${dirty.join('\n  ')}\n  Önce commit'le ya da --zorla ver.`)
for (const p of touched) writeFileSync(join(root, p), plan.files.get(p)!.cur)
for (const [p, c] of plan.created) writeFileSync(join(root, p), c)

console.log(`
Şimdi doldur (hepsi "${T}" diye işaretli: grep -rn "${T}" game components lib tests README.md app scripts/art .github):
  harita       game/cities/${id}.ts (ana yol: P, 5 ?, 4 n, 3 C, $, F'ler, E) · game/finales/${id}.ts (meydan yolu: 1+ ?, n, tam bir !)  → level-designer
  metin        game/levels.ts ${id} (ad, takma ad, alt başlık, not, 4 kişi, laflar, hatıra, giriş, 3 bilgi + gizli, 5 tabela)
               game/content.en.ts ${id} · game/finales/${id}.ts hints/npcs (+En) · game/flagMoments.ts · game/features.ts
               game/stories/${id}.ts (ilk iki kişi; kişi adları levels.ts ile aynı) · README.md satırı
  boss         game/boss.ts (ad, hareketler, taunt) · game/bossLines.ts · çizim game/bossDraw.ts PAINT  → artist
  çizim        game/art.ts CITY + buildLayers case · game/enemyDraw.ts KEEPSAKES · game/render.ts tezgâh s / simge z · game/terrainDraw.ts LOOK  → artist
  ses          game/music.ts SCALES (makam)${bump ? `\n  sürüm notu   components/Game.tsx RELEASE_NOTES.${id} + lib/ui.en.ts` : `\n  sürüm notu   bu sürümün ilk şehrinin RELEASE_NOTES satırına ${name} şehrini de yaz (aynı sürüm)`}
  görsel       node scripts/art/banners.cjs ${id} · node scripts/art/icons.cjs --og
  madalya      npx tsx scripts/solver-time.ts ${id} → game/medals.ts SOLVER_TIME · bossbot "insan paylı" → BOSS_TIME${tier === 3 ? '' : `\n  CI           çözücü uzun sürerse ci.yml 75 dk listesine ekle`}
Denetim: npx tsc --noEmit && npx tsx scripts/city-check.ts ${id} && npx tsx scripts/check-text.ts ${id}

Geri al (deneme için):
  git checkout -- ${touched.join(' ')}
  rm ${created.join(' ')}`)
