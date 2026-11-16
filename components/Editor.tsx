'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AuthForm from '@/components/AuthForm'
import { CITY, type CityStyle } from '@/game/art'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import type { CityKey } from '@/game/types'
import { TITLE_MAX, titleProblem } from '@/lib/communityMaps'
import { MAX_W, MIN_W, NPC_LOOKS, NPC_NAME_MAX, NPC_TEXT_MAX, ROWS, SAMPLE_MAP, SIGN_MAX, SINGLES, customLevel, decodeMap, emptyTexts, encodeMap, textProblem, validateMap, type CustomTexts, type Sym } from '@/lib/customLevel'
import { KEEP, STAMPS, TEMPLATES, cut, fillRect, floodFill, mirrorRect, mirrorRows, norm, placePattern, thumbColors, type Pattern, type Rect } from '@/lib/editorKit'
import { LangProvider, useLang, useT, type Lang } from '@/lib/i18n'
import type { SolveReply, SolveRequest } from './solve.worker'

/**
 * Bölüm Düzenleyici (/duzenle): 24 satırlık özel harita çizilir, çözücüyle sınanır, kodu bağlantıyla paylaşılır.
 * Karolar oyunun çizimiyle değil, okunsun diye sade renkli kare + simgeyle gösterilir; renkler seçilen şehrin paletinden.
 * Izgara yalnız görünen sütunları çizer (600 sütunluk harita da akıcı kalır); altındaki şerit bütün haritayı gösterir.
 */

type ToolId = 'brush' | 'rect' | 'fill' | 'pick' | 'select' | 'pan' | 'stamp'
type Cat = 'zemin' | 'tehlike' | 'nesne' | 'hareketli' | 'dusman' | 'sus' | 'parca'

interface TileDef {
  sym: Sym
  name: string
  desc: string
  key?: string
  cat: Exclude<Cat, 'parca'>
}

/** Palet: kısayollar kalıcı (eski kısayollar değişmedi); harf kısayolları büyük-küçük ayırmaz, simge kısayolları tuşun kendisi. */
const TILES: TileDef[] = [
  { sym: ' ', name: 'Silgi', desc: 'Karoyu boşaltır. Her araçta sağ tık da siler.', key: '0', cat: 'zemin' },
  { sym: '#', name: 'Zemin', desc: 'Üstünde yürünür; her duvara tırmanılır, duvardan sekilir.', key: '1', cat: 'zemin' },
  { sym: '=', name: 'İnce Platform', desc: 'Altından zıplayıp içinden geçilir, üstünde durulur.', key: '2', cat: 'zemin' },
  { sym: 'I', name: 'Buz', desc: 'Kaygan: hızlanmak da durmak da zor.', key: '6', cat: 'zemin' },
  { sym: 'i', name: 'Islak Taş', desc: 'Biraz kaygan taş.', key: '7', cat: 'zemin' },
  { sym: 'X', name: 'Çatlak Taş', desc: 'Üstüne basınca az sonra çöker. Aşağı inen yollar için.', key: '8', cat: 'zemin' },
  { sym: '%', name: 'Sahte Duvar', desc: 'Duvar gibi görünür, içinden geçilir: gizli köşeler için.', key: '%', cat: 'zemin' },
  { sym: 'W', name: 'Derin Su (Yüzülür)', desc: 'Yüzülür: zıplama kulaç atar, boğulma yok.', key: 'N', cat: 'zemin' },
  { sym: '^', name: 'Diken', desc: 'Değen düşer. Çukurdaysa bir karo gömülü ve en çok iki karo geniş olsun.', key: '3', cat: 'tehlike' },
  { sym: 'v', name: 'Tavan Dikeni', desc: 'Tavandan sarkar; kafasını çarpan düşer.', key: '4', cat: 'tehlike' },
  { sym: '~', name: 'Su', desc: 'Düşülen su: değen son bayraktan yeniden başlar.', key: '5', cat: 'tehlike' },
  { sym: '>', name: 'Ok Tuzağı →', desc: 'Aralıkla sağa ok atar; ok taşa çarpana dek uçar.', key: '.', cat: 'tehlike' },
  { sym: '<', name: 'Ok Tuzağı ←', desc: 'Aralıkla sola ok atar; ok taşa çarpana dek uçar.', key: ',', cat: 'tehlike' },
  { sym: 'Y', name: 'Tokmak', desc: 'Tavandan altındaki zemine iner, kalkar; ritmini izle.', cat: 'tehlike' },
  { sym: 'P', name: 'Başlangıç', desc: 'Oyuncunun doğduğu yer; haritada bir tane.', key: 'P', cat: 'nesne' },
  { sym: 'E', name: 'Çıkış Kapısı', desc: 'Bölümün sonu; iki karo yüksek, haritada bir tane.', key: 'K', cat: 'nesne' },
  { sym: 'F', name: 'Bayrak', desc: 'Düşen buradan yeniden başlar. Aralarını 75 karodan uzun tutma.', key: 'F', cat: 'nesne' },
  { sym: 'C', name: 'Hatıra', desc: 'Toplanacak hatıra; en çok üç.', key: 'C', cat: 'nesne' },
  { sym: '$', name: 'Gizli Pul', desc: 'Haritada bir tane. Saklı ama adil bir yere koy.', key: '$', cat: 'nesne' },
  { sym: '!', name: 'Nazar Boncuğu', desc: 'Haritada bir tane; dikkatli gözün bulacağı yere.', key: '!', cat: 'nesne' },
  { sym: 'K', name: 'Anahtar', desc: 'Alınınca bütün kilitli kapılar açılır; haritada bir tane.', key: 'A', cat: 'nesne' },
  { sym: 'D', name: 'Kilitli Kapı', desc: 'Anahtar alınana dek duvar. Kapatan duvar haritanın tepesine dek çıksın.', key: 'O', cat: 'nesne' },
  { sym: '_', name: 'Plaka', desc: 'Basınca blokları değiştirir: açılan bloklar kalkar, beliren bloklar gelir.', key: '_', cat: 'nesne' },
  { sym: '[', name: 'Açılan Blok', desc: 'Plakaya basılana dek katı, basınca açılır.', key: '[', cat: 'nesne' },
  { sym: ']', name: 'Beliren Blok', desc: 'Başta yok; plakaya basınca katılaşır (köprü, basamak).', key: ']', cat: 'nesne' },
  { sym: 'S', name: 'Yay', desc: 'Üstüne basanı yedi karo kadar yukarı fırlatır.', key: '9', cat: 'nesne' },
  { sym: '*', name: 'Dash Halkası', desc: 'Değince dash’i yeniler: havada ikinci dash için.', key: '*', cat: 'nesne' },
  { sym: 'T', name: 'Nitro Tüpü', desc: 'Alınınca 3 saniye hızlı koşu, atlayış uzar; birkaç saniyede yeniden dolar.', key: 'S', cat: 'nesne' },
  { sym: '?', name: 'Tabela', desc: 'Önünde durana senin yazdığın sözü gösterir (en çok 8; yazısı Metinler kutusunda).', key: '?', cat: 'nesne' },
  { sym: 'n', name: 'Şehir İnsanı', desc: 'Yanına gelene senin yazdığın sözü söyler (en çok 4; adı, sözü ve kılığı Metinler kutusunda).', cat: 'nesne' },
  { sym: 'p', name: 'Sandık', desc: 'İtilir, üstüne çıkılır; en çok iki, küçük kapalı alanda.', key: 'X', cat: 'nesne' },
  { sym: 'M', name: 'Raylı Platform ↔', desc: 'Yan yana koyduğun kadar geniş; ray sonuna (|) ya da duvara dek gidip gelir.', key: 'V', cat: 'hareketli' },
  { sym: '|', name: 'Ray Sonu', desc: 'Yatay raylı platformun döndüğü yer; oyunda görünmez.', key: '|', cat: 'hareketli' },
  { sym: 'N', name: 'Raylı Platform ↕', desc: 'Yukarı aşağı gider; iki nokta (:) ya da zemin durdurur.', key: 'Z', cat: 'hareketli' },
  { sym: ':', name: 'Dikey Ray Sonu', desc: 'Dikey platformun ve balonun durduğu yer; oyunda görünmez.', key: ':', cat: 'hareketli' },
  { sym: 'B', name: 'Balon', desc: 'Üstüne binince yükselir, inince yavaşça alçalır.', cat: 'hareketli' },
  { sym: '{', name: 'Ritim Bloğu (Önce)', desc: 'Saatle belirip kaybolur: 1,6 saniye var, 1,6 saniye yok. Kaybolmadan önce yanıp söner.', cat: 'hareketli' },
  { sym: '}', name: 'Ritim Bloğu (Sonra)', desc: 'Öbür takım: önce olan kaybolunca belirir. İkisini sırayla dizersen ritimle geçilen bir yol olur.', cat: 'hareketli' },
  { sym: 'O', name: 'Sema Halkası', desc: 'Merkezinin çevresinde dönen tepsi; yan yana iki halka ters yöne döner.', cat: 'hareketli' },
  { sym: 'L', name: 'Halat', desc: 'Havadayken değince tutunulur; yukarı aşağı tırmanılır.', key: 'Y', cat: 'hareketli' },
  { sym: 'R', name: 'Teleferik Halatı', desc: 'Altından zıplayınca asılınır, elle ilerlenir. Bittiği yerin altı zemin olsun.', key: 'J', cat: 'hareketli' },
  { sym: 'e', name: 'Yürüyen Düşman', desc: 'Kenara ya da duvara varınca döner; üstüne basılır.', key: 'D', cat: 'dusman' },
  { sym: 'f', name: 'Uçan Düşman', desc: 'Havada dört karo gidip gelir.', key: 'U', cat: 'dusman' },
  { sym: 'h', name: 'Zıplayan Düşman', desc: 'Çömelir, sonra sana doğru sıçrar.', cat: 'dusman' },
  { sym: 'c', name: 'Hücum Eden Düşman', desc: 'Seni görünce koşar, duvara çarpınca sersemler.', cat: 'dusman' },
  { sym: 'u', name: 'Yarasa', desc: 'Dalga çizerek süzülür.', cat: 'dusman' },
  { sym: 'x', name: 'Dikenli Düşman', desc: 'Yavaş yürür; üstüne basılmaz, dash da işlemez.', cat: 'dusman' },
  { sym: 'j', name: 'Saksağan', desc: 'Tünekte bekler, altından geçene dalar.', cat: 'dusman' },
  { sym: 'Q', name: 'Boss', desc: 'Satırında ray sonuna (|), duvara ya da boss kapısına dek dolaşır; hangi şehrin boss’u olduğunu Metinler kutusunda seç.', cat: 'dusman' },
  { sym: 'G', name: 'Boss Kapısı', desc: 'Boss yenilene dek kapalı demir parmaklık.', cat: 'dusman' },
  { sym: 't', name: 'Ağaç (Süs)', desc: 'Yalnız görünüş; oyunu etkilemez.', key: 'T', cat: 'sus' },
  { sym: 'l', name: 'Fener (Süs)', desc: 'Yalnız görünüş; oyunu etkilemez.', key: 'L', cat: 'sus' },
  { sym: 'w', name: 'Pencere (Süs)', desc: 'Yalnız görünüş; oyunu etkilemez.', key: 'W', cat: 'sus' },
  { sym: 'b', name: 'Bayrak Süsü', desc: 'Yalnız görünüş; oyunu etkilemez.', key: 'B', cat: 'sus' },
]

