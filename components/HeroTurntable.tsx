'use client'

import { useEffect, useRef } from 'react'
import { kitKey, type Kit } from '@/game/accessories'
import type { CharacterId } from '@/game/characters'
import { drawHero } from '@/game/heroDraw'
import { drawHeroTurn } from '@/game/heroTurn'
import { demoPose, newDemo, type DemoMode } from '@/game/stance'

interface ScarfColor {
  color: string
  shade: string
}

/** kendiliğinden dönüş hızı (radyan/sn): bir tur ~9 sn */
const SPIN = (Math.PI * 2) / 9
/** dört görüş: yan (sağa), ön, yan (sola), arka; her biri çeyrek tur */
const Q = Math.PI / 2
/** bırakınca en yakın görüşe oturan yayın sertliği (kritik sönümlü, 1/sn): ~0,7 sn'de yerine oturur */
const SETTLE = 6.5
/** sürüklemede piksel başına dönüş: önizlemenin genişliği kadar sürükleme ~1 tur */
const DRAG_TURN = Math.PI * 2
/** ok tuşunun bir adımı: çeyrek tur, bir görüşten sonrakine */
const KEY_STEP = Q
/** görünen açı her görüşte biraz oyalanır, geçişte çabuk akar (geçiş sıkıştırma + çapraz geçiştir: kısa sürsün) */
const DWELL = 0.5
const shown = (a: number) => a - (DWELL / 4) * Math.sin(4 * a)
/** geçişte en dar an: gövde genişliğinin bu kadarı dolu kalır (kağıt inceliği yok) */
const NARROW = 0.62
const smooth = (e0: number, e1: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return u * u * (3 - 2 * u)
}

/**
 * Kritik sönümlü yayın kapalı biçimi: x hedefe uzaklık, v hız; dt ne olursa olsun aynı yol (kare hızından bağımsız).
 */
function springStep(x: number, v: number, w: number, dt: number): [number, number] {
  const e = Math.exp(-w * dt)
  const b = v + w * x
  return [(x + b * dt) * e, (v - w * b * dt) * e]
}

/**
 * Mağazanın döner sahnesi: karakter seçilen kombin ve görünümle canlı durur (oyundaki poz kodu: game/stance.ts) ve 360
 * derece döndürülür. Dört gerçek görüş var: yan (sağa; oyundaki çizim), ön ve arka (game/heroTurn.ts: portre yüzü, sırt
 * eşyası arkadan tam), yan (sola). Görüşler arasında kısa bir yatay sıkıştırma (en dar anda gövdenin %62'si) ve çapraz
 * geçiş olur; arkası dönükken gövde biraz koyulaşır, önü dönükken ılık ışık alır, gölge elipsi daralır, sahne tablasının
 * çivileri aynı açıyla döner. Fareyle ya da parmakla yatay sürüklenir (dikey sürükleme sayfayı kaydırır), odaktayken
 * ←/→ çeyrek tur döndürür, Home baştaki yan görünüşe döner. Bırakınca yay en yakın görüşe oturtur; `spin` açıkken yavaşça
 * kendi döner. Her şey saate bağlı; hareket azaltma seçiliyse kendiliğinden dönmez, yay beklemeden oturur.
 */
