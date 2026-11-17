import { emptyInput, type Input } from './types'

/** Yeniden atanabilen eylemler. Yukarı (kapı, merdiven) sabit kalır: ↑ / W */
export type KeyAction = 'left' | 'right' | 'down' | 'jump' | 'dash'
export type KeyBindings = Record<KeyAction, string[]>
export const KEY_ACTIONS: KeyAction[] = ['left', 'right', 'jump', 'dash', 'down']
// Shift yok: Windows'ta art arda 5 Shift "Yapışkan Tuşlar" sesini ve penceresini açar, dash'e hızlı basan oyuncuyu böler
export const DEFAULT_KEYS: KeyBindings = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['ArrowUp', 'KeyW', 'KeyZ', 'KeyK', 'KeyC'],
  dash: ['Space', 'KeyX', 'KeyJ', 'KeyL'],
}
/**
 * İki kişilik tuşlar (Co-op ve Yan Yana Yarış): solda WASD + X (dash), sağda ok tuşları + Enter (dash).
 * Boşluk kimseye verilmez: tek kişilik oyunda dash Boşluk'tur, iki kişide alışkanlıkla basılınca öbürünün
 * oyuncusunu atıyordu. Bir tuş yalnız bir oyuncuya aittir (tests/input.test.ts "iki kişilik tuşlar").
 * Oyun kolu varsa 1. kol sola, 2. kol sağa.
 */
export const DUO_KEYS = [
  { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['KeyW'], dash: ['KeyX'] },
  { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['ArrowUp'], dash: ['Enter', 'NumpadEnter', 'Numpad0', 'Slash', 'Period'] },
] as const
/** Oyunun kendi işi olan tuşlar atanamaz: mola, checkpoint, sekme ve tarayıcı tuşları */
export const RESERVED_KEYS = ['Escape', 'KeyP', 'KeyR', 'Tab', 'MetaLeft', 'MetaRight', 'ShiftLeft', 'ShiftRight', 'F5', 'F11', 'F12']

/** Kayıttaki atamayı sağlamlaştırır: eksik eylem varsayılandan, boş liste varsayılandan gelir */
export function normalizeKeys(k?: Partial<KeyBindings> | null): KeyBindings {
  const out = { ...DEFAULT_KEYS }
  for (const a of KEY_ACTIONS) {
    const v = k?.[a]
    if (Array.isArray(v) && v.length) out[a] = v.filter((c) => typeof c === 'string' && !RESERVED_KEYS.includes(c))
    if (!out[a].length) out[a] = DEFAULT_KEYS[a]
  }
  return out
}

/** Bir tuşu bir eyleme bağlar: başka eylemden alınır (bir tuş tek iş yapar), eylemin listesinin başına girer */
export function bindKey(k: KeyBindings, action: KeyAction, code: string): KeyBindings {
  if (RESERVED_KEYS.includes(code)) return k
  const out = {} as KeyBindings
  for (const a of KEY_ACTIONS) out[a] = k[a].filter((c) => c !== code)
  out[action] = [code, ...out[action]].slice(0, 5)
  // tuşu elinden alınan eylem boş kalmasın
  for (const a of KEY_ACTIONS) if (!out[a].length) out[a] = DEFAULT_KEYS[a].filter((c) => !Object.values(out).flat().includes(c)).slice(0, 1)
  return out
}

/** Tuş kodunu okunur ada çevirir: KeyZ → Z, ArrowLeft → ←, Space → Boşluk */
export function keyLabel(code: string, lang: 'tr' | 'en' = 'tr'): string {
  const arrows: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }
  if (arrows[code]) return arrows[code]
  if (code === 'Space') return lang === 'en' ? 'Space' : 'Boşluk'
  if (code === 'Enter') return 'Enter'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6)
  if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl'
  if (code === 'AltLeft' || code === 'AltRight') return 'Alt'
  return code.replace(/(Left|Right)$/, '')
}

/**
 * Klavye + oyun kolu + dokunmatik. Basışlar "mandallanır": iki kare arasında
 * yapılan kısa bir dokunuş bile kaçmaz, ilk simülasyon adımı tüketir.
 */
export class InputManager {
  private keys = new Set<string>()
  private jumpLatch = false
  private dashLatch = false
  private prevPadJump = false
  private prevPadDash = false
  touch = { x: 0, y: 0, jump: false, dash: false }
  /** joystick'in tuttuğu yön (-1, 0, 1): eşikte titremesin diye bırakma eşiği daha düşük */
  private stickDir = 0
  private bind: KeyBindings = DEFAULT_KEYS
  onPause: (() => void) | null = null
  onRetry: (() => void) | null = null

