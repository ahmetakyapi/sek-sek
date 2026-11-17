import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYS, KEY_ACTIONS, bindKey, keyLabel, normalizeKeys, DEFAULT_DUO, bindDuo, normalizeDuo } from '../game/input'

describe('tuş atama', () => {
  it('eksik ya da bozuk kayıt varsayılana döner', () => {
    expect(normalizeKeys(undefined)).toEqual(DEFAULT_KEYS)
    expect(normalizeKeys({ jump: [] })).toEqual(DEFAULT_KEYS)
    expect(normalizeKeys({ dash: ['Escape'] }).dash).toEqual(DEFAULT_KEYS.dash)
  })

  it('bir tuş tek işe bağlanır: başka eylemden alınır', () => {
    const k = bindKey(DEFAULT_KEYS, 'jump', 'Space')
    expect(k.jump[0]).toBe('Space')
    expect(k.dash).not.toContain('Space')
    const all = KEY_ACTIONS.flatMap((a) => k[a])
    expect(new Set(all).size).toBe(all.length)
  })

  it('tuşu alınan eylem boş kalmaz', () => {
    let k = normalizeKeys({ dash: ['KeyX'] })
    k = bindKey(k, 'jump', 'KeyX')
    expect(k.dash.length).toBeGreaterThan(0)
    expect(k.dash).not.toContain('KeyX')
  })

  it('mola ve checkpoint tuşları atanamaz', () => {
    expect(bindKey(DEFAULT_KEYS, 'jump', 'Escape')).toBe(DEFAULT_KEYS)
    expect(bindKey(DEFAULT_KEYS, 'dash', 'KeyR')).toBe(DEFAULT_KEYS)
  })

  it('tuş adları okunur', () => {
    expect(keyLabel('KeyZ')).toBe('Z')
    expect(keyLabel('ArrowLeft')).toBe('←')
    expect(keyLabel('Space')).toBe('Boşluk')
    expect(keyLabel('Space', 'en')).toBe('Space')
  })
})

describe('iki kişilik tuşlar', () => {
  it('varsayılanda bir tuş yalnız bir oyuncuya ait; Boşluk kimsede yok (tek kişilikte dash, alışkanlıkla basılıyor)', () => {
    const all = DEFAULT_DUO.map((k) => new Set(Object.values(k).flat()))
    for (const c of all[0]) expect(all[1].has(c)).toBe(false)
    for (const s of all) expect(s.has('Space')).toBe(false)
  })
  it('solda WASD + Shift, sağda ok tuşları + Enter', () => {
    expect(DEFAULT_DUO[0].dash[0]).toBe('ShiftLeft')
    expect(DEFAULT_DUO[0].left).toContain('KeyA')
    expect(DEFAULT_DUO[1].dash[0]).toBe('Enter')
    expect(DEFAULT_DUO[1].left).toContain('ArrowLeft')
  })
  it('her oyuncunun tek dash tuşu var; Sağ Shift kimsede yok (biri ötekini dash attırmasın)', () => {
    expect(DEFAULT_DUO[0].dash).toEqual(['ShiftLeft'])
    expect(DEFAULT_DUO[1].dash[0]).toBe('Enter')
    for (const b of DEFAULT_DUO) expect(Object.values(b).flat()).not.toContain('ShiftRight')
    // eski varsayılanı kayıtlı oyuncu yenisine geçer
    const old = normalizeDuo([{ dash: ['ShiftLeft', 'KeyX'] }, { dash: ['Enter', 'ShiftRight', 'NumpadEnter', 'Numpad0'] }])
    expect(old[0].dash).toEqual(['ShiftLeft'])
    expect(old[1].dash).not.toContain('ShiftRight')
  })
  it('atanan tuş öbür oyuncudan ve öbür eylemden alınır; eylem boş kalmaz', () => {
    const k = bindDuo(DEFAULT_DUO, 1, 'dash', 'KeyX')
    expect(k[1].dash[0]).toBe('KeyX')
    expect(k[0].dash).not.toContain('KeyX')
    const j = bindDuo(DEFAULT_DUO, 0, 'jump', 'KeyA')
    expect(j[0].jump[0]).toBe('KeyA')
    expect(j[0].left.length).toBeGreaterThan(0)
    expect(j[0].left).not.toContain('KeyA')
  })
  it('bozuk kayıt varsayılana döner, mola tuşu atanamaz', () => {
    expect(normalizeDuo(null)).toEqual(DEFAULT_DUO)
    expect(normalizeDuo([{ dash: [] }, { left: ['Escape'] }])[1].left).toEqual(DEFAULT_DUO[1].left)
    expect(bindDuo(DEFAULT_DUO, 0, 'dash', 'Escape')).toEqual(DEFAULT_DUO)
  })
})
