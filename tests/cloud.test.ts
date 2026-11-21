import { describe, expect, it } from 'vitest'
import { LEVELS } from '../game/levels'
import { cityVersion } from '../lib/mapVersion'
import { kitOf, scarfIdOf, MAP_VERSION, ackMapNews, cleanIncoming, cloudPart, defaultSave, isRenewed, mapNews, mergeSaves, normalizeSave, type Save } from '../lib/storage'

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

  it('Günün Üçlüsü izi birleşir; sayaç kaybolmaz ve bozuk iz düşer', () => {
    const local = save({ trio: { day: '2026-11-21', mini: 20000, days: 2, last: '2026-11-20' } })
    const cloud = save({ trio: { day: '2026-11-21', boss: 40000, days: 4, last: '2026-11-19' } })
    expect(mergeSaves(local, cloud).trio).toEqual({ day: '2026-11-21', mini: 20000, boss: 40000, days: 4, last: '2026-11-20' })
    expect(cloudPart(local).trio).toBeDefined()
    expect(cleanIncoming({ trio: { days: 'x', mini: 'y' } }).trio).toMatchObject({ days: 0, day: '' })
  })

  it('buluta oturum ve cihaz ayarı gitmez', () => {
    const part = cloudPart(save({ player: { id: 'x', name: 'y', token: 'z' }, sfx: false, unlocked: 4 }))
    expect(part.unlocked).toBe(4)
    expect('player' in part || 'sfx' in part || 'lang' in part).toBe(false)
  })
})

describe('karakter başına kılık', () => {
  it('eski ortak kombin ve atkı ilk geçişte iki karaktere kopyalanır; yolcuya uymayan parça boş kalır', () => {
    const old = normalizeSave({ kit: { head: 'papatya', face: 'gunes', back: 'pelerin' }, scarf: 'camgobegi', owned: { papatya: true, gunes: true }, character: 'memo' })
    expect(old.kits?.uktun).toEqual({ head: 'papatya', face: 'gunes', back: 'pelerin' })
    expect(old.kits?.memo).toEqual({ head: 'yok', face: 'gunes', back: 'pelerin' })
    expect(kitOf(old, 'memo').face).toBe('gunes')
    expect(scarfIdOf(old, 'uktun')).toBe('camgobegi')
    expect(scarfIdOf(old, 'memo')).toBe('camgobegi')
    // eski sahiplik iki yolcuya da açık kalır (düz kimlik)
    expect(old.owned).toEqual({ papatya: true, gunes: true })
  })
  it('tek aksesuarlı çok eski kayıt kendi yuvasına geçer', () => {
    expect(kitOf(normalizeSave({ accessory: 'heybe' }), 'uktun')).toEqual({ head: 'yok', face: 'yok', back: 'heybe' })
  })
  it('bulut birleşmesi karakter başına: biri öbürünü ezmez, sahiplik birleşir', () => {
    const local = save({ kits: { uktun: { head: 'fiyonk' } }, scarfs: { uktun: 'a' }, owned: { 'uktun:fiyonk': true } })
    const cloud = save({ kits: { memo: { head: 'bandana' }, uktun: { head: 'tac' } }, scarfs: { memo: 'b' }, owned: { 'memo:bandana': true } })
    const m = mergeSaves(local, cloud)
    expect(m.kits?.uktun?.head).toBe('fiyonk')
    expect(m.kits?.memo?.head).toBe('bandana')
    expect(m.scarfs).toEqual({ uktun: 'a', memo: 'b' })
    expect(m.owned).toEqual({ 'memo:bandana': true, 'uktun:fiyonk': true })
    // buluta gider
    const part = cloudPart(m)
    expect(part.kits && part.scarfs).toBeTruthy()
  })
  it('başka yolcuya özgü parça kombinde düşer', () => {
    expect(kitOf(save({ kits: { memo: { head: 'fiyonk', face: 'tek', back: 'sal' } } }), 'memo')).toEqual({ head: 'yok', face: 'tek', back: 'yok' })
  })
})

