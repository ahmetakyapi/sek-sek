import { describe, expect, it } from 'vitest'
import { cityVersion } from '../lib/mapVersion'
import { ackMapNews, cloudPart, defaultSave, mapNews, mergeSaves, normalizeSave, type Save } from '../lib/storage'

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

describe('şehir başına harita sürümü', () => {
  it('sürümsüz eski rekor kaydın sürümündeki haritaya bağlanır; yalnız haritası değişen şehir eskir', () => {
    // sürüm 6 kaydı: İstanbul'un haritası 7'de değişti, İzmir'inki değişmedi
    const s = normalizeSave({ mapVersion: 6, migrated: true, unlocked: 5, best: { istanbul: { timeMs: 50000, deaths: 0, items: [true, true, true] }, izmir: { timeMs: 60000, deaths: 1, items: [true, false, false] } } })
    expect(s.best.istanbul.stale).toBe(true)
    expect(s.best.istanbul.items).toEqual([true, true, true])
    expect(s.best.izmir.stale).toBeFalsy()
    expect(s.best.izmir.v).toBe(cityVersion('izmir'))
    expect(s.mapVersion).toBe(8)
  })

  it('haritası sonradan değişen şehir "yenilendi" notunda görünür, ötekiler sıfırlanmaz', () => {
    const s = normalizeSave({ mapVersion: 8, unlocked: 10, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false], v: 'eski' }, ankara: { timeMs: 70000, deaths: 0, items: [false, false, false], v: cityVersion('ankara') } } })
    expect(s.best.izmir.stale).toBe(true)
    expect(s.best.ankara.stale).toBeFalsy()
    expect(mapNews(s).renewed).toEqual(['izmir'])
    const ack = ackMapNews(s)
    expect(mapNews(ack).renewed).toEqual([])
    // not kapandıktan sonra yeniden açılınca tekrar çıkmaz
    expect(mapNews(normalizeSave(ack)).renewed).toEqual([])
    expect(ack.best.izmir.items).toEqual([true, false, false])
  })

  it('sonradan eklenen şehirler yeni şehir olarak listelenir', () => {
    const s = normalizeSave({ mapVersion: 7, migrated: true, unlocked: 20, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false] } } })
    expect(mapNews(s).added.sort()).toEqual(['eskisehir', 'hatay', 'kayseri'])
    // yeni oyuncu hiçbir not görmez
    expect(mapNews(defaultSave())).toEqual({ renewed: [], added: [] })
  })
})
