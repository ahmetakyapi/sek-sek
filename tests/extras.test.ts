import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { SCARVES, markTournament, mergeTournament, tournamentFor, tournamentTotal, completes, dailyChallenge, dailyRun, ruleFits, ruleLimit, dailyScore, dayKey, duelFirst, duelResult, duelScoreWith, rushPlan, istanbulDay, liveStreak, markDaily, meets, mergeDaily, shiftDay, weekKey, weeklyChallenge, type DuelRounds, swapPhase, SWAP, RAGE_RULES, ruleLevel, SLIPPERY_OK, CRUMBLE_OK, MOON_OK, STORM_OK, HEAVY_OK, SHORT_DASH_OK, NO_MERCY_OK, GEZGIN_SIZES, gezginFor, gezginKey, gezginSeed, gezginTotal, dailyBoss, dailyMini, cleanTrio, markTrio, mergeTrio, settleTrio, trioCount, trioParts } from '../lib/extras'
import { bossLevel } from '../game/levels'
import { mirrorLevel } from '../game/mirror'
import { ACCESSORIES, HEROES, NO_KIT, earned, forHero, kitFor, walletOf } from '../game/accessories'
import { CHALLENGES, challengeLevel } from '../game/challenges'
import { ACHIEVEMENTS, freshAchievements, isEarned } from '../lib/achievements'
import { defaultSave, mergeSaves, nextUnplayed, resumeFor } from '../lib/storage'
import { ustaDone, ustaTask } from '../lib/ustalar'
import { MODES, NAME, TILE_ORDER, matchesQuery, modeForDigit, neighbor, passesFilter, recommend, type ModeFilter, type ModeId } from '../lib/modeHints'

describe('günün şehri ve haftanın görevi', () => {
  it('aynı gün aynı görev, açılmamış şehir çıkmaz', () => {
    for (let i = 0; i < 400; i++) {
      const d = new Date(2026, 0, 1 + i)
      const unlocked = i % LEVELS.length
      const a = dailyChallenge(d, LEVELS, unlocked)
      expect(a).toEqual(dailyChallenge(new Date(d.getTime() + 3600_000), LEVELS, unlocked))
      expect(LEVELS.findIndex((l) => l.id === a.levelId)).toBeLessThanOrEqual(unlocked)
      const w = weeklyChallenge(d, LEVELS, unlocked)
      expect(LEVELS.findIndex((l) => l.id === w.levelId)).toBeLessThanOrEqual(unlocked)
      expect(w.kinds).toHaveLength(2)
    }
  })

  it('dash atmadan bitir yalnız Kolay şehirde, sıfır düşüş yalnız Zor olmayan şehirde istenir', () => {
    for (let i = 0; i < 800; i++) {
      const ch = dailyChallenge(new Date(2026, 0, 1 + i), LEVELS, LEVELS.length - 1)
      const l = LEVELS.find((x) => x.id === ch.levelId)!
      if (ch.kinds.includes('noDash')) expect(l.difficulty).toBe('Kolay')
      if (ch.kinds.includes('noFall')) expect(['Kolay', 'Orta']).toContain(l.difficulty)
    }
  })

  it('hafta pazartesi başlar, yıl sonunda bölünmez', () => {
    expect(weekKey(new Date(2026, 10, 9))).toBe(weekKey(new Date(2026, 10, 15)))
    expect(weekKey(new Date(2026, 10, 15))).not.toBe(weekKey(new Date(2026, 10, 16)))
    expect(weekKey(new Date(2026, 11, 31))).toBe(weekKey(new Date(2027, 0, 1)))
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('görev koşulları ve Rahat Mod', () => {
    const l = LEVELS[0]
    const run = { timeMs: l.medals[0] * 1000, deaths: 0, dashes: 0, items: [true, true, true], relaxed: false }
    for (const k of ['noFall', 'fewFalls', 'noDash', 'silver', 'gold', 'collector'] as const) expect(meets(k, l, run)).toBe(true)
    expect(meets('gold', l, { ...run, timeMs: run.timeMs + 1 })).toBe(false)
    expect(meets('collector', l, { ...run, items: [true, false, true] })).toBe(false)
    const ch = { key: 'x', levelId: l.id, kinds: ['noFall' as const] }
    expect(completes(ch, l, run)).toBe(true)
    expect(completes(ch, l, { ...run, relaxed: true })).toBe(false)
    expect(completes(ch, LEVELS[1], run)).toBe(false)
  })

  it('atkılar: ilki açık, sonuncusu bütün nazarları ister', () => {
    expect(SCARVES[0].need).toBe(0)
    expect(SCARVES[SCARVES.length - 1].need).toBe(LEVELS.length)
    expect(new Set(SCARVES.map((s) => s.id)).size).toBe(SCARVES.length)
  })
})

describe('boss koşusu', () => {
  it('her şehrin arena bölümü: başlangıç, bayrak, boss, kapı ve çıkış var; tabela yok', () => {
    for (const l of LEVELS) {
      const b = bossLevel(l)
      const w = new World(b)
      expect(w.boss, l.id).toBeTruthy()
      expect(w.checkpoints.length, l.id).toBe(1)
      expect(b.map.join('').includes('?'), l.id).toBe(false)
      expect(w.exit.x, l.id).toBeGreaterThan(w.boss!.x)
    }
  })
})

describe('oynanmamış şehre yönlendirme', () => {
  const done = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { timeMs: 1000, deaths: 0, items: [true, true, true] }]))
  const all = LEVELS.map((l) => l.id)
  it('sona varmış ama araya giren şehirleri oynamamış oyuncu ilk oynanmamışa gider', () => {
    const s = { ...defaultSave(), unlocked: LEVELS.length - 1, best: done(all.filter((id) => !['eskisehir', 'kayseri', 'hatay'].includes(id))) }
    expect(LEVELS[resumeFor(s)].id).toBe('eskisehir')
    // son şehirden sonra sıradaki de oynanmamış ilk şehir
    expect(LEVELS[nextUnplayed(s, LEVELS.length - 1)!].id).toBe('eskisehir')
  })
  it('hepsi bitmişse devam son şehirde kalır, sıradaki yoktur', () => {
    const s = { ...defaultSave(), unlocked: LEVELS.length - 1, best: done(all) }
    expect(resumeFor(s)).toBe(LEVELS.length - 1)
    expect(nextUnplayed(s, LEVELS.length - 1)).toBeNull()
  })
  it('yolun ortasındaki oyuncu kaldığı şehirden devam eder', () => {
    const s = { ...defaultSave(), unlocked: 3, best: done(all.slice(0, 3)) }
    expect(resumeFor(s)).toBe(3)
  })
})

