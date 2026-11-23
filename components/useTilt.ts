'use client'

/**
 * Kartın imlece göre eğilmesi (ana menü kartpostalı, mücadele parkur görseli): imlecin kart içindeki konumu `--rx` / `--ry`
 * (derece) ve parlamanın yeri `--sx` / `--sy` olur. React durumu değil, doğrudan stil değişkeni (yeniden çizim yok).
 * Yalnız fareyle; dönüşü ve parlamayı globals.css `.tilt` çizer, "hareketi azalt" açıksa orada kapalıdır.
 */
export function useTilt() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`)
      el.style.setProperty('--sx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--sy', `${(y * 100).toFixed(1)}%`)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.style.setProperty('--rx', '0deg')
      e.currentTarget.style.setProperty('--ry', '0deg')
    },
  }
}
