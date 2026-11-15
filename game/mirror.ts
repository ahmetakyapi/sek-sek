import type { LevelDef } from './types'

/**
 * Ayna Yolu (Yeni Oyun+): şehrin haritası sağdan sola çevrilir. Fizik sağ-sol simetrik olduğu için asıl harita
 * bitirilebiliyorsa aynası da bitirilir (ok tuzakları ters yöne döner, rüzgâr ters eser, platformlar ayna fazında
 * başlar: sim.ts `mirror`). Toplananlar, tabelalar ve şehir insanları çıkarılır: Ayna Yolu yalnız koşudur.
 * Kanıt: `npx tsx scripts/verify-mirror.ts [şehir]` (çözücü aynalı haritayı baştan sona bitirir; çözücü de Ayna Yolu'nda
 * sola doğru arar). Şehir haritası değişince o şehrin aynasını da koş.
 */
const SWAP: Record<string, string> = { '<': '>', '>': '<' }
const STRIP = /[C$!n?]/g

export function mirrorLevel(l: LevelDef): LevelDef {
  const w = Math.max(...l.map.map((r) => r.length))
  const map = l.map.map((r) =>
    r
      .padEnd(w, ' ')
      .split('')
      .reverse()
      .map((c) => SWAP[c] ?? c)
      .join('')
      .replace(STRIP, ' '),
  )
  return { ...l, id: `ayna-${l.id}`, map, wind: l.wind ? -l.wind : undefined, hints: [], npcs: [], finaleAt: undefined, mirror: true }
}