describe('Günlük Meydan Okuma', () => {
  it('herkes için aynı gün aynı şehir ve kural; art arda iki gün aynı şehir gelmez', () => {
    let prev = ''
    for (let i = 0; i < 120; i++) {
      const day = shiftDay('2026-11-01', i)
      const a = dailyRun(day, LEVELS)
      expect(dailyRun(day, LEVELS)).toEqual(a)
      expect(a.levelId).not.toBe(prev)
      prev = a.levelId
    }
  })
  it('skor süreye cezaları ekler', () => {
    expect(dailyScore('ceza', 60000, 2, 0)).toBe(60000 + 16000)
    expect(dailyScore('hatira', 60000, 1, 1)).toBe(60000 + 3000 + 40000)
    expect(dailyScore('hiz', 60000, 0, 3)).toBe(60000)
  })
  it('seri dün oynandıysa artar, gün atlanınca sıfırdan başlar', () => {
    let m = markDaily(null, '2026-11-10', 90000)
    m = markDaily(m, '2026-11-10', 80000)
    expect(m).toEqual({ day: '2026-11-10', bestMs: 80000, streak: 1 })
    m = markDaily(m, '2026-11-11', 99000)
    expect(m.streak).toBe(2)
    expect(liveStreak(m, '2026-11-12')).toBe(2)
    expect(liveStreak(m, '2026-11-13')).toBe(0)
    expect(markDaily(m, '2026-11-13', 1).streak).toBe(1)
    expect(mergeDaily(m, { day: '2026-11-11', bestMs: 50000, streak: 1 })).toEqual({ day: '2026-11-11', bestMs: 50000, streak: 2 })
    // buluttan çekmeden oynanan gün seriyi sıfırlamaz
    expect(mergeDaily({ day: '2026-11-12', bestMs: 1, streak: 1 }, { day: '2026-11-11', bestMs: 2, streak: 6 })?.streak).toBe(7)
  })
  it('İstanbul saatiyle gün döner', () => {
    expect(istanbulDay(new Date('2026-11-14T21:30:00Z'))).toBe('2026-11-15')
  })
})

describe('Düello', () => {
  const r = (score: number) => ({ timeMs: score, deaths: 0, score })
  it('tek turda düşük skor kazanır', () => {
    expect(duelResult([[r(5), r(6)]], 1)).toEqual({ over: true, winner: 0 })
    expect(duelResult([[r(5), null]], 1).over).toBe(false)
  })
  it('üç turluda iki tur alan kazanır, beraberlik fazladan tur açar', () => {
    expect(duelResult([[r(9), r(6)], [r(5), r(6)]], 3).over).toBe(false)
    expect(duelResult([[r(9), r(6)], [r(5), r(6)], [r(9), r(8)]], 3)).toEqual({ over: true, winner: 1 })
    const ties: DuelRounds = [[r(5), r(5)], [r(5), r(5)], [r(5), r(5)], [r(5), r(5)], [r(4), r(5)]]
    expect(duelResult(ties, 3)).toEqual({ over: true, winner: 0 })
    expect(duelResult(ties.slice(0, 4).concat([[r(5), r(5)]]), 3)).toEqual({ over: true, winner: -1 })
    // beş turda üç alan kazanır
    expect(duelResult([[r(5), r(6)], [r(5), r(6)]], 5).over).toBe(false)
    expect(duelResult([[r(5), r(6)], [r(5), r(6)], [r(5), r(6)]], 5)).toEqual({ over: true, winner: 0 })
    expect(duelFirst(0)).toBe(0)
    expect(duelFirst(1)).toBe(1)
  })
})

