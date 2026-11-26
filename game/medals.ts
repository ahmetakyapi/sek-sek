/**
 * Madalyalar (altın, gümüş, bronz; sn): her şehrin kusursuz koşusundan hesaplanır, elle yazılmaz.
 *   altın = çözücü süresi × 1,4 + insan paylı boss botunun süresi × 1,1 · gümüş = altın × 1,3 · bronz = altın × 1,75
 * hepsi 5 saniyeye yuvarlanır ve levels.ts'teki eski süreden uzun olmaz (16 Kasım 2026: madalyalar kısaltıldı).
 * Çözücü süresi `npx tsx scripts/solver-time.ts <şehir>`, boss süresi `npx tsx scripts/bossbot.ts <şehir>` ("insan paylı").
 * Haritası ya da boss'u değişen şehirde ikisini yeniden ölç (tests/antiCheat.test.ts de SOLVER_TIME'ı kullanır).
 */
/** çözücünün çıkışa vardığı süre (sn; boss'suz, düşman ve ok kapalı) */
export const SOLVER_TIME: Record<string, number> = {
  istanbul: 60.3, edirne: 53.0, kocaeli: 51.3, bursa: 53.6, eskisehir: 52.6, canakkale: 52.6, izmir: 56.1,
  antalya: 52.7, ankara: 73.6, konya: 74.7, nevsehir: 95.2, kayseri: 53.1, adana: 52.6, hatay: 56.1,
  gaziantep: 71.6, sanliurfa: 48.6, diyarbakir: 52.5, mardin: 57.2, malatya: 53.1, corum: 58.2, sinop: 56.4,
  ordu: 71.3, trabzon: 58.8, sivas: 65.0, van: 58.3, erzurum: 72.2, ardahan: 60.7, amasya: 93.7, mugla: 66.5,
  bayburt: 81.3, rize: 56.7, artvin: 68.5, kars: 60.1, bitlis: 58.0, agri: 72.0, giresun: 66.2, tokat: 60.7, denizli: 59.8, zonguldak: 77.8, mersin: 62.7, karabuk: 68.6,
  aydin: 62.6,
  balikesir: 50.0,
  elazig: 64.1,
  afyon: 65.6,
  bingol: 53.0,
  adiyaman: 64.9,
  kastamonu: 65.2,
}

/** insan paylı boss botunun boss'u yendiği süre (sn) */
export const BOSS_TIME: Record<string, number> = {
  istanbul: 17, edirne: 18, kocaeli: 17, bursa: 17, eskisehir: 14, canakkale: 85, izmir: 19, antalya: 22,
  ankara: 31, konya: 16, nevsehir: 31, kayseri: 30, adana: 23, hatay: 26, gaziantep: 14, sanliurfa: 36,
  diyarbakir: 115, mardin: 43, corum: 132, malatya: 29, sinop: 45, ordu: 54, trabzon: 47, sivas: 68, van: 53, erzurum: 29,
  ardahan: 31, amasya: 27, mugla: 29, bayburt: 60, rize: 36, artvin: 37, kars: 74, bitlis: 25, agri: 38,
  giresun: 21, tokat: 67,
  denizli: 54,
  zonguldak: 33,
  mersin: 34,
  karabuk: 67,
  aydin: 39,
  balikesir: 51,
  elazig: 63,
  afyon: 83,
  bingol: 89,
  adiyaman: 21,
  kastamonu: 120,
}

const up5 = (s: number) => Math.ceil(s / 5) * 5

/** şehrin madalyaları: ölçüm varsa formülden (eskisinden uzun olmaz), yoksa eskisi */
export function medalsFor(id: string, old: [number, number, number]): [number, number, number] {
  const s = SOLVER_TIME[id]
  const b = BOSS_TIME[id]
  if (s === undefined || b === undefined) return old
  const gold = Math.min(old[0], up5(s * 1.4 + b * 1.1))
  const silver = Math.max(gold + 10, Math.min(old[1], up5(gold * 1.3)))
  const bronze = Math.max(silver + 10, Math.min(old[2], up5(gold * 1.75)))
  return [gold, silver, bronze]
}
