/**
 * Bölüm finalleri: meydan kapısı (@) oyuncuyu buraya geçirir.
 *   [duvar] varış + bayrak → meydan yolu (şehre özgü bulmaca / meydan okuma) → bayrak → boss arenası → kapı → çıkış
 * Meydan yolları şehir başına bir dosyada (game/finales/<şehir>.ts); arena burada, boss’un hareketine göre kurulur.
 */
import { BOSSES } from '../boss'
import type { CityKey } from '../types'
import { prelude as istanbul } from './istanbul'
import { prelude as kocaeli } from './kocaeli'
import { prelude as canakkale } from './canakkale'
import { prelude as diyarbakir } from './diyarbakir'
import { prelude as izmir } from './izmir'
import { prelude as sinop } from './sinop'
import { prelude as ankara } from './ankara'
import { prelude as konya } from './konya'
import { prelude as nevsehir } from './nevsehir'
import { prelude as adana } from './adana'
import { prelude as gaziantep } from './gaziantep'
import { prelude as mardin } from './mardin'
import { prelude as malatya } from './malatya'
import { prelude as corum } from './corum'
import { prelude as ordu } from './ordu'
import { prelude as trabzon } from './trabzon'
import { prelude as sivas } from './sivas'
import { prelude as ardahan } from './ardahan'
import { prelude as bayburt } from './bayburt'
import { prelude as edirne } from './edirne'
import { prelude as bursa } from './bursa'
import { prelude as antalya } from './antalya'
import { prelude as sanliurfa } from './sanliurfa'
import { prelude as van } from './van'
import { prelude as erzurum } from './erzurum'
import { prelude as eskisehir } from './eskisehir'
import { prelude as hatay } from './hatay'
import { prelude as kayseri } from './kayseri'
import type { Prelude } from './types'

export const PRELUDES: Record<CityKey, Prelude> = { istanbul, kocaeli, canakkale, izmir, ankara, konya, nevsehir, adana, gaziantep, diyarbakir, mardin, malatya, corum, sinop, ordu, trabzon, sivas, ardahan, bayburt, kayseri, hatay, eskisehir, edirne, bursa, antalya, sanliurfa, van, erzurum }

const H = 24
const ICE: CityKey[] = ['sivas', 'ardahan', 'erzurum']

/** Varış: kapıdan çıkılan yer, hemen yanında bayrak. */
const ARRIVAL = ['      ', ' & F  ', '######', '######', '######', '######']

/**
 * Arena: solda bayrak ve boss’un nasıl yenileceğini söyleyen tabela, ortada 22 karoluk düz meydan (iki ucunda
 * fener, ortasında şehrin simge nesnesi: süsler boss’un arkasında kalır, yolu kesmez)
 * (boss | ile duvar arasında gezer), sağda göğe kadar duvar ve boss yenilince açılan kapı (G), ardında
 * şehrin dost hayvanı ve çıkış.
 */
function arena(city: CityKey): string[] {
  const moves = BOSSES[city].moves
  const top = ICE.includes(city) ? 'I' : '#'
  const W = 27
  const rows: string[] = []
  for (let y = 0; y < H; y++) {
    let r: string
    if (y < 16) r = ' '.repeat(W) + '##' + ' '.repeat(8)
    else if (y < 19) r = ' '.repeat(W) + 'GG' + ' '.repeat(8)
    else if (y === 19) r = ' F ? |l' + ' '.repeat(6) + 'z' + ' '.repeat(6) + 'Q' + ' '.repeat(5) + 'l' + 'GG' + '  l k E  '
    else if (y === 20) r = '#####' + top.repeat(22) + '##' + '########'
    else r = '#'.repeat(W + 10)
    rows.push(r)
  }
  // toslayan boss’un üstünden atlamak için alçak bir sahanlık; sıçrayan ve atan için meydan boş kalır
  if (moves[0] === 'charge') rows[17] = rows[17].slice(0, 14) + '====' + rows[17].slice(18)
  return rows
}

/** Varış + meydan yolu (arena hariç): scripts/verify-prelude.ts tek başına da dener. */
export function buildRoad(city: CityKey, pad: (rows: string[]) => string[], decorate: (rows: string[]) => string[]): string[] {
  const parts = [pad(ARRIVAL), ...PRELUDES[city].chunks.map(pad)]
  return decorate(Array.from({ length: H }, (_, y) => parts.map((c) => c[y]).join('')))
}

/** Boss Rush: kısa bir giriş ve arena; meydan yolu ve tabela yok. */
export function buildArena(city: CityKey): string[] {
  return arena(city).map((r, y) => (y === 19 ? '  P  ' : y > 19 ? '#####' : '     ') + r.replace('?', ' '))
}

export function buildFinale(city: CityKey, pad: (rows: string[]) => string[], decorate: (rows: string[]) => string[]): string[] {
  const a = arena(city)
  return buildRoad(city, pad, decorate).map((r, y) => '##' + r + a[y])
}