describe('kurallar', () => {
  it('Dash’siz yalnız kanıtlı şehirlerde çıkar; günün kuralı şehre uyar', () => {
    for (let i = 0; i < 200; i++) {
      const r = dailyRun(shiftDay('2026-11-01', i), LEVELS)
      expect(ruleFits(r.rule, LEVELS.find((l) => l.id === r.levelId)!)).toBe(true)
    }
    expect(ruleFits('dashsiz', LEVELS.find((l) => l.id === 'istanbul')!)).toBe(false)
    expect(ruleFits('dashsiz', LEVELS.find((l) => l.id === 'edirne')!)).toBe(true)
  })
  it('Zamana Karşı sınırı bronz süredir; Tek Can ve Bayraksız skora ceza eklemez', () => {
    const l = LEVELS[0]
    expect(ruleLimit('zaman', l)).toBe(l.medals[2])
    expect(ruleLimit('ceza', l)).toBeNull()
    expect(dailyScore('tekcan', 50000, 0, 0)).toBe(50000)
    expect(dailyScore('bayraksiz', 50000, 4, 1)).toBe(50000)
  })
})

describe('başarımlar', () => {
  it('kimlikler tekil, yeni oyuncu hiçbirini kazanmamış', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    expect(ACHIEVEMENTS.filter((a) => isEarned(a, defaultSave()))).toEqual([])
  })
  it('kayıttan hesaplanır; bildirilmiş olan bir daha çıkmaz', () => {
    const best = Object.fromEntries(LEVELS.map((l) => [l.id, { timeMs: l.medals[0] * 1000, deaths: 0, items: [true, true, true] }]))
    const all = Object.fromEntries(LEVELS.map((l) => [l.id, true]))
    const s = { ...defaultSave(), unlocked: LEVELS.length - 1, best, stamps: all, charms: all, bosses: all, feats: { cleanBoss: true } }
    const ids = freshAchievements(s).map((a) => a.id)
    for (const id of ['firstCity', 'allCities', 'keepsAll', 'stampsAll', 'charmsAll', 'bossesAll', 'goldAll', 'goldHard', 'cleanBoss']) expect(ids).toContain(id)
    expect(ids).not.toContain('flawlessHard')
    expect(freshAchievements({ ...s, ach: Object.fromEntries(ids.map((i) => [i, true])) })).toEqual([])
  })
})

describe('mücadele haritaları', () => {
  it('her kesit bir başlangıç ve bir çıkış taşır, toplanan ve bayrak taşımaz, şehrin rüzgârı kalır', () => {
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length)
    for (const c of CHALLENGES) {
      const l = challengeLevel(c)
      const src = LEVELS.find((x) => x.id === c.level)!
      expect(['Zor', 'Çok Zor']).toContain(src.difficulty)
      const text = l.map.join('\n')
      expect(text.match(/P/g)?.length, c.id).toBe(1)
      expect(text.match(/E/g)?.length, c.id).toBe(1)
      expect(text, c.id).not.toMatch(/[FC$!n?@&QGK]/)
      expect(l.map).toHaveLength(src.map.length)
      expect(l.wind).toBe(src.wind)
      const w = new World(l)
      expect(w.exit.x, c.id).toBeGreaterThan(w.start.x)
      expect(l.medals[0]).toBeLessThan(l.medals[1])
    }
  })
  it('bitirilen mücadeleler başarım sayılır', () => {
    const one = Object.fromEntries(CHALLENGES.slice(0, 3).map((c) => [c.id, 20000]))
    expect(freshAchievements({ ...defaultSave(), challenges: one }).map((a) => a.id)).toContain('challenge3')
    const all = Object.fromEntries(CHALLENGES.map((c) => [c.id, 20000]))
    expect(freshAchievements({ ...defaultSave(), challenges: all }).map((a) => a.id)).toContain('challengeAll')
  })
})

