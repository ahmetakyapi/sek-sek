'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CITY, type CityStyle } from '@/game/art'
import { LEVELS } from '@/game/levels'
import type { CityKey } from '@/game/types'
import { MAX_W, MIN_W, ROWS, SAMPLE_MAP, customLevel, decodeMap, encodeMap, validateMap, type Sym } from '@/lib/customLevel'
import { LangProvider, useLang, useT, type Lang } from '@/lib/i18n'
import type { SolveReply, SolveRequest } from './solve.worker'

/**
 * Bölüm Düzenleyici (/duzenle): 24 satırlık özel harita çizilir, çözücüyle sınanır, kodu bağlantıyla paylaşılır.
 * Karolar oyunun çizimiyle değil, okunsun diye sade renkli kare + simgeyle gösterilir; renkler seçilen şehrin paletinden.
 */

type Tool = Exclude<Sym, ' '> | 'erase' | 'pan'

const TOOLS: Array<{ tool: Tool; name: string; key: string }> = [
  { tool: 'erase', name: 'Silgi', key: '0' },
  { tool: 'pan', name: 'Kaydır', key: 'H' },
  { tool: '#', name: 'Zemin', key: '1' },
  { tool: '=', name: 'İnce Platform', key: '2' },
  { tool: '^', name: 'Diken', key: '3' },
  { tool: 'v', name: 'Tavan Dikeni', key: '4' },
  { tool: '~', name: 'Su', key: '5' },
  { tool: 'I', name: 'Buz', key: '6' },
  { tool: 'i', name: 'Islak Taş', key: '7' },
  { tool: 'X', name: 'Çatlak Taş', key: '8' },
  { tool: 'S', name: 'Yay', key: '9' },
  { tool: '>', name: 'Ok Tuzağı →', key: '.' },
  { tool: '<', name: 'Ok Tuzağı ←', key: ',' },
  { tool: 'P', name: 'Başlangıç', key: 'P' },
  { tool: 'E', name: 'Çıkış Kapısı', key: 'K' },
  { tool: 'F', name: 'Bayrak', key: 'F' },
  { tool: 'C', name: 'Hatıra', key: 'C' },
  { tool: 'e', name: 'Yürüyen Düşman', key: 'D' },
  { tool: 'f', name: 'Uçan Düşman', key: 'U' },
  { tool: 't', name: 'Ağaç (Süs)', key: 'T' },
  { tool: 'l', name: 'Fener (Süs)', key: 'L' },
  { tool: 'w', name: 'Pencere (Süs)', key: 'W' },
  { tool: 'b', name: 'Bayrak Süsü', key: 'B' },
]

const DRAFTS_KEY = 'seksek:taslaklar'
const WORK_KEY = 'seksek:duzenle'
const BUDGET = 20000
const SOLVE_LIMIT_MS = 45000
const HISTORY = 120

interface Draft {
  id: string
  name: string
  /** geçerli haritanın paylaşım kodu (P/E eksikse null) */
  code: string | null
  map: string[]
  city: CityKey
  at: number
}

type SolveState = { s: 'idle' } | { s: 'running' } | { s: 'won'; seconds: number } | { s: 'fail'; unsure: boolean; far: { x: number; y: number } } | { s: 'error' }

/** Çizim renkleri: şehrin paleti + tema değişkenleri (globals.css @theme). */
interface Look {
  city: CityStyle
  gold: string
  flag: string
  cream: string
  ink: string
  sign: string
}

function readStore<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* depo kapalı ya da dolu: taslak bu cihazda saklanamaz */
  }
}

function tri(c: CanvasRenderingContext2D, pts: number[], fill: string, stroke?: string) {
  c.beginPath()
  c.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
  c.closePath()
  c.fillStyle = fill
  c.fill()
  if (stroke) {
    c.strokeStyle = stroke
    c.lineWidth = 1
    c.stroke()
  }
}

