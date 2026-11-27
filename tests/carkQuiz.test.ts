import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { BOSSES } from '../game/boss'
import { ruleFits, type DailyRule } from '../lib/extras'
import { RULE_ART } from '../components/RuleArt'
import { CARK_PAID, CARK_RULES, CARK_SLICES, carkCities, carkCoins, carkLeft, carkReward, carkSeed, cleanCark, mergeCark, spinCark, spinMark, winMark } from '../lib/cark'
import { QUIZ_MIN, QUIZ_PRIZE, QUIZ_SIZE, cleanQuiz, draftCity, makeQuiz, markQuiz, mergeQuiz, quizCoins, quizInfo, quizPoints, quizPrompt } from '../lib/quiz'
import { cleanIncoming, defaultSave, mergeSaves } from '../lib/storage'

const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
const rw = (r: DailyRule) => carkReward(RULE_ART[r].heat)
const ready = LEVELS.filter((l) => !draftCity(l))

describe('Çark-ı Felek', () => {
  it('aynı tohum aynı çevirme; şehir havuzdan, kural o şehirde kanıtlı (ruleFits)', () => {
    for (let i = 0; i < 400; i++) {
      const seed = `2026-11-${10 + (i % 20)}:${i}`
      const pool = ready.slice(0, 1 + (i % ready.length))
      const a = spinCark(seed, pool)!
      expect(a).toEqual(spinCark(seed, pool))
      const lv = pool.find((l) => l.id === a.levelId)!
      expect(lv).toBeDefined()
      expect(ruleFits(a.rule, lv)).toBe(true)
      expect(a.wheel[a.slot]).toBe(a.rule)
      expect(a.wheel.length).toBeLessThanOrEqual(CARK_SLICES)
      expect(new Set(a.wheel).size).toBe(a.wheel.length)
      for (const r of a.wheel) expect(ruleFits(r, lv)).toBe(true)
    }
    expect(spinCark('x', [])).toBeNull()
  })

  it('Dash’siz yalnız NO_DASH_OK şehrinde, kaygan yalnız kanıtlı şehirde çıkar', () => {
    const ist = LEVELS.find((l) => l.id === 'istanbul')!
    for (let i = 0; i < 300; i++) expect(spinCark(`s${i}`, [ist])!.rule).not.toBe('dashsiz')
    const sivas = LEVELS.find((l) => l.id === 'sivas')!
    for (let i = 0; i < 300; i++) expect(spinCark(`s${i}`, [sivas])!.rule).not.toBe('kovala')
  })

  it('TASLAK metinli şehir havuza girmez; havuz yalnız bitirilmiş şehirler', () => {
    const pool = carkCities(LEVELS, () => true)
    expect(pool.every((l) => !draftCity(l))).toBe(true)
    expect(carkCities(LEVELS, (id) => id === 'istanbul').map((l) => l.id)).toEqual(['istanbul'])
  })

  it('günde üç ödüllü çevirme, seri ve parça; bitirilmeden yeniden çevirmek seriyi bitirir', () => {
    const day = '2026-11-27'
    let m = spinMark(null, day, { levelId: 'istanbul', rule: 'ceza' })
    expect(m.open?.paid).toBe(true)
    let w = winMark(m, day, 'istanbul', 'ceza', RULE_ART.ceza.heat)
    expect(w.coins).toBe(rw('ceza'))
    expect(w.mark.streak).toBe(1)
    m = w.mark
    // başka bir koşunun bitişi çarkı saymaz
    expect(winMark(m, day, 'istanbul', 'ceza', RULE_ART.ceza.heat).coins).toBe(0)
    m = spinMark(m, day, { levelId: 'edirne', rule: 'kabus' })
    m = winMark(m, day, 'edirne', 'kabus', RULE_ART.kabus.heat).mark
    expect(m.streak).toBe(2)
    m = spinMark(m, day, { levelId: 'bursa', rule: 'tekcan' })
    expect(carkLeft(m, day)).toBe(0)
    // bitirmeden yeniden: seri sıfır, bu çevirme ödülsüz
    m = spinMark(m, day, { levelId: 'izmir', rule: 'hiz' })
    expect(m.streak).toBe(0)
    expect(m.open?.paid).toBe(false)
    w = winMark(m, day, 'izmir', 'hiz', RULE_ART.hiz.heat)
    expect(w.coins).toBe(0)
    expect(w.mark.streak).toBe(1)
    expect(w.mark.bestStreak).toBe(2)
    expect(carkCoins(w.mark)).toBe(rw('ceza') + rw('kabus'))
    // ertesi gün haklar yenilenir; tohum her çevirmede değişir
    expect(carkLeft(w.mark, '2026-11-28')).toBe(CARK_PAID)
    expect(carkSeed(w.mark, day)).not.toBe(carkSeed(m, day).replace(/:\d+$/, ':0'))
  })

  it('zor kural çok parça verir; her kuralın ödülü var', () => {
    for (const r of CARK_RULES) expect(rw(r)).toBeGreaterThan(0)
    expect(rw('kabus')).toBeGreaterThan(rw('ceza'))
  })

  it('bulutla birleşme: kazanç gün gün en çoğu, hiçbir şey kaybolmaz; bozuk gövde temizlenir', () => {
    const a = { day: '2026-11-27', spins: 2, total: 5, streak: 2, bestStreak: 4, wins: 5, earn: { '2026-11-26': 6, '2026-11-27': 4 }, open: null }
    const b = { day: '2026-11-27', spins: 3, total: 7, streak: 1, bestStreak: 3, wins: 6, earn: { '2026-11-25': 8, '2026-11-27': 3 }, open: { levelId: 'van', rule: 'ceza' as const, paid: false } }
    const m = mergeCark(a, b)!
    expect(m.earn).toEqual({ '2026-11-25': 8, '2026-11-26': 6, '2026-11-27': 4 })
    expect(m.spins).toBe(3)
    expect(m.total).toBe(7)
    expect(m.bestStreak).toBe(4)
    expect(m.open?.levelId).toBe('van')
    expect(mergeCark(null, a)).toEqual(a)
    const s = mergeSaves({ ...defaultSave(), cark: a }, { ...defaultSave(), cark: b })
    expect(carkCoins(s.cark)).toBe(18)
    expect(cleanCark({ day: 'kötü', spins: 99, earn: { x: 5, '2026-11-01': 1e9, __proto__: 1 }, open: { levelId: 'van', rule: 'yok' } })).toEqual({ day: '', spins: CARK_PAID, total: 0, streak: 0, bestStreak: 0, wins: 0, earn: { '2026-11-01': 24 }, open: null })
    expect(cleanCark('x')).toBeNull()
    expect(cleanIncoming({ cark: 5, quiz: [] }).cark).toBeNull()
  })
})