describe('şehir başına harita sürümü', () => {
  it('haritası yenilenen şehirde rekor ve hatıralar silinmez; yalnız "yenilendi" diye işaretlenir', () => {
    const s = normalizeSave({ mapVersion: 8, unlocked: 10, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false], v: 'eski' }, ankara: { timeMs: 70000, deaths: 0, items: [false, false, false], v: cityVersion('ankara') } } })
    expect(s.best.izmir.stale).toBeFalsy()
    expect(s.best.izmir.timeMs).toBe(60000)
    expect(isRenewed(s.best.izmir, 'izmir')).toBe(true)
    expect(isRenewed(s.best.ankara, 'ankara')).toBe(false)
    expect(mapNews(s).renewed).toEqual(['izmir'])
    const ack = ackMapNews(s)
    expect(mapNews(ack).renewed).toEqual([])
    expect(mapNews(normalizeSave(ack)).renewed).toEqual([])
    // not kapansa da listede rozet kalır (şehir yeniden oynanana dek) ve rekor durur
    expect(isRenewed(ack.best.izmir, 'izmir')).toBe(true)
    expect(ack.best.izmir.timeMs).toBe(60000)
  })

  it('kısa süre yayında kalan sürümün eskittiği rekor geri gelir', () => {
    const s = normalizeSave({ mapVersion: 8, unlocked: 10, best: { bursa: { timeMs: 55000, deaths: 2, items: [true, true, false], v: 'eski', stale: true, renew: true } } })
    expect(s.best.bursa.stale).toBe(false)
    expect(s.best.bursa.timeMs).toBe(55000)
  })

  it('sürümsüz eski rekor kaydın sürümündeki haritaya bağlanır', () => {
    const s = normalizeSave({ mapVersion: 7, migrated: true, unlocked: 5, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false] } } })
    expect(s.best.izmir.v).toBe(cityVersion('izmir'))
    expect(s.best.izmir.stale).toBeFalsy()
    expect(s.mapVersion).toBe(MAP_VERSION)
  })

  it('sonradan eklenen şehirler yeni şehir olarak listelenir', () => {
    const s = normalizeSave({ mapVersion: 7, migrated: true, unlocked: 20, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false] } } })
    expect(mapNews(s).added.sort()).toEqual(['agri', 'amasya', 'artvin', 'aydin', 'bitlis', 'denizli', 'eskisehir', 'giresun', 'hatay', 'karabuk', 'kars', 'kayseri', 'mersin', 'mugla', 'rize', 'tokat', 'zonguldak'])
    // sürüm 8'den gelen oyuncuya yalnız son eklenen iki şehir yenidir
    const s8 = normalizeSave({ mapVersion: 8, unlocked: 27, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false] } } })
    expect(mapNews(s8).added.sort()).toEqual(['agri', 'amasya', 'artvin', 'aydin', 'bitlis', 'denizli', 'giresun', 'karabuk', 'kars', 'mersin', 'mugla', 'rize', 'tokat', 'zonguldak'])
    // eski sırada son şehir (Bayburt) açıktı: kimliğiyle yeni sıradaki yerine taşınır
    expect(LEVELS[s8.unlocked].id).toBe('bayburt')
    // sürüm 9'dan gelen, Bayburt'u bitirmiş oyuncuya ikinci defterin ilk şehri açılır
    const s9 = normalizeSave({ mapVersion: 9, unlocked: 29, best: { bayburt: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })
    expect(mapNews(s9).added.sort()).toEqual(['agri', 'artvin', 'aydin', 'bitlis', 'denizli', 'giresun', 'karabuk', 'kars', 'mersin', 'rize', 'tokat', 'zonguldak'])
    expect(LEVELS[s9.unlocked].id).toBe('rize')
    // sürüm 10'dan gelen, Ağrı'yı bitirmiş oyuncuya dönüş yolunun ilk şehri (Giresun) açılır
    const s10 = normalizeSave({ mapVersion: 10, unlocked: 34, best: { agri: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })
    expect(mapNews(s10).added.sort()).toEqual(['aydin', 'denizli', 'giresun', 'karabuk', 'mersin', 'tokat', 'zonguldak'])
    // sürüm 11'den gelen, Denizli'yi bitirmiş oyuncuya Zonguldak açılır
    const s11 = normalizeSave({ mapVersion: 11, unlocked: 37, best: { denizli: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })
    expect(mapNews(s11).added).toEqual(['zonguldak', 'mersin', 'karabuk', 'aydin'])
    expect(LEVELS[s11.unlocked].id).toBe('zonguldak')
    // sürüm 12'den gelen, Zonguldak'ı bitirmiş oyuncuya Mersin açılır
    const s12 = normalizeSave({ mapVersion: 12, unlocked: 38, best: { zonguldak: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })
    expect(mapNews(s12).added).toEqual(['mersin', 'karabuk', 'aydin'])
    expect(LEVELS[s12.unlocked].id).toBe('mersin')
    // sürüm 13'ten gelen, Mersin'i bitirmiş oyuncuya Karabük açılır
    const s13 = normalizeSave({ mapVersion: 13, unlocked: 39, best: { mersin: { timeMs: 90000, deaths: 0, items: [true, true, true] } } })
    expect(mapNews(s13).added).toEqual(['karabuk', 'aydin'])
    expect(LEVELS[s13.unlocked].id).toBe('karabuk')
    expect(LEVELS[s10.unlocked].id).toBe('giresun')
    expect(mapNews(defaultSave())).toEqual({ renewed: [], added: [] })
  })

  it('not bir kez görülür: onay bulut gidiş dönüşünde kaybolmaz (sunucu da birleştirir)', () => {
    const raw = { mapVersion: 8, unlocked: 10, best: { izmir: { timeMs: 60000, deaths: 1, items: [true, false, false], v: 'eski' } } }
    let cloud = cloudPart(normalizeSave(raw))
    const acked = ackMapNews(normalizeSave(raw))
    for (let session = 0; session < 3; session++) {
      cloud = cloudPart(mergeSaves(normalizeSave(cloudPart(acked)), normalizeSave(cloud)))
      const next = mergeSaves(normalizeSave(JSON.parse(JSON.stringify(acked))), normalizeSave(cloud))
      expect(mapNews(next).renewed).toEqual([])
      expect(next.best.izmir.timeMs).toBe(60000)
    }
    expect(mapNews(mergeSaves(normalizeSave(raw), normalizeSave(cloud))).renewed).toEqual([])
  })

  it('bozuk tipli bulut kaydı beklenen biçime zorlanır', () => {
    const c = cleanIncoming({ best: { izmir: { items: 5 }, ankara: { timeMs: 1, deaths: 0, items: [true, 'x'] }, x: null }, stamps: 'x', charms: null, bosses: { izmir: true, a: 1 }, unlocked: 999 })
    expect(c.best).toEqual({ ankara: { timeMs: 1, deaths: 0, items: [true, false, false] } })
    expect(c.stamps).toEqual({})
    expect(c.bosses).toEqual({ izmir: true })
    expect(c.unlocked).toBeLessThan(100)
    expect(cleanIncoming({ best: null }).best).toEqual({})
  })
})
