import { emptyInput, type Input } from './types'

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
  onPause: (() => void) | null = null
  onRetry: (() => void) | null = null

  private down = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return
    const k = e.code
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault()
    if (e.repeat) return
    this.keys.add(k)
    if (JUMP_KEYS.includes(k)) this.jumpLatch = true
    if (DASH_KEYS.includes(k)) this.dashLatch = true
    if (k === 'Escape' || k === 'KeyP') this.onPause?.()
    if (k === 'KeyR') this.onRetry?.()
  }
  private up = (e: KeyboardEvent) => {
    // boşluk odaktaki bir düğmeyi tetiklemesin
    if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) e.preventDefault()
    this.keys.delete(e.code)
  }
  private blur = () => this.keys.clear()

  attach() {
    window.addEventListener('keydown', this.down)
    window.addEventListener('keyup', this.up)
    window.addEventListener('blur', this.blur)
  }

  detach() {
    window.removeEventListener('keydown', this.down)
    window.removeEventListener('keyup', this.up)
    window.removeEventListener('blur', this.blur)
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
    i.left = k.has('ArrowLeft') || k.has('KeyA')
    i.right = k.has('ArrowRight') || k.has('KeyD')
    i.up = k.has('ArrowUp') || k.has('KeyW')
    i.down = k.has('ArrowDown') || k.has('KeyS')
    i.jump = JUMP_KEYS.some((c) => k.has(c)) || this.touch.jump

    // dokunmatik joystick
    if (this.touch.x < -0.35) i.left = true
    if (this.touch.x > 0.35) i.right = true
    if (this.touch.y < -0.5) i.up = true
    if (this.touch.y > 0.5) i.down = true

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

const JUMP_KEYS = ['ArrowUp', 'KeyW', 'KeyZ', 'KeyK', 'KeyC']
const DASH_KEYS = ['Space', 'KeyX', 'ShiftLeft', 'ShiftRight', 'KeyJ', 'KeyL']
