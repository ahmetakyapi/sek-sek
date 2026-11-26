/**
 * Metin ve harita uyumu: bir şehrin metinleri haritasıyla uyuşuyor mu.
 *  - sayılar: haritadaki `?` kadar tabela, `n` kadar kişi metni
 *  - mekanik sözcükleri: tabela "rüzgâr", "gelgit", "halat", "termal"… diyorsa söz edilen mekanik o parçada
 *    (önceki tabeladan sonraki tabelaya, ±12 karo) var mı; giriş (intro) ve özellik satırı (features.ts) diyorsa bölümün
 *    herhangi bir yerinde var mı. Boss tabelası (arenadan önceki son tabela) boss'u anlatır, atlanır.
 *  - `--hepsi`: kişi sözleri, Gezgin notu ve düşüş lafları da (bunlar çoğu zaman manzara anlatır; uyarıyı gözle değerlendir)
 * Harita bittikten sonra metinleri gözden geçirirken koş (Adıyaman'ın ilk taslağı "rüzgâr" diyordu, haritada rüzgâr yoktu).
 * Kural yalnız oyunda var olan mekanikte çalışır (karosu sim.ts'te `case`li olan): yeni mekanik eklenince MECHS'e satır yaz.
 *
 *   npx tsx scripts/check-text.ts adiyaman kastamonu     (argümansız: bütün şehirler) · --kati: uyarı varsa çıkış kodu 1
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FEATURES } from '../game/features'
import { LEVELS } from '../game/levels'
import type { LevelDef } from '../game/types'

export interface Mech {
  /** raporda görünen ad */
  name: string
  /** küçük harfe çevrilmiş Türkçe metinde aranır */
  re: RegExp
  /** haritadaki karşılığı olan karolar */
  chars?: string
  /** karo dışı karşılık (LevelDef bayrağı) */
  flag?: (l: LevelDef) => boolean
}

/** sözcük sınırı Türkçe harflerle (JS'in \b'si ı, ş, ğ'yi harf saymaz) */
const w = (s: string) => new RegExp(`(?<!\\p{L})(?:${s})(?!\\p{L})`, 'u')

/** mekanik sözcükleri ve haritadaki karşılıkları (lejant: .claude/rules/bolumler.md) */
export const MECHS: Mech[] = [
  { name: 'rüzgâr', re: /rüzg[âa]r|esinti/, flag: (l) => !!l.wind },
  { name: 'gelgit', re: /gelgit|med[- ]cezir/, chars: 'A' },
  { name: 'halat', re: /halat/, chars: 'LR' },
  { name: 'teleferik', re: /teleferik/, chars: 'RMNOB' },
  { name: 'derin su', re: /yüzerek|yüzülür|kulaç|derin su|nefes(in|ini)? (tut|bit|kes)/, chars: 'WAZyU"+' },
  { name: 'buz / kaygan', re: w('buz|buzu|buzda|buzlu|kaygan|ıslak taş'), chars: 'IiZ', flag: (l) => !!l.slippery },
  { name: 'donan su', re: /don(an|ar|up) su|donup eri/, chars: 'Z' },
  { name: 'yükselen hava', re: /termal(?! otel)|yükselen (sıcak )?hava|sıcak hava(?! balon)/, chars: 'V' },
  { name: 'yüzen ada', re: /yüzen ada|ada(lar)? bat/, chars: '+' },
  { name: 'havuz teyzesi', re: /havlu fırlat|teyzeler (sağa|bakar)/, chars: '"' },
  { name: 'ritim bloğu', re: /ritim (blo|taş|sıra)/, chars: '{}' },
  { name: 'nitro', re: /nitro/, chars: 'T' },
  { name: 'sandık', re: /sandı(k|ğ)/, chars: 'p' },
  { name: 'plaka', re: /plaka|düğme/, chars: '_' },
  { name: 'ok tuzağı', re: /ok tuza|oklar(ı)? (at|uç)/, chars: '<>' },
  { name: 'tokmak', re: /tokma(k|ğ)/, chars: 'Y' },
  { name: 'çatlak taş', re: /çatlak (taş|cam|zemin)|çöken (taş|zemin)/, chars: 'X' },
  { name: 'diken', re: /diken/, chars: '^vx' },
  { name: 'dash halkası', re: /dash halka|kristal/, chars: '*' },
  { name: 'raylı taş', re: /raylı|gidip gelen (taş|tahta|platform)|asansör/, chars: 'MNOBHJ' },
  { name: 'yay', re: w('yay|yaya|yayı|yayın|yayıyla|yaylar'), chars: 'S' },
  { name: 'şelale', re: /şelalenin içinde|şelaleye girme|su seni aşağı/, chars: ';' },
]

