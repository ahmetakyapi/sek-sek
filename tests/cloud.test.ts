import { describe, expect, it } from 'vitest'
import { cloudPart, defaultSave, mergeSaves, type Save } from '../lib/storage'

const save = (p: Partial<Save>): Save => ({ ...defaultSave(), ...p })

describe('bulut kaydı birleştirme', () => {
  it('hiçbir ilerleme kaybolmaz: en ileri şehir, en iyi süre, bütün hatıralar, pul ve nazar birleşimi', () => {
    const local = save({ unlocked: 3, best: { istanbul: { timeMs: 90000, deaths: 1, items: [true, false, false] } }, stamps: { istanbul: true }, sfx: false })
    const cloud = save({ unlocked: 7, best: { istanbul: { timeMs: 80000, deaths: 2, items: [false, true, false] }, edirne: { timeMs: 99000, deaths: 0, items: [true, true, true] } }, charms: { edirne: true }, bosses: { istanbul: true } })
    const m = mergeSaves(local, cloud)
    expect(m.unlocked).toBe(7)
    expect(m.best.istanbul.timeMs).toBe(80000)
    expect(m.best.istanbul.items).toEqual([true, true, false])
    expect(m.best.edirne.items).toEqual([true, true, true])
    expect(m.stamps.istanbul && m.charms.edirne && m.bosses.istanbul).toBe(true)
    // cihaz ayarı yerelde kalır
    expect(m.sfx).toBe(false)
  })

  it('eski haritanın süresi yenisinin yerine geçmez', () => {
    const local = save({ best: { izmir: { timeMs: 120000, deaths: 0, items: [true, false, false] } } })
    const cloud = save({ best: { izmir: { timeMs: 60000, deaths: 0, items: [false, false, true], stale: true } } })
    const m = mergeSaves(local, cloud)
    expect(m.best.izmir.timeMs).toBe(120000)
    expect(m.best.izmir.stale).toBeFalsy()
    expect(m.best.izmir.items).toEqual([true, false, true])
  })

  it('buluta oturum ve cihaz ayarı gitmez', () => {
    const part = cloudPart(save({ player: { id: 'x', name: 'y', token: 'z' }, sfx: false, unlocked: 4 }))
    expect(part.unlocked).toBe(4)
    expect('player' in part || 'sfx' in part || 'lang' in part).toBe(false)
  })
})