describe('haftalık turnuva', () => {
  it('her hafta üç farklı şehirden üç mücadele, aynı hafta hep aynı', () => {
    for (const w of ['2026-H46', '2026-H47', '2027-H01']) {
      const ids = tournamentFor(w)
      expect(ids).toEqual(tournamentFor(w))
      expect(new Set(ids.map((id) => CHALLENGES.find((c) => c.id === id)!.level)).size).toBe(3)
    }
    expect(tournamentFor('2026-H46')).not.toEqual(tournamentFor('2026-H47'))
  })
  it('kayıt: hafta dönünce sıfırlanır, aynı haftada en iyisi kalır, iki cihaz birleşir', () => {
    const [a, b, c] = tournamentFor('2026-H46')
    let m = markTournament(null, '2026-H46', a, 9000).mark
    expect(markTournament(m, '2026-H46', a, 9500).best).toBe(false)
    m = markTournament(m, '2026-H46', b, 8000).mark
    expect(tournamentTotal(m, '2026-H46')).toBeNull()
    m = markTournament(m, '2026-H46', c, 7000).mark
    expect(tournamentTotal(m, '2026-H46')).toBe(24000)
    expect(markTournament(m, '2026-H47', a, 9000).mark.best).toEqual({ [a]: 9000 })
    expect(mergeTournament({ week: '2026-H46', best: { [a]: 5000 } }, m)?.best[a]).toBe(5000)
    expect(mergeTournament({ week: '2026-H47', best: {} }, m)?.week).toBe('2026-H47')
  })
})

describe('Ayna Yolu', () => {
  it('harita sağdan sola döner, oklar ters bakar, rüzgâr ters eser; toplanan ve konuşan çıkar', () => {
    for (const l of LEVELS) {
      const m = mirrorLevel(l)
      const w = Math.max(...l.map.map((r) => r.length))
      expect(m.map.every((r) => r.length === w), l.id).toBe(true)
      expect(m.map.join(''), l.id).not.toMatch(/[C$!n?]/)
      const count = (map: string[], c: string) => map.join('').split(c).length - 1
      expect(count(m.map, '<')).toBe(count(l.map, '>'))
      expect(count(m.map, 'P')).toBe(1)
      expect(m.wind ?? 0).toBe(l.wind ? -l.wind : 0)
      const a = new World(l)
      const b = new World(m)
      // başlangıç tam ayna yerinde
      expect(b.start.x).toBeCloseTo(a.cols * 16 - a.start.x - 12)
    }
  })
})

describe('Kılık Dükkânı', () => {
  it('cüzdan kazanılan parçadan o karakterin aldıklarının fiyatı düşülerek hesaplanır, eksiye inmez', () => {
    expect(walletOf(40, {}, 'uktun')).toBe(40)
    // yolcuya özgü alım yalnız o yolcunun cüzdanını azaltır
    expect(walletOf(40, { 'uktun:papatya': true, 'uktun:gozluk': true }, 'uktun')).toBe(40 - 10 - 12)
    expect(walletOf(40, { 'uktun:papatya': true, 'uktun:gozluk': true }, 'memo')).toBe(40)
    // karakter ayrımından önce alınan (düz kimlik) iki yolcuya da açıktır ve ikisinin cüzdanından düşer
    expect(walletOf(40, { gozluk: true }, 'uktun')).toBe(28)
    expect(walletOf(40, { gozluk: true }, 'memo')).toBe(28)
    // başka yolcunun parçası dolapta yoktur: fiyatı düşülmez
    expect(walletOf(40, { papatya: true }, 'memo')).toBe(40)
    expect(walletOf(10, { 'memo:fes': true }, 'memo')).toBe(0)
    expect(new Set(ACCESSORIES.map((a) => a.id)).size).toBe(ACCESSORIES.length)
  })
  it('parça: hatıra, pul, nazar 1 · boss 2 · Usta Mührü 3; oyunun tamamı her karakterin dolabını alır', () => {
    expect(earned(10, 2, 1)).toBe(17)
    const all = earned(LEVELS.length * 5, LEVELS.length, LEVELS.length)
    for (const h of HEROES) {
      const prices = forHero(h).filter((a) => a.seals === undefined).reduce((a, x) => a + x.price, 0)
      expect(all).toBeGreaterThanOrEqual(prices)
      // hepsi alınca oyunun parçasının büyük kısmı harcanmış olur (seçim anlamlı kalsın)
      expect(prices).toBeGreaterThan(all * 0.8)
    }
  })
  it('her karakterin her yuvada en az üç özel parçası var; ortak parçalar iki dolapta da', () => {
    for (const h of HEROES)
      for (const slot of ['head', 'face', 'back'] as const) expect(ACCESSORIES.filter((a) => a.for === h && a.slot === slot).length).toBeGreaterThanOrEqual(3)
    const common = ACCESSORIES.filter((a) => !a.for)
    expect(common.length).toBeGreaterThan(0)
    for (const a of common) expect(forHero('uktun')).toContain(a), expect(forHero('memo')).toContain(a)
    // özel parça öbür karakterin dolabında yok
    for (const a of ACCESSORIES.filter((x) => x.for)) expect(forHero(a.for === 'uktun' ? 'memo' : 'uktun')).not.toContain(a)
  })
  it('kombin: yuva başına bir parça; eski tek aksesuar kendi yuvasına geçer, bilinmeyen, yanlış yuva ya da başka karakterin parçası boş sayılır', () => {
    expect(kitFor('uktun', undefined, undefined)).toEqual(NO_KIT)
    expect(kitFor('uktun', undefined, 'heybe')).toEqual({ ...NO_KIT, back: 'heybe' })
    expect(kitFor('uktun', undefined, 'yok-boyle')).toEqual(NO_KIT)
    expect(kitFor('uktun', { head: 'fes', face: 'gunes', back: 'pelerin' })).toEqual({ head: 'fes', face: 'gunes', back: 'pelerin' })
    expect(kitFor('uktun', { head: 'gozluk', face: 'fes' })).toEqual(NO_KIT)
    // yeni kayıt eskisinin önüne geçer
    expect(kitFor('uktun', { face: 'kayak' }, 'fes')).toEqual({ ...NO_KIT, face: 'kayak' })
    // karakterlere özgü
    expect(kitFor('uktun', { head: 'fiyonk', face: 'bant' })).toEqual({ ...NO_KIT, head: 'fiyonk' })
    expect(kitFor('memo', { head: 'fiyonk', face: 'bant', back: 'okluk' })).toEqual({ head: 'yok', face: 'bant', back: 'okluk' })
    expect(kitFor('memo', undefined, 'papatya')).toEqual(NO_KIT)
  })
})