const sim = readFileSync(join(import.meta.dirname, '../game/sim.ts'), 'utf8')
/** kural yalnız oyunda var olan mekanikte: bayrak kuralıysa ya da karolarından biri sim.ts'te `case`liyse */
export const live = (m: Mech) => !!m.flag || [...(m.chars ?? '')].some((c) => sim.includes(`case '${c}'`))

const low = (s: string) => s.toLocaleLowerCase('tr')

/** Bir şehrin sorunları (boş dizi: uyumlu). */
export function textProblems(l: LevelDef, opts: { features?: string; all?: boolean; mechs?: Mech[] } = {}): string[] {
  const features = opts.features ?? FEATURES[l.id]?.tr ?? ''
  const mechs = opts.mechs ?? MECHS.filter(live)
  const out: string[] = []
  const cells: { ch: string; x: number; y: number }[] = []
  l.map.forEach((row, y) => [...row].forEach((ch, x) => ch !== ' ' && ch !== '#' && cells.push({ ch, x, y })))
  const count = (ch: string) => cells.filter((c) => c.ch === ch).length
  const signs = cells.filter((c) => c.ch === '?').sort((a, b) => a.x - b.x || a.y - b.y)
  if (signs.length !== l.hints.length) out.push(`tabela: haritada ${signs.length} ?, metinde ${l.hints.length}`)
  if (count('n') !== l.npcs.length) out.push(`kişi: haritada ${count('n')} n, metinde ${l.npcs.length}`)
  const has = (m: Mech, from = -Infinity, to = Infinity) => (m.flag?.(l) ?? false) || cells.some((c) => m.chars?.includes(c.ch) && c.x >= from && c.x <= to)
  const boss = cells.find((c) => c.ch === 'Q')
  // tabelalar: söz edilen mekanik bu parçada (önceki tabeladan sonrakine) görünmeli; boss tabelası atlanır
  l.hints.forEach((h, i) => {
    const s = signs[i]
    if (!s || (boss && i === signs.length - 1 && s.x < boss.x)) return
    const from = (signs[i - 1]?.x ?? 0) - 12
    const to = (signs[i + 1]?.x ?? l.map[0].length) + 12
    for (const m of mechs) if (m.re.test(low(h)) && !has(m, from, to)) out.push(`tabela ${i + 1} "${m.name}" diyor, o parçada (${Math.max(0, from)}-${to}. sütun) yok: «${h.slice(0, 64)}…»`)
  })
  // öbür metinler: mekanik bölümün herhangi bir yerinde olmalı
  const texts: [string, string][] = [
    ['giriş', l.intro],
    ['özellik (features.ts)', features],
  ]
  if (opts.all)
    texts.push(
      ...l.npcs.map((p, i): [string, string] => [`kişi ${i + 1} (${p.name})`, p.text]),
      ['not', l.note],
      ...l.quips.map((q, i): [string, string] => [`düşüş lafı ${i + 1}`, q]),
    )
  for (const [where, t] of texts) for (const m of mechs) if (m.re.test(low(t)) && !has(m)) out.push(`${where} "${m.name}" diyor, haritada yok`)
  return out
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const strict = process.argv.includes('--kati')
  const all = process.argv.includes('--hepsi')
  for (const id of ids) if (!LEVELS.some((l) => l.id === id)) console.log(`FAIL ${id}: LEVELS'te yok`)
  let bad = 0
  for (const l of ids.length ? LEVELS.filter((x) => ids.includes(x.id)) : LEVELS) {
    const p = textProblems(l, { all })
    if (p.length) bad++
    console.log(p.length ? `UYARI ${l.id}\n${p.map((x) => '     · ' + x).join('\n')}` : `OK    ${l.id}`)
  }
  process.exit(strict && bad ? 1 : 0)
}
