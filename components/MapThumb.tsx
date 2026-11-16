'use client'

import { useEffect, useRef } from 'react'
import { CITY, LAYER_H, LAYER_W, buildLayers, type Layers } from '@/game/art'
import type { CityKey } from '@/game/types'
import { thumbColors } from '@/lib/editorKit'

/**
 * Haritanın kuşbakışı: karo başına bir piksel, şehrin paletiyle (lib/editorKit.ts thumbColors). Topluluk galerisi
 * ve mücadele/parkur ekranı kullanır. `minW`: kısa haritada gök ve zemin bu genişliğe dek sürer (kart oranı korunur).
 */
export default function MapThumb({ map, city, minW = 0, className = 'block h-full w-auto max-w-none', fit = 'contain' }: { map: string[]; city: CityKey; minW?: number; className?: string; /** contain: oran korunur · fill: kutuyu doldurur (ince şeritte yolun silueti) */ fit?: 'contain' | 'fill' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !map.length) return
    const p = CITY[city]
    const w = map[0].length
    cv.width = Math.max(w, minW)
    cv.height = map.length
    const sky = c.createLinearGradient(0, 0, 0, cv.height)
    p.sky.forEach((col, i) => sky.addColorStop(i / (p.sky.length - 1), col))
    c.fillStyle = sky
    c.fillRect(0, 0, cv.width, cv.height)
    const color = thumbColors(p)
    map.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        const ch = row[x]
        const col = color[ch]
        if (!col) continue
        c.fillStyle = ch === '#' && y > 0 && map[y - 1][x] !== '#' ? p.tileTop : col
        c.fillRect(x, ch === 'E' || ch === 'F' ? y - 1 : y, 1, ch === 'E' || ch === 'F' ? 2 : 1)
      }
      const last = row[w - 1]
      if (cv.width > w && (last === '#' || last === '~')) {
        c.fillStyle = last === '#' ? (y > 0 && map[y - 1][w - 1] !== '#' ? p.tileTop : p.tile) : p.water[0]
        c.fillRect(w, y, cv.width - w, 1)
      }
    })
  }, [map, city, minW])
  // oran korunur: kutu haritadan farklı oranlıysa harita ortalanır, kalan yer zeminin rengiyle kalır
  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated', objectFit: fit }} aria-hidden />
}

const layerCache = new Map<CityKey, Layers>()
const layersOf = (city: CityKey) => {
  let l = layerCache.get(city)
  if (!l) layerCache.set(city, (l = buildLayers(city)))
  return l
}

/**
 * Parkur kartının görseli: parkurun kendisi oyunun diliyle, kartın tamamını kaplar. Arkada şehrin kendi parallax
 * katmanları (kale, cami, köprü siluetleri; oyundaki arka planın aynısı), önde parkurun karoları şehrin paletiyle
 * (diken, su, düşman, bayrak ve hatıralar renkli). Kadraj yolun geçtiği yüksekliğe oturur; kart ölçüsü değişince
 * yeniden çizilir. Mücadele, Öfke Parkuru ve Haftalık Turnuva kartları kullanır.
 */