  private down = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return
    const k = e.code
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault()
    // tekrar olayı da tuşu basılı sayar: odak kayıp geri gelince ilk basış kaçmışsa yürüyüş sürsün
    this.keys.add(k)
    if (e.repeat) return
    if (this.bind.jump.includes(k)) this.jumpLatch = true
    if (this.bind.dash.includes(k)) this.dashLatch = true
    if (k === 'Escape' || k === 'KeyP') this.onPause?.()
    if (k === 'KeyR') this.onRetry?.()
  }
  private up = (e: KeyboardEvent) => {
    // boşluk odaktaki bir düğmeyi tetiklemesin
    if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) e.preventDefault()
    this.keys.delete(e.code)
    // macOS'ta ⌘ basılıyken öteki tuşların bırakılışı gelmez: ⌘ kalkınca takılı tuş kalmasın
    if (e.key === 'Meta') this.keys.clear()
  }
  private blur = () => {
    this.keys.clear()
    this.touch = { x: 0, y: 0, jump: false, dash: false }
  }

  setBindings(b: KeyBindings) {
    this.bind = b
  }

  attach() {
    window.addEventListener('keydown', this.down)
    window.addEventListener('keyup', this.up)
    window.addEventListener('blur', this.blur)
    document.addEventListener('visibilitychange', this.blur)
  }

  detach() {
    window.removeEventListener('keydown', this.down)
    window.removeEventListener('keyup', this.up)
    window.removeEventListener('blur', this.blur)
    document.removeEventListener('visibilitychange', this.blur)
  }

  pressJump() {
    this.touch.jump = true
    this.jumpLatch = true
  }
  releaseJump() {
    this.touch.jump = false
  }
  pressDash() {
    this.touch.dash = true
    this.dashLatch = true
  }
  releaseDash() {
    this.touch.dash = false
  }

  clear() {
    this.keys.clear()
    this.jumpLatch = false
    this.dashLatch = false
    this.touch = { x: 0, y: 0, jump: false, dash: false }
  }

  /** Bir karede bir kez çağrılır; `first` dışındaki adımlara basış bayrakları sıfırlanmış kopya verilir. */
  sample(): Input {
    const i = emptyInput()
    const k = this.keys
    const b = this.bind
    i.left = b.left.some((c) => k.has(c))
    i.right = b.right.some((c) => k.has(c))
    i.up = k.has('ArrowUp') || k.has('KeyW')
    i.down = b.down.some((c) => k.has(c))
    i.jump = b.jump.some((c) => k.has(c)) || this.touch.jump

    // dokunmatik joystick: basmak için 0,28, bırakmak için 0,18 (eşikte titreyen başparmak yönü açıp kapatmasın)
    const tx = this.touch.x
    this.stickDir = this.stickDir > 0 ? (tx > 0.18 ? 1 : tx < -0.28 ? -1 : 0) : this.stickDir < 0 ? (tx < -0.18 ? -1 : tx > 0.28 ? 1 : 0) : tx > 0.28 ? 1 : tx < -0.28 ? -1 : 0
    if (this.stickDir < 0) i.left = true
    if (this.stickDir > 0) i.right = true
    if (this.touch.y < -0.5) i.up = true
    // aşağı yalnızca bilinçli ve dike yakın bir itişle: koşarken başparmak kayınca ince platformdan düşmesin
    if (this.touch.y > 0.72 && Math.abs(this.touch.x) < this.touch.y * 0.7) i.down = true

    // oyun kolu
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []
    for (const p of pads) {
      if (!p) continue
      const ax = p.axes[0] ?? 0
      const ay = p.axes[1] ?? 0
      if (ax < -0.4 || p.buttons[14]?.pressed) i.left = true
      if (ax > 0.4 || p.buttons[15]?.pressed) i.right = true
      if (ay < -0.5 || p.buttons[12]?.pressed) i.up = true
      if (ay > 0.5 || p.buttons[13]?.pressed) i.down = true
      const pj = !!(p.buttons[0]?.pressed || p.buttons[3]?.pressed)
      const pd = !!(p.buttons[2]?.pressed || p.buttons[1]?.pressed || p.buttons[7]?.pressed)
      if (pj) i.jump = true
      if (pj && !this.prevPadJump) this.jumpLatch = true
      if (pd && !this.prevPadDash) this.dashLatch = true
      if (p.buttons[9]?.pressed) this.onPause?.()
      this.prevPadJump = pj
      this.prevPadDash = pd
    }

    i.jumpPressed = this.jumpLatch
    i.dashPressed = this.dashLatch
    this.jumpLatch = false
    this.dashLatch = false
    return i
  }
}

