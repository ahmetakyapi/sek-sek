'use client'

import { useRef, useState } from 'react'
import type { InputManager } from '@/game/input'

/** Sol yarıda yüzen joystick, sağda ATIL ve ZIPLA. Çoklu dokunuş pointer olaylarıyla. */
export default function TouchControls({ input }: { input: InputManager }) {
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null)
  const stickId = useRef<number | null>(null)
  const R = 46

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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* joystick bölgesi */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[55%] w-1/2"
        onPointerDown={(e) => {
          if (stickId.current !== null) return
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
          <div className="absolute" style={{ left: stick.ox - 60, top: stick.oy - 60 }}>
            <div className="h-[120px] w-[120px] rounded-full border-2 border-white/25 bg-black/25" />
            <div
              className="absolute h-14 w-14 rounded-full border-2 border-white/50 bg-white/30"
              style={{ left: 32 + stick.x, top: 32 + stick.y }}
            />
          </div>
        ) : (
          <div
            className="absolute flex h-[120px] w-[120px] items-center justify-center rounded-full border-2 border-white/15 bg-black/20 text-xs font-semibold text-white/40"
            style={{ left: 'max(20px, env(safe-area-inset-left))', bottom: 'max(28px, env(safe-area-inset-bottom))' }}
          >
            ◀ ▲ ▶
          </div>
        )}
      </div>

      <div
        className="pointer-events-auto absolute flex items-end gap-4"
        style={{ right: 'max(18px, env(safe-area-inset-right))', bottom: 'max(26px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          aria-label="Atıl"
          className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full border-2 border-white/30 bg-[#2a2438]/80 font-display text-sm text-cream shadow-[inset_0_-4px_0_rgba(0,0,0,0.35)] active:translate-y-0.5"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            input.pressDash()
          }}
          onPointerUp={() => input.releaseDash()}
          onPointerCancel={() => input.releaseDash()}
        >
          <span className="text-lg leading-none">»</span>
          ATIL
        </button>
        <button
          type="button"
          aria-label="Zıpla"
          className="mb-6 flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full border-2 border-[#f5a571] bg-accent/90 font-display text-base text-ink shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)] active:translate-y-0.5"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            input.pressJump()
          }}
          onPointerUp={() => input.releaseJump()}
          onPointerCancel={() => input.releaseJump()}
        >
          <span className="text-xl leading-none">▲</span>
          ZIPLA
        </button>
      </div>
    </div>
  )
}