export default function HeroTurntable({ hero, kit, scarf, mode, spin, onStopSpin, label, className = '' }: { hero: CharacterId; kit: Kit; scarf: ScarfColor | null; mode: DemoMode; spin: boolean; /** ok tuşu kendiliğinden dönüşü durdurur */ onStopSpin: () => void; label: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLCanvasElement>(null)
  const key = kitKey(kit)
  const kitRef = useRef(kit)
  kitRef.current = kit
  /** dönüş durumu: açı, hız, hedef, sürükleme */
  const turn = useRef({ a: 0, v: 0, target: 0, drag: false, px: 0, pa: 0, pt: 0, spin, settle: true, dirty: true })
  turn.current.spin = spin

  // dönüş kapanınca en yakın görüşe otur
  useEffect(() => {
    const s = turn.current
    // (ok tuşu durdurduysa hedefi zaten koymuştur: hedef açıdan ayrıysa dokunma)
    if (!spin && !s.drag && s.target === s.a) {
      s.target = Math.round(s.a / Q) * Q
      s.settle = true
    }
    s.dirty = true
  }, [spin])

  useEffect(() => {
    const cv = ref.current
    const el = box.current
    if (!cv || !el) return
    const c = cv.getContext('2d')!
    const layer = document.createElement('canvas')
    const lc = layer.getContext('2d')!
    const layer2 = document.createElement('canvas')
    const lc2 = layer2.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const demo = newDemo()
    const s = turn.current
    s.dirty = true
    let raf = 0
    let last = -1
    let prev = performance.now()
    let shownDeg = -1
    const t0 = prev

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(cv.clientWidth * dpr)
      const h = Math.round(cv.clientHeight * dpr)
      if (!w || !h) return
      const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000))
      prev = now
      // dönüşün adımı
      if (!s.drag) {
        if (s.spin && !still) {
          s.v = SPIN + (s.v - SPIN) * Math.exp(-3 * dt)
          s.a += s.v * dt
          s.target = s.a
        } else if (still) {
          s.a = s.target
          s.v = 0
        } else {
          const [x, v] = springStep(s.a - s.target, s.v, SETTLE, dt)
          s.a = s.target + x
          s.v = v
          if (Math.abs(x) < 1e-4 && Math.abs(v) < 1e-3) {
            s.a = s.target
            s.v = 0
          }
        }
      }
      const moving = s.drag || s.v !== 0 || s.a !== s.target
      const resized = cv.width !== w || cv.height !== h
      // dönerken her kare, dururken ~30 kare (hareket azaltmada yalnız değişince)
      if (!resized && !moving && !s.dirty && (still ? last >= 0 : now - last < 33)) return
      s.dirty = moving
      if (resized) {
        cv.width = w
        cv.height = h
      }
      // katman her kurulumda yenidir (tuval ise eski boyunu korur): ayrı denetlenir
      for (const L of [layer, layer2]) {
        if (L.width !== w || L.height !== h) {
          L.width = w
          L.height = h
        }
      }
      last = now
      const t = (now - t0) / 1000
      const k = kitRef.current
      const d = demoPose(demo, still ? 'dur' : mode, t, k.look?.st, k.look?.rs)
      // görünen açı → iki komşu görüş ve aralarındaki geçiş payı
      const u = shown(s.a) / Q
      const i0 = Math.floor(u)
      const f = u - i0
      const e = 1 - Math.abs(2 * f - 1)
      const sx = 1 - (1 - NARROW) * e * e * (3 - 2 * e)
      const topA = smooth(0.38, 0.62, f)
      const baseA = 1 - smooth(0.5, 0.62, f)
      const viewOf = (i: number) => ((i % 4) + 4) % 4
      // gölge ve ışık için ağırlıklı görüş: yan görüşte geniş, önde/arkada dar; arka koyu, ön ılık
      const wOf = (v: number) => (v % 2 === 0 ? 1 : 0)
      const wide = wOf(viewOf(i0)) * (1 - topA) + wOf(viewOf(i0 + 1)) * topA
      // büyük sahnede altta düğme şeridi, üstte parçanın adı var: karakter ikisinin arasına sığar (boyu ~ size)
      const big = w > 200 * dpr
      const ground = big ? h - 54 * dpr : h * 0.9
      const size = Math.min(ground - (big ? 44 : 10) * dpr, w * 0.95)
      const cx = w / 2
      c.clearRect(0, 0, w, h)

      // ışık: sol üstten ılık huzme ve karakterin ardında yumuşak hale
      const beam = c.createLinearGradient(w * 0.15, 0, cx, ground)
      beam.addColorStop(0, 'rgba(255,214,150,0.16)')
      beam.addColorStop(1, 'rgba(255,214,150,0)')
      c.fillStyle = beam
      c.beginPath()
      c.moveTo(w * 0.05, 0)
      c.lineTo(w * 0.42, 0)
      c.lineTo(cx + size * 0.5, ground)
      c.lineTo(cx - size * 0.62, ground)
      c.closePath()
      c.fill()
      const halo = c.createRadialGradient(cx, ground - size * 0.5, 0, cx, ground - size * 0.5, size * 0.72)
      halo.addColorStop(0, 'rgba(255,224,170,0.22)')
      halo.addColorStop(0.55, 'rgba(160,150,255,0.08)')
      halo.addColorStop(1, 'rgba(160,150,255,0)')
      c.fillStyle = halo
      c.fillRect(0, 0, w, h)

      // sahne tablası: dönen çivileriyle derinlik ipucu
      const rx = Math.min(w * 0.46, size * 0.6)
      const ry = rx * 0.2
      const plate = c.createLinearGradient(0, ground - ry, 0, ground + ry)
      plate.addColorStop(0, 'rgba(70,62,140,0.55)')
      plate.addColorStop(1, 'rgba(20,18,48,0.75)')
      c.fillStyle = plate
      c.beginPath()
      c.ellipse(cx, ground, rx, ry, 0, 0, Math.PI * 2)
      c.fill()
      c.lineWidth = Math.max(1, dpr * 1.5)
      c.strokeStyle = 'rgba(255,204,102,0.32)'
      c.stroke()
      // tablanın ön kenarı: kalınlık
      c.fillStyle = 'rgba(12,11,30,0.7)'
      c.beginPath()
      c.ellipse(cx, ground, rx, ry, 0, 0, Math.PI)
      c.ellipse(cx, ground + ry * 0.35, rx, ry, 0, Math.PI, 0, true)
      c.fill()
      for (let i = 0; i < 12; i++) {
        const th = (i / 12) * Math.PI * 2 + s.a
        const front = Math.sin(th)
        const r = Math.max(1, dpr * (1.6 + front * 0.8))
        c.fillStyle = `rgba(255,214,150,${0.22 + 0.4 * (front * 0.5 + 0.5)})`
        c.beginPath()
        c.arc(cx + Math.cos(th) * rx * 0.82, ground + front * ry * 0.82, r, 0, Math.PI * 2)
        c.fill()
      }

      // gölge: zıplarken küçülür, önden/arkadan bakınca daralır
      // zıplayış sahnenin tepesine çarpmasın: üst payın altında yumuşakça kısılır
      const room = Math.max(1, ground - size - 6 * dpr)
      const lift = room * Math.tanh((d.dy * size) / room)
      c.fillStyle = `rgba(10,9,26,${0.5 - Math.min(0.25, d.dy * 0.3)})`
      c.beginPath()
      c.ellipse(cx, ground, size * 0.24 * (1 - d.dy * 0.35) * (0.72 + 0.28 * wide) * sx, size * 0.04, 0, 0, Math.PI * 2)
      c.fill()

      // karakter: her görüş ayrı katmanda çizilir, arkası dönükken koyulaşır, önü dönükken ılık ışık alır
      const paint = (g: CanvasRenderingContext2D, v: number) => {
        g.clearRect(0, 0, w, h)
        const o = { moving: d.moving, flow: d.flow, sx: d.kx * sx, sy: d.ky, scarf: scarf?.color, scarfS: scarf?.shade, acc: k }
        if (v === 0 || v === 2) drawHero(g, hero, d.pose, cx, ground - lift, size, v === 2, t, o)
        else drawHeroTurn(g, hero, v === 1 ? 'front' : 'back', d.pose, cx, ground - lift, size, t, o)
        g.globalCompositeOperation = 'source-atop'
        g.fillStyle = v === 3 ? 'rgba(18,14,44,0.16)' : v === 1 ? 'rgba(255,222,170,0.07)' : 'rgba(0,0,0,0)'
        if (v === 1 || v === 3) g.fillRect(0, 0, w, h)
        g.globalCompositeOperation = 'source-over'
      }
      if (baseA > 0.001) {
        paint(lc, viewOf(i0))
        c.globalAlpha = baseA
        c.drawImage(layer, 0, 0)
      }
      if (topA > 0.001) {
        paint(lc2, viewOf(i0 + 1))
        c.globalAlpha = topA
        c.drawImage(layer2, 0, 0)
      }
      c.globalAlpha = 1

      // erişilebilirlik: kaydırıcının değeri (yalnız değişince)
      const deg = Math.round((((-s.a * 180) / Math.PI) % 360 + 360) % 360)
      if (deg !== shownDeg) {
        shownDeg = deg
        el.setAttribute('aria-valuenow', String(deg))
        el.setAttribute('aria-valuetext', `${deg}°`)
      }
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      draw(now)
    }
    draw(prev)
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [hero, key, scarf?.color, scarf?.shade, mode])

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const s = turn.current
    s.drag = true
    s.px = e.clientX
    s.pa = s.a
    s.pt = performance.now()
    s.v = 0
    s.dirty = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const s = turn.current
    if (!s.drag) return
    const wdt = Math.max(120, box.current?.clientWidth ?? 240)
    const now = performance.now()
    const a = s.pa - ((e.clientX - s.px) / wdt) * DRAG_TURN
    const dt = Math.max(0.001, (now - s.pt) / 1000)
    // bırakma hızı: son hareketlerin yumuşatılmış ortalaması
    s.v = s.v * 0.6 + ((a - s.a) / dt) * 0.4
    s.a = a
    s.pt = now
    s.dirty = true
  }
  const onUp = () => {
    const s = turn.current
    if (!s.drag) return
    s.drag = false
    // durmuş parmak fırlatmaz
    if (performance.now() - s.pt > 90) s.v = 0
    s.v = Math.max(-12, Math.min(12, s.v))
    s.target = Math.round((s.a + s.v * 0.18) / Q) * Q
    s.dirty = true
  }
  const onKey = (e: React.KeyboardEvent) => {
    const s = turn.current
    const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0
    if (dir) {
      // bir basış çeyrek tur: sonraki görüşe yayla döner; basılı tutunca döner durur
      e.preventDefault()
      e.stopPropagation()
      const from = s.spin ? s.a : s.target
      const next = Math.round(from / Q) * Q + dir * KEY_STEP
      if (Math.abs(next - s.a) <= KEY_STEP * 1.5) s.target = next
      if (s.spin) {
        s.v = 0
        s.spin = false
        onStopSpin()
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      s.target = Math.round(s.a / (Math.PI * 2)) * Math.PI * 2
    } else return
    s.dirty = true
  }

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={0}
      aria-valuetext="0°"
      data-turn
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onKeyDown={onKey}
      className={`cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-gold ${className}`}
    >
      <canvas ref={ref} className="pointer-events-none block h-full w-full" aria-hidden />
    </div>
  )
}
