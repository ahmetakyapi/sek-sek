/**
 * Kare hızından bağımsızlık: oyun 60 Hz'de de 240 Hz'de de aynı görünmeli. Bu test oyun döngüsünü
 * (components/Game.tsx: sabit 1/120 sn fizik adımı + adımlar arası ara değerleme) ve kamerayı (game/camera.ts)
 * farklı tazeleme hızlarında birebir koşar; dash sırasında karakterin ekrandaki hareketi titrememeli ve her hızda
 * aynı olmalı. Kasma bir daha gelirse önce burası kırılır.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CAM, approach, shakeOffset, stepCamera } from '../game/camera'
import { LEVELS } from '../game/levels'
import { World } from '../game/sim'
import { emptyInput } from '../game/types'

const STEP = 1 / 120
const HZ = [60, 90, 120, 144, 165, 240]

/**
 * Game.tsx'teki döngünün aynısı; her karede karakterin ekrandaki x'ini (dünya pikseli) döndürür.
 * Dash, karşılaştırma bütün hızlarda aynı fizik adımında başlasın diye kare başına değil adım sayısına göre verilir.
 */
function run(hz: number, secs = 1.4, dashStep = 60) {
  const w = new World(LEVELS[0])
  const vw = 427
  const vh = 240
  const cam = { x: w.player.x - vw / 2, y: w.player.y - vh / 2 }
  let acc = 0
  let t = 0
  let shake = 0
  let steps = 0
  let prev = { x: w.player.x, y: w.player.y }
  const out: { t: number; screen: number; camX: number }[] = []
  const dt = 1 / hz
  while (t < secs) {
    t += dt
    acc += dt
    while (acc >= STEP) {
      prev = { x: w.player.x, y: w.player.y }
      w.step(STEP, { ...emptyInput(), right: true, dashPressed: steps === dashStep })
      steps++
      acc -= STEP
      for (const e of w.events) if (e.type === 'dash') shake = Math.max(shake, 1.5)
      w.events.length = 0
    }
    const a = acc / STEP
    const real = { x: w.player.x, y: w.player.y }
    w.player.x = prev.x + (real.x - prev.x) * a
    w.player.y = prev.y + (real.y - prev.y) * a
    stepCamera(w, cam, dt, vw, vh)
    shake = Math.max(0, shake - dt * 18)
    const [sx] = shakeOffset(t, shake)
    out.push({ t: t - dashStep * STEP, screen: w.player.x - (cam.x + sx), camX: cam.x })
    w.player.x = real.x
    w.player.y = real.y
  }
  return out
}