/** Tek karo; above: üstteki karo (zeminin üst örtüsü ve suyun dalgası için). */
function drawTile(c: CanvasRenderingContext2D, ch: string, x: number, y: number, s: number, look: Look, above = ' ') {
  const p = look.city
  const u = s / 16
  switch (ch) {
    case '#':
      c.fillStyle = p.tile
      c.fillRect(x, y, s, s)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + s - 2 * u, s, 2 * u)
      if (above !== '#') {
        c.fillStyle = p.tileTop
        c.fillRect(x, y, s, 4 * u)
      }
      break
    case '=':
      c.fillStyle = p.plank
      c.fillRect(x, y, s, 5 * u)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + 5 * u, s, u)
      break
    case '^':
      tri(c, [x + u, y + s, x + s / 2, y + 3 * u, x + s - u, y + s], p.spike[0], p.spike[1])
      break
    case 'v':
      tri(c, [x + u, y, x + s / 2, y + s - 3 * u, x + s - u, y], p.spike[0], p.spike[1])
      break
    case 'I':
      c.fillStyle = p.water[2]
      c.fillRect(x, y, s, s)
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + 3 * u, 4 * u, 2 * u)
      c.strokeStyle = p.water[0]
      c.lineWidth = u
      c.strokeRect(x + u / 2, y + u / 2, s - u, s - u)
      break
    case 'i':
      c.fillStyle = p.tileLight
      c.fillRect(x, y, s, s)
      c.fillStyle = p.water[0]
      for (const [dx, dy] of [[4, 4], [10, 7], [5, 11]]) c.fillRect(x + dx * u, y + dy * u, 2 * u, 3 * u)
      break
    case 'X':
      c.fillStyle = p.tileDark
      c.fillRect(x, y, s, s)
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.beginPath()
      c.moveTo(x + 3 * u, y + 2 * u)
      c.lineTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 6 * u, y + 14 * u)
      c.moveTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 13 * u, y + 6 * u)
      c.stroke()
      break
    case '~':
      c.fillStyle = p.water[0]
      c.fillRect(x, y, s, s)
      if (above !== '~') {
        c.fillStyle = p.water[2]
        c.fillRect(x, y, s, 2 * u)
      }
      break
    case 'S':
      c.fillStyle = p.accent
      c.fillRect(x + 2 * u, y + 13 * u, 12 * u, 3 * u)
      c.strokeStyle = look.cream
      c.lineWidth = 1.5 * u
      c.beginPath()
      c.moveTo(x + 4 * u, y + 13 * u)
      for (let i = 0; i < 3; i++) c.lineTo(x + (i % 2 ? 4 : 12) * u, y + (11 - i * 2.5) * u)
      c.stroke()
      c.fillStyle = p.accent
      c.fillRect(x + 2 * u, y + 4 * u, 12 * u, 2 * u)
      break
    case '>':
    case '<': {
      c.fillStyle = p.tileDark
      c.fillRect(x, y, s, s)
      const d = ch === '>' ? 1 : -1
      const cx = x + s / 2
      tri(c, [cx - 4 * u * d, y + 4 * u, cx + 5 * u * d, y + 8 * u, cx - 4 * u * d, y + 12 * u], look.cream)
      break
    }
    case 'F':
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + u, 1.5 * u, 15 * u)
      tri(c, [x + 4.5 * u, y + u, x + 14 * u, y + 4.5 * u, x + 4.5 * u, y + 8 * u], look.flag)
      break
    case 'C':
      tri(c, [x + s / 2, y + 2 * u, x + 13 * u, y + 8 * u, x + s / 2, y + 14 * u, x + 3 * u, y + 8 * u], look.gold, look.ink)
      break
    case 'e':
    case 'f': {
      const cy = ch === 'e' ? y + 10 * u : y + 7 * u
      if (ch === 'f') {
        tri(c, [x + 8 * u, cy, x + u, cy - 5 * u, x + 3 * u, cy + 2 * u], look.flag)
        tri(c, [x + 8 * u, cy, x + 15 * u, cy - 5 * u, x + 13 * u, cy + 2 * u], look.flag)
      }
      c.fillStyle = look.flag
      c.beginPath()
      c.arc(x + 8 * u, cy, 5 * u, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = look.cream
      c.fillRect(x + 5.5 * u, cy - 2 * u, 2 * u, 2 * u)
      c.fillRect(x + 8.5 * u, cy - 2 * u, 2 * u, 2 * u)
      break
    }
    case 'P':
      c.fillStyle = p.accent
      c.beginPath()
      c.arc(x + 8 * u, y + 5 * u, 3.5 * u, 0, Math.PI * 2)
      c.fill()
      c.fillRect(x + 5 * u, y + 9 * u, 6 * u, 7 * u)
      c.strokeStyle = look.ink
      c.lineWidth = u
      c.strokeRect(x + 5 * u, y + 9 * u, 6 * u, 7 * u)
      break
    case 'E':
      // çıkış kapısı karonun kendisi ve üstündeki karoyu kaplar (sim.ts: exit y - T, boy 2T)
      c.fillStyle = p.plank
      c.fillRect(x + u, y - s + 2 * u, 14 * u, 2 * s - 2 * u)
      c.strokeStyle = look.gold
      c.lineWidth = 1.5 * u
      c.strokeRect(x + u, y - s + 2 * u, 14 * u, 2 * s - 2 * u)
      c.fillStyle = look.gold
      c.fillRect(x + 11 * u, y + 3 * u, 2 * u, 2 * u)
      break
    case 't':
      c.fillStyle = p.plank
      c.fillRect(x + 7 * u, y + 9 * u, 2 * u, 7 * u)
      c.fillStyle = p.mid
      c.beginPath()
      c.arc(x + 8 * u, y + 7 * u, 5 * u, 0, Math.PI * 2)
      c.fill()
      break
    case 'l':
      c.fillStyle = p.tileDark
      c.fillRect(x + 7 * u, y + 6 * u, 2 * u, 10 * u)
      c.fillStyle = look.gold
      c.fillRect(x + 5 * u, y + 2 * u, 6 * u, 5 * u)
      break
    case 'w':
      c.fillStyle = look.sign
      c.fillRect(x + 3 * u, y + 3 * u, 10 * u, 10 * u)
      c.fillStyle = look.cream
      c.fillRect(x + 7.5 * u, y + 3 * u, u, 10 * u)
      c.fillRect(x + 3 * u, y + 7.5 * u, 10 * u, u)
      break
    case 'b':
      c.fillStyle = look.cream
      c.fillRect(x, y + 3 * u, s, u)
      for (let i = 0; i < 3; i++) tri(c, [x + (1 + i * 5) * u, y + 4 * u, x + (6 + i * 5) * u, y + 4 * u, x + (3.5 + i * 5) * u, y + 9 * u], i % 2 ? look.gold : look.flag)
      break
  }
}