describe('Defter Bilmecesi', () => {
  it('aynı tohum aynı sınav; on soru, şehir tekrar etmez, dört benzersiz seçenek, doğru yanıt içinde', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuiz(`t${i}`, ready)
      expect(q).toEqual(makeQuiz(`t${i}`, ready))
      expect(q).toHaveLength(QUIZ_SIZE)
      expect(new Set(q.map((x) => x.city)).size).toBe(q.length)
      for (const x of q) {
        expect(x.options).toHaveLength(4)
        expect(new Set(x.options).size).toBe(4)
        expect(x.options).toContain(x.city)
      }
    }
  })

  it('ipucu şehrin adını vermez ve başka seçeneğe de uymaz; metin TR ve EN dolu', () => {
    for (let i = 0; i < 100; i++)
      for (const x of makeQuiz(`k${i}`, ready)) {
        const lv = LEVELS.find((l) => l.id === x.city)!
        for (const lang of ['tr', 'en'] as const) {
          const p = quizPrompt(x, lv, lang)
          expect(p.length).toBeGreaterThan(0)
          expect(fold(p)).not.toContain(fold(lv.name))
          expect(quizInfo(x, lv, lang).length).toBeGreaterThan(0)
          for (const o of x.options.filter((id) => id !== x.city)) {
            const ol = LEVELS.find((l) => l.id === o)!
            const same = x.kind === 'boss' ? fold(lang === 'en' ? BOSSES[ol.city].nameEn : BOSSES[ol.city].name) === fold(p) : false
            expect(same).toBe(false)
          }
        }
      }
  })

  it('yalnız havuzdaki şehirler sorulur; az şehirde kısa sınav, dörtten azında kilitli; TASLAK şehir sorulmaz', () => {
    const four = ready.slice(0, 4)
    const q = makeQuiz('az', four)
    expect(q.length).toBeLessThanOrEqual(4)
    expect(q.length).toBeGreaterThan(0)
    for (const x of q) for (const o of x.options) expect(four.some((l) => l.id === o)).toBe(true)
    expect(makeQuiz('az', ready.slice(0, QUIZ_MIN - 1))).toEqual([])
    const drafts = LEVELS.filter(draftCity).map((l) => l.id)
    for (let i = 0; i < 50; i++) for (const x of makeQuiz(`d${i}`, LEVELS)) for (const o of x.options) expect(drafts).not.toContain(o)
  })

  it('puan: doğru 100 + hız bonusu (en çok 50), yanlış 0', () => {
    expect(quizPoints(true, 1000)).toBe(150)
    expect(quizPoints(true, 60000)).toBe(100)
    expect(quizPoints(false, 500)).toBe(0)
    expect(quizPoints(true, 9000)).toBeGreaterThan(100)
  })

  it('ilk tam puan (on soruda on) bir kez ödül verir; birleşme ve temizleme', () => {
    let r = markQuiz(null, 900, 8, 10)
    expect(r.prize).toBe(0)
    r = markQuiz(r.mark, 1400, 10, 10)
    expect(r.prize).toBe(QUIZ_PRIZE)
    expect(r.best).toBe(true)
    const again = markQuiz(r.mark, 1300, 10, 10)
    expect(again.prize).toBe(0)
    expect(again.mark.best).toBe(1400)
    // kısa sınavda tam puan ödül vermez
    expect(markQuiz(null, 600, 4, 4).prize).toBe(0)
    expect(quizCoins(r.mark)).toBe(QUIZ_PRIZE)
    expect(mergeQuiz({ best: 700, size: 10, plays: 3, perfect: false }, { best: 500, size: 10, plays: 9, perfect: true })).toEqual({ best: 700, size: 10, plays: 9, perfect: true })
    expect(cleanQuiz({ best: 1e9, size: -1, plays: 'x', perfect: 1 })).toEqual({ best: QUIZ_SIZE * 150, size: 0, plays: 0, perfect: false })
    const s = mergeSaves({ ...defaultSave(), quiz: { best: 1, size: 4, plays: 1, perfect: false } }, { ...defaultSave(), quiz: { best: 2, size: 10, plays: 1, perfect: true } })
    expect(s.quiz).toEqual({ best: 2, size: 10, plays: 1, perfect: true })
  })
})