describe('şehir ustaları', () => {
  const lv = LEVELS[0]
  const base = { timeMs: 999999, deaths: 2, items: [true, false, true], stamp: false, charm: true, cleanBoss: false, relaxed: false }
  it('görev türleri şehirden şehre döner, art arda aynı görev yok', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(ustaTask(i)).not.toBe(ustaTask(i - 1))
    expect(new Set(LEVELS.map((_, i) => ustaTask(i))).size).toBe(5)
  })
  it('görev koşunun sonucundan doğrulanır; Rahat Mod sayılmaz', () => {
    expect(ustaDone('items', lv, base)).toBe(false)
    expect(ustaDone('items', lv, { ...base, items: [true, true, true] })).toBe(true)
    expect(ustaDone('nodeath', lv, { ...base, deaths: 0 })).toBe(true)
    expect(ustaDone('secrets', lv, { ...base, stamp: true })).toBe(true)
    expect(ustaDone('cleanBoss', lv, { ...base, cleanBoss: true })).toBe(true)
    expect(ustaDone('gold', lv, { ...base, timeMs: lv.medals[0] * 1000 - 1 })).toBe(true)
    expect(ustaDone('gold', lv, base)).toBe(false)
    expect(ustaDone('nodeath', lv, { ...base, deaths: 0, relaxed: true })).toBe(false)
  })
  it('her şehrin bir ustası (ilk şehir insanı) var', () => {
    for (const l of LEVELS) expect(l.npcs.length).toBeGreaterThan(0)
  })
})