function lookFor(city: CityKey): Look {
  const css = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback
  const p = CITY[city]
  return { city: p, gold: v('--color-gold', p.accent), flag: v('--color-flag', p.accent), cream: v('--color-cream', p.tileTop), ink: v('--color-ink', p.tileDark), sign: v('--color-sign', p.water[1]) }
}

function Swatch({ tool, look }: { tool: Tool; look: Look | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look) return
    c.setTransform(2, 0, 0, 2, 0, 0)
    c.clearRect(0, 0, 24, 24)
    if (tool === 'erase' || tool === 'pan') {
      c.fillStyle = look.cream
      c.font = '600 15px system-ui, sans-serif'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(tool === 'erase' ? '✕' : '↔', 12, 13)
      return
    }
    c.fillStyle = look.city.sky[1]
    c.globalAlpha = 0.35
    c.fillRect(0, 0, 24, 24)
    c.globalAlpha = 1
    if (tool === 'E') drawTile(c, 'E', 6.5, 12, 11, look)
    else drawTile(c, tool, 2, 2, 20, look)
  }, [tool, look])
  return <canvas ref={ref} width={48} height={48} className="size-6 shrink-0" aria-hidden />
}

/** İki karo arası: hızlı sürüklemede atlanan hücreler de boyansın. */
function line(x0: number, y0: number, x1: number, y1: number, each: (x: number, y: number) => void) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    each(x0, y0)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