export function CourseScene({ map, city, className = '' }: { map: string[]; city: CityKey; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = box.current
    const cv = ref.current
    if (!el || !cv) return
    const draw = () => {
      const c = cv.getContext('2d')
      const W = Math.max(1, Math.round(el.clientWidth))
      const H = Math.max(1, Math.round(el.clientHeight))
      if (!c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.imageSmoothingEnabled = false
      const p = CITY[city]
      // gök
      const sky = c.createLinearGradient(0, 0, 0, H)
      p.sky.forEach((col, k) => sky.addColorStop(k / (p.sky.length - 1), col))
      c.fillStyle = sky
      c.fillRect(0, 0, W, H)
      // kadraj: haritanın dolu satırlarından iki satır yukarıdan başlar, dibe dek
      const rows = map.length
      const cols = map[0].length
      let top = map.findIndex((r) => r.trim() !== '')
      top = Math.max(0, Math.min(rows - 8, (top < 0 ? rows - 8 : top) - 2))
      const vis = rows - top
      const tile = Math.max(H / vis, W / cols)
      const oy = H - rows * tile
      // parallax katmanları: tabanları zemin çizgisine (yaklaşık 20. satır) oturur, kartın eni boyunca yinelenir
      const L = layersOf(city)
      const ground = oy + 20 * tile
      const k = Math.max(0.35, (ground / LAYER_H) * 1.15)
      for (const [cvL, f] of [[L.far, 0.55], [L.mid, 0.8], [L.near, 1]] as const) {
        const lw = LAYER_W * k * f
        const lh = LAYER_H * k * f
        for (let x = -((cols * tile * (1 - f)) % lw); x < W; x += lw) c.drawImage(cvL, x, ground - lh + 6 * k, lw, lh)
      }
      c.fillStyle = 'rgba(14,13,34,0.12)'
      c.fillRect(0, 0, W, H)
      // karolar
      const solid = (ch: string | undefined) => ch === '#' || ch === 'I' || ch === 'i' || ch === 'X' || ch === '%'
      const rect = (x: number, y: number, w: number, h: number, col: string) => {
        c.fillStyle = col
        c.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h))
      }
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const ch = map[y][x]
          const px = x * tile
          const py = oy + y * tile
          if (py > H || px > W) continue
          if (solid(ch)) {
            const topEdge = !solid(map[y - 1]?.[x])
            rect(px, py, tile, tile, ch === 'I' ? p.water[2] : ch === 'X' ? p.tileDark : p.tile)
            if (topEdge) {
              rect(px, py, tile, Math.max(1, tile * 0.3), ch === 'i' ? '#2896be' : p.tileTop)
              rect(px, py + tile * 0.3, tile, Math.max(1, tile * 0.08), 'rgba(14,13,34,0.35)')
            }
          } else if (ch === '=' || ch === 'M' || ch === 'N' || ch === 'B' || ch === 'O' || ch === 'H' || ch === 'J') rect(px, py, tile, tile * 0.32, p.plank)
          else if (ch === '^' || ch === 'v') {
            c.fillStyle = p.spike[0]
            c.beginPath()
            const up = ch === '^'
            c.moveTo(px, up ? py + tile : py)
            c.lineTo(px + tile / 2, up ? py + tile * 0.25 : py + tile * 0.75)
            c.lineTo(px + tile, up ? py + tile : py)
            c.fill()
          } else if (ch === '~') rect(px, py + tile * 0.25, tile, tile * 0.75, p.water[0])
          else if (ch === 'W') rect(px, py, tile, tile, '#3fa9b8')
          else if (ch === '{' || ch === '}') rect(px + 1, py + 1, tile - 2, tile - 2, ch === '{' ? '#ff9a7a' : '#5ad6c6')
          else if (ch === 'L') rect(px + tile * 0.42, py, tile * 0.16, tile, '#c49a5a')
          else if (ch === 'R') rect(px, py + tile * 0.4, tile, Math.max(1, tile * 0.12), '#8f96a3')
          else if (ch === 'Y') rect(px + tile * 0.1, py, tile * 0.8, tile * 0.8, '#b8682e')
          else if ('efhcuxj'.includes(ch) && ch !== ' ') {
            c.fillStyle = '#ff6b6b'
            c.beginPath()
            c.arc(px + tile / 2, py + tile * 0.62, tile * 0.36, 0, Math.PI * 2)
            c.fill()
          } else if (ch === 'F') {
            rect(px + tile * 0.3, py - tile, Math.max(1, tile * 0.12), tile * 2, '#ece6da')
            rect(px + tile * 0.42, py - tile, tile * 0.5, tile * 0.38, '#e30a17')
          } else if (ch === 'P') {
            // yolcu: baş, turkuaz atkı, gövde
            c.fillStyle = '#f0c8a0'
            c.beginPath()
            c.arc(px + tile / 2, py - tile * 0.55, tile * 0.32, 0, Math.PI * 2)
            c.fill()
            rect(px + tile * 0.2, py - tile * 0.25, tile * 0.6, tile * 0.22, '#3cc4b4')
            rect(px + tile * 0.25, py - tile * 0.05, tile * 0.5, tile * 1.05, '#f2c14e')
          } else if (ch === 'E') {
            // çıkış: altın kemerli kapı
            rect(px - tile * 0.1, py - tile, tile * 1.2, tile * 2, '#7a5a30')
            rect(px + tile * 0.1, py - tile * 0.8, tile * 0.8, tile * 1.8, '#ffcc66')
          }
          else if (ch === 'T' || ch === '*' || ch === 'S') rect(px + tile * 0.25, py + tile * 0.25, tile * 0.5, tile * 0.5, ch === 'T' ? '#ff9a3c' : ch === '*' ? '#9fd8ff' : p.accent)
          else if (ch === '>' || ch === '<') rect(px, py + tile * 0.3, tile, tile * 0.4, p.tileDark)
        }
      // haritanın sağında kalan alan: son sütunun zemini sürer
      if (cols * tile < W)
        for (let y = 0; y < rows; y++)
          if (solid(map[y][cols - 1])) rect(cols * tile, oy + y * tile, W - cols * tile, tile, !solid(map[y - 1]?.[cols - 1]) ? p.tileTop : p.tile)
      // alt kenarda hafif koyuluk: kart yazısı ve çerçeveyle karışmasın
      const fade = c.createLinearGradient(0, H * 0.6, 0, H)
      fade.addColorStop(0, 'rgba(14,13,34,0)')
      fade.addColorStop(1, 'rgba(14,13,34,0.35)')
      c.fillStyle = fade
      c.fillRect(0, H * 0.6, W, H * 0.4)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [map, city])
  return (
    <div ref={box} className={`relative overflow-hidden border-2 border-line bg-ink ${className}`}>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  )
}