describe('sinir bozucu modlar', () => {
  it('Ters Tuşlar: turun sonunda ters, dönmeden ve düzelmeden önce uyarı', () => {
    expect(swapPhase(0).flipped).toBe(false)
    expect(swapPhase(SWAP.cycle - SWAP.flipped - 0.5)).toEqual({ flipped: false, warn: true })
    expect(swapPhase(SWAP.cycle - SWAP.flipped + 0.5)).toEqual({ flipped: true, warn: false })
    expect(swapPhase(SWAP.cycle - 0.5)).toEqual({ flipped: true, warn: true })
    expect(swapPhase(SWAP.cycle + 0.1).flipped).toBe(false)
  })
  it('günlük meydan okuma zor mod seçmez; zor modlar fiziği yalnız bölüme yazar', () => {
    for (let d = 0; d < 200; d++) expect(RAGE_RULES).not.toContain(dailyRun(shiftDay('2026-11-16', d), LEVELS).rule)
    const lv = LEVELS[0]
    expect(ruleLevel('kaygan', lv).slippery).toBe(true)
    expect(ruleLevel('sonnefes', lv).crumbleAll).toBe(true)
    expect(ruleLevel('ters', lv)).toBe(lv)
    expect(ruleLevel('kaygan', lv).map).toBe(lv.map)
    expect(ruleLevel('ay', lv).lowGravity).toBe(true)
    expect(ruleLevel('firtina', lv).storm).toBe(true)
    expect(ruleLevel('firtina', lv).wind).toBeGreaterThan(0)
    expect(ruleLevel('agir', lv).heavy).toBe(true)
    expect(ruleLevel('kisadash', lv).shortDash).toBe(true)
    expect(ruleLevel('afyok', lv).noMercy).toBe(true)
    expect(ruleLevel('deprem', lv)).toBe(lv)
    expect(RAGE_RULES.length).toBe(23)
  })
  it('kaygan ve çöken modlar yalnız kanıtlanmış şehirlerde açılır', () => {
    for (const lv of LEVELS) {
      expect(ruleFits('kaygan', lv)).toBe(SLIPPERY_OK.includes(lv.id))
      expect(ruleFits('kabus', lv)).toBe(SLIPPERY_OK.includes(lv.id))
      expect(ruleFits('coken', lv)).toBe(CRUMBLE_OK.includes(lv.id))
      expect(ruleFits('cehennem', lv)).toBe(true)
      expect(ruleFits('ters', lv)).toBe(true)
      // yalnız görüntüyü değiştiren modlar her şehirde açık; kaos kaygan fiziğe bağlı
      for (const r of ['karanlik', 'basasagi', 'aynaekran', 'turbo', 'geceyarisi'] as const) expect(ruleFits(r, lv)).toBe(true)
      expect(ruleFits('kaos', lv)).toBe(SLIPPERY_OK.includes(lv.id))
      expect(ruleFits('ay', lv)).toBe(MOON_OK.includes(lv.id))
      expect(ruleFits('firtina', lv)).toBe(STORM_OK.includes(lv.id))
      for (const r of ['gorunmez', 'hayalet', 'dar', 'korkabus', 'deprem'] as const) expect(ruleFits(r, lv)).toBe(true)
      expect(ruleFits('agir', lv)).toBe(HEAVY_OK.includes(lv.id))
      expect(ruleFits('kisadash', lv)).toBe(SHORT_DASH_OK.includes(lv.id))
      expect(ruleFits('afyok', lv)).toBe(NO_MERCY_OK.includes(lv.id))
    }
    // kanıtlı listeler gerçek şehirlerden oluşur
    for (const id of [...HEAVY_OK, ...SHORT_DASH_OK, ...NO_MERCY_OK]) expect(LEVELS.some((l) => l.id === id)).toBe(true)
  })
  it('yeni fizik kuralları sim\'de gerçekten fark yaratır', () => {
    const lv = LEVELS[0]
    const jumpApex = (level: typeof lv) => {
      const w = new World(level)
      const idle = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, dash: false, dashPressed: false } as never
      for (let i = 0; i < 240; i++) w.step(1 / 120, idle)
      const y0 = w.player.y
      let top = y0
      w.step(1 / 120, { ...(idle as object), jump: true, jumpPressed: true } as never)
      for (let i = 0; i < 160; i++) {
        w.step(1 / 120, { ...(idle as object), jump: true } as never)
        top = Math.min(top, w.player.y)
      }
      return y0 - top
    }
    expect(jumpApex(ruleLevel('agir', lv))).toBeLessThan(jumpApex(lv) - 4)
  })
  it('Gezgin Turu: tohum aynı kesitleri verir, şehirler tekrar etmez', () => {
    expect(gezginFor('yol', 4)).toEqual(gezginFor('YOL', 4))
    expect(gezginSeed(' ağ ac!! ')).toBe('AĞAC')
    for (const seed of ['YOL', 'ABCDE', '20261121', 'ÇAY']) {
      for (const n of GEZGIN_SIZES) {
        const ids = gezginFor(seed, n)
        expect(ids.length).toBe(n)
        expect(new Set(ids.map((id) => CHALLENGES.find((c) => c.id === id)!.level)).size).toBe(n)
      }
    }
    expect(gezginFor('A', 3)).not.toEqual(gezginFor('B', 3))
    expect(gezginKey('yol', 4)).toBe('YOL:4')
    const ids = gezginFor('YOL', 3)
    expect(gezginTotal(ids, { [ids[0]]: 1000, [ids[1]]: 2000 })).toBeNull()
    expect(gezginTotal(ids, { [ids[0]]: 1000, [ids[1]]: 2000, [ids[2]]: 3000 })).toBe(6000)
  })
  it('Gezgin Turu rekoru bulutla birleşir: küçük olan kalır', () => {
    const a = { ...defaultSave(), gezgin: { 'YOL:4': 90000, 'AB:3': 50000 } }
    const b = { ...defaultSave(), gezgin: { 'YOL:4': 80000 } }
    expect(mergeSaves(a, b).gezgin).toEqual({ 'YOL:4': 80000, 'AB:3': 50000 })
  })
  it('Sakin Gezi: düşüş sayılmaz', () => {
    const w = new World({ ...LEVELS[0], calm: true })
    w.kill()
    expect(w.deaths).toBe(0)
    const n = new World(LEVELS[0])
    n.kill()
    expect(n.deaths).toBe(1)
  })
})