function Body({ setLang }: { setLang: (l: Lang) => void }) {
  const t = useT()
  const lang = useLang()
  const [map, setMap] = useState<string[]>(SAMPLE_MAP)
  const [city, setCity] = useState<CityKey>('istanbul')
  const [tool, setTool] = useState<Tool>('#')
  const [solveState, setSolve] = useState<SolveState>({ s: 'idle' })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [draftName, setDraftName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [share, setShare] = useState<{ url: string; copied: boolean } | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [cell, setCell] = useState(20)
  const [look, setLook] = useState<Look | null>(null)
  const [, setHistoryTick] = useState(0)
  const past = useRef<string[][]>([])
  const future = useRef<string[][]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  const stroke = useRef<{ rows: string[][]; last: { x: number; y: number }; erase: boolean; pushed: boolean } | null>(null)
  const worker = useRef<Worker | null>(null)
  const mapRef = useRef(map)
  mapRef.current = map

  const cols = map[0].length
  const problem = validateMap(map)
  const code = useMemo(() => (problem ? null : encodeMap(map, city)), [map, city, problem])

  // açılış: dil, ?kod=, son çalışma, taslaklar
  useEffect(() => {
    const save = readStore<{ lang?: Lang }>('seksek:v1')
    if (save?.lang === 'en') setLang('en')
    setDrafts(readStore<Draft[]>(DRAFTS_KEY) ?? [])
    setCell(window.matchMedia('(max-width: 640px)').matches ? 16 : 20)
    const kod = new URLSearchParams(window.location.search).get('kod')
    if (kod) {
      const r = decodeMap(kod)
      if ('error' in r) setNotice(r.error)
      else {
        setMap(r.map)
        setCity(r.city)
        return
      }
    }
    const work = readStore<{ map: string[]; city: CityKey }>(WORK_KEY)
    if (work && Array.isArray(work.map) && work.map.length === ROWS && CITY[work.city]) {
      setMap(work.map)
      setCity(work.city)
    }
  }, [setLang])

  useEffect(() => setLook(lookFor(city)), [city])

  // paylaşım bağlantısı eski haritayı göstermesin
  useEffect(() => setShare(null), [code])

  // çalışmayı her değişiklikte sakla: sayfa yenilense de kaybolmasın
  useEffect(() => writeStore(WORK_KEY, { map, city }), [map, city])

  const commit = useCallback((next: string[], prev: string[]) => {
    past.current.push(prev)
    if (past.current.length > HISTORY) past.current.shift()
    future.current = []
    setHistoryTick((n) => n + 1)
    setMap(next)
    setSolve({ s: 'idle' })
  }, [])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(mapRef.current)
    setHistoryTick((n) => n + 1)
    setMap(prev)
    setSolve({ s: 'idle' })
  }, [])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(mapRef.current)
    setHistoryTick((n) => n + 1)
    setMap(next)
    setSolve({ s: 'idle' })
  }, [])

  const resize = (delta: number) => {
    const w = Math.max(MIN_W, Math.min(MAX_W, cols + delta))
    if (w === cols) return
    // genişlerken son sütunun zemini uzar; tekil nesneler kopyalanmaz
    const next = map.map((r) => (w < cols ? r.slice(0, w) : r + (/[#=~I iX^v]/.test(r[cols - 1]) ? r[cols - 1] : ' ').repeat(w - cols)))
    commit(next, map)
  }

  // klavye: kısayollar ve geri al / yinele
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if (e.ctrlKey || e.metaKey) {
        if (k === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
        return
      }
      if (e.altKey) return
      if (e.key === 'Delete' || e.key === 'Backspace') return setTool('erase')
      const hit = TOOLS.find((x) => x.key.toLowerCase() === k)
      if (hit) setTool(hit.tool)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // ızgara çizimi
  useEffect(() => {
    const cv = canvas.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look) return
    const W = cols * cell
    const H = ROWS * cell
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, 8192 / W))
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    const sky = c.createLinearGradient(0, 0, 0, H)
    look.city.sky.forEach((col, i) => sky.addColorStop(i / (look.city.sky.length - 1), col))
    c.fillStyle = sky
    c.fillRect(0, 0, W, H)
    c.globalAlpha = 0.45
    c.fillStyle = look.ink
    c.fillRect(0, 0, W, H)
    c.globalAlpha = 1
    // ince ızgara, her 10 sütunda belirgin çizgi
    c.lineWidth = 1
    for (let x = 0; x <= cols; x++) {
      c.strokeStyle = look.cream
      c.globalAlpha = x % 10 === 0 ? 0.28 : 0.08
      c.beginPath()
      c.moveTo(x * cell + 0.5, 0)
      c.lineTo(x * cell + 0.5, H)
      c.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      c.globalAlpha = 0.08
      c.beginPath()
      c.moveTo(0, y * cell + 0.5)
      c.lineTo(W, y * cell + 0.5)
      c.stroke()
    }
    c.globalAlpha = 1
    const late: Array<[string, number, number]> = []
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < cols; x++) {
        const ch = map[y][x]
        if (ch === ' ') continue
        if (ch === 'E' || ch === 'P') late.push([ch, x, y])
        else drawTile(c, ch, x * cell, y * cell, cell, look, y > 0 ? map[y - 1][x] : ' ')
      }
    for (const [ch, x, y] of late) drawTile(c, ch, x * cell, y * cell, cell, look)
    // sütun numaraları
    c.fillStyle = look.cream
    c.globalAlpha = 0.6
    c.font = `600 ${Math.round(cell * 0.55)}px system-ui, sans-serif`
    c.textBaseline = 'top'
    for (let x = 10; x < cols; x += 10) c.fillText(String(x), x * cell + 3, 3)
    c.globalAlpha = 1
    if (solveState.s === 'fail') {
      const fx = (solveState.far.x / 16) * cell + cell / 2
      const fy = (solveState.far.y / 16) * cell + cell / 2
      c.strokeStyle = look.flag
      c.lineWidth = 3
      c.beginPath()
      c.arc(fx, fy, cell * 0.9, 0, Math.PI * 2)
      c.stroke()
      c.beginPath()
      c.moveTo(fx - cell * 0.5, fy - cell * 0.5)
      c.lineTo(fx + cell * 0.5, fy + cell * 0.5)
      c.moveTo(fx + cell * 0.5, fy - cell * 0.5)
      c.lineTo(fx - cell * 0.5, fy + cell * 0.5)
      c.stroke()
    }
    if (hover && tool !== 'pan') {
      c.strokeStyle = tool === 'erase' ? look.flag : look.gold
      c.lineWidth = 2
      c.strokeRect(hover.x * cell + 1, hover.y * cell + 1, cell - 2, cell - 2)
    }
  }, [map, cols, cell, look, hover, tool, solveState])

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * cols)
    const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS)
    return x >= 0 && x < cols && y >= 0 && y < ROWS ? { x, y } : null
  }

  const paintTo = (to: { x: number; y: number }) => {
    const st = stroke.current
    if (!st) return
    const ch = st.erase || tool === 'erase' ? ' ' : (tool as string)
    let changed = false
    line(st.last.x, st.last.y, to.x, to.y, (x, y) => {
      if (st.rows[y][x] === ch) return
      // başlangıç ve çıkış tektir: yenisi konunca eskisi kalkar
      if (ch === 'P' || ch === 'E') for (const row of st.rows) for (let i = 0; i < row.length; i++) if (row[i] === ch) row[i] = ' '
      st.rows[y][x] = ch
      changed = true
    })
    st.last = to
    if (!changed) return
    const next = st.rows.map((r) => r.join(''))
    if (!st.pushed) {
      st.pushed = true
      commit(next, mapRef.current)
    } else {
      setMap(next)
    }
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'pan') return
    const at = cellAt(e)
    if (!at) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    stroke.current = { rows: map.map((r) => r.split('')), last: at, erase: e.button === 2, pushed: false }
    paintTo(at)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const at = cellAt(e)
    setHover((h) => (at && h && h.x === at.x && h.y === at.y ? h : at))
    if (stroke.current && at) paintTo(at)
  }

  const endStroke = () => (stroke.current = null)

  const runSolver = () => {
    if (problem) return
    worker.current?.terminate()
    const w = new Worker(new URL('./solve.worker.ts', import.meta.url))
    worker.current = w
    setSolve({ s: 'running' })
    const timer = window.setTimeout(() => {
      w.terminate()
      if (worker.current === w) setSolve({ s: 'fail', unsure: true, far: { x: 0, y: 0 } })
    }, SOLVE_LIMIT_MS)
    w.onmessage = (ev: MessageEvent<SolveReply>) => {
      window.clearTimeout(timer)
      w.terminate()
      if (worker.current !== w) return
      const r = ev.data
      setSolve(r.won ? { s: 'won', seconds: r.seconds } : { s: 'fail', unsure: r.unsure, far: r.far })
    }
    w.onerror = () => {
      window.clearTimeout(timer)
      w.terminate()
      if (worker.current === w) setSolve({ s: 'error' })
    }
    const req: SolveRequest = { level: customLevel(map, city), budget: BUDGET }
    w.postMessage(req)
  }

  useEffect(() => () => worker.current?.terminate(), [])

  const playHref = code ? `/?ozel=${code}` : null

  const doShare = async () => {
    if (!code) return
    const url = `${window.location.origin}/?ozel=${code}`
    let copied = false
    try {
      await navigator.clipboard.writeText(url)
      copied = true
    } catch {
      copied = false
    }
    setShare({ url, copied })
  }

  const saveDraft = () => {
    const name = draftName.trim() || t('Adsız Harita')
    const d: Draft = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, code, map, city, at: Date.now() }
    const next = [d, ...drafts].slice(0, 40)
    setDrafts(next)
    writeStore(DRAFTS_KEY, next)
    setDraftName('')
  }

  const openDraft = (d: Draft) => {
    const r = d.code ? decodeMap(d.code) : null
    const m = r && !('error' in r) ? r.map : d.map
    if (!Array.isArray(m) || m.length !== ROWS) return setNotice(t('Taslak açılamadı.'))
    commit(m, map)
    setCity(r && !('error' in r) ? r.city : d.city)
  }

  const deleteDraft = (id: string) => {
    const next = drafts.filter((d) => d.id !== id)
    setDrafts(next)
    writeStore(DRAFTS_KEY, next)
  }

  const counts = useMemo(() => {
    const all = map.join('')
    return { c: all.split('C').length - 1, f: all.split('F').length - 1 }
  }, [map])

  const date = (n: number) => new Date(n).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-dvh bg-ink text-cream">
      <header className="border-b-2 border-line bg-ink">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="pixel-btn py-2 text-sm">
            ← {t('Oyuna Dön')}
          </Link>
          <h1 className="font-display text-2xl text-cream sm:text-3xl">{t('Bölüm Düzenleyici')}</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5">
        <div className="grid gap-1">
          <p className="max-w-3xl text-[15px] leading-relaxed text-muted">
            {t('Kendi bölümünü çiz: bir başlangıç (P), bir çıkış (E), arasına zemin, diken, su ve en çok üç hatıra. Çözücüyle sına, bağlantıyı arkadaşına gönder.')}
          </p>
          <p className="text-[13px] text-gold sm:hidden">{t('Masaüstünde daha rahat: telefonda kaydırmak için Kaydır aracını seç.')}</p>
          {notice && (
            <p role="alert" className="text-[14px] text-accent-2">
              {t(notice)}
            </p>
          )}
        </div>

        {/* araç çubuğu */}
        <div className="flex flex-wrap items-center gap-3 border-2 border-line bg-panel p-3">
          <label className="flex items-center gap-2 text-[14px] text-muted">
            {t('Şehir')}
            <select value={city} onChange={(e) => setCity(e.target.value as CityKey)} className="border-2 border-line bg-panel-2 px-2 py-1.5 text-[14px] text-cream">
              {LEVELS.map((l) => (
                <option key={l.id} value={l.city}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" className="pixel-btn px-3 py-1.5 text-sm" onClick={() => resize(-10)} disabled={cols <= MIN_W} aria-label={t('Daralt')}>
              −10
            </button>
            <span className="min-w-20 text-center text-[14px] text-cream">{t('{n} Sütun', { n: cols })}</span>
            <button type="button" className="pixel-btn px-3 py-1.5 text-sm" onClick={() => resize(10)} disabled={cols >= MAX_W} aria-label={t('Genişlet')}>
              +10
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="pixel-btn px-3 py-1.5 text-sm" onClick={undo} disabled={!past.current.length} title="Ctrl+Z">
              ↶ {t('Geri Al')}
            </button>
            <button type="button" className="pixel-btn px-3 py-1.5 text-sm" onClick={redo} disabled={!future.current.length} title="Ctrl+Y">
              ↷ {t('Yinele')}
            </button>
          </div>
          <span className="text-[13px] text-muted">
            {t('Hatıra {c}/3 · Bayrak {f}', { c: counts.c, f: counts.f })}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* palet */}
          <section aria-label={t('Karolar')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:grid-cols-1 lg:content-start lg:overflow-visible lg:px-0 lg:pb-0">
            {TOOLS.map((x) => (
              <button
                key={x.tool}
                type="button"
                onClick={() => setTool(x.tool)}
                aria-pressed={tool === x.tool}
                className={`flex shrink-0 items-center gap-2 border-2 px-2 py-1.5 text-left text-[14px] transition-colors ${tool === x.tool ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
              >
                <Swatch tool={x.tool} look={look} />
                <span className="min-w-0 flex-1 whitespace-nowrap lg:truncate">{t(x.name)}</span>
                <kbd className="hidden text-[11px] text-muted sm:inline">{x.key}</kbd>
              </button>
            ))}
          </section>

          <div className="grid min-w-0 content-start gap-4">
            {/* ızgara */}
            <div className="overflow-x-auto border-2 border-line bg-panel">
              <canvas
                ref={canvas}
                className={tool === 'pan' ? 'block cursor-grab' : 'block cursor-crosshair touch-none'}
                style={{ width: cols * cell, height: ROWS * cell }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
                onPointerLeave={() => setHover(null)}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={t('Harita Izgarası')}
              />
            </div>
            <p className="text-[13px] text-muted">{t('Sol tık boyar, sağ tık siler; sürükleyerek boyayabilirsin. Kısayollar palette yazılı.')}</p>

            {/* sınama ve paylaşım */}
            <section className="pixel-panel grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="pixel-btn" onClick={runSolver} disabled={!!problem || solveState.s === 'running'}>
                  {t('Bitirilebilir mi?')}
                </button>
                {playHref ? (
                  <Link href={playHref} className="pixel-btn primary">
                    ▶ {t('Oyna')}
                  </Link>
                ) : (
                  <button type="button" className="pixel-btn primary" disabled>
                    ▶ {t('Oyna')}
                  </button>
                )}
                <button type="button" className="pixel-btn" onClick={doShare} disabled={!code}>
                  {t('Paylaş')}
                </button>
              </div>
              <div aria-live="polite" className="text-[14px]">
                {problem && <p className="text-accent-2">{t(problem)}</p>}
                {!problem && solveState.s === 'running' && <p className="text-muted">{t('Çözücü deniyor…')}</p>}
                {!problem && solveState.s === 'won' && <p className="text-gold">{t('Bitirilebilir ✓ (çözücünün yolu ~{s} sn)', { s: solveState.seconds.toFixed(1) })}</p>}
                {!problem && solveState.s === 'fail' && (
                  <p className="text-accent-2">
                    {solveState.unsure ? t('Emin olunamadı: çözücü süresini doldurdu. Haritayı sadeleştirip yeniden dene.') : t('Çözücü çıkışa varamadı; en uzak nokta işaretlendi.')}
                  </p>
                )}
                {!problem && solveState.s === 'error' && <p className="text-accent-2">{t('Çözücü çalışamadı.')}</p>}
                {!problem && solveState.s === 'idle' && <p className="text-muted">{t('Çözücü düşmanları ve okları saymaz, yalnız çıkışa giden yolu arar.')}</p>}
              </div>
              {share && (
                <div className="grid gap-1">
                  <p className="text-[13px] text-muted">{share.copied ? t('Bağlantı panoya kopyalandı.') : t('Bağlantıyı seçip kopyala:')}</p>
                  <input readOnly value={share.url} onFocus={(e) => e.currentTarget.select()} className="w-full border-2 border-line bg-ink px-2 py-1.5 text-[13px] text-cream" aria-label={t('Paylaşım Bağlantısı')} />
                </div>
              )}
            </section>

            {/* taslaklar */}
            <section className="pixel-panel grid gap-3 p-4">
              <h2 className="font-display text-xl text-cream">{t('Taslaklar')}</h2>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveDraft()
                }}
              >
                <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={40} placeholder={t('Taslak adı')} className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream" aria-label={t('Taslak Adı')} />
                <button type="submit" className="pixel-btn py-1.5 text-sm">
                  {t('Taslağı Kaydet')}
                </button>
              </form>
              {drafts.length === 0 ? (
                <p className="text-[14px] text-muted">{t('Henüz taslak yok. Kaydettiklerin bu cihazda saklanır.')}</p>
              ) : (
                <ul className="grid max-h-64 gap-1.5 overflow-y-auto">
                  {drafts.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-2 border-2 border-line px-2 py-1.5 text-[14px]">
                      <span className="min-w-0 flex-1 truncate text-cream">{d.name}</span>
                      <span className="text-[12px] text-muted">
                        {LEVELS.find((l) => l.city === d.city)?.name} · {date(d.at)}
                      </span>
                      <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => openDraft(d)}>
                        {t('Aç')}
                      </button>
                      <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => deleteDraft(d.id)} aria-label={t('{name} Taslağını Sil', { name: d.name })}>
                        {t('Sil')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Editor() {
  const [lang, setLang] = useState<Lang>('tr')
  return (
    <LangProvider value={lang}>
      <Body setLang={setLang} />
    </LangProvider>
  )
}