const CATS: Array<{ id: Cat; name: string }> = [
  { id: 'zemin', name: 'Zemin' },
  { id: 'tehlike', name: 'Tehlike' },
  { id: 'nesne', name: 'Nesne' },
  { id: 'hareketli', name: 'Hareketli' },
  { id: 'dusman', name: 'Düşman' },
  { id: 'sus', name: 'Süs' },
  { id: 'parca', name: 'Parçalar' },
]

const TOOLS: Array<{ id: Exclude<ToolId, 'stamp'>; name: string; glyph: string; key: string; desc: string }> = [
  { id: 'brush', name: 'Fırça', glyph: '✎', key: 'Q', desc: 'Karoyu tek tek ya da sürükleyerek boyar.' },
  { id: 'rect', name: 'Dikdörtgen', glyph: '▭', key: 'R', desc: 'Sürükle, bırakınca dikdörtgen seçili karoyla dolar.' },
  { id: 'fill', name: 'Kova', glyph: '◩', key: 'G', desc: 'Tıkladığın yerdeki bitişik aynı karoların hepsini doldurur.' },
  { id: 'pick', name: 'Damlalık', glyph: '⊙', key: 'I', desc: 'Haritada bir karoya tıkla, o karo seçilsin. Her araçta Alt+tık da seçer.' },
  { id: 'select', name: 'Seçim', glyph: '⬚', key: 'M', desc: 'Sürükleyerek alan seç, içinden tutup taşı. Ctrl+C kopyalar, Ctrl+V yapıştırır.' },
  { id: 'pan', name: 'Kaydır', glyph: '✥', key: 'H', desc: 'Haritayı sürükleyerek kaydırır; telefonda parmakla kaydırmak için.' },
]

/** Sayısı sınırlı karolar dolgu ve dikdörtgende tek hücre boyanır */
const LIMITED = new Set<string>([...SINGLES, 'C', 'p'])
const ZOOMS = [8, 10, 12, 16, 20, 24, 32]
const DRAFTS_KEY = 'seksek:taslaklar'
const WORK_KEY = 'seksek:duzenle'
const HISTORY = 120

interface Draft {
  id: string
  name: string
  /** geçerli haritanın paylaşım kodu (P/E eksikse null) */
  code: string | null
  map: string[]
  city: CityKey
  at: number
  texts?: CustomTexts
}

/** Topluluğa yayın: giriş yapan oyuncu (çerezden ya da yerel kayıttan), başlık ve sonuç */
type Author = { id: string; name: string; token?: string }
type PublishState = { s: 'idle' } | { s: 'sending' } | { s: 'done'; id: number } | { s: 'dup' } | { s: 'error'; msg: string }

type SolveState = { s: 'idle' } | { s: 'running' } | ({ s: 'won' } & Extract<SolveReply, { won: true }>) | { s: 'fail'; unsure: boolean; far: { x: number; y: number } } | { s: 'error' }

/** Sürükleme: boyama, dikdörtgen, seçim, taşıma, kaydırma */
type Drag =
  | { kind: 'paint'; rows: string[][]; last: Cell; erase: boolean; pushed: boolean }
  | { kind: 'rect'; a: Cell; b: Cell; erase: boolean }
  | { kind: 'select'; a: Cell; b: Cell }
  | { kind: 'move'; from: Cell; to: Cell; rows: string[]; base: string[]; sel: Rect; before: string[] }
  | { kind: 'pan'; x: number; scroll: number }

type Cell = { x: number; y: number }

/** Çizim renkleri: şehrin paleti + tema değişkenleri (globals.css @theme). */
interface Look {
  city: CityStyle
  gold: string
  flag: string
  cream: string
  ink: string
  sign: string
  accent: string
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

function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

/** Düşman: kırmızı gövde + iki göz; türü süsüyle ayrılır */
function creature(c: CanvasRenderingContext2D, ch: string, x: number, y: number, u: number, look: Look) {
  const cx = x + 8 * u
  const cy = ch === 'f' || ch === 'u' || ch === 'j' ? y + 7 * u : y + 10 * u
  const body = ch === 'u' ? '#7a4aa8' : ch === 'j' ? '#1c1c28' : look.flag
  if (ch === 'f') {
    tri(c, [cx, cy, x + u, cy - 5 * u, x + 3 * u, cy + 2 * u], look.flag)
    tri(c, [cx, cy, x + 15 * u, cy - 5 * u, x + 13 * u, cy + 2 * u], look.flag)
  } else if (ch === 'u') {
    tri(c, [cx, cy, x, cy - 4 * u, x + 3 * u, cy + 4 * u], look.ink)
    tri(c, [cx, cy, x + 16 * u, cy - 4 * u, x + 13 * u, cy + 4 * u], look.ink)
  } else if (ch === 'x') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      tri(c, [cx + Math.cos(a - 0.4) * 4 * u, cy + Math.sin(a - 0.4) * 4 * u, cx + Math.cos(a) * 7.5 * u, cy + Math.sin(a) * 7.5 * u, cx + Math.cos(a + 0.4) * 4 * u, cy + Math.sin(a + 0.4) * 4 * u], look.cream)
    }
  } else if (ch === 'c') {
    tri(c, [cx - 5 * u, cy - 3 * u, cx - 6 * u, cy - 8 * u, cx - 2 * u, cy - 4 * u], look.cream)
    tri(c, [cx + 5 * u, cy - 3 * u, cx + 6 * u, cy - 8 * u, cx + 2 * u, cy - 4 * u], look.cream)
  } else if (ch === 'h') {
    c.strokeStyle = look.cream
    c.lineWidth = u
    c.beginPath()
    c.moveTo(cx - 3 * u, cy + 4 * u)
    c.lineTo(cx - 5 * u, cy + 6 * u)
    c.moveTo(cx + 3 * u, cy + 4 * u)
    c.lineTo(cx + 5 * u, cy + 6 * u)
    c.stroke()
  }
  disc(c, cx, cy, 5 * u, body)
  if (ch === 'j') {
    c.fillStyle = look.cream
    c.fillRect(cx - 5 * u, cy + u, 10 * u, 3 * u)
    tri(c, [cx + 4 * u, cy - 2 * u, cx + 9 * u, cy, cx + 4 * u, cy + u], look.gold)
  }
  c.fillStyle = look.cream
  c.fillRect(cx - 2.5 * u, cy - 2 * u, 2 * u, 2 * u)
  c.fillRect(cx + 0.5 * u, cy - 2 * u, 2 * u, 2 * u)
}