describe('düello şartları ve Boss Rush çeşitleri', () => {
  it('skor: süre + düşüş cezası − hatıra − avantaj; bitiremeyen DNF', () => {
    const terms = { penalty: 5 as const, itemBonus: 5 as const, handicap: [0, 3] as [number, number] }
    expect(duelScoreWith(terms, 0, 30000, 2, 1)).toBe(30000 + 10000 - 5000)
    expect(duelScoreWith(terms, 1, 30000, 0, 0)).toBe(27000)
    expect(duelScoreWith(terms, 0, 1000, 0, 3)).toBe(0)
    expect(duelScoreWith(terms, 0, 1e9, 0, 0, 1e9)).toBe(1e9)
  })
  it('çifte Boss Rush boss\'ları ikişer eşler, tek kalan yalnız çıkar', () => {
    expect(rushPlan([1, 2, 3], undefined)).toEqual({ order: [1, 2, 3] })
    expect(rushPlan([1, 2, 3, 4, 5], 'cifte')).toEqual({ order: [1, 3, 5], pairs: [2, 4, -1] })
  })
})

describe('Günün Üçlüsü', () => {
  const days = Array.from({ length: 60 }, (_, i) => shiftDay('2026-11-01', i))
  it('günün mücadelesi ve boss\'u tarihe bağlı, herkes için aynı; art arda iki gün aynı gelmez', () => {
    for (const d of days) {
      expect(dailyMini(d)).toBe(dailyMini(d))
      expect(CHALLENGES.some((c) => c.id === dailyMini(d))).toBe(true)
      expect(dailyMini(d)).not.toBe(dailyMini(shiftDay(d, -1)))
      const b = dailyBoss(d, LEVELS)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(LEVELS.length)
      expect(b).not.toBe(dailyBoss(shiftDay(d, -1), LEVELS))
      // meydan okuma şehriyle çakışmaz: üç ayrı iş
      expect(LEVELS[b].id).not.toBe(dailyRun(d, LEVELS).levelId)
    }
    expect(new Set(days.map((d) => dailyMini(d))).size).toBeGreaterThan(5)
    expect(new Set(days.map((d) => dailyBoss(d, LEVELS))).size).toBeGreaterThan(15)
  })
  it('parça en iyi süreyle tutulur, yeni günde sıfırlanır, Üçlü günde bir kez sayılır', () => {
    const d = '2026-11-21'
    const daily = { day: d, bestMs: 90000, streak: 1 }
    let a = markTrio(null, d, 'mini', 20000)
    expect(a.best).toBe(true)
    a = markTrio(a.mark, d, 'mini', 25000)
    expect(a.best).toBe(false)
    expect(a.mark.mini).toBe(20000)
    expect(settleTrio(a.mark, d, daily)!.days).toBe(0)
    const b = markTrio(a.mark, d, 'boss', 40000).mark
    expect(trioCount(trioParts(b, d, daily))).toBe(3)
    const done = settleTrio(b, d, daily)!
    expect(done).toMatchObject({ days: 1, last: d })
    expect(settleTrio(done, d, daily)!.days).toBe(1)
    // meydan okuma yapılmadıysa üçlü sayılmaz
    expect(settleTrio(b, d, null)!.days).toBe(0)
    // ertesi gün parçalar sıfır, sayaç sürer
    const n = markTrio(done, shiftDay(d, 1), 'boss', 30000).mark
    expect(n).toMatchObject({ day: shiftDay(d, 1), boss: 30000, days: 1 })
    expect(n.mini).toBeUndefined()
  })
  it('iki cihazın izi birleşir: sayaç kaybolmaz, aynı günde en iyi süreler', () => {
    const x = { day: '2026-11-21', mini: 20000, days: 3, last: '2026-11-20' }
    const y = { day: '2026-11-21', mini: 18000, boss: 50000, days: 5, last: '2026-11-19' }
    expect(mergeTrio(x, y)).toEqual({ day: '2026-11-21', mini: 18000, boss: 50000, days: 5, last: '2026-11-20' })
    expect(mergeTrio(x, null)).toBe(x)
    expect(mergeTrio({ ...x, day: '2026-11-22', mini: undefined }, y)!.mini).toBeUndefined()
  })
  it('bozuk iz biçime zorlanır', () => {
    expect(cleanTrio('x')).toBeNull()
    expect(cleanTrio({ day: 5, mini: -1, boss: 'a', days: 1e9, last: '2026-11-21' })).toEqual({ day: '', mini: undefined, boss: undefined, days: 5000, last: '2026-11-21' })
  })
})

