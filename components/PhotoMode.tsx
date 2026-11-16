'use client'
import { ic } from '@/components/ui'

import { useEffect, useRef, useState } from 'react'
import type { Renderer } from '@/game/render'
import type { LevelDef } from '@/game/types'
import { useT } from '@/lib/i18n'

/**
 * Fotoğraf Kipi: oyun durur, arayüz kalkar; kadraj ok tuşları / WASD (Game.tsx döngüsü) ya da sürükleyerek kayar.
 * Kaydedilen görüntü tuvalin kendisidir; istenirse kartpostal çerçevesi (şehir adı, plaka, tarih) eklenir.
 */
export default function PhotoMode({ canvas, renderer, level, onClose }: { canvas: HTMLCanvasElement | null; renderer: Renderer | null; level: LevelDef; onClose: () => void }) {
  const t = useT()
  const [frame, setFrame] = useState(true)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!note) return
    const id = setTimeout(() => setNote(null), 2400)
    return () => clearTimeout(id)
  }, [note])

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    const p = renderer?.photo
    if (!d || !p || !canvas) return
    // ekran pikseli → dünya pikseli
    const k = renderer.viewW / Math.max(1, canvas.clientWidth)
    p.x -= (e.clientX - d.x) * k
    p.y -= (e.clientY - d.y) * k
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = () => {
    drag.current = null
  }

  const save = async () => {
    if (!canvas || busy) return
    setBusy(true)
    try {
      const blob = await snapshot(canvas, frame ? level : null)
      const file = new File([blob], `sek-sek-${level.id}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
      if (nav.share && nav.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
        await nav.share({ files: [file], title: `Sek-Sek · ${level.name}` }).catch(() => {})
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        setNote(t('Fotoğraf Kaydedildi'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute inset-0 z-20 cursor-grab touch-none active:cursor-grabbing" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="pointer-events-none absolute inset-3 border-2 border-cream/25 [box-shadow:inset_0_0_0_1px_rgb(14_13_34/0.4)]" />
      <p className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+14px)] text-center text-[13px] text-cream/80 [text-shadow:0_1px_2px_#0e0d22]">
        {t('Kadrajı kaydırmak için sürükle ya da ok tuşlarını kullan')}
      </p>
      {note && <p className="rise pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+40px)] text-center font-display text-[15px] text-gold [text-shadow:0_2px_0_#0e0d22]">{note}</p>}
      <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+14px)] flex justify-center px-3" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 bg-ink/80 p-2 backdrop-blur-[2px] [box-shadow:inset_0_0_0_2px_#37337a]">
          <button className="pixel-btn px-3 py-2 text-[13px]" onClick={onClose}>
            {ic(t('← Mola'))}
          </button>
          <button className="pixel-btn px-3 py-2 text-[13px]" aria-pressed={frame} onClick={() => setFrame((f) => !f)}>
            {t('Kartpostal Çerçevesi')}: {frame ? t('Açık') : t('Kapalı')}
          </button>
          <button className="pixel-btn primary px-4 py-2 text-[13px]" onClick={save} disabled={busy} autoFocus>
            {ic(t('◉ Fotoğrafı Kaydet'))}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Tuvalin o anki karesi; çerçeveli istenirse krem kenar, şehir adı, plaka ve tarih eklenir. */
async function snapshot(canvas: HTMLCanvasElement, level: LevelDef | null): Promise<Blob> {
  let out = canvas
  if (level) {
    const w = canvas.width
    const h = canvas.height
    const pad = Math.round(Math.min(w, h) * 0.035)
    const foot = Math.round(pad * 2.6)
    out = document.createElement('canvas')
    out.width = w + pad * 2
    out.height = h + pad + foot
    const c = out.getContext('2d')!
    c.fillStyle = '#f8f4ec'
    c.fillRect(0, 0, out.width, out.height)
    c.drawImage(canvas, pad, pad)
    c.strokeStyle = 'rgba(58,42,30,0.35)'
    c.lineWidth = Math.max(1, pad * 0.06)
    c.strokeRect(pad, pad, w, h)
    const title = getComputedStyle(document.body).getPropertyValue('--font-title').trim() || 'system-ui'
    const body = getComputedStyle(document.body).getPropertyValue('--font-body').trim() || 'system-ui'
    const base = h + pad + foot * 0.62
    c.fillStyle = '#3a2a1e'
    c.textBaseline = 'alphabetic'
    c.font = `700 ${Math.round(foot * 0.5)}px ${title}, system-ui, sans-serif`
    c.fillText(level.name, pad, base)
    const nameW = c.measureText(level.name).width
    c.font = `600 ${Math.round(foot * 0.26)}px ${body}, system-ui, sans-serif`
    c.fillStyle = '#8a6a4a'
    c.fillText(`${String(level.plate).padStart(2, '0')} · ${new Date().toLocaleDateString('tr-TR')}`, pad + nameW + pad * 0.6, base)
    c.textAlign = 'right'
    c.font = `700 ${Math.round(foot * 0.34)}px ${title}, system-ui, sans-serif`
    c.fillStyle = '#2f3cb0'
    c.fillText('Sek-Sek', out.width - pad, base)
  }
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
}