describe('kamera kare hızından bağımsız', () => {
  it('üstel yaklaşım her Hz’de aynı yere varır', () => {
    for (const hz of HZ) {
      let x = 0
      for (let i = 0; i < hz; i++) x = approach(x, 100, 1 / hz, CAM.follow)
      expect(x).toBeCloseTo(100 * (1 - CAM.follow), 6)
    }
  })

  it('dash sırasında karakter ekranda geri tepmez (titreme yok)', () => {
    for (const hz of HZ) {
      const f = run(hz).filter((r) => r.t > -0.05 && r.t < 0.4)
      const v = f.slice(1).map((r, i) => (r.screen - f[i].screen) * hz)
      // ekrandaki hız ardışık iki karede yön değiştirip 5 px/sn'yi aşmamalı
      const flips = v.slice(1).filter((x, i) => Math.sign(x) !== Math.sign(v[i]) && Math.abs(x) > 5 && Math.abs(v[i]) > 5).length
      expect(flips, `${hz} Hz`).toBe(0)
    }
  })

  it('her Hz’de karakter ekranda aynı yoldan geçer (960 Hz referansına ±1,25 px)', () => {
    // sarsıntı dahil: kare başına rastgele titreme, kaçan ara değerleme ya da kareye bağlı kamera bunu bozar
    const ref = run(960)
    const at = (t: number) => {
      let i = 0
      while (i < ref.length - 2 && ref[i + 1].t < t) i++
      const a = ref[i]
      const b = ref[i + 1]
      const k = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)))
      return a.screen + (b.screen - a.screen) * k
    }
    for (const hz of HZ) {
      let worst = 0
      for (const r of run(hz)) if (r.t > -0.3) worst = Math.max(worst, Math.abs(r.screen - at(r.t)))
      // ölü bölge kalkışı bir fizik adımı kadar (≤ 1,1 px) faz farkı yapabilir; titreme değil (geri tepme ve sarsıntı
      // testleri ayrı). Kare başına rastgelelik ya da kareye bağlı kamera bunu birkaç piksel aşar
      expect(worst, `${hz} Hz`).toBeLessThan(1.25)
    }
  })

  it('zıplarken kamera dikeyde sallanmaz, yüksek yere çıkınca yeni yüksekliği izler', () => {
    const w = new World(LEVELS[0])
    const vw = 427
    const vh = 240
    const cam: { x: number; y: number; feet?: number } = { x: w.player.x - vw / 2, y: w.player.y - vh / 2 }
    const tick = (inp = {}) => {
      w.step(STEP, { ...emptyInput(), ...inp })
      stepCamera(w, cam, STEP, vw, vh)
    }
    for (let i = 0; i < 240; i++) tick()
    const y0 = cam.y
    let most = 0
    for (let i = 0; i < 120; i++) {
      tick({ jump: true, jumpPressed: i === 0 })
      most = Math.max(most, Math.abs(cam.y - y0))
    }
    expect(most).toBeLessThan(2)
    // yüksek bir taşa çıkınca (ayak hizası 6 karo yukarı) kamera da yukarı kayar
    const map = [...Array(14)].map(() => ' '.repeat(40)).concat(['                 ##########      ', '                 ##########      ', '                 ##########      ', '                 ##########      ', '                 ##########      ', '                 ##########      ', ' P               ##########      ', '########################', '########################', '########################'].map((r) => r.padEnd(40, '#')))
    const h = new World({ ...LEVELS[0], map })
    const hc: { x: number; y: number; feet?: number } = { x: 0, y: 0 }
    for (let i = 0; i < 240; i++) {
      h.step(STEP, emptyInput())
      stepCamera(h, hc, STEP, vw, vh)
    }
    const low = hc.y
    h.player.x = 20 * 16
    h.player.y = 14 * 16 - h.player.h
    for (let i = 0; i < 360; i++) {
      h.step(STEP, emptyInput())
      stepCamera(h, hc, STEP, vw, vh)
    }
    expect(h.player.grounded).toBe(true)
    expect(low - hc.y).toBeGreaterThan(50)
  })

  it('sarsıntı rastgele değil, zamana bağlı ve yumuşak', () => {
    // 240 Hz'de ardışık iki kare arası sarsıntı farkı küçük kalmalı (her karede rastgele sıçrama yok)
    let prev = shakeOffset(0, 1.5)
    for (let i = 1; i < 60; i++) {
      const cur = shakeOffset(i / 240, 1.5)
      expect(Math.abs(cur[0] - prev[0])).toBeLessThan(0.45)
      prev = cur
    }
  })

  it('çizimde kare başına rastgele titreme ya da olasılık yok', () => {
    const src = readFileSync('game/render.ts', 'utf8') + readFileSync('game/camera.ts', 'utf8')
    // kare başına Math.random() < p, yüksek Hz'de daha sık tetiklenir: this.chance(p) kullan
    expect(src.match(/Math\.random\(\) < 0?\.\d+\)/g) ?? []).toEqual([])
    // kamera ya da taş titremesi Math.random ile yapılmaz: shakeOffset / zamana bağlı sinüs
    expect(src).not.toMatch(/\(Math\.random\(\) - 0\.5\) \* (this\.shake|\(1 \+ k)/)
  })
})
