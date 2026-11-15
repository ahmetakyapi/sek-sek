import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYS, KEY_ACTIONS, bindKey, keyLabel, normalizeKeys } from '../game/input'

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