describe('Modlar ekranı: arama, süzgeç, öneri, gezinti', () => {
  const base = { cities: 0, ruleRecords: 0, bossesBeaten: 0, rushNeeds: 3, rushPlayed: false, dailyUsed: false, trioDone: 0, mirrorOpen: false, mirrorDone: 0, challengeDone: 0 }

  it('aramada Türkçe harf farkı ve büyük küçük harf yok sayılır', () => {
    expect(matchesQuery('mucadele', ['Mücadeleler'])).toBe(true)
    expect(matchesQuery('KANGAL', ['Kovalamaca', 'Kangal izini sürer'])).toBe(true)
    expect(matchesQuery('ıspanak', ['İspanak'])).toBe(true)
    expect(matchesQuery('iki kisi', ['Co-op', 'iki yolcu', '2 Kişi'])).toBe(true)
    expect(matchesQuery('boss yok', ['Boss Rush'])).toBe(false)
    expect(matchesQuery('   ', ['x'])).toBe(true)
  })

  it('süzgeçler kataloğa uyar', () => {
    const ids = Object.keys(MODES) as ModeId[]
    const by = (f: ModeFilter) => ids.filter((id) => passesFilter(f, id, true))
    expect(by('all')).toHaveLength(ids.length)
    expect(by('together').sort()).toEqual(['coop', 'duel'])
    expect(by('solo').length + by('together').length).toBe(ids.length)
    expect(by('hard').every((id) => MODES[id].heat === 3)).toBe(true)
    expect(by('new')).toContain('trio')
    expect(by('ranked')).toContain('rush')
    expect(by('ranked')).not.toContain('duel')
    expect(passesFilter('open', 'rush', false)).toBe(false)
    expect(passesFilter('open', 'rush', true)).toBe(true)
  })

  it('her ızgara kutucuğunun kaydı ve (sayfa açmayanın) nasıl oynanır adımı var; sayı tuşları ilk dokuzu açar', () => {
    for (const id of TILE_ORDER) {
      expect(MODES[id]).toBeDefined()
      expect(NAME[id]).toBeTruthy()
      if (id !== 'editor' && id !== 'community') expect(MODES[id].howto.length).toBeGreaterThanOrEqual(2)
    }
    expect(modeForDigit('1')).toBe(TILE_ORDER[0])
    expect(modeForDigit('9')).toBe(TILE_ORDER[8])
    expect(modeForDigit('0')).toBeNull()
    expect(modeForDigit('a')).toBeNull()
    expect(modeForDigit('12')).toBeNull()
  })

  it('öneri: hiç oynamamışa günlük ve Co-op, yeni bitirene Kurallı Koşu, boss yenene Boss Rush', () => {
    expect(recommend(base).map((r) => r.id)).toEqual(['daily', 'coop'])
    expect(recommend({ ...base, cities: 1, dailyUsed: true, trioDone: 1 }).map((r) => r.id)).toEqual(['trio', 'rules'])
    expect(recommend({ ...base, cities: 2, dailyUsed: true, trioDone: 3 })[0].id).toBe('rules')
    expect(recommend({ ...base, cities: 8, dailyUsed: true, trioDone: 3, bossesBeaten: 4, ruleRecords: 2 })[0].id).toBe('rush')
    expect(recommend({ ...base, cities: 8, dailyUsed: false })[0].id).toBe('daily')
    expect(recommend({ ...base, cities: 30, dailyUsed: true, trioDone: 3, ruleRecords: 1, bossesBeaten: 9, rushPlayed: true, mirrorOpen: true })[0].id).toBe('mirror')
  })

  it('öneri en çok ikidir, tekrarsızdır ve Devam Et\'teki modu önermez', () => {
    for (let c = 0; c <= 40; c += 5) {
      for (const dailyUsed of [false, true]) {
        for (const trioDone of [0, 1, 3]) {
          const r = recommend({ ...base, cities: c, dailyUsed, trioDone, bossesBeaten: c, last: 'rules' })
          expect(r.length).toBeLessThanOrEqual(2)
          expect(new Set(r.map((x) => x.id)).size).toBe(r.length)
          expect(r.some((x) => x.id === 'rules')).toBe(false)
        }
      }
    }
    expect(recommend({ ...base, cities: 1, dailyUsed: true, trioDone: 3 }).length).toBeGreaterThan(0)
  })

  it('oklarla gezinti: 4 sütunlu ızgarada sağ-sol bir adım, aşağı-yukarı alttaki satırın en yakını', () => {
    const boxes = Array.from({ length: 10 }, (_, i) => ({ x: (i % 4) * 100, y: Math.floor(i / 4) * 80, w: 90, h: 70 }))
    expect(neighbor(boxes, 5, 'right')).toBe(6)
    expect(neighbor(boxes, 0, 'left')).toBe(0)
    expect(neighbor(boxes, 9, 'right')).toBe(9)
    expect(neighbor(boxes, 1, 'down')).toBe(5)
    expect(neighbor(boxes, 5, 'up')).toBe(1)
    expect(neighbor(boxes, 3, 'down')).toBe(7)
    expect(neighbor(boxes, 3, 'up')).toBe(3)
    // son satırda eksik sütun: en yakın dolu kutucuk
    expect(neighbor(boxes, 7, 'down')).toBe(9)
    expect(neighbor(boxes, 0, 'down')).toBe(4)
  })
})
