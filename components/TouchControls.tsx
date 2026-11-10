'use client'

import { useT } from '@/lib/i18n'
import { useRef, useState } from 'react'
import type { InputManager } from '@/game/input'

type Kind = 'jump' | 'dash'

/**
 * Sol yarıda yüzen joystick, sağda DASH ve ZIPLA.
 * Tuşların dokunma alanı görünen dairelerden geniştir; kaçırılan basış olmasın.
 */
export default function TouchControls({ input, big = false, canDash = true }: { input: InputManager; big?: boolean; canDash?: boolean }) {
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null)
  const [pressed, setPressed] = useState({ jump: false, dash: false })
  const stickId = useRef<number | null>(null)
  const R = big ? 56 : 46
  const jumpD = big ? 112 : 94
  const dashD = big ? 92 : 78

  const move = (e: React.PointerEvent, ox: number, oy: number) => {
    let dx = e.clientX - ox
    let dy = e.clientY - oy
    const len = Math.hypot(dx, dy)
    if (len > R) {
      dx = (dx / len) * R
      dy = (dy / len) * R
    }
    input.touch.x = dx / R
    input.touch.y = dy / R
    setStick({ ox, oy, x: dx, y: dy })
  }

  const end = () => {
    stickId.current = null
    input.touch.x = 0
    input.touch.y = 0
    setStick(null)
  }

  const block = (e: React.SyntheticEvent) => e.preventDefault()

  // her parmak hangi tuşta: başparmak ZIPLA'dan DASH'a kayınca kaldırmadan geçiş olur
  const fingers = useRef(new Map<number, Kind>())
  const sync = () => {
    const on = [...fingers.current.values()]
    const jump = on.includes('jump')
    const dash = on.includes('dash')
    if (jump && !input.touch.jump) input.pressJump()
    if (!jump && input.touch.jump) input.releaseJump()
    if (dash && !input.touch.dash) input.pressDash()
    if (!dash && input.touch.dash) input.releaseDash()
    setPressed((p) => (p.jump === jump && p.dash === dash ? p : { jump, dash }))
  }
  const lift = (e: React.PointerEvent) => {
    fingers.current.delete(e.pointerId)
    sync()
  }

  const btn = (kind: Kind) => ({
    'data-btn': kind,
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      fingers.current.set(e.pointerId, kind)
      sync()
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!fingers.current.has(e.pointerId)) return
      const over = (document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-btn]') as HTMLElement | null)?.dataset.btn as Kind | undefined
      if (over && over !== fingers.current.get(e.pointerId)) {
        fingers.current.set(e.pointerId, over)
        sync()
      }
    },
    onPointerUp: lift,
    onPointerCancel: lift,
    onLostPointerCapture: lift,
    onContextMenu: block,
  })

  const dir = stick ? (stick.x < -R * 0.35 ? 'left' : stick.x > R * 0.35 ? 'right' : null) : null

  const t = useT()
  return (
    <div className="touch-layer pointer-events-none absolute inset-0 z-10" onContextMenu={block}>
      {/* joystick bölgesi: sol yarının alt %60'ı */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[60%] w-1/2"
        onContextMenu={block}
        onPointerDown={(e) => {
          if (stickId.current !== null) return
          e.preventDefault()
          stickId.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          move(e, e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== stickId.current || !stick) return
          move(e, stick.ox, stick.oy)
        }}
        onPointerUp={(e) => e.pointerId === stickId.current && end()}
        onPointerCancel={(e) => e.pointerId === stickId.current && end()}
      >
        {stick ? (
          <div className="absolute" style={{ left: stick.ox - R - 14, top: stick.oy - R - 14 }}>
            <div className="relative rounded-full border-2 border-white/25 bg-black/30" style={{ width: (R + 14) * 2, height: (R + 14) * 2 }}>
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-lg ${dir === 'left' ? 'text-gold' : 'text-white/30'}`}>◀</span>
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-lg ${dir === 'right' ? 'text-gold' : 'text-white/30'}`}>▶</span>
            </div>
            <div
              className="absolute rounded-full border-2 border-white/60 bg-white/35 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
              style={{ width: 56, height: 56, left: R + 14 - 28 + stick.x, top: R + 14 - 28 + stick.y }}
            />
          </div>
        ) : (
          <div
            className="absolute flex items-center justify-between rounded-full border-2 border-white/15 bg-black/25 px-4 text-lg text-white/40"
            style={{ width: (R + 14) * 2, height: (R + 14) * 2, left: 'max(20px, env(safe-area-inset-left))', bottom: 'max(28px, env(safe-area-inset-bottom))' }}
          >
            <span>◀</span>
            <span className="h-12 w-12 rounded-full border-2 border-white/25 bg-white/15" />
            <span>▶</span>
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute flex items-end gap-3"
        style={{ right: 'max(14px, env(safe-area-inset-right))', bottom: 'max(22px, env(safe-area-inset-bottom))' }}
      >
        <button type="button" aria-label={t("Dash")} className="pointer-events-auto p-2" {...btn('dash')}>
          <span
            className={`flex flex-col items-center justify-center rounded-full border-2 font-display text-sm text-cream shadow-[inset_0_-4px_0_rgba(0,0,0,0.35)] transition-transform duration-75 ${pressed.dash ? 'translate-y-0.5 scale-95 border-gold bg-[#3a3250]' : canDash ? 'border-[#d6403a] bg-[#2a2438]/85 shadow-[0_0_12px_rgba(214,64,58,0.45)]' : 'border-white/20 bg-[#2a2438]/60 opacity-60'}`}
            style={{ width: dashD, height: dashD }}
          >
            <span className="text-xl leading-none">»</span>
            {t('DASH')}
          </span>
        </button>
        <button type="button" aria-label={t("Zıpla")} className="pointer-events-auto mb-8 p-2" {...btn('jump')}>
          <span
            className={`flex flex-col items-center justify-center rounded-full border-2 border-[#f5a571] font-display text-base text-ink shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)] transition-transform duration-75 ${pressed.jump ? 'translate-y-0.5 scale-95 bg-accent-2' : 'bg-accent/90'}`}
            style={{ width: jumpD, height: jumpD }}
          >
            <span className="text-2xl leading-none">▲</span>
            {t('ZIPLA')}
          </span>
        </button>
      </div>
    </div>
  )
}