/** İki yönlü ok (raylı platformların yönü) */
function arrows(c: CanvasRenderingContext2D, x: number, y: number, u: number, axis: 'x' | 'y', color: string) {
  const cx = x + 8 * u
  const cy = y + 10 * u
  if (axis === 'x') {
    tri(c, [cx - 7 * u, cy, cx - 3 * u, cy - 3 * u, cx - 3 * u, cy + 3 * u], color)
    tri(c, [cx + 7 * u, cy, cx + 3 * u, cy - 3 * u, cx + 3 * u, cy + 3 * u], color)
  } else {
    tri(c, [cx, y + 6 * u, cx - 3 * u, y + 9.5 * u, cx + 3 * u, y + 9.5 * u], color)
    tri(c, [cx, y + 15.5 * u, cx - 3 * u, y + 12 * u, cx + 3 * u, y + 12 * u], color)
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
    case '%':
      c.globalAlpha = 0.55
      c.fillStyle = p.tile
      c.fillRect(x, y, s, s)
      c.globalAlpha = 1
      c.setLineDash([2 * u, 2 * u])
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.strokeRect(x + u / 2, y + u / 2, s - u, s - u)
      c.setLineDash([])
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
    case '$':
      // pul: tırtıklı kenarlı küçük kâğıt, ortasında kırmızı damga
      c.fillStyle = look.cream
      c.fillRect(x + 3 * u, y + 2 * u, 10 * u, 12 * u)
      c.fillStyle = look.gold
      for (let i = 0; i < 4; i++) {
        c.fillRect(x + (3.5 + i * 2.6) * u, y + 1.5 * u, 1.4 * u, 1.4 * u)
        c.fillRect(x + (3.5 + i * 2.6) * u, y + 13.2 * u, 1.4 * u, 1.4 * u)
      }
      disc(c, x + 8 * u, y + 8 * u, 2.8 * u, look.flag)
      break
    case '!':
      disc(c, x + 8 * u, y + 8 * u, 6 * u, '#1f5fd0')
      disc(c, x + 8 * u, y + 8 * u, 4 * u, look.cream)
      disc(c, x + 8 * u, y + 8 * u, 2.6 * u, '#62b6ff')
      disc(c, x + 8 * u, y + 8 * u, 1.3 * u, look.ink)
      break
    case '?': {
      // tabela: direk ve tahta, üstünde soru işareti
      c.fillStyle = p.plank
      c.fillRect(x + 7 * u, y + 8 * u, 2 * u, 8 * u)
      c.fillRect(x + 2 * u, y + 2 * u, 12 * u, 7 * u)
      c.fillStyle = look.cream
      c.font = `700 ${Math.round(7 * u)}px system-ui, sans-serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('?', x + 8 * u, y + 5.8 * u)
      c.textAlign = 'start'
      break
    }
    case 'n':
      // şehir insanı: baş, gövde, konuşma noktası
      disc(c, x + 8 * u, y + 4.5 * u, 3 * u, '#e8b48a')
      c.fillStyle = p.accent
      c.fillRect(x + 4.5 * u, y + 8 * u, 7 * u, 8 * u)
      disc(c, x + 13.5 * u, y + 2.5 * u, 1.6 * u, look.cream)
      break
    case '{':
    case '}': {
      // ritim bloğu: kiremit (önce) / turkuaz (sonra), ortada vuruş karesi
      const col = ch === '{' ? '#ff9a7a' : '#5ad6c6'
      c.fillStyle = ch === '{' ? '#b8503a' : '#2a8a7e'
      c.fillRect(x, y, s, s)
      c.fillStyle = col
      c.fillRect(x + u, y + u, s - 2 * u, s - 2 * u)
      c.fillStyle = 'rgba(255,255,255,0.55)'
      c.fillRect(x + 6 * u, y + 6 * u, 4 * u, 4 * u)
      break
    }
    case 'O':
      // sema halkası: merkez ve dönen tepsi
      c.strokeStyle = '#7ad8cc'
      c.lineWidth = 1.2 * u
      c.setLineDash([2 * u, 1.5 * u])
      c.beginPath()
      c.arc(x + 8 * u, y + 8 * u, 6.5 * u, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
      disc(c, x + 8 * u, y + 8 * u, 1.8 * u, '#f2c14e')
      c.fillStyle = '#2f9a94'
      c.fillRect(x + 11 * u, y + 2 * u, 5 * u, 2 * u)
      break
    case 'Q':
      // boss: iri, öfkeli kaşlı gövde ve taç
      disc(c, x + 8 * u, y + 9 * u, 6.5 * u, '#d6403a')
      c.fillStyle = '#f2c14e'
      c.fillRect(x + 4 * u, y + 0.5 * u, 8 * u, 3 * u)
      disc(c, x + 5.5 * u, y + 8 * u, 1.6 * u, look.cream)
      disc(c, x + 10.5 * u, y + 8 * u, 1.6 * u, look.cream)
      break
    case 'G':
      c.fillStyle = '#4a4654'
      for (let i = 1; i < 16; i += 5) c.fillRect(x + i * u, y, 3 * u, s)
      c.fillRect(x, y + 6 * u, s, 2 * u)
      break
    case 'K':
      c.strokeStyle = look.gold
      c.lineWidth = 2 * u
      c.beginPath()
      c.arc(x + 5 * u, y + 8 * u, 3 * u, 0, Math.PI * 2)
      c.moveTo(x + 8 * u, y + 8 * u)
      c.lineTo(x + 14 * u, y + 8 * u)
      c.moveTo(x + 12 * u, y + 8 * u)
      c.lineTo(x + 12 * u, y + 11 * u)
      c.stroke()
      break
    case 'D':
      c.fillStyle = p.plank
      c.fillRect(x + u, y, 14 * u, s)
      c.strokeStyle = p.tileDark
      c.lineWidth = u
      c.strokeRect(x + 1.5 * u, y + 0.5 * u, 13 * u, s - u)
      disc(c, x + 8 * u, y + 6.5 * u, 1.8 * u, look.ink)
      c.fillStyle = look.ink
      c.fillRect(x + 7.3 * u, y + 7 * u, 1.4 * u, 4 * u)
      break
    case '*':
      c.strokeStyle = '#9fd8ff'
      c.lineWidth = 2 * u
      c.beginPath()
      c.arc(x + 8 * u, y + 8 * u, 5 * u, 0, Math.PI * 2)
      c.stroke()
      disc(c, x + 8 * u, y + 8 * u, 1.5 * u, look.cream)
      break
    case 'T':
      // nitro tüpü: kırmızı gövde, beyaz bant, turuncu alev
      c.fillStyle = '#ff9a3c'
      c.beginPath()
      c.moveTo(x + 5.5 * u, y + 4 * u)
      c.lineTo(x + 8 * u, y + 0.5 * u)
      c.lineTo(x + 10.5 * u, y + 4 * u)
      c.fill()
      c.fillStyle = '#d6403a'
      c.fillRect(x + 4.5 * u, y + 4 * u, 7 * u, 11 * u)
      c.fillStyle = look.cream
      c.fillRect(x + 4.5 * u, y + 8 * u, 7 * u, 2.5 * u)
      break
    case 'p':
      c.fillStyle = p.plank
      c.fillRect(x + u, y + u, 14 * u, 15 * u)
      c.strokeStyle = p.tileDark
      c.lineWidth = 1.2 * u
      c.strokeRect(x + 1.5 * u, y + 1.5 * u, 13 * u, 14 * u)
      c.beginPath()
      c.moveTo(x + 2 * u, y + 2 * u)
      c.lineTo(x + 14 * u, y + 15 * u)
      c.moveTo(x + 14 * u, y + 2 * u)
      c.lineTo(x + 2 * u, y + 15 * u)
      c.stroke()
      break
    case '_':
      c.fillStyle = p.tileDark
      c.fillRect(x + u, y + 13 * u, 14 * u, 3 * u)
      c.fillStyle = look.accent
      c.fillRect(x + 2.5 * u, y + 11 * u, 11 * u, 2.5 * u)
      break
    case '[':
      c.fillStyle = '#4a7bd8'
      c.fillRect(x, y, s, s)
      c.strokeStyle = look.cream
      c.lineWidth = u
      c.strokeRect(x + 1.5 * u, y + 1.5 * u, s - 3 * u, s - 3 * u)
      break
    case ']':
      c.globalAlpha = 0.45
      c.fillStyle = '#e0b030'
      c.fillRect(x, y, s, s)
      c.globalAlpha = 1
      c.setLineDash([2 * u, 2 * u])
      c.strokeStyle = '#e0b030'
      c.lineWidth = 1.2 * u
      c.strokeRect(x + u, y + u, s - 2 * u, s - 2 * u)
      c.setLineDash([])
      break
    case 'M':
    case 'N':
      c.fillStyle = p.plank
      c.fillRect(x, y, s, 5 * u)
      c.fillStyle = p.tileDark
      c.fillRect(x, y + 5 * u, s, u)
      arrows(c, x, y, u, ch === 'M' ? 'x' : 'y', look.cream)
      break
    case '|':
      c.fillStyle = look.cream
      c.globalAlpha = 0.7
      c.fillRect(x + 7 * u, y + 2 * u, 2 * u, 12 * u)
      c.fillRect(x + 5 * u, y + 2 * u, 6 * u, 1.5 * u)
      c.fillRect(x + 5 * u, y + 12.5 * u, 6 * u, 1.5 * u)
      c.globalAlpha = 1
      break
    case ':':
      c.fillStyle = look.cream
      c.globalAlpha = 0.7
      c.fillRect(x + 2 * u, y + 7 * u, 12 * u, 2 * u)
      c.fillRect(x + 2 * u, y + 5 * u, 1.5 * u, 6 * u)
      c.fillRect(x + 12.5 * u, y + 5 * u, 1.5 * u, 6 * u)
      c.globalAlpha = 1
      break
    case 'B':
      disc(c, x + 8 * u, y + 5.5 * u, 4.5 * u, look.flag)
      c.fillStyle = look.cream
      c.fillRect(x + 6 * u, y + 3 * u, 1.5 * u, 2 * u)
      c.fillRect(x + 7.6 * u, y + 10 * u, 0.8 * u, 4 * u)
      c.fillStyle = p.plank
      c.fillRect(x + 2 * u, y + 14 * u, 12 * u, 2 * u)
      break
    case 'Y':
      c.fillStyle = p.tileDark
      c.fillRect(x + 7 * u, y, 2 * u, 7 * u)
      c.fillStyle = '#b06a3a'
      c.fillRect(x + 2 * u, y + 7 * u, 12 * u, 6 * u)
      c.strokeStyle = look.ink
      c.lineWidth = u
      c.strokeRect(x + 2.5 * u, y + 7.5 * u, 11 * u, 5 * u)
      tri(c, [x + 8 * u, y + 16 * u, x + 5.5 * u, y + 13.5 * u, x + 10.5 * u, y + 13.5 * u], look.cream)
      break
    case 'e':
    case 'f':
    case 'h':
    case 'c':
    case 'u':
    case 'x':
    case 'j':
      creature(c, ch, x, y, u, look)
      break
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
      disc(c, x + 8 * u, y + 7 * u, 5 * u, p.mid)
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
    case 'L':
      c.fillStyle = '#c49a5a'
      c.fillRect(x + 7 * u, y, 2 * u, s)
      c.fillStyle = '#8a6434'
      for (let i = 1; i < 16; i += 4) c.fillRect(x + 7 * u, y + i * u, 2 * u, u)
      break
    case 'R':
      c.fillStyle = '#8f96a3'
      c.fillRect(x, y + 7 * u, s, 2 * u)
      c.fillStyle = '#5a5f6a'
      c.fillRect(x + 6 * u, y + 6 * u, 4 * u, 4 * u)
      break
    case 'W':
      c.fillStyle = '#3fa9b8'
      c.fillRect(x, y + 3 * u, s, s - 3 * u)
      c.fillStyle = '#a8eef2'
      c.fillRect(x, y + 3 * u, s, u)
      break
    case 'b':
      c.fillStyle = look.cream
      c.fillRect(x, y + 3 * u, s, u)
      for (let i = 0; i < 3; i++) tri(c, [x + (1 + i * 5) * u, y + 4 * u, x + (6 + i * 5) * u, y + 4 * u, x + (3.5 + i * 5) * u, y + 9 * u], i % 2 ? look.gold : look.flag)
      break
  }
}

/** Desenin karoları (KEEP hariç); P ve E en son, kapı üstteki karoyu da kaplar */
function drawRows(c: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, s: number, look: Look, clear: boolean) {
  const late: Array<[string, number, number]> = []
  rows.forEach((line, dy) => {
    for (let dx = 0; dx < line.length; dx++) {
      const ch = line[dx]
      if (ch === KEEP) continue
      if (ch === ' ') {
        if (!clear) continue
        c.fillStyle = look.ink
        c.globalAlpha *= 0.5
        c.fillRect(ox + dx * s, oy + dy * s, s, s)
        c.globalAlpha *= 2
        continue
      }
      if (ch === 'E' || ch === 'P') late.push([ch, dx, dy])
      else drawTile(c, ch, ox + dx * s, oy + dy * s, s, look, dy > 0 ? rows[dy - 1][dx] : ' ')
    }
  })
  for (const [ch, dx, dy] of late) drawTile(c, ch, ox + dx * s, oy + dy * s, s, look)
}

function lookFor(city: CityKey): Look {
  const css = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback
  const p = CITY[city]
  return {
    city: p,
    gold: v('--color-gold', p.accent),
    flag: v('--color-flag', p.accent),
    cream: v('--color-cream', p.tileTop),
    ink: v('--color-ink', p.tileDark),
    sign: v('--color-sign', p.water[1]),
    accent: v('--color-accent', p.accent),
  }
}

/** Palet simgesi: tek karo ya da hazır parçanın küçültülmüşü */
function Swatch({ sym, rows, look }: { sym?: Sym; rows?: string[]; look: Look | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look) return
    c.setTransform(2, 0, 0, 2, 0, 0)
    c.clearRect(0, 0, 24, 24)
    c.fillStyle = look.city.sky[1]
    c.globalAlpha = 0.35
    c.fillRect(0, 0, 24, 24)
    c.globalAlpha = 1
    if (rows) {
      const s = Math.min(24 / rows[0].length, 24 / rows.length)
      drawRows(c, rows, (24 - s * rows[0].length) / 2, (24 - s * rows.length) / 2, s, look, false)
    } else if (sym === ' ') {
      c.fillStyle = look.cream
      c.font = '600 15px system-ui, sans-serif'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('✕', 12, 13)
    } else if (sym === 'E') drawTile(c, 'E', 6.5, 12, 11, look)
    else if (sym) drawTile(c, sym, 2, 2, 20, look)
  }, [sym, rows, look])
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

const inside = (r: Rect, at: Cell) => {
  const n = norm(r)
  return at.x >= n.x0 && at.x <= n.x1 && at.y >= n.y0 && at.y <= n.y1
}

function Body({ setLang }: { setLang: (l: Lang) => void }) {
  const t = useT()
  const lang = useLang()
  const [map, setMap] = useState<string[]>(SAMPLE_MAP)
  const [city, setCity] = useState<CityKey>('istanbul')
  const [texts, setTexts] = useState<CustomTexts>(emptyTexts)
  const [tile, setTile] = useState<Sym>('#')
  const [tool, setTool] = useState<ToolId>('brush')
  const [cat, setCat] = useState<Cat>('zemin')
  /** imleçte duran parça: hazır parça ya da yapıştırılan seçim */
  const [float, setFloat] = useState<(Pattern & { toTop?: number[]; stamp?: string }) | null>(null)
  const [sel, setSel] = useState<Rect | null>(null)
  const [clip, setClip] = useState<string[] | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [solveState, setSolve] = useState<SolveState>({ s: 'idle' })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [draftName, setDraftName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [share, setShare] = useState<{ url: string; copied: boolean } | null>(null)
  const [author, setAuthor] = useState<Author | null | undefined>(undefined)
  const [pubTitle, setPubTitle] = useState('')
  const [pub, setPub] = useState<PublishState>({ s: 'idle' })
  const [hover, setHover] = useState<Cell | null>(null)
  const [cell, setCell] = useState(20)
  const [look, setLook] = useState<Look | null>(null)
  const [scrollX, setScrollX] = useState(0)
  const [boxW, setBoxW] = useState(0)
  const [, setHistoryTick] = useState(0)
  const past = useRef<string[][]>([])
  const future = useRef<string[][]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const worker = useRef<Worker | null>(null)
  /** yakınlaştırınca ortadaki sütun yerinde kalsın */
  const keepCol = useRef<number | null>(null)
  const mapRef = useRef(map)
  mapRef.current = map

  const cols = map[0].length
  const viewW = Math.min(boxW || cols * cell, cols * cell)
  // tabela ve şehir insanı metinleri haritadaki sayıya göre: fazlası saklanır (silinip geri konursa metin kaybolmaz)
  const signCount = useMemo(() => map.join('').split('?').length - 1, [map])
  const npcCount = useMemo(() => map.join('').split('n').length - 1, [map])
  const hasBoss = useMemo(() => map.some((r) => r.includes('Q')), [map])
  const usedTexts: CustomTexts = useMemo(
    () => ({ signs: Array.from({ length: signCount }, (_, k) => texts.signs[k] ?? ''), npcs: Array.from({ length: npcCount }, (_, k) => texts.npcs[k] ?? { name: '', text: '', look: NPC_LOOKS[k % NPC_LOOKS.length] }), ...(hasBoss && texts.boss ? { boss: texts.boss } : {}) }),
    [texts, signCount, npcCount, hasBoss],
  )
  const problem = validateMap(map) ?? textProblem(usedTexts)
  const code = useMemo(() => (problem ? null : encodeMap(map, city, usedTexts)), [map, city, problem, usedTexts])

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d
    setDrag(d)
  }

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
        setTexts(r.texts)
        return
      }
    }
    const work = readStore<{ map: string[]; city: CityKey; texts?: CustomTexts }>(WORK_KEY)
    if (work && Array.isArray(work.map) && work.map.length === ROWS && CITY[work.city]) {
      setMap(work.map)
      setCity(work.city)
      if (work.texts && Array.isArray(work.texts.signs) && Array.isArray(work.texts.npcs)) setTexts(work.texts)
    }
  }, [setLang])

  useEffect(() => setLook(lookFor(city)), [city])

  // paylaşım bağlantısı ve yayın sonucu eski haritayı göstermesin
  useEffect(() => {
    setShare(null)
    setPub({ s: 'idle' })
  }, [code])

  // yayın için oturum: çerezden; çerezden önceki girişler yerel kayıttaki anahtarla
  useEffect(() => {
    let live = true
    const local = readStore<{ player?: Author | null }>('seksek:v1')?.player ?? null
    fetch('/api/players/me', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ player?: Author | null }>) : null))
      .then((j) => live && setAuthor(j?.player ?? local))
      .catch(() => live && setAuthor(local))
    return () => {
      live = false
    }
  }, [])

  // çalışmayı her değişiklikte sakla: sayfa yenilense de kaybolmasın
  useEffect(() => writeStore(WORK_KEY, { map, city, texts }), [map, city, texts])

  // ızgara kutusunun genişliği (yalnız görünen sütunlar çizilir)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth))
    ro.observe(el)
    setBoxW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // yakınlaştırmadan sonra ortadaki sütuna dön
  useEffect(() => {
    const el = scroller.current
    if (!el || keepCol.current === null) return
    el.scrollLeft = keepCol.current * cell - el.clientWidth / 2
    keepCol.current = null
    setScrollX(el.scrollLeft)
  }, [cell])

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
    setSel(null)
    setSolve({ s: 'idle' })
  }, [])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(mapRef.current)
    setHistoryTick((n) => n + 1)
    setMap(next)
    setSel(null)
    setSolve({ s: 'idle' })
  }, [])

  const resize = (delta: number) => {
    const w = Math.max(MIN_W, Math.min(MAX_W, cols + delta))
    if (w === cols) return
    // genişlerken son sütunun zemini uzar; tekil nesneler kopyalanmaz
    const next = map.map((r) => (w < cols ? r.slice(0, w) : r + (/[#=~I iX^vW%]/.test(r[cols - 1]) ? r[cols - 1] : ' ').repeat(w - cols)))
    setSel(null)
    commit(next, map)
  }

  const zoom = (dir: 1 | -1) => {
    const i = ZOOMS.indexOf(cell)
    const next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? ZOOMS.indexOf(20) : i) + dir))]
    if (next === cell) return
    const el = scroller.current
    keepCol.current = el ? (el.scrollLeft + el.clientWidth / 2) / cell : 0
    setCell(next)
  }

  const chooseTile = (sym: Sym) => {
    setTile(sym)
    setFloat(null)
    setTool((cur) => (cur === 'rect' || cur === 'fill' ? cur : 'brush'))
  }

  const chooseTool = (id: ToolId) => {
    setFloat(null)
    if (id !== 'select') setSel(null)
    setTool(id)
  }

  const chooseStamp = (id: string) => {
    const s = STAMPS.find((x) => x.id === id)
    if (!s) return
    setSel(null)
    setFloat({ rows: s.rows, ax: s.ax, ay: s.ay, toTop: s.toTop, stamp: s.id })
    setTool('stamp')
  }

  const copySel = useCallback(() => {
    if (!sel) return false
    setClip(cut(mapRef.current, sel))
    setNotice('Seçim kopyalandı: Ctrl+V ile yapıştır.')
    return true
  }, [sel])

  const clearSel = useCallback(() => {
    if (!sel) return
    commit(fillRect(mapRef.current, sel, ' '), mapRef.current)
  }, [sel, commit])

  const paste = useCallback(() => {
    if (!clip) return
    setSel(null)
    setFloat({ rows: clip, ax: 0, ay: 0 })
    setTool('stamp')
  }, [clip])

  /** Yatay ayna: imleçteki parça, yoksa seçim, yoksa bütün harita */
  const mirror = useCallback(() => {
    if (float) {
      const w = float.rows[0].length
      setFloat({ ...float, rows: mirrorRows(float.rows), ax: w - 1 - float.ax, toTop: float.toTop?.map((x) => w - 1 - x) })
      return
    }
    const m = mapRef.current
    commit(mirrorRect(m, sel ?? { x0: 0, y0: 0, x1: m[0].length - 1, y1: ROWS - 1 }), m)
  }, [float, sel, commit])

  // klavye: araç ve karo kısayolları, geri al / yinele, kopyala / yapıştır
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if (e.ctrlKey || e.metaKey) {
        if (k === 'z' && !e.shiftKey) undo()
        else if (k === 'y' || (k === 'z' && e.shiftKey)) redo()
        else if (k === 'c') copySel()
        else if (k === 'x') {
          if (copySel()) clearSel()
        } else if (k === 'v') paste()
        else if (k === 'a') {
          setFloat(null)
          setTool('select')
          setSel({ x0: 0, y0: 0, x1: mapRef.current[0].length - 1, y1: ROWS - 1 })
        } else return
        e.preventDefault()
        return
      }
      if (e.altKey) return
      if (e.key === 'Escape') {
        setFloat(null)
        setSel(null)
        setTool((cur) => (cur === 'stamp' ? 'brush' : cur))
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (sel) clearSel()
        else chooseTile(' ')
        return
      }
      if (e.key === '+' || e.key === '=') return zoom(1)
      if (e.key === '-') return zoom(-1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        scroller.current?.scrollBy({ left: (e.key === 'ArrowLeft' ? -10 : 10) * cell })
        e.preventDefault()
        return
      }
      const same = (key: string) => (/^[a-z]$/i.test(key) ? key.toLowerCase() === k : key === e.key)
      const tl = TOOLS.find((x) => same(x.key))
      if (tl) return chooseTool(tl.id)
      const hit = TILES.find((x) => x.key && same(x.key))
      if (hit) chooseTile(hit.sym)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ızgara çizimi: yalnız görünen sütunlar
  useEffect(() => {
    const cv = canvas.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look || !viewW) return
    const H = ROWS * cell
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    const bw = Math.round(viewW * dpr)
    const bh = Math.round(H * dpr)
    if (cv.width !== bw) cv.width = bw
    if (cv.height !== bh) cv.height = bh
    const sx = Math.max(0, Math.min(scrollX, cols * cell - viewW))
    c.setTransform(dpr, 0, 0, dpr, -sx * dpr, 0)
    const x0 = Math.max(0, Math.floor(sx / cell) - 1)
    const x1 = Math.min(cols, Math.ceil((sx + viewW) / cell) + 1)
    const sky = c.createLinearGradient(0, 0, 0, H)
    look.city.sky.forEach((col, i) => sky.addColorStop(i / (look.city.sky.length - 1), col))
    c.fillStyle = sky
    c.fillRect(sx, 0, viewW, H)
    c.globalAlpha = 0.45
    c.fillStyle = look.ink
    c.fillRect(sx, 0, viewW, H)
    c.globalAlpha = 1
    // ince ızgara, her 10 sütunda belirgin çizgi
    c.lineWidth = 1
    c.strokeStyle = look.cream
    for (let x = x0; x <= x1; x++) {
      c.globalAlpha = x % 10 === 0 ? 0.28 : 0.08
      c.beginPath()
      c.moveTo(x * cell + 0.5, 0)
      c.lineTo(x * cell + 0.5, H)
      c.stroke()
    }
    c.globalAlpha = 0.08
    for (let y = 0; y <= ROWS; y++) {
      c.beginPath()
      c.moveTo(sx, y * cell + 0.5)
      c.lineTo(sx + viewW, y * cell + 0.5)
      c.stroke()
    }
    c.globalAlpha = 1
    // taşınan seçim yerinden kalkmış görünür
    const d = drag
    const shown = d?.kind === 'move' ? d.base : map
    const late: Array<[string, number, number]> = []
    for (let y = 0; y < ROWS; y++)
      for (let x = x0; x < x1; x++) {
        const ch = shown[y][x]
        if (ch === ' ') continue
        if (ch === 'E' || ch === 'P') late.push([ch, x, y])
        else drawTile(c, ch, x * cell, y * cell, cell, look, y > 0 ? shown[y - 1][x] : ' ')
      }
    for (const [ch, x, y] of late) drawTile(c, ch, x * cell, y * cell, cell, look)
    // sütun numaraları
    c.fillStyle = look.cream
    c.globalAlpha = 0.6
    c.font = `600 ${Math.max(9, Math.round(cell * 0.55))}px system-ui, sans-serif`
    c.textBaseline = 'top'
    for (let x = Math.max(10, Math.ceil(x0 / 10) * 10); x < x1; x += cell < 12 ? 20 : 10) c.fillText(String(x), x * cell + 3, 3)
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
    const frame = (r: Rect, color: string, dash: boolean) => {
      const n = norm(r)
      c.strokeStyle = color
      c.lineWidth = 2
      c.setLineDash(dash ? [5, 4] : [])
      c.strokeRect(n.x0 * cell + 1, n.y0 * cell + 1, (n.x1 - n.x0 + 1) * cell - 2, (n.y1 - n.y0 + 1) * cell - 2)
      c.setLineDash([])
    }
    // önizlemeler: dikdörtgen, taşınan seçim, imleçteki parça, seçim çerçevesi, imleç
    if (d?.kind === 'rect') {
      const n = norm({ x0: d.a.x, y0: d.a.y, x1: d.b.x, y1: d.b.y })
      if (!d.erase) {
        c.globalAlpha = 0.7
        drawRows(c, Array.from({ length: n.y1 - n.y0 + 1 }, () => tile.repeat(n.x1 - n.x0 + 1)), n.x0 * cell, n.y0 * cell, cell, look, true)
        c.globalAlpha = 1
      }
      frame(n, d.erase ? look.flag : look.gold, false)
    }
    if (d?.kind === 'select') frame({ x0: d.a.x, y0: d.a.y, x1: d.b.x, y1: d.b.y }, look.gold, true)
    if (d?.kind === 'move') {
      const dx = d.to.x - d.from.x
      const dy = d.to.y - d.from.y
      c.globalAlpha = 0.85
      drawRows(c, d.rows, (d.sel.x0 + dx) * cell, (d.sel.y0 + dy) * cell, cell, look, true)
      c.globalAlpha = 1
      frame({ x0: d.sel.x0 + dx, y0: d.sel.y0 + dy, x1: d.sel.x1 + dx, y1: d.sel.y1 + dy }, look.gold, true)
    }
    if (sel && !d) frame(sel, look.gold, true)
    if (hover && float && tool === 'stamp') {
      const ox = hover.x - float.ax
      const oy = hover.y - float.ay
      c.globalAlpha = 0.75
      drawRows(c, float.rows, ox * cell, oy * cell, cell, look, true)
      c.globalAlpha = 1
      frame({ x0: ox, y0: oy, x1: ox + float.rows[0].length - 1, y1: oy + float.rows.length - 1 }, look.gold, false)
      if (float.toTop?.length && oy > 0) {
        c.globalAlpha = 0.4
        for (const tx of float.toTop) for (let y = 0; y < oy; y++) drawTile(c, '#', (ox + tx) * cell, y * cell, cell, look, '#')
        c.globalAlpha = 1
      }
    } else if (hover && !d && tool !== 'pan' && tool !== 'select') {
      c.strokeStyle = tile === ' ' ? look.flag : look.gold
      c.lineWidth = 2
      c.strokeRect(hover.x * cell + 1, hover.y * cell + 1, cell - 2, cell - 2)
    }
  }, [map, cols, cell, look, hover, tool, tile, solveState, scrollX, viewW, drag, sel, float])

  // harita şeridi: bütün harita karo başına bir renk, görünen bölge çerçeveli
  useEffect(() => {
    const cv = strip.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look) return
    const W = cv.clientWidth
    if (!W) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(ROWS * 2 * dpr)
    const img = c.createImageData(cols, ROWS)
    const colors = thumbColors(look.city)
    const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
    const cache = new Map<string, number[]>()
    const sky = rgb(look.ink)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < cols; x++) {
        const ch = map[y][x]
        const hex = ch === '#' && y > 0 && map[y - 1][x] !== '#' ? look.city.tileTop : colors[ch]
        let v = hex && /^#[0-9a-f]{6}$/i.test(hex) ? cache.get(hex) : sky
        if (!v) cache.set(hex!, (v = rgb(hex!)))
        const i = (y * cols + x) * 4
        img.data[i] = v[0]
        img.data[i + 1] = v[1]
        img.data[i + 2] = v[2]
        img.data[i + 3] = 255
      }
    const off = document.createElement('canvas')
    off.width = cols
    off.height = ROWS
    off.getContext('2d')!.putImageData(img, 0, 0)
    c.imageSmoothingEnabled = false
    c.drawImage(off, 0, 0, cv.width, cv.height)
    const k = cv.width / (cols * cell)
    c.strokeStyle = look.gold
    c.lineWidth = 2 * dpr
    c.strokeRect(scrollX * k + dpr, dpr, Math.max(4, viewW * k - 2 * dpr), cv.height - 2 * dpr)
  }, [map, cols, cell, look, scrollX, viewW, boxW])

  const stripJump = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.type === 'pointermove' && !e.buttons) return
    const r = e.currentTarget.getBoundingClientRect()
    const col = ((e.clientX - r.left) / r.width) * cols
    const el = scroller.current
    if (el) el.scrollLeft = col * cell - el.clientWidth / 2
  }

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>): Cell | null => {
    const r = e.currentTarget.getBoundingClientRect()
    const sx = Math.max(0, Math.min(scrollX, cols * cell - viewW))
    const x = Math.floor((e.clientX - r.left + sx) / cell)
    const y = Math.floor((e.clientY - r.top) / cell)
    return x >= 0 && x < cols && y >= 0 && y < ROWS ? { x, y } : null
  }

  const paintTo = (d: Extract<Drag, { kind: 'paint' }>, to: Cell) => {
    const ch = d.erase ? ' ' : tile
    let changed = false
    line(d.last.x, d.last.y, to.x, to.y, (x, y) => {
      if (d.rows[y][x] === ch) return
      // başlangıç, çıkış, pul, nazar ve anahtar tektir: yenisi konunca eskisi kalkar
      if ((SINGLES as readonly string[]).includes(ch)) for (const row of d.rows) for (let i = 0; i < row.length; i++) if (row[i] === ch) row[i] = ' '
      d.rows[y][x] = ch
      changed = true
    })
    d.last = to
    if (!changed) return
    const next = d.rows.map((r) => r.join(''))
    if (!d.pushed) {
      d.pushed = true
      commit(next, mapRef.current)
    } else setMap(next)
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const at = cellAt(e)
    // kaydırma: araçla ya da orta tuşla (dokunmatikte tarayıcının kendi kaydırması)
    if (tool === 'pan' || e.button === 1) {
      if (e.pointerType === 'mouse' && scroller.current) {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragBoth({ kind: 'pan', x: e.clientX, scroll: scroller.current.scrollLeft })
      }
      return
    }
    if (!at) return
    e.preventDefault()
    const erase = e.button === 2
    if (e.altKey || tool === 'pick') {
      const sym = map[at.y][at.x] as Sym
      setTile(sym)
      setCat(TILES.find((x) => x.sym === sym)?.cat ?? 'zemin')
      if (tool === 'pick') setTool('brush')
      return
    }
    if (tool === 'stamp' && float) {
      if (erase) {
        setFloat(null)
        setTool('brush')
        return
      }
      // dokunmatikte üzerinde gezinme yok: ilk dokunuş parçanın hayaletini gösterir, aynı yere ikinci dokunuş yerleştirir
      if (e.pointerType !== 'mouse' && (!hover || hover.x !== at.x || hover.y !== at.y)) {
        setHover(at)
        return
      }
      commit(placePattern(map, float, at.x, at.y), map)
      return
    }
    const limited = LIMITED.has(tile) && !erase
    if (tool === 'fill' && !limited) {
      const next = floodFill(map, at.x, at.y, erase ? ' ' : tile)
      if (next !== map) commit(next, map)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'select') {
      if (sel && inside(sel, at)) {
        const n = norm(sel)
        setDragBoth({ kind: 'move', from: at, to: at, rows: cut(map, n), base: fillRect(map, n, ' '), sel: n, before: map })
      } else {
        setSel(null)
        setDragBoth({ kind: 'select', a: at, b: at })
      }
      return
    }
    if (tool === 'rect' && !limited) {
      setDragBoth({ kind: 'rect', a: at, b: at, erase })
      return
    }
    const d: Drag = { kind: 'paint', rows: map.map((r) => r.split('')), last: at, erase, pushed: false }
    setDragBoth(d)
    paintTo(d, at)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (d?.kind === 'pan') {
      if (scroller.current) scroller.current.scrollLeft = d.scroll - (e.clientX - d.x)
      return
    }
    const at = cellAt(e)
    setHover((h) => (at && h && h.x === at.x && h.y === at.y ? h : at))
    if (!d || !at) return
    if (d.kind === 'paint') paintTo(d, at)
    else if (d.kind === 'rect' || d.kind === 'select') {
      if (d.b.x !== at.x || d.b.y !== at.y) setDragBoth({ ...d, b: at })
    } else if (d.kind === 'move' && (d.to.x !== at.x || d.to.y !== at.y)) setDragBoth({ ...d, to: at })
  }

  const onUp = () => {
    const d = dragRef.current
    setDragBoth(null)
    if (!d) return
    if (d.kind === 'rect') {
      commit(fillRect(map, { x0: d.a.x, y0: d.a.y, x1: d.b.x, y1: d.b.y }, d.erase ? ' ' : tile), map)
    } else if (d.kind === 'select') {
      setSel(norm({ x0: d.a.x, y0: d.a.y, x1: d.b.x, y1: d.b.y }))
    } else if (d.kind === 'move') {
      const dx = d.to.x - d.from.x
      const dy = d.to.y - d.from.y
      if (!dx && !dy) return
      commit(placePattern(d.base, { rows: d.rows, ax: 0, ay: 0 }, d.sel.x0 + dx, d.sel.y0 + dy), d.before)
      const w = cols - 1
      setSel(norm({ x0: Math.max(0, Math.min(w, d.sel.x0 + dx)), y0: Math.max(0, Math.min(ROWS - 1, d.sel.y0 + dy)), x1: Math.max(0, Math.min(w, d.sel.x1 + dx)), y1: Math.max(0, Math.min(ROWS - 1, d.sel.y1 + dy)) }))
    }
  }

  const newMap = (make: () => string[]) => {
    setSel(null)
    setFloat(null)
    setTool((cur) => (cur === 'stamp' ? 'brush' : cur))
    commit(make(), map)
    setTemplatesOpen(false)
    scroller.current?.scrollTo({ left: 0 })
  }

  const runSolver = () => {
    if (problem) return
    worker.current?.terminate()
    const w = new Worker(new URL('./solve.worker.ts', import.meta.url))
    worker.current = w
    setSolve({ s: 'running' })
    // geniş haritada arama da süre de genişlikle büyür
    const budget = Math.max(20000, cols * 120)
    const timer = window.setTimeout(
      () => {
        w.terminate()
        if (worker.current === w) setSolve({ s: 'fail', unsure: true, far: { x: 0, y: 0 } })
      },
      45000 + cols * 100,
    )
    w.onmessage = (ev: MessageEvent<SolveReply>) => {
      window.clearTimeout(timer)
      w.terminate()
      if (worker.current !== w) return
      const r = ev.data
      setSolve(r.won ? { s: 'won', ...r } : { s: 'fail', unsure: r.unsure, far: r.far })
    }
    w.onerror = () => {
      window.clearTimeout(timer)
      w.terminate()
      if (worker.current === w) setSolve({ s: 'error' })
    }
    const req: SolveRequest = { level: customLevel(map, city, usedTexts), budget }
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

  const titleIssue = pubTitle.trim() ? titleProblem(pubTitle) : null

  const publish = async () => {
    if (!code || solveState.s !== 'won' || titleProblem(pubTitle)) return
    setPub({ s: 'sending' })
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (author?.token) headers['x-seksek-oyuncu'] = `${author.id}.${author.token}`
      const r = await fetch('/api/maps', { method: 'POST', headers, body: JSON.stringify({ code, title: pubTitle, solved: true }) })
      const j = (await r.json().catch(() => ({}))) as { id?: number; error?: string }
      if (r.ok && j.id) return setPub({ s: 'done', id: j.id })
      if (r.status === 409) return setPub({ s: 'dup' })
      if (r.status === 401) setAuthor(null)
      setPub({ s: 'error', msg: r.status === 503 ? 'Topluluk haritaları şu an kapalı.' : (j.error ?? 'Yayınlanamadı, biraz sonra yeniden dene.') })
    } catch {
      setPub({ s: 'error', msg: 'Yayınlanamadı, biraz sonra yeniden dene.' })
    }
  }

  const saveDraft = () => {
    const name = draftName.trim() || t('Adsız Harita')
    const d: Draft = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, code, map, city, at: Date.now(), texts: usedTexts }
    const next = [d, ...drafts].slice(0, 40)
    setDrafts(next)
    writeStore(DRAFTS_KEY, next)
    setDraftName('')
  }

  const openDraft = (d: Draft) => {
    const r = d.code ? decodeMap(d.code) : null
    const m = r && !('error' in r) ? r.map : d.map
    if (!Array.isArray(m) || m.length !== ROWS) return setNotice(t('Taslak açılamadı.'))
    setSel(null)
    commit(m, map)
    setCity(r && !('error' in r) ? r.city : d.city)
    setTexts(r && !('error' in r) ? r.texts : (d.texts ?? emptyTexts()))
  }

  const deleteDraft = (id: string) => {
    const next = drafts.filter((d) => d.id !== id)
    setDrafts(next)
    writeStore(DRAFTS_KEY, next)
  }

  const counts = useMemo(() => {
    const n: Record<string, number> = {}
    for (const row of map) for (const ch of row) n[ch] = (n[ch] ?? 0) + 1
    return { c: n.C ?? 0, f: n.F ?? 0, p: n.p ?? 0, stamp: !!n.$, charm: !!n['!'], key: !!n.K }
  }, [map])

  const date = (n: number) => new Date(n).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const tileDef = TILES.find((x) => x.sym === tile)
  const toolDef = TOOLS.find((x) => x.id === tool)
  const stampDef = float?.stamp ? STAMPS.find((x) => x.id === float.stamp) : null
  const help =
    tool === 'stamp' && float
      ? { title: stampDef ? stampDef.name : 'Yapıştır', text: stampDef ? stampDef.desc : 'Yapıştırılacak parça imleçte: tıkla, yerleştir. Sağ tık ya da Esc vazgeçer.' }
      : { title: toolDef?.name ?? '', text: toolDef?.desc ?? '' }
  const paints = tool === 'brush' || tool === 'rect' || tool === 'fill'
  const won = solveState.s === 'won' ? solveState : null

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

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4">
        <div className="grid gap-1">
          <p className="max-w-3xl text-[15px] leading-relaxed text-muted">
            {t('Kendi bölümünü kur: bir başlangıç (P), bir çıkış (E), arasına istediğin yol. Hazır parçalarla hızlı başla, çözücüyle sına, bağlantıyı arkadaşına gönder.')}
          </p>
          {notice && (
            <p role="status" className="text-[14px] text-accent-2">
              {t(notice)}
            </p>
          )}
        </div>

        {/* üst çubuk: harita, şehir, genişlik, geçmiş, yakınlık */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-2 border-line bg-panel p-3">
          <button type="button" className="pixel-btn primary px-3 py-1.5 text-sm" onClick={() => setTemplatesOpen((o) => !o)} aria-expanded={templatesOpen}>
            ＋ {t('Yeni Harita')}
          </button>
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
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={() => resize(-10)} disabled={cols <= MIN_W} aria-label={t('Daralt')}>
              −10
            </button>
            <span className="min-w-20 text-center text-[14px] tabular-nums text-cream">{t('{n} Sütun', { n: cols })}</span>
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={() => resize(10)} disabled={cols >= MAX_W} aria-label={t('Genişlet')}>
              +10
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={undo} disabled={!past.current.length} title="Ctrl+Z" aria-label={t('Geri Al')}>
              ↶<span className="hidden sm:inline">{t('Geri Al')}</span>
            </button>
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={redo} disabled={!future.current.length} title="Ctrl+Y" aria-label={t('Yinele')}>
              ↷<span className="hidden sm:inline">{t('Yinele')}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={() => zoom(-1)} disabled={cell <= ZOOMS[0]} aria-label={t('Uzaklaştır')} title="−">
              −
            </button>
            <span className="min-w-12 text-center text-[14px] tabular-nums text-cream">{Math.round((cell / 20) * 100)}%</span>
            <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={() => zoom(1)} disabled={cell >= ZOOMS[ZOOMS.length - 1]} aria-label={t('Yakınlaştır')} title="+">
              +
            </button>
          </div>
          <button type="button" className="pixel-btn px-2.5 py-1.5 text-sm" onClick={mirror} title={t('Seçimi ya da bütün haritayı sağdan sola çevirir.')}>
            ⇋ {t('Yatay Çevir')}
          </button>
          <span className="text-[13px] text-muted">
            {t('Hatıra {c}/3 · Bayrak {f} · Sandık {p}/2', { c: counts.c, f: counts.f, p: counts.p })}
            {counts.stamp ? ` · ${t('Pul')}` : ''}
            {counts.charm ? ` · ${t('Nazar')}` : ''}
            {counts.key ? ` · ${t('Anahtar')}` : ''}
          </span>
        </div>

        {templatesOpen && (
          <section aria-label={t('Yeni Harita')} className="grid gap-2 border-2 border-line bg-panel p-3">
            <p className="text-[13px] text-muted">{t('Bir başlangıç seç. Şimdiki harita geri al ile döner; saklamak istersen önce taslak olarak kaydet.')}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((tp) => (
                <button key={tp.id} type="button" onClick={() => newMap(tp.make)} className="border-2 border-line bg-panel-2 px-3 py-2 text-left hover:border-gold">
                  <span className="block font-display text-[16px] text-cream">{t(tp.name)}</span>
                  <span className="block text-[13px] text-muted">{t(tp.desc)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* araçlar ve palet */}
          <aside className="grid min-w-0 content-start gap-3">
            <section aria-label={t('Araçlar')} className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-3">
              {TOOLS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => chooseTool(x.id)}
                  aria-pressed={tool === x.id}
                  title={`${t(x.name)} (${x.key})`}
                  className={`flex flex-col items-center gap-0.5 border-2 px-1 py-1.5 text-[11px] leading-tight transition-colors ${tool === x.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
                >
                  <span className="text-[18px] leading-none text-cream" aria-hidden>
                    {x.glyph}
                  </span>
                  <span className="max-w-full truncate">{t(x.name)}</span>
                </button>
              ))}
            </section>

            <div role="tablist" aria-label={t('Karolar')} className="flex flex-wrap gap-1.5">
              {CATS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={cat === x.id}
                  onClick={() => setCat(x.id)}
                  className={`border-2 px-2 py-1 text-[13px] ${cat === x.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
                >
                  {t(x.name)}
                </button>
              ))}
            </div>

            <section role="tabpanel" aria-label={t(CATS.find((x) => x.id === cat)!.name)} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:max-h-[24rem] lg:grid-cols-1 lg:content-start lg:overflow-y-auto lg:px-0 lg:pb-0">
              {cat === 'parca'
                ? STAMPS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => chooseStamp(s.id)}
                      aria-pressed={float?.stamp === s.id}
                      className={`flex shrink-0 items-center gap-2 border-2 px-2 py-1.5 text-left text-[14px] transition-colors ${float?.stamp === s.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
                    >
                      <Swatch rows={s.rows} look={look} />
                      <span className="min-w-0 flex-1 whitespace-nowrap lg:truncate">{t(s.name)}</span>
                    </button>
                  ))
                : TILES.filter((x) => x.cat === cat).map((x) => (
                    <button
                      key={x.sym}
                      type="button"
                      onClick={() => chooseTile(x.sym)}
                      aria-pressed={tile === x.sym && paints}
                      className={`flex shrink-0 items-center gap-2 border-2 px-2 py-1.5 text-left text-[14px] transition-colors ${tile === x.sym && paints ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
                    >
                      <Swatch sym={x.sym} look={look} />
                      <span className="min-w-0 flex-1 whitespace-nowrap lg:truncate">{t(x.name)}</span>
                      {x.key && <kbd className="hidden text-[12px] text-muted sm:inline">{x.key}</kbd>}
                    </button>
                  ))}
            </section>

            {/* seçili araç ve karonun kısa açıklaması */}
            <div aria-live="polite" className="grid gap-1 border-2 border-line bg-panel p-3">
              <p className="font-display text-[16px] text-cream">
                {t(help.title)}
                {paints && tileDef && <span className="text-gold"> · {t(tileDef.name)}</span>}
              </p>
              <p className="text-[13px] leading-snug text-muted">{t(help.text)}</p>
              {tool === 'stamp' && float && <p className="text-[12px] leading-snug text-muted lg:hidden">{t('Dokunmatikte: bir kez dokun, parçanın yeri görünsün; aynı yere yine dokun, yerleşsin.')}</p>}
              {paints && tileDef && <p className="text-[13px] leading-snug text-cream">{t(tileDef.desc)}</p>}
              {paints && LIMITED.has(tile) && tool !== 'brush' && <p className="text-[12px] text-muted">{t('Bu karo sayılı: dolgu ve dikdörtgen tek hücre koyar.')}</p>}
            </div>
          </aside>

          <div className="grid min-w-0 content-start gap-3">
            {/* ızgara: kaydırma kutusu tam genişlikte, tuval yalnız görünen bölgeyi çizer */}
            <div
              ref={scroller}
              className="overflow-x-auto border-2 border-line bg-panel"
              onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
            >
              <div style={{ width: cols * cell, height: ROWS * cell }}>
                <canvas
                  ref={canvas}
                  className={`sticky left-0 block ${tool === 'pan' ? 'cursor-grab' : tool === 'select' ? 'cursor-cell touch-none' : 'cursor-crosshair touch-none'}`}
                  style={{ width: viewW || '100%', height: ROWS * cell }}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  onPointerLeave={() => setHover(null)}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={t('Harita Izgarası')}
                />
              </div>
            </div>

            {(sel || (tool === 'stamp' && float)) && (
              <div className="flex flex-wrap items-center gap-2 border-2 border-line bg-panel p-2 text-sm">
                {sel ? (
                  <>
                    <span className="px-1 text-[13px] text-muted">{t('Seçim {w}×{h}', { w: norm(sel).x1 - norm(sel).x0 + 1, h: norm(sel).y1 - norm(sel).y0 + 1 })}</span>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={copySel} title="Ctrl+C">
                      {t('Kopyala')}
                    </button>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => copySel() && clearSel()} title="Ctrl+X">
                      {t('Kes')}
                    </button>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={mirror}>
                      ⇋ {t('Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={clearSel} title="Delete">
                      {t('Boşalt')}
                    </button>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => setSel(null)} title="Esc">
                      {t('Seçimi Bırak')}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-1 text-[13px] text-muted">{t('Yerleştirmek için haritaya dokun; aynı parçayı istediğin kadar koyabilirsin.')}</span>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={mirror}>
                      ⇋ {t('Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => (setFloat(null), setTool('brush'))} title="Esc">
                      {t('Vazgeç')}
                    </button>
                  </>
                )}
                {clip && !float && (
                  <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={paste} title="Ctrl+V">
                    {t('Yapıştır')}
                  </button>
                )}
              </div>
            )}

            {/* bütün harita: dokun ya da sürükle, oraya git */}
            <canvas
              ref={strip}
              className="block h-12 w-full cursor-pointer touch-none border-2 border-line"
              onPointerDown={stripJump}
              onPointerMove={stripJump}
              aria-label={t('Harita Şeridi')}
            />
            <p className="text-[13px] text-muted">{t('Sol tık boyar, sağ tık siler, Alt+tık karoyu seçer. Seçim aracıyla Ctrl+C, Ctrl+X ve Ctrl+V; Ctrl+Z geri alır, + ve − yakınlaştırır. Alttaki şeride dokunup haritada gezin.')}</p>

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
              <div aria-live="polite" className="grid gap-1 text-[14px]">
                {problem && <p className="text-accent-2">{t(problem)}</p>}
                {!problem && solveState.s === 'running' && <p className="text-muted">{t('Çözücü deniyor…')}</p>}
                {!problem && won && (
                  <>
                    <p className="text-gold">{t('Bitirilebilir ✓ (çözücünün yolu ~{s} sn)', { s: won.seconds.toFixed(1) })}</p>
                    {(won.items[1] > 0 || won.stamp !== null || won.charm !== null) && (
                      <p className="text-[13px] text-muted">
                        {t('Çözücünün alabildikleri:')}{' '}
                        {[
                          won.items[1] > 0 ? `${t('Hatıra')} ${won.items[0]}/${won.items[1]}` : '',
                          won.stamp === null ? '' : t(won.stamp ? 'Pul ✓' : 'Pul ✗'),
                          won.charm === null ? '' : t(won.charm ? 'Nazar ✓' : 'Nazar ✗'),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </>
                )}
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
              {!problem && won && (
                <div className="grid gap-2 border-t-2 border-line pt-3">
                  <h2 className="font-display text-xl text-cream">{t('Topluluğa Yayınla')}</h2>
                  {pub.s === 'done' || pub.s === 'dup' ? (
                    <p className="text-[14px] text-gold">
                      {pub.s === 'done' ? t('Yayınlandı! Haritan artık galeride.') : t('Bu harita zaten yayında.')}{' '}
                      <Link href="/haritalar" className="text-cream underline underline-offset-4">
                        {t('Topluluk Haritaları')} →
                      </Link>
                    </p>
                  ) : author === null ? (
                    <div className="grid max-w-md gap-2">
                      <p className="text-[14px] text-muted">{t('Yayınlamak için giriş gerekir: oyundaki hesabınla gir ya da hemen üye ol.')}</p>
                      <AuthForm autoFocus={false} onDone={(p) => setAuthor(p)} />
                    </div>
                  ) : (
                    <form
                      className="grid gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void publish()
                      }}
                    >
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={pubTitle}
                          onChange={(e) => setPubTitle(e.target.value)}
                          maxLength={TITLE_MAX}
                          placeholder={t('Haritanın adı (3–40 karakter)')}
                          className="min-w-0 flex-1 border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream"
                          aria-label={t('Harita Başlığı')}
                        />
                        <button type="submit" className="pixel-btn primary py-1.5 text-sm" disabled={!author || pub.s === 'sending' || !!titleProblem(pubTitle)}>
                          {pub.s === 'sending' ? t('Yayınlanıyor…') : t('Topluluğa Yayınla')}
                        </button>
                      </div>
                      <p className="text-[13px] text-muted">
                        {author ? t('{name} adıyla yayınlanır; herkes galeride görüp oynayabilir.', { name: author.name }) : t('Oturum denetleniyor…')}
                      </p>
                      {titleIssue && <p className="text-[13px] text-accent-2">{t(titleIssue)}</p>}
                      {pub.s === 'error' && (
                        <p role="alert" className="text-[13px] text-accent-2">
                          {t(pub.msg)}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </section>

            {/* metinler: haritadaki tabela ve şehir insanlarının sözleri, soldan sağa sırayla */}
            {(signCount > 0 || npcCount > 0 || hasBoss) && (
              <section className="pixel-panel grid gap-3 p-4" aria-label={t('Metinler')}>
                <h2 className="font-display text-xl text-cream">{t('Metinler')}</h2>
                <p className="text-[13px] text-muted">{t('Tabelalar ve şehir insanları haritada soldan sağa sıralanır. Yazdığın söz oyunda başlarının üstünde baloncukta görünür.')}</p>
                {hasBoss && (
                  <label className="grid gap-1 text-[13px] text-cream">
                    <span>{t('Boss')}</span>
                    <select value={texts.boss ?? city} onChange={(e) => setTexts((old) => ({ ...old, boss: e.target.value as CityKey }))} className="border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream" aria-label={t('Boss')}>
                      {LEVELS.map((l) => (
                        <option key={l.city} value={l.city}>
                          {lang === 'en' ? BOSSES[l.city].nameEn : BOSSES[l.city].name} · {l.name} · {t(l.difficulty)}
                        </option>
                      ))}
                    </select>
                    <span className="text-[12px] text-muted">{t(lang === 'en' ? BOSSES[texts.boss ?? city].tauntEn : BOSSES[texts.boss ?? city].taunt)}</span>
                  </label>
                )}
                {usedTexts.signs.map((sgn, k) => (
                  <label key={`s${k}`} className="grid gap-1 text-[13px] text-cream">
                    <span>{t('Tabela {n}', { n: k + 1 })}</span>
                    <input
                      value={sgn}
                      maxLength={SIGN_MAX}
                      placeholder={t('Ne yapılacağını kısaca yaz: “Duvara tutun, yukarı sek.”')}
                      onChange={(e) => setTexts((old) => ({ ...old, signs: Array.from({ length: Math.max(old.signs.length, k + 1) }, (_, i) => (i === k ? e.target.value : (old.signs[i] ?? ''))) }))}
                      className="w-full border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream"
                    />
                  </label>
                ))}
                {usedTexts.npcs.map((npc, k) => {
                  const put = (patch: Partial<CustomTexts['npcs'][number]>) =>
                    setTexts((old) => ({ ...old, npcs: Array.from({ length: Math.max(old.npcs.length, k + 1) }, (_, i) => (i === k ? { ...usedTexts.npcs[k], ...patch } : (old.npcs[i] ?? usedTexts.npcs[i] ?? { name: '', text: '', look: 'amca' }))) }))
                  return (
                    <fieldset key={`n${k}`} className="grid gap-1.5 border-2 border-line p-2">
                      <legend className="px-1 text-[13px] text-cream">{t('Şehir İnsanı {n}', { n: k + 1 })}</legend>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <input value={npc.name} maxLength={NPC_NAME_MAX} placeholder={t('Adı: “Simitçi Hasan Amca”')} onChange={(e) => put({ name: e.target.value })} className="min-w-0 border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream" aria-label={t('Adı')} />
                        <select value={npc.look} onChange={(e) => put({ look: e.target.value as CustomTexts['npcs'][number]['look'] })} className="border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream" aria-label={t('Kılığı')}>
                          {NPC_LOOKS.map((l) => (
                            <option key={l} value={l}>
                              {t({ amca: 'Amca', teyze: 'Teyze', usta: 'Usta', genc: 'Genç', coban: 'Çoban', ozan: 'Ozan' }[l])}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea value={npc.text} maxLength={NPC_TEXT_MAX} rows={2} placeholder={t('Sözü: şehri anlat, saklı köşeyi üstü kapalı fısılda.')} onChange={(e) => put({ text: e.target.value })} className="w-full resize-y border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream" aria-label={t('Sözü')} />
                    </fieldset>
                  )
                })}
              </section>
            )}

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
                      <span className="text-[13px] text-muted">
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
