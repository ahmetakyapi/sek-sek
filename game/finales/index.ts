/**
 * Bölüm finalleri: meydan kapısı (@) oyuncuyu buraya geçirir.
 *   [duvar] varış + bayrak → meydan yolu (şehre özgü bulmaca / meydan okuma) → bayrak → patron arenası → kapı → çıkış
 * Meydan yolları şehir başına bir dosyada (game/finales/<şehir>.ts); arena burada, patronun hareketine göre kurulur.
 */
import { BOSSES } from '../boss'
import type { CityKey } from '../types'
import { prelude as istanbul } from './istanbul'
import { prelude as kocaeli } from './kocaeli'
import { prelude as izmir } from './izmir'
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
import type { Prelude } from './types'

export const PRELUDES: Record<CityKey, Prelude> = { istanbul, kocaeli, izmir, ankara, konya, nevsehir, adana, gaziantep, mardin, malatya, corum, ordu, trabzon, sivas, ardahan, bayburt }

const H = 24
const ICE: CityKey[] = ['sivas', 'ardahan']

/** Varış: kapıdan çıkılan yer, hemen yanında bayrak. */
const ARRIVAL = ['      ', ' & F  ', '######', '######', '######', '######']

/**
 * Arena: solda bayrak ve patronun nasıl yenileceğini söyleyen tabela, ortada 22 karoluk düz meydan (iki ucunda
 * fener, ortasında şehrin simge nesnesi: süsler patronun arkasında kalır, yolu kesmez)
 * (patron | ile duvar arasında gezer), sağda göğe kadar duvar ve patron yenilince açılan kapı (G), ardında
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
  // toslayan patronun üstünden atlamak için alçak bir sahanlık; sıçrayan ve atan için meydan boş kalır
  if (moves[0] === 'charge') rows[17] = rows[17].slice(0, 14) + '====' + rows[17].slice(18)
  return rows
}

/** Varış + meydan yolu (arena hariç): scripts/verify-prelude.ts tek başına da dener. */
export function buildRoad(city: CityKey, pad: (rows: string[]) => string[], decorate: (rows: string[]) => string[]): string[] {
  const parts = [pad(ARRIVAL), ...PRELUDES[city].chunks.map(pad)]
  return decorate(Array.from({ length: H }, (_, y) => parts.map((c) => c[y]).join('')))
}

export function buildFinale(city: CityKey, pad: (rows: string[]) => string[], decorate: (rows: string[]) => string[]): string[] {
  const a = arena(city)
  return buildRoad(city, pad, decorate).map((r, y) => '##' + r + a[y])
}
