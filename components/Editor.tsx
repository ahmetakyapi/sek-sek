'use client'

import Link from 'next/link'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import AuthForm from '@/components/AuthForm'
import { BossFigure } from '@/components/Figures'
import { CITY } from '@/game/art'
import { BOSSES } from '@/game/boss'
import { LEVELS } from '@/game/levels'
import { PIXEL_BUDGET } from '@/game/render'
import type { CityKey, LevelDef } from '@/game/types'
import { TITLE_MAX, titleProblem } from '@/lib/communityMaps'
import { BOSS_HP_MAX, BOSS_SPEEDS, MAP_DESC_MAX, MAP_TITLE_MAX, MAX_W, MIN_W, NPC_LOOKS, NPC_NAME_MAX, NPC_TEXT_MAX, ROWS, SAMPLE_MAP, SIGN_MAX, SINGLES, customLevel, decodeMap, emptyTexts, encodeMap, textProblem, validateMap, type CustomTexts, type Sym } from '@/lib/customLevel'
import { NPC_TIPS, SIGN_TIPS, STAMPS, STAMP_CATS, TEMPLATES, autoGround, cut, fillRect, flipRowsV, floodFill, mapNotes, mapStats, mirrorRect, mirrorRows, norm, placePattern, repeatRect, resizeMap, rotateRows, stampCat, stuckHint, thumbColors, wizardMap, type Pattern, type Rect, type StampCat } from '@/lib/editorKit'
import { LangProvider, useLang, useT, type Lang } from '@/lib/i18n'
import { formatTime } from '@/lib/storage'
import EditorPlay, { type PlayTrace } from './EditorPlay'
import { EditorScene, drawRows, drawTile, lookFor, paintSwatch, type Look, type ViewMode } from './editorScene'
import type { SolveReply, SolveRequest } from './solve.worker'

/**
 * Bölüm Düzenleyici (/duzenle): 24 satırlık özel harita çizilir, çözücüyle sınanır, kodu bağlantıyla paylaşılır.
 * Izgara iki görünüşlüdür (editorScene.ts): Oyun (harita oyundaki gibi) ya da Şema (sade renkli kare + simge). Yalnız görünen
 * sütunlar çizilir (600 sütunluk harita da akıcı kalır); altındaki şerit bütün haritayı gösterir. Hızlı Deneme (EditorPlay.tsx)
 * ızgaranın yerinde oyunu oynatır, dönüşte koşunun izi ızgarada kalır.
 * Ekran tek bakışta sığar (sayfa kaymaz): geniş ekranda palet | ızgara | sekmeli panel, yatay telefonda ızgara | panel,
 * dikey telefonda ızgara üstte, panel altta; uzun içerik panelin kendi alanında kayar. Izgaranın yakınlığı kutuya sığacak
 * biçimde seçilir (oyuncu yakınlaştırana dek).
 */

type ToolId = 'brush' | 'rect' | 'fill' | 'pick' | 'select' | 'pan' | 'stamp'
type Cat = 'zemin' | 'tehlike' | 'nesne' | 'hareketli' | 'dusman' | 'sus' | 'parca'
type Tab = 'karolar' | 'dene' | 'boss' | 'metin' | 'harita'
/** wide: palet + ızgara + panel · side: ızgara + panel (yatay telefon, tablet) · stack: ızgara üstte, panel altta */
type Layout = 'wide' | 'side' | 'stack'

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
  { sym: 'A', name: 'Gelgit Suyu', desc: 'Sekiz saniyede bir yükselip alçalır: yüksekken yüzülür, alçakken dibinde yürünür. Bitişik karolar tek havuzdur.', key: 'E', cat: 'zemin' },
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
  { sym: '?', name: 'Tabela', desc: 'Önünde durana senin yazdığın sözü gösterir (en çok 8; yazısı Metinler kutusunda).', cat: 'nesne' },
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
  { sym: 'Q', name: 'Boss', desc: 'Satırında ray sonuna (|), duvara ya da boss kapısına dek dolaşır; hangi şehrin boss’u olduğunu Boss sekmesinde seç.', cat: 'dusman' },
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
const ZOOMS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 40]
const SIZES = [1, 2, 3] as const
const SPEED_NAMES: Record<number, string> = { 80: 'Yavaş', 100: 'Normal', 115: 'Hızlı', 130: 'Çok Hızlı' }
/** Kısayollar kartı (? ile açılır): araç ve karo kısayolları listeden, gerisi burada */
const KEY_GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: 'Çizim',
    rows: [
      ['Sol Tık', 'Boyar'],
      ['Sağ Tık', 'Siler'],
      ['Alt + Tık', 'Karoyu seçer'],
      ['Delete', 'Seçimi boşaltır, yoksa silgi'],
      ['/', 'Karo arar'],
    ],
  },
  {
    title: 'Seçim',
    rows: [
      ['Ctrl + C · X · V', 'Kopyala, kes, yapıştır'],
      ['Ctrl + D', 'Seçimi sağa çoğaltır'],
      ['Ctrl + A', 'Bütün haritayı seçer'],
      ['Shift + H', 'Yatay çevirir'],
      ['Shift + V', 'Dikey çevirir'],
      ['Shift + R', 'Saat yönünde döndürür'],
    ],
  },
  {
    title: 'Gezinme',
    rows: [
      ['Ctrl + Tekerlek', 'Yakınlaştırır'],
      ['Tekerlek', 'Yana kaydırır'],
      ['Boşluk + Sürükle', 'Haritayı kaydırır'],
      ['Orta Tık', 'Haritayı kaydırır'],
      ['← →', 'On sütun kaydırır'],
      ['+ −', 'Yakınlaştır, uzaklaştır'],
    ],
  },
  {
    title: 'Deneme',
    rows: [
      ['Enter', 'Baştan oyna'],
      ['Shift + Enter', 'İmlecin olduğu yerden oyna'],
      ['Esc', 'Oyundan düzenlemeye döner'],
      ['Ctrl + Z · Y', 'Geri al, yinele'],
    ],
  },
]
const VIEW_KEY = 'seksek:duzenle-gorunum'
const GUIDE_KEY = 'seksek:duzenle-rehber'
const RECENT_MAX = 8
const DRAFTS_KEY = 'seksek:taslaklar'
const WORK_KEY = 'seksek:duzenle'
const HISTORY = 300
/** Sihirbazın boyut seçenekleri (0: şablonun kendi boyu) */
const WIZ_WIDTHS = [0, 100, 150, 200, 300, 400] as const
const WIDTH_PRESETS = [60, 100, 150, 200, 300, 400] as const

interface Wizard {
  step: 0 | 1 | 2 | 3
  city: CityKey
  template: string
  width: number
  boss: boolean
}
/** bu tarayıcıda en son yayınlanan ya da güncellemek için açılan haritanın yayın numarası */
const PUBLISHED_KEY = 'seksek:duzenle:yayin'

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
/** yayın sonucu: `updated` yayındaki haritanın güncellendiğini, `link` oynama bağlantısını söyler */
type PublishState = { s: 'idle' } | { s: 'sending' } | { s: 'done'; id: number; updated: boolean; link: string; copied: boolean } | { s: 'dup' } | { s: 'error'; msg: string }

type SolveState = { s: 'idle' } | { s: 'running' } | ({ s: 'won' } & Extract<SolveReply, { won: true }>) | { s: 'fail'; unsure: boolean; far: { x: number; y: number } } | { s: 'error' }

/** Sürükleme: boyama, dikdörtgen, seçim, taşıma, kaydırma */
type Drag =
  | { kind: 'paint'; rows: string[][]; last: Cell; erase: boolean; pushed: boolean }
  | { kind: 'rect'; a: Cell; b: Cell; erase: boolean }
  | { kind: 'select'; a: Cell; b: Cell }
  | { kind: 'move'; from: Cell; to: Cell; rows: string[]; base: string[]; sel: Rect; before: string[] }
  | { kind: 'pan'; x: number; y: number; scroll: number; top: number }

type Cell = { x: number; y: number }


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

/** Palet simgesi: oyunun çizimiyle (nesne, canlı, boss), sade karo ya da hazır parçanın küçültülmüşü */
function Swatch({ sym, rows, look, city, mode, px = 26 }: { sym?: Sym; rows?: string[]; look: Look | null; city: CityKey; mode: ViewMode; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look) return
    const n = px * 2
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, n, n)
    const g = c.createLinearGradient(0, 0, 0, n)
    g.addColorStop(0, look.city.sky[1])
    g.addColorStop(1, look.city.sky[2])
    c.fillStyle = g
    c.globalAlpha = 0.4
    c.fillRect(0, 0, n, n)
    c.globalAlpha = 1
    if (rows) {
      const s = Math.min(n / rows[0].length, n / rows.length)
      drawRows(c, rows, (n - s * rows[0].length) / 2, (n - s * rows.length) / 2, s, look, false)
    } else if (sym === ' ') {
      c.fillStyle = look.cream
      c.font = `600 ${Math.round(n * 0.6)}px system-ui, sans-serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('✕', n / 2, n * 0.54)
    } else if (sym === 'E' && mode === 'sema') drawTile(c, 'E', n * 0.27, n / 2, n * 0.46, look)
    else if (sym) paintSwatch(c, sym, n, look, city, mode)
  }, [sym, rows, look, city, mode, px])
  return <canvas ref={ref} width={px * 2} height={px * 2} className="shrink-0 rounded-[3px]" style={{ width: px, height: px }} aria-hidden />
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
  const [tab, setTab] = useState<Tab>('dene')
  /** Yeni Harita Sihirbazı (null: kapalı), hazır parça kategorisi, yineleme ve boyut girişi */
  const [wiz, setWiz] = useState<Wizard | null>(null)
  const [stampCatSel, setStampCatSel] = useState<StampCat | 'hepsi'>('hepsi')
  const [rep, setRep] = useState({ times: 3, gap: 0 })
  const [widthInput, setWidthInput] = useState('')
  const [layout, setLayout] = useState<Layout>('wide')
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  /** fırça boyutu: kare kenarı (sayılı karolar her zaman tek hücre) */
  const [size, setSize] = useState<(typeof SIZES)[number]>(1)
  /** uyarıdan ya da çözücüden "Göster" ile işaretlenen yer */
  const [mark, setMark] = useState<Cell | null>(null)
  const [solveState, setSolve] = useState<SolveState>({ s: 'idle' })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [draftName, setDraftName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [share, setShare] = useState<{ url: string; copied: boolean } | null>(null)
  const [author, setAuthor] = useState<Author | null | undefined>(undefined)
  const [pubTitle, setPubTitle] = useState('')
  const [pub, setPub] = useState<PublishState>({ s: 'idle' })
  /** güncellenecek yayın (null: yeni harita olarak yayınla) ve oyuncunun yayındaki haritaları */
  const [target, setTarget] = useState<number | null>(null)
  const targetRef = useRef<number | null>(null)
  const [mine, setMine] = useState<Array<{ id: number; title: string }>>([])
  const [hover, setHover] = useState<Cell | null>(null)
  const [cell, setCell] = useState(20)
  const [look, setLook] = useState<Look | null>(null)
  const [scrollX, setScrollX] = useState(0)
  const [boxW, setBoxW] = useState(0)
  const [, setHistoryTick] = useState(0)
  const past = useRef<string[][]>([])
  const future = useRef<string[][]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  /** üst katman: ızgara çizgileri, imleç, seçim, önizlemeler, çözücünün ve denemenin izi */
  const overlay = useRef<HTMLCanvasElement>(null)
  const [view, setView] = useState<ViewMode>('oyun')
  const [showGrid, setShowGrid] = useState(true)
  const [recent, setRecent] = useState<Sym[]>(['#', '=', '^', 'F', 'C'])
  const [query, setQuery] = useState('')
  const search = useRef<HTMLInputElement>(null)
  const [showKeys, setShowKeys] = useState(false)
  /** Hızlı Deneme: ızgaranın yerinde oyun; picking: "Buradan Oyna" başlangıç yerini bekliyor */
  const [playing, setPlaying] = useState<LevelDef | null>(null)
  const [picking, setPicking] = useState(false)
  const [trace, setTrace] = useState<PlayTrace | null>(null)
  /** ilk adımlar rehberi: ilk açılışta ve başlangıç ya da çıkış eksikken */
  const [guide, setGuide] = useState(false)
  const [painted, setPainted] = useState(false)
  /** boşluk basılıyken sürükleme haritayı kaydırır */
  const space = useRef(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const scene = useRef<EditorScene | null>(null)
  const drawBase = useRef<() => void>(() => {})
  const scroller = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLCanvasElement>(null)
  /** ızgaranın sığacağı kutu: yakınlık buna göre seçilir */
  const fitBox = useRef<HTMLDivElement>(null)
  const status = useRef<HTMLDivElement>(null)
  /** oyuncu yakınlaştırdıysa kutuya sığdırma durur */
  const zoomed = useRef(false)
  const dragRef = useRef<Drag | null>(null)
  const worker = useRef<Worker | null>(null)
  /** yakınlaştırınca imlecin (ya da ortanın) altındaki sütun yerinde kalsın: sütun ve kutudaki yeri */
  const keepCol = useRef<{ col: number; px: number } | null>(null)
  const mapRef = useRef(map)
  mapRef.current = map

  const cols = map[0].length
  const viewW = Math.min(boxW || cols * cell, cols * cell)
  // tabela ve şehir insanı metinleri haritadaki sayıya göre: fazlası saklanır (silinip geri konursa metin kaybolmaz)
  // ağır türetilenler (doğrulama, kod, uyarılar, sayılar) boyamayı bekletmesin: haritanın ertelenmiş kopyasından
  const lazy = useDeferredValue(map)
  const signCount = useMemo(() => map.join('').split('?').length - 1, [map])
  const npcCount = useMemo(() => map.join('').split('n').length - 1, [map])
  const hasBoss = useMemo(() => map.some((r) => r.includes('Q')), [map])
  const usedTexts: CustomTexts = useMemo(
    () => ({ ...(texts.title ? { title: texts.title } : {}), ...(texts.desc ? { desc: texts.desc } : {}), signs: Array.from({ length: signCount }, (_, k) => texts.signs[k] ?? ''), npcs: Array.from({ length: npcCount }, (_, k) => texts.npcs[k] ?? { name: '', text: '', look: NPC_LOOKS[k % NPC_LOOKS.length] }), ...(hasBoss ? { boss: texts.boss, boss2: texts.boss2, bossTier: texts.bossTier, bossSpeed: texts.bossSpeed, bossHp: texts.bossHp } : {}) }),
    [texts, signCount, npcCount, hasBoss],
  )
  const problem = useMemo(() => validateMap(lazy) ?? textProblem(usedTexts), [lazy, usedTexts])
  const code = useMemo(() => (problem || validateMap(lazy) ? null : encodeMap(lazy, city, usedTexts)), [lazy, city, problem, usedTexts])
  const notes = useMemo(() => (validateMap(lazy) ? [] : mapNotes(lazy)), [lazy])

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d
    setDrag(d)
  }

  // açılış: dil, ?kod=, son çalışma, taslaklar
  useEffect(() => {
    const save = readStore<{ lang?: Lang }>('seksek:v1')
    if (save?.lang === 'en') setLang('en')
    setDrafts(readStore<Draft[]>(DRAFTS_KEY) ?? [])
    const prefs = readStore<{ view?: ViewMode; grid?: boolean; recent?: Sym[] }>(VIEW_KEY)
    if (prefs?.view === 'sema') setView('sema')
    if (prefs?.grid === false) setShowGrid(false)
    if (Array.isArray(prefs?.recent)) setRecent(prefs.recent.filter((x) => TILES.some((tl) => tl.sym === x)).slice(0, RECENT_MAX))
    if (!readStore<boolean>(GUIDE_KEY)) setGuide(true)
    const params = new URLSearchParams(window.location.search)
    const yayin = Number(params.get('yayin'))
    const saved = readStore<{ id?: number }>(PUBLISHED_KEY)?.id
    if (Number.isInteger(yayin) && yayin > 0) setTarget(yayin)
    else if (Number.isInteger(saved) && (saved ?? 0) > 0) setTarget(saved ?? null)
    const kod = params.get('kod')
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

  useEffect(() => writeStore(VIEW_KEY, { view, grid: showGrid, recent }), [view, showGrid, recent])

  // başlangıç ya da çıkış eksikse rehber yeniden görünür
  const hasP = useMemo(() => map.some((r) => r.includes('P')), [map])
  const hasE = useMemo(() => map.some((r) => r.includes('E')), [map])
  useEffect(() => {
    if (!hasP || !hasE) setGuide(true)
  }, [hasP, hasE])

  // düzen: ekranın boyuna ve enine göre (globals.css'teki wide / side ile aynı eşikler)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1100px) and (min-height: 600px)')
    const side = window.matchMedia('(min-width: 900px) and (min-height: 600px), (min-width: 560px) and (max-height: 500px)')
    const pick = () => setLayout(wide.matches ? 'wide' : side.matches ? 'side' : 'stack')
    pick()
    wide.addEventListener('change', pick)
    side.addEventListener('change', pick)
    return () => {
      wide.removeEventListener('change', pick)
      side.removeEventListener('change', pick)
    }
  }, [])

  // palet geniş ekranda solda durur; dar ekranda panelin ilk sekmesidir
  useEffect(() => {
    if (layout === 'wide') setTab((cur) => (cur === 'karolar' ? 'dene' : cur))
    else setTab((cur) => (cur === 'dene' ? 'karolar' : cur))
  }, [layout])

  // ızgara kutuya sığsın: 24 satırın tamamı görünür (oyuncu yakınlaştırana dek)
  useEffect(() => {
    const el = fitBox.current
    if (!el) return
    const fit = () => {
      if (zoomed.current) return
      // durum satırı, şerit, aralar ve kaydırma çubuğu da sığsın
      const h = el.clientHeight - (status.current?.offsetHeight ?? 32) - (strip.current?.offsetHeight ?? 40) - 12 - 14
      // dikey telefonda karo parmakla seçilebilsin: en az 12 piksel, sığmayan üst satırlar kaydırılır (zemin görünür kalır)
      const least = layoutRef.current === 'stack' ? 12 : ZOOMS[0]
      const next = Math.max(least, [...ZOOMS].reverse().find((z) => z * ROWS <= h) ?? ZOOMS[0])
      setCell(next)
      if (next * ROWS > h) window.setTimeout(() => scroller.current?.scrollTo({ top: 99999 }), 0)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    fit()
    return () => ro.disconnect()
  }, [layout])

  useEffect(() => {
    if (!mark) return
    const id = window.setTimeout(() => setMark(null), 2600)
    return () => window.clearTimeout(id)
  }, [mark])

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

  // yayındaki haritalarım: güncellenecek olanı seçmek için (yalnız çözülmüş haritada gerekir)
  const isSolved = solveState.s === 'won'
  useEffect(() => {
    if (!author || !isSolved) return
    let live = true
    const headers: Record<string, string> = author.token ? { 'x-seksek-oyuncu': `${author.id}.${author.token}` } : {}
    fetch('/api/maps?mine=1&sort=yeni', { cache: 'no-store', headers })
      .then((r) => (r.ok ? (r.json() as Promise<{ maps?: Array<{ id: number; title: string }> }>) : null))
      .then((j) => {
        if (!live || !j?.maps) return
        const list = j.maps.map((m) => ({ id: m.id, title: m.title }))
        setMine(list)
        // yerelde saklanan numara artık yoksa (silinmiş ya da başkasının) yeni yayına dön
        setTarget((cur) => (cur !== null && !list.some((m) => m.id === cur) ? null : cur))
        setPubTitle((cur) => cur || (list.find((m) => m.id === targetRef.current)?.title ?? ''))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [author, isSolved, pub.s])

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
    el.scrollLeft = keepCol.current.col * cell - keepCol.current.px
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
    setPainted(true)
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

  const resizeTo = (width: number) => {
    // genişlerken son sütunun zemini uzar; tekil nesneler kopyalanmaz
    const next = resizeMap(map, width)
    if (next === map) return
    setSel(null)
    commit(next, map)
  }
  const resize = (delta: number) => resizeTo(cols + delta)

  /** at: kutudaki yatay yer (css piksel); verilmezse ortası */
  const zoom = (dir: 1 | -1, at?: number) => {
    const i = ZOOMS.indexOf(cell)
    const near = i < 0 ? ZOOMS.findIndex((z) => z >= cell) : i
    const next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, near + dir))]
    if (next === cell) return
    zoomed.current = true
    const el = scroller.current
    const px = at ?? (el ? el.clientWidth / 2 : 0)
    keepCol.current = { col: el ? (el.scrollLeft + px) / cell : 0, px }
    setCell(next)
  }

  const remember = (sym: Sym) => setRecent((r) => [sym, ...r.filter((x) => x !== sym)].slice(0, RECENT_MAX))

  const chooseTile = (sym: Sym) => {
    setTile(sym)
    remember(sym)
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

  /** Ctrl+D: seçimi hemen sağına kopyalar, seçim kopyaya geçer (art arda basınca yol uzar) */
  const dupSel = useCallback(() => {
    if (!sel) return false
    const m = mapRef.current
    const n = norm(sel)
    const w = n.x1 - n.x0 + 1
    if (n.x1 + w >= m[0].length) {
      setNotice('Çoğaltmaya yer yok: önce haritayı genişlet.')
      return true
    }
    commit(repeatRect(m, n, 1, 0), m)
    setSel({ ...n, x0: n.x0 + w, x1: n.x1 + w })
    return true
  }, [sel, commit])

  /** Seçimi `rep.times` kez, aralarında `rep.gap` boş sütunla sağa yineler (sığdığı kadar) */
  const repeatSel = useCallback(() => {
    if (!sel) return
    const m = mapRef.current
    const n = norm(sel)
    const w = n.x1 - n.x0 + 1 + rep.gap
    const fit = Math.floor((m[0].length - 1 - n.x1) / w)
    const times = Math.min(rep.times, fit)
    if (times < 1) {
      setNotice('Yinelemeye yer yok: önce haritayı genişlet.')
      return
    }
    commit(repeatRect(m, n, times, rep.gap), m)
    if (times < rep.times) setNotice('Haritaya sığdığı kadar yinelendi.')
  }, [sel, rep, commit])

  /** Seçili alanda sütunları ilk zeminden alta kadar doldurur */
  const groundSel = useCallback(() => {
    if (!sel) return
    commit(autoGround(mapRef.current, sel), mapRef.current)
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

  /** Dikey ayna: imleçteki parça ya da seçim (yerinde) */
  const flipV = useCallback(() => {
    if (float) {
      setFloat({ rows: flipRowsV(float.rows), ax: float.ax, ay: float.rows.length - 1 - float.ay })
      return
    }
    if (!sel) return
    const m = mapRef.current
    const n = norm(sel)
    const rows = flipRowsV(cut(m, n))
    commit(m.map((row, y) => (y < n.y0 || y > n.y1 ? row : row.slice(0, n.x0) + rows[y - n.y0] + row.slice(n.x1 + 1))), m)
  }, [float, sel, commit])

  /** Çeyrek dönüş: imleçteki parça döner; seçim yerinden kalkıp imlece döner hâlde gelir */
  const rotate = useCallback(() => {
    if (float) {
      setFloat({ rows: rotateRows(float.rows), ax: float.rows.length - 1 - float.ay, ay: float.ax })
      return
    }
    if (!sel) return
    const m = mapRef.current
    const n = norm(sel)
    const rows = rotateRows(cut(m, n))
    commit(fillRect(m, n, ' '), m)
    setSel(null)
    setFloat({ rows, ax: 0, ay: 0 })
    setTool('stamp')
    setNotice('Döndürülen parça imleçte: yerleştirmek için tıkla.')
  }, [float, sel, commit])

  /** Hızlı Deneme: baştan ya da verilen karodan (başlangıç oraya taşınır; katı karoya denk gelirse üstündeki ilk boşluğa) */
  const play = useCallback(
    (from?: Cell | null) => {
      let m = mapRef.current
      if (from) {
        let y = from.y
        const solid = (ch: string) => '#=IiX[DG><{}%p'.includes(ch)
        while (y > 0 && solid(m[y][from.x])) y--
        m = m.map((row) => row.replace('P', ' '))
        m = m.map((row, yy) => (yy === y ? row.slice(0, from.x) + 'P' + row.slice(from.x + 1) : row))
      } else if (!m.some((r) => r.includes('P'))) {
        setNotice('Önce bir başlangıç (P) koy ya da “Buradan Oyna” ile yer seç.')
        return
      }
      setPicking(false)
      setHover(null)
      setPlaying(customLevel(m, city, usedTexts))
    },
    [city, usedTexts],
  )

  // klavye: araç ve karo kısayolları, geri al / yinele, kopyala / yapıştır, çevir / döndür, deneme
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (playing) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return
      // klavyeyle odaklanmış düğme Enter ve boşlukla basılır; fareyle tıklanmış düğmede iki tuş da düzenleyicinindir
      const keyboardFocus = !!el && (el.tagName === 'BUTTON' || el.tagName === 'A') && el.matches(':focus-visible')
      if (keyboardFocus && (e.key === 'Enter' || e.key === ' ')) return
      const k = e.key.toLowerCase()
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault()
        setShowKeys((v) => !v)
        return
      }
      if (showKeys) {
        if (e.key === 'Escape') setShowKeys(false)
        return
      }
      if (e.key === ' ') {
        // boşluk basılıyken sürükleme kaydırır (odaktaki düğmeye basmasın)
        e.preventDefault()
        if (!space.current) {
          space.current = true
          setSpaceHeld(true)
        }
        return
      }
      if (e.ctrlKey || e.metaKey) {
        if (k === 'z' && !e.shiftKey) undo()
        else if (k === 'y' || (k === 'z' && e.shiftKey)) redo()
        else if (k === 'c') copySel()
        else if (k === 'd') dupSel()
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
      if (e.key === 'Enter') {
        e.preventDefault()
        play(e.shiftKey ? hover : null)
        return
      }
      if (e.key === 'Escape') {
        setPicking(false)
        setFloat(null)
        setSel(null)
        setTool((cur) => (cur === 'stamp' ? 'brush' : cur))
        return
      }
      if (e.shiftKey && (float || sel) && (k === 'h' || k === 'v' || k === 'r')) {
        e.preventDefault()
        if (k === 'h') mirror()
        else if (k === 'v') flipV()
        else rotate()
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        if (layout !== 'wide') setTab('karolar')
        window.setTimeout(() => search.current?.focus(), 0)
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
    const onUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && space.current) {
        space.current = false
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onUp)
    }
  })

  // tekerlek: Ctrl (ya da ⌘) ile imlecin altında yakınlaştır, yoksa yana kaydır (dikey taşma yoksa)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    // dokunmatik yüzeyde tek hareket onlarca olay yollar: yakınlık birikince bir kademe
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        acc += e.deltaY
        if (Math.abs(acc) < 40) return
        const r = el.getBoundingClientRect()
        zoomAt.current(acc < 0 ? 1 : -1, e.clientX - r.left)
        acc = 0
        return
      }
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollHeight <= el.clientHeight + 1) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  const zoomAt = useRef(zoom)
  zoomAt.current = zoom

  // ızgara: alt katman haritanın kendisi (oyun ya da şema görünüşü), üst katman imleç ve önizlemeler; ikisi de yalnız görünen sütunları çizer
  const shown = drag?.kind === 'move' ? drag.base : map
  const busy = drag?.kind === 'paint'
  const dprOf = (w: number) => Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / 2 / Math.max(1, w * ROWS * cell))))
  useEffect(() => {
    scene.current = new EditorScene(() => drawBase.current())
    return () => scene.current?.dispose()
  }, [])
  drawBase.current = () => {
    const cv = canvas.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look || !viewW || !scene.current) return
    const dpr = dprOf(viewW)
    const bw = Math.round(viewW * dpr)
    const bh = Math.round(ROWS * cell * dpr)
    if (cv.width !== bw) cv.width = bw
    if (cv.height !== bh) cv.height = bh
    const sx = Math.max(0, Math.min(scrollX, cols * cell - viewW))
    scene.current.draw(c, { map: shown, city, texts: usedTexts, look, mode: view, sx, viewW, cell, dpr, busy })
  }
  useEffect(() => drawBase.current(), [shown, city, usedTexts, look, view, cell, scrollX, viewW, busy])

  // Kova önizlemesi: imlecin altındaki bitişik aynı karolar (en çok 6000)
  const fillArea = useMemo(() => {
    if (tool !== 'fill' || !hover || LIMITED.has(tile)) return null
    const from = map[hover.y][hover.x]
    if (from === tile) return null
    const seen = new Set<number>()
    const stack = [hover.x, hover.y]
    while (stack.length && seen.size < 6000) {
      const y = stack.pop()!
      const x = stack.pop()!
      if (x < 0 || y < 0 || x >= cols || y >= ROWS || map[y][x] !== from || seen.has(y * cols + x)) continue
      seen.add(y * cols + x)
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
    }
    return seen
  }, [tool, hover, map, tile, cols])

  useEffect(() => {
    const cv = overlay.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look || !viewW) return
    const H = ROWS * cell
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    const bw = Math.round(viewW * dpr)
    const bh = Math.round(H * dpr)
    if (cv.width !== bw) cv.width = bw
    if (cv.height !== bh) cv.height = bh
    const sx = Math.max(0, Math.min(scrollX, cols * cell - viewW))
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, bw, bh)
    c.setTransform(dpr, 0, 0, dpr, -sx * dpr, 0)
    const x0 = Math.max(0, Math.floor(sx / cell) - 1)
    const x1 = Math.min(cols, Math.ceil((sx + viewW) / cell) + 1)
    const game = view === 'oyun'
    // ince ızgara, her 10 sütunda belirgin çizgi (oyun görünüşünde daha silik; kapatılabilir)
    if (showGrid || !game) {
      c.lineWidth = 1
      c.strokeStyle = look.cream
      for (let x = x0; x <= x1; x++) {
        c.globalAlpha = x % 10 === 0 ? (game ? 0.22 : 0.28) : game ? 0.07 : 0.08
        c.beginPath()
        c.moveTo(x * cell + 0.5, 0)
        c.lineTo(x * cell + 0.5, H)
        c.stroke()
      }
      c.globalAlpha = game ? 0.07 : 0.08
      for (let y = 0; y <= ROWS; y++) {
        c.beginPath()
        c.moveTo(sx, y * cell + 0.5)
        c.lineTo(sx + viewW, y * cell + 0.5)
        c.stroke()
      }
      c.globalAlpha = 1
    }
    // sütun numaraları: koyu zeminli küçük rozet (oyun görünüşünün gökyüzünde de okunsun)
    const fs = Math.max(11, Math.min(13, Math.round(cell * 0.5)))
    c.font = `600 ${fs}px var(--font-body), system-ui, sans-serif`
    c.textBaseline = 'middle'
    for (let x = Math.max(10, Math.ceil(x0 / 10) * 10); x < x1; x += cell < 12 ? 20 : 10) {
      const label = String(x)
      const w = c.measureText(label).width + 8
      c.fillStyle = 'rgba(14,13,34,0.62)'
      c.beginPath()
      c.roundRect(x * cell + 2, 2, w, fs + 6, 3)
      c.fill()
      c.fillStyle = look.cream
      c.fillText(label, x * cell + 6, 2 + (fs + 6) / 2 + 0.5)
    }
    const at = (wx: number) => (wx / 16) * cell
    // çözücünün yolu: kesik turkuaz çizgi, başı ve sonu yuvarlak
    const path = (pts: Array<[number, number]>, color: string, dash: number[]) => {
      if (pts.length < 2) return
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.setLineDash([])
      c.strokeStyle = 'rgba(14,13,34,0.55)'
      c.lineWidth = Math.max(3, cell * 0.22) + 2
      c.beginPath()
      pts.forEach(([x, y], i) => (i ? c.lineTo(at(x), at(y)) : c.moveTo(at(x), at(y))))
      c.stroke()
      c.strokeStyle = color
      c.lineWidth = Math.max(3, cell * 0.22)
      c.setLineDash(dash)
      c.stroke()
      c.setLineDash([])
      for (const [x, y] of [pts[0], pts[pts.length - 1]]) {
        c.fillStyle = color
        c.beginPath()
        c.arc(at(x), at(y), Math.max(4, cell * 0.26), 0, Math.PI * 2)
        c.fill()
      }
    }
    if (solveState.s === 'won' && solveState.trail.length) path(solveState.trail, '#5ad6c6', [cell * 0.5, cell * 0.35])
    // son denemenin izi ve düşülen yerler
    if (trace) {
      path(trace.path, look.gold, [2, cell * 0.4])
      for (const [x, y] of trace.falls) {
        const r = Math.max(5, cell * 0.32)
        c.strokeStyle = 'rgba(14,13,34,0.7)'
        c.lineWidth = 5
        c.beginPath()
        c.moveTo(at(x) - r, at(y) - r)
        c.lineTo(at(x) + r, at(y) + r)
        c.moveTo(at(x) + r, at(y) - r)
        c.lineTo(at(x) - r, at(y) + r)
        c.stroke()
        c.strokeStyle = '#ff9a7a'
        c.lineWidth = 2.5
        c.stroke()
      }
    }
    if (solveState.s === 'fail') {
      const fx = at(solveState.far.x) + cell / 2
      const fy = at(solveState.far.y) + cell / 2
      c.fillStyle = 'rgba(227,10,23,0.18)'
      c.beginPath()
      c.arc(fx, fy, cell * 1.6, 0, Math.PI * 2)
      c.fill()
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
    // uyarılar: sorunlu karonun üstünde altın üçgen
    for (const n of notes) {
      if (n.x < x0 - 1 || n.x > x1) continue
      const y = n.y ?? 2
      const cx = n.x * cell + cell / 2
      const top = Math.max(2, y * cell - cell * 0.95)
      const r = Math.max(8, cell * 0.42)
      c.fillStyle = look.gold
      c.strokeStyle = '#0e0d22'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(cx, top)
      c.lineTo(cx + r, top + r * 1.6)
      c.lineTo(cx - r, top + r * 1.6)
      c.closePath()
      c.fill()
      c.stroke()
      c.fillStyle = '#0e0d22'
      c.font = `800 ${Math.round(r * 1.1)}px system-ui, sans-serif`
      c.textAlign = 'center'
      c.fillText('!', cx, top + r * 1.05)
      c.textAlign = 'start'
    }
    const frame = (r: Rect, color: string, dash: boolean) => {
      const n = norm(r)
      c.strokeStyle = color
      c.lineWidth = 2
      c.setLineDash(dash ? [5, 4] : [])
      c.strokeRect(n.x0 * cell + 1, n.y0 * cell + 1, (n.x1 - n.x0 + 1) * cell - 2, (n.y1 - n.y0 + 1) * cell - 2)
      c.setLineDash([])
    }
    const d = drag
    // önizlemeler: dikdörtgen, taşınan seçim, imleçteki parça, seçim çerçevesi, fırça ve kova hayaleti
    if (d?.kind === 'rect') {
      const n = norm({ x0: d.a.x, y0: d.a.y, x1: d.b.x, y1: d.b.y })
      if (!d.erase) {
        c.globalAlpha = 0.7
        drawRows(c, Array.from({ length: n.y1 - n.y0 + 1 }, () => tile.repeat(n.x1 - n.x0 + 1)), n.x0 * cell, n.y0 * cell, cell, look, true)
        c.globalAlpha = 1
      } else {
        c.fillStyle = 'rgba(227,10,23,0.22)'
        c.fillRect(n.x0 * cell, n.y0 * cell, (n.x1 - n.x0 + 1) * cell, (n.y1 - n.y0 + 1) * cell)
      }
      frame(n, d.erase ? look.flag : look.gold, false)
      // boyut rozeti
      const label = `${n.x1 - n.x0 + 1}×${n.y1 - n.y0 + 1}`
      c.font = '600 12px system-ui, sans-serif'
      const w = c.measureText(label).width + 10
      c.fillStyle = 'rgba(14,13,34,0.85)'
      c.fillRect((n.x1 + 1) * cell - w, Math.max(0, n.y0 * cell - 20), w, 18)
      c.fillStyle = look.gold
      c.textBaseline = 'middle'
      c.fillText(label, (n.x1 + 1) * cell - w + 5, Math.max(0, n.y0 * cell - 20) + 9.5)
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
    if (sel && !d) {
      c.fillStyle = 'rgba(255,204,102,0.08)'
      const n = norm(sel)
      c.fillRect(n.x0 * cell, n.y0 * cell, (n.x1 - n.x0 + 1) * cell, (n.y1 - n.y0 + 1) * cell)
      frame(sel, look.gold, true)
    }
    if (picking && hover) {
      // "Buradan Oyna": karakterin doğacağı yer
      c.fillStyle = 'rgba(90,214,198,0.25)'
      c.fillRect(hover.x * cell, 0, cell, H)
      frame({ x0: hover.x, y0: hover.y, x1: hover.x, y1: hover.y }, '#5ad6c6', false)
    } else if (hover && float && tool === 'stamp') {
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
    } else if (hover && !d && fillArea) {
      c.fillStyle = tile === ' ' ? 'rgba(227,10,23,0.25)' : 'rgba(255,204,102,0.28)'
      for (const i of fillArea) {
        const x = i % cols
        if (x >= x0 && x <= x1) c.fillRect(x * cell, Math.floor(i / cols) * cell, cell, cell)
      }
      frame({ x0: hover.x, y0: hover.y, x1: hover.x, y1: hover.y }, look.gold, false)
    } else if (hover && !d && tool !== 'pan' && tool !== 'select' && !spaceHeld) {
      const n = tool === 'brush' && !LIMITED.has(tile) ? size : 1
      const w = Math.min(n, cols - hover.x)
      const h = Math.min(n, ROWS - hover.y)
      if (tile === ' ') {
        c.fillStyle = 'rgba(227,10,23,0.22)'
        c.fillRect(hover.x * cell, hover.y * cell, w * cell, h * cell)
      } else {
        c.globalAlpha = 0.55
        drawRows(c, Array.from({ length: h }, () => tile.repeat(w)), hover.x * cell, hover.y * cell, cell, look, false)
        c.globalAlpha = 1
      }
      c.strokeStyle = tile === ' ' ? look.flag : look.gold
      c.lineWidth = 2
      c.strokeRect(hover.x * cell + 1, hover.y * cell + 1, w * cell - 2, h * cell - 2)
    }
    if (mark) {
      // "Göster": işaretlenen sütun bir an parlar
      c.fillStyle = look.gold
      c.globalAlpha = 0.22
      c.fillRect(mark.x * cell, 0, cell, H)
      c.globalAlpha = 1
      c.strokeStyle = look.gold
      c.lineWidth = 3
      c.strokeRect(mark.x * cell - 2, mark.y * cell - 2, cell + 4, cell + 4)
    }
  }, [map, cols, cell, look, hover, tool, tile, size, solveState, scrollX, viewW, drag, sel, float, mark, view, showGrid, trace, notes, picking, fillArea, spaceHeld])

  // harita şeridi: bütün harita karo başına bir renk (haritadan bir kez), görünen bölge çerçeveli, uyarılar altın çentik
  const stripImage = useMemo(() => {
    if (!look || typeof document === 'undefined') return null
    const w = lazy[0].length
    const img = new ImageData(w, ROWS)
    const colors = thumbColors(look.city)
    const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
    const cache = new Map<string, number[]>()
    const sky = rgb(look.ink)
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < w; x++) {
        const ch = lazy[y][x]
        const hex = ch === '#' && y > 0 && lazy[y - 1][x] !== '#' ? look.city.tileTop : colors[ch]
        let v = hex && /^#[0-9a-f]{6}$/i.test(hex) ? cache.get(hex) : sky
        if (!v) cache.set(hex!, (v = rgb(hex!)))
        const i = (y * w + x) * 4
        img.data[i] = v[0]
        img.data[i + 1] = v[1]
        img.data[i + 2] = v[2]
        img.data[i + 3] = 255
      }
    const off = document.createElement('canvas')
    off.width = w
    off.height = ROWS
    off.getContext('2d')!.putImageData(img, 0, 0)
    return off
  }, [lazy, look])

  useEffect(() => {
    const cv = strip.current
    const c = cv?.getContext('2d')
    if (!cv || !c || !look || !stripImage) return
    const W = cv.clientWidth
    if (!W) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    const bw = Math.round(W * dpr)
    const bh = Math.round(ROWS * 2 * dpr)
    if (cv.width !== bw) cv.width = bw
    if (cv.height !== bh) cv.height = bh
    c.imageSmoothingEnabled = false
    c.drawImage(stripImage, 0, 0, cv.width, cv.height)
    const k = cv.width / (stripImage.width * cell)
    c.fillStyle = look.gold
    for (const n of notes) c.fillRect((n.x + 0.5) * cell * k - dpr, 0, 2 * dpr, cv.height * 0.35)
    c.fillStyle = 'rgba(14,13,34,0.45)'
    c.fillRect(0, 0, scrollX * k, cv.height)
    c.fillRect((scrollX + viewW) * k, 0, cv.width - (scrollX + viewW) * k, cv.height)
    c.strokeStyle = look.gold
    c.lineWidth = 2 * dpr
    c.strokeRect(scrollX * k + dpr, dpr, Math.max(4, viewW * k - 2 * dpr), cv.height - 2 * dpr)
  }, [stripImage, cell, look, scrollX, viewW, boxW, notes])

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
    const n = LIMITED.has(ch) ? 1 : size
    let changed = false
    const one = (x: number, y: number) => {
      if (y >= ROWS || x >= cols || d.rows[y][x] === ch) return
      // başlangıç, çıkış, pul, nazar ve anahtar tektir: yenisi konunca eskisi kalkar
      if ((SINGLES as readonly string[]).includes(ch)) for (const row of d.rows) for (let i = 0; i < row.length; i++) if (row[i] === ch) row[i] = ' '
      d.rows[y][x] = ch
      changed = true
    }
    line(d.last.x, d.last.y, to.x, to.y, (x, y) => {
      for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) one(x + dx, y + dy)
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
    // kaydırma: araçla, orta tuşla ya da boşluk basılıyken (dokunmatikte tarayıcının kendi kaydırması)
    if (tool === 'pan' || e.button === 1 || space.current) {
      if (e.pointerType === 'mouse' && scroller.current) {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragBoth({ kind: 'pan', x: e.clientX, y: e.clientY, scroll: scroller.current.scrollLeft, top: scroller.current.scrollTop })
      }
      return
    }
    if (!at) return
    e.preventDefault()
    if (picking) {
      play(at)
      return
    }
    const erase = e.button === 2
    if (e.altKey || tool === 'pick') {
      const sym = map[at.y][at.x] as Sym
      setTile(sym)
      remember(sym)
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
      if (scroller.current) {
        scroller.current.scrollLeft = d.scroll - (e.clientX - d.x)
        scroller.current.scrollTop = d.top - (e.clientY - d.y)
      }
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

  targetRef.current = target
  /** yalnız oyuncunun gerçekten yayındaki haritası güncellenir */
  const updateId = target !== null && mine.some((m) => m.id === target) ? target : null
  const titleIssue = pubTitle.trim() ? titleProblem(pubTitle) : null

  const publish = async () => {
    if (!code || solveState.s !== 'won' || titleProblem(pubTitle)) return
    setPub({ s: 'sending' })
    const updating = updateId !== null
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (author?.token) headers['x-seksek-oyuncu'] = `${author.id}.${author.token}`
      const r = await fetch(updating ? `/api/maps/${updateId}` : '/api/maps', { method: updating ? 'PUT' : 'POST', headers, body: JSON.stringify({ code, title: pubTitle, solved: true }) })
      const j = (await r.json().catch(() => ({}))) as { id?: number; error?: string }
      if (r.ok && j.id) {
        writeStore(PUBLISHED_KEY, { id: j.id })
        setTarget(j.id)
        return setPub({ s: 'done', id: j.id, updated: updating, link: `${window.location.origin}/?ozel=${code}`, copied: false })
      }
      if (r.status === 409) return setPub({ s: 'dup' })
      if (r.status === 401) setAuthor(null)
      if (updating && (r.status === 403 || r.status === 404)) {
        setTarget(null)
        return setPub({ s: 'error', msg: 'Yayındaki harita bulunamadı ya da senin değil; yeni harita olarak yayınlayabilirsin.' })
      }
      setPub({ s: 'error', msg: r.status === 503 ? 'Topluluk haritaları şu an kapalı.' : (j.error ?? 'Yayınlanamadı, biraz sonra yeniden dene.') })
    } catch {
      setPub({ s: 'error', msg: 'Yayınlanamadı, biraz sonra yeniden dene.' })
    }
  }

  const copyPublished = async () => {
    if (pub.s !== 'done') return
    let copied = false
    try {
      await navigator.clipboard.writeText(pub.link)
      copied = true
    } catch {
      copied = false
    }
    setPub({ ...pub, copied })
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

  const stats = useMemo(() => mapStats(lazy), [lazy])

  const counts = useMemo(() => {
    const n: Record<string, number> = {}
    for (const row of lazy) for (const ch of row) n[ch] = (n[ch] ?? 0) + 1
    return { c: n.C ?? 0, f: n.F ?? 0, p: n.p ?? 0, stamp: !!n.$, charm: !!n['!'], key: !!n.K }
  }, [lazy])

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
  const hoverTile = hover ? TILES.find((x) => x.sym === map[hover.y]?.[hover.x]) : null

  // ilk adımlar: karo boya, başlangıç ve çıkışı koy, dene (çözücü ya da Hızlı Deneme)
  const tested = !!won || !!trace
  const steps = [
    { done: painted, text: 'Bir karo seç ve haritaya boya' },
    { done: hasP && hasE, text: 'Başlangıç (P) ve çıkış (K) koy' },
    { done: tested, text: 'Oyna ya da Bitirilebilir mi ile dene' },
  ]
  const closeGuide = () => {
    setGuide(false)
    writeStore(GUIDE_KEY, true)
  }
  useEffect(() => {
    if (guide && painted && hasP && hasE && tested) {
      setGuide(false)
      writeStore(GUIDE_KEY, true)
    }
  }, [guide, painted, hasP, hasE, tested])

  /** Hızlı Denemeden dönüş: iz ızgarada kalır */
  const endPlay = (tr: PlayTrace) => {
    setPlaying(null)
    setTrace(tr.path.length > 1 || tr.falls.length ? tr : null)
    if (tr.done) setNotice(null)
  }

  /** Karo arama: adında ya da açıklamasında geçen (Türkçe ve İngilizce) */
  const found = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(lang === 'en' ? 'en' : 'tr')
    if (!q) return null
    const low = (x: string) => x.toLocaleLowerCase(lang === 'en' ? 'en' : 'tr')
    return TILES.filter((x) => low(x.name).includes(q) || low(t(x.name)).includes(q) || low(t(x.desc)).includes(q) || x.sym === query.trim())
  }, [query, lang, t])

  /** Haritada bir yere git ve orayı bir an işaretle */
  const goTo = (x: number, y = 19) => {
    const el = scroller.current
    if (el) el.scrollLeft = x * cell - el.clientWidth / 2
    setMark({ x: Math.max(0, Math.min(cols - 1, x)), y: Math.max(0, Math.min(ROWS - 1, y)) })
  }

  // çözücünün takıldığı yer: hangi bayraktan sonra, hangi sütun
  const stuck = useMemo(() => {
    if (solveState.s !== 'fail' || solveState.unsure) return null
    const x = Math.floor(solveState.far.x / 16)
    const y = Math.floor(solveState.far.y / 16)
    const flags = map.reduce((n, row) => n + Array.from(row.slice(0, x + 1)).filter((ch) => ch === 'F').length, 0)
    return { x, y, flags }
  }, [solveState, map])

  const hint = useMemo(() => (stuck ? stuckHint(map, stuck.x, stuck.y) : null), [stuck, map])

  // çözücü takılınca o yere kaydır (çarpı işareti ızgarada kalır)
  useEffect(() => {
    const el = scroller.current
    if (stuck && el) el.scrollLeft = stuck.x * cell - el.clientWidth / 2
  }, [stuck]) // yalnız yeni sonuçta: yakınlaştırınca yeniden kaydırmasın

  // Boss Tasarımcısı
  const boss1 = texts.boss ?? city
  const def1 = BOSSES[boss1]
  const def2 = texts.boss2 ? BOSSES[texts.boss2] : null
  const tierOf = (own: number) => Math.max(own, texts.bossTier ?? 1)
  const putBoss = (patch: Partial<CustomTexts>) => setTexts((old) => ({ ...old, ...patch }))
  const bossName = (k: CityKey) => (lang === 'en' ? BOSSES[k].nameEn : BOSSES[k].name)
  const bossOptions = LEVELS.map((l) => (
    <option key={l.city} value={l.city}>
      {bossName(l.city)} · {l.name} · {t(l.difficulty)}
    </option>
  ))

  const seg = (on: boolean) => `border-2 px-2.5 py-1 text-[13px] ${on ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`
  const field = 'border-2 border-line bg-ink px-2 py-1.5 text-[14px] text-cream'

  const tileBtn = (x: TileDef) => (
    <button
      key={x.sym}
      type="button"
      onClick={() => chooseTile(x.sym)}
      aria-pressed={tile === x.sym && paints}
      title={t(x.desc)}
      className={`group flex min-w-0 items-center gap-2 border-2 px-1.5 py-1 text-left text-[14px] transition-colors ${tile === x.sym && paints ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:border-accent hover:text-cream'}`}
    >
      <Swatch sym={x.sym} look={look} city={city} mode={view} />
      <span className="min-w-0 flex-1 truncate">{t(x.name)}</span>
      {x.key && <kbd className="hidden min-w-5 rounded-[3px] border border-line px-1 text-center text-[12px] leading-5 text-muted wide:inline">{x.key}</kbd>}
    </button>
  )

  /** Araçlar, fırça boyutu, arama, karo sekmeleri, karolar ve seçilenin açıklaması */
  const palette = (inPanel: boolean) => (
    <>
      <section aria-label={t('Araçlar')} className="grid shrink-0 grid-cols-3 gap-1 min-[480px]:grid-cols-6 wide:grid-cols-3">
        {TOOLS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => chooseTool(x.id)}
            aria-pressed={tool === x.id}
            title={`${t(x.name)} (${x.key}): ${t(x.desc)}`}
            className={`flex flex-row items-center justify-center gap-1.5 border-2 px-1 py-1.5 text-[12px] leading-tight transition-colors min-[480px]:flex-col min-[480px]:gap-0.5 min-[480px]:py-1 ${tool === x.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:border-accent hover:text-cream'}`}
          >
            <span className="text-[17px] leading-none text-cream" aria-hidden>
              {x.glyph}
            </span>
            <span className={`max-w-full truncate ${inPanel && layout === 'side' ? 'sr-only' : ''}`}>{t(x.name)}</span>
          </button>
        ))}
      </section>
      {tool === 'brush' && (
        <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted" role="group" aria-label={t('Fırça Boyutu')}>
          <span>{t('Fırça Boyutu')}</span>
          {SIZES.map((n) => (
            <button key={n} type="button" className={seg(size === n)} aria-pressed={size === n} onClick={() => setSize(n)} title={t('{n}×{n} karo boyar; sayılı karolar tek hücre.', { n })}>
              {n}×{n}
            </button>
          ))}
        </div>
      )}
      <label className="relative flex shrink-0 items-center">
        <span className="sr-only">{t('Karo Ara')}</span>
        <span className="pointer-events-none absolute left-2.5 text-[15px] text-muted" aria-hidden>
          ⌕
        </span>
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && found?.[0]) {
              chooseTile(found[0].sym)
              setQuery('')
              e.currentTarget.blur()
            } else if (e.key === 'Escape') {
              setQuery('')
              e.currentTarget.blur()
            }
          }}
          placeholder={t('Karo ara: diken, su, bayrak…')}
          className={`w-full ${field} pl-7`}
        />
        <kbd className="pointer-events-none absolute right-2 hidden rounded-[3px] border border-line px-1 text-[12px] leading-5 text-muted wide:inline" aria-hidden>
          /
        </kbd>
      </label>
      {found ? (
        <section aria-label={t('Arama Sonuçları')} className={inPanel ? 'grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-1' : 'grid min-h-0 flex-1 content-start gap-1 overflow-y-auto pr-1'}>
          {found.length ? found.map(tileBtn) : <p className="px-1 text-[14px] text-muted">{t('Bu adla karo yok. Başka bir söz dene.')}</p>}
        </section>
      ) : (
        <>
          <div role="tablist" aria-label={t('Karolar')} className="flex shrink-0 flex-wrap gap-1">
            {CATS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={cat === x.id}
                onClick={() => setCat(x.id)}
                className={`border-2 px-2 py-0.5 text-[13px] ${cat === x.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
              >
                {t(x.name)}
              </button>
            ))}
          </div>
          {cat === 'parca' && (
            <div role="group" aria-label={t('Parça Kategorisi')} className="flex shrink-0 flex-wrap gap-1">
              {([{ id: 'hepsi' as const, name: 'Hepsi' }, ...STAMP_CATS]).map((x) => (
                <button key={x.id} type="button" aria-pressed={stampCatSel === x.id} onClick={() => setStampCatSel(x.id)} className={seg(stampCatSel === x.id)}>
                  {t(x.name)}
                </button>
              ))}
            </div>
          )}
          <section
            role="tabpanel"
            aria-label={t(CATS.find((x) => x.id === cat)!.name)}
            className={inPanel ? 'grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-1' : 'grid min-h-0 flex-1 content-start gap-1 overflow-y-auto pr-1'}
          >
            {cat === 'parca'
              ? STAMPS.filter((s) => stampCatSel === 'hepsi' || stampCat(s) === stampCatSel).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseStamp(s.id)}
                    aria-pressed={float?.stamp === s.id}
                    title={t(s.desc)}
                    className={`flex min-w-0 items-center gap-2 border-2 px-1.5 py-1 text-left text-[14px] transition-colors ${float?.stamp === s.id ? 'border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:border-accent hover:text-cream'}`}
                  >
                    <Swatch rows={s.rows} look={look} city={city} mode={view} />
                    <span className="min-w-0 flex-1 truncate">{t(s.name)}</span>
                  </button>
                ))
              : TILES.filter((x) => x.cat === cat).map(tileBtn)}
          </section>
        </>
      )}
      {/* seçili araç ve karonun kısa açıklaması */}
      <div aria-live="polite" className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1 border-2 border-line bg-panel p-2.5">
        {paints && tileDef ? <Swatch sym={tileDef.sym} look={look} city={city} mode={view} px={36} /> : <span className="grid size-9 place-items-center border-2 border-line text-[18px] text-cream" aria-hidden>{tool === 'stamp' ? '⧉' : toolDef?.glyph}</span>}
        <div className="grid min-w-0 gap-0.5">
          <p className="font-display text-[15px] leading-tight text-cream">{paints && tileDef ? t(tileDef.name) : t(help.title)}</p>
          {paints && tileDef && <p className="text-[12px] text-gold">{t(help.title)}</p>}
        </div>
        <p className="col-span-2 text-[13px] leading-snug text-muted">{paints && tileDef ? t(tileDef.desc) : t(help.text)}</p>
        {tool === 'stamp' && float && layout !== 'wide' && <p className="col-span-2 text-[12px] leading-snug text-muted">{t('Dokunmatikte: bir kez dokun, parçanın yeri görünsün; aynı yere yine dokun, yerleşsin.')}</p>}
        {paints && LIMITED.has(tile) && tool !== 'brush' && <p className="col-span-2 text-[12px] text-muted">{t('Bu karo sayılı: dolgu ve dikdörtgen tek hücre koyar.')}</p>}
      </div>
    </>
  )

  const TABS: Array<{ id: Tab; name: string }> = [
    ...(layout === 'wide' ? [] : [{ id: 'karolar' as const, name: 'Karolar' }]),
    { id: 'dene', name: 'Dene' },
    { id: 'boss', name: 'Boss' },
    { id: 'metin', name: 'Metinler' },
    { id: 'harita', name: 'Harita' },
  ]

  const playBtn = (cls: string, label = true) => (
    <button type="button" className={`pixel-btn primary cta ${cls}`} onClick={() => play()} disabled={!hasP} title={hasP ? `${t('Burada, düzenleyiciden çıkmadan oyna')} (Enter)` : t('Önce bir başlangıç (P) koy.')}>
      ▶{label && <span> {t('Oyna')}</span>}
    </button>
  )
  const pickBtn = (cls: string) => (
    <button type="button" className={`pixel-btn ${cls}`} aria-pressed={picking} onClick={() => setPicking((v) => !v)} title={`${t('Haritada bir yere dokun, oradan başla')} (Shift+Enter)`}>
      ⌖ {t('Buradan Oyna')}
    </button>
  )

  const dene = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {playBtn('py-1.5 text-sm')}
        {pickBtn('py-1.5 text-sm')}
        <button type="button" className="pixel-btn py-1.5 text-sm" onClick={runSolver} disabled={!!problem || solveState.s === 'running'}>
          {t('Bitirilebilir mi?')}
        </button>
        {playHref ? (
          <Link href={playHref} className="pixel-btn py-1.5 text-sm" title={t('Haritayı oyunun kendisinde, tam ekranda aç')}>
            {t('Oyunda Aç')} ↗
          </Link>
        ) : (
          <button type="button" className="pixel-btn py-1.5 text-sm" disabled title={problem ? t(problem) : undefined}>
            {t('Oyunda Aç')} ↗
          </button>
        )}
        <button type="button" className="pixel-btn py-1.5 text-sm" onClick={doShare} disabled={!code}>
          {t('Paylaş')}
        </button>
      </div>
      {trace && (
        <div className="flex flex-wrap items-center gap-2 border-2 border-line px-2 py-1.5 text-[14px]">
          <p className="min-w-0 flex-1 text-cream">
            {trace.done
              ? t('Son deneme: {time}, {n} düşüş. Yolun ızgarada altın çizgiyle görünüyor.', { time: formatTime(trace.done.ms), n: trace.done.deaths })
              : trace.falls.length
                ? t('Son deneme yarıda kaldı: {n} düşüş. Düştüğün yerler ızgarada çarpıyla işaretli.', { n: trace.falls.length })
                : t('Son deneme yarıda kaldı. Yolun ızgarada altın çizgiyle görünüyor.')}
          </p>
          <button type="button" className="pixel-btn shrink-0 px-2 py-0.5 text-[13px]" onClick={() => setTrace(null)}>
            {t('İzi Temizle')}
          </button>
        </div>
      )}
      <div aria-live="polite" className="grid gap-1.5 text-[14px]">
        {problem && (
          <p className="border-2 border-flag/60 px-2 py-1.5 text-accent-2">
            <span className="font-display text-cream">{t('Önce bunu düzelt:')}</span> {t(problem)}
          </p>
        )}
        {!problem && solveState.s === 'running' && <p className="text-muted">{t('Çözücü deniyor…')}</p>}
        {!problem && won && (
          <>
            <p className="text-gold">{t('Bitirilebilir ✓ (çözücünün yolu ~{s} sn)', { s: won.seconds.toFixed(1) })}</p>
            <p className="text-[13px] text-muted">{t('Çözücünün bulduğu yol ızgarada turkuaz kesik çizgiyle görünüyor.')}</p>
            {(won.items[1] > 0 || won.stamp !== null || won.charm !== null) && (
              <p className="text-[13px] text-muted">
                {t('Çözücünün alabildikleri:')}{' '}
                {[won.items[1] > 0 ? `${t('Hatıra')} ${won.items[0]}/${won.items[1]}` : '', won.stamp === null ? '' : t(won.stamp ? 'Pul ✓' : 'Pul ✗'), won.charm === null ? '' : t(won.charm ? 'Nazar ✓' : 'Nazar ✗')]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </>
        )}
        {!problem && solveState.s === 'fail' && (
          <div className="flex flex-wrap items-center gap-2 text-accent-2">
            <p className="min-w-0 flex-1">
              {solveState.unsure
                ? t('Emin olunamadı: çözücü süresini doldurdu. Haritayı sadeleştirip yeniden dene.')
                : stuck && stuck.flags > 0
                  ? t('Çözücü bitiremedi: {n}. bayraktan sonra, {x}. sütun dolayında takıldı. Orayı işaretledim.', { n: stuck.flags, x: stuck.x })
                  : t('Çözücü bitiremedi: başlangıçtan sonra, {x}. sütun dolayında takıldı. Orayı işaretledim.', { x: stuck?.x ?? 0 })}
            </p>
            {stuck && (
              <button type="button" className="pixel-btn px-2.5 py-1 text-[13px]" onClick={() => goTo(stuck.x, stuck.y)}>
                {t('Göster')}
              </button>
            )}
            {hint && (
              <p className="basis-full text-[13px] leading-snug text-cream">
                <span className="font-display text-gold">{t('Çözücü Önerisi:')}</span> {t(hint.text, hint.vars)}
              </p>
            )}
          </div>
        )}
        {!problem && solveState.s === 'error' && <p className="text-accent-2">{t('Çözücü çalışamadı.')}</p>}
        {!problem && solveState.s === 'idle' && <p className="text-[13px] text-muted">{t('Çözücü düşmanları, okları ve boss’u saymaz, yalnız çıkışa giden yolu arar.')}</p>}
      </div>
      {notes.length > 0 && (
        <section className="grid gap-1.5" aria-label={t('Uyarılar')}>
          <h2 className="font-display text-[16px] text-cream">{t('Uyarılar')}</h2>
          <ul className="grid gap-1.5">
            {notes.map((n, k) => (
              <li key={k} className="flex items-start gap-2 border-2 border-line px-2 py-1.5 text-[13px] leading-snug text-cream">
                <span className="min-w-0 flex-1">{t(n.text, n.vars)}</span>
                <button type="button" className="pixel-btn shrink-0 px-2 py-0.5 text-[12px]" onClick={() => goTo(n.x)}>
                  {t('Göster')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-[13px] text-muted">
        {t('Hatıra {c}/3 · Bayrak {f} · Sandık {p}/2', { c: counts.c, f: counts.f, p: counts.p })}
        {counts.stamp ? ` · ${t('Pul')}` : ''}
        {counts.charm ? ` · ${t('Nazar')}` : ''}
        {counts.key ? ` · ${t('Anahtar')}` : ''}
      </p>
      <section aria-label={t('Harita İstatistiği')} className="grid gap-1 border-2 border-line p-2 text-[13px]">
        <h2 className="font-display text-[15px] text-cream">{t('Harita İstatistiği')}</h2>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted">
          {[
            [t('Genişlik'), t('{n} Sütun', { n: stats.width })],
            [t('Tehlike'), `${stats.hazards} (${t('{a} diken · {b} çukur · {c} düşman · {d} tuzak', { a: stats.spikes, b: stats.pits, c: stats.enemies, d: stats.traps })})`],
            [t('Hareketli Parça'), String(stats.movers)],
            [t('Tabela · Kişi'), `${stats.signs} · ${stats.npcs}`],
            [t('Boss'), stats.boss ? t('Var') : t('Yok')],
            [t('Tahmini Süre'), won ? t('~{s} sn (çözücü)', { s: won.seconds.toFixed(0) }) : t('Bitirilebilir mi? ile ölç')],
          ].map(([k, v]) => (
            <div key={k} className="col-span-2 flex items-baseline justify-between gap-2">
              <dt>{k}</dt>
              <dd className="text-right text-cream">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      {share && (
        <div className="grid gap-1">
          <p className="text-[13px] text-muted">{share.copied ? t('Bağlantı panoya kopyalandı.') : t('Bağlantıyı seçip kopyala:')}</p>
          <input readOnly value={share.url} onFocus={(e) => e.currentTarget.select()} className={`w-full ${field} text-[13px]`} aria-label={t('Paylaşım Bağlantısı')} />
        </div>
      )}
      {!problem && won && (
        <div className="grid gap-2 border-t-2 border-line pt-3">
          <h2 className="font-display text-[18px] text-cream">{t('Topluluğa Yayınla')}</h2>
          {pub.s === 'done' ? (
            <div className="grid gap-2 border-2 border-line p-2.5">
              <p className="text-[14px] text-gold">{pub.updated ? t('Güncellendi! Aynı bağlantı yeni haritayı gösteriyor.') : t('Yayınlandı! Haritan artık galeride.')}</p>
              <input readOnly value={pub.link} onFocus={(e) => e.currentTarget.select()} className={`w-full ${field} text-[13px]`} aria-label={t('Paylaşım Bağlantısı')} />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="pixel-btn primary px-3 py-1.5 text-sm" onClick={() => void copyPublished()}>
                  {pub.copied ? t('Kopyalandı ✓') : t('Bağlantıyı Kopyala')}
                </button>
                <Link href="/haritalar" className="text-[14px] text-cream underline underline-offset-4">
                  {t('Topluluk Haritaları')} →
                </Link>
              </div>
            </div>
          ) : pub.s === 'dup' ? (
            <p className="text-[14px] text-gold">
              {t('Bu harita zaten yayında.')}{' '}
              <Link href="/haritalar" className="text-cream underline underline-offset-4">
                {t('Topluluk Haritaları')} →
              </Link>
            </p>
          ) : author === null ? (
            <div className="grid gap-2">
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
              {mine.length > 0 && (
                <label className="grid gap-1 text-[13px] text-muted">
                  {t('Yayın Türü')}
                  <select
                    value={updateId ?? ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null
                      setTarget(id)
                      const hit = mine.find((m) => m.id === id)
                      if (hit && !pubTitle.trim()) setPubTitle(hit.title)
                    }}
                    className={`min-w-0 ${field}`}
                  >
                    <option value="">{t('Yeni harita olarak yayınla')}</option>
                    {mine.map((m) => (
                      <option key={m.id} value={m.id}>
                        {t('Yayındakini güncelle: {title}', { title: m.title })}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} maxLength={TITLE_MAX} placeholder={t('Haritanın adı (3–40 karakter)')} className={`min-w-0 ${field}`} aria-label={t('Harita Başlığı')} />
              <button type="submit" className="pixel-btn primary py-1.5 text-sm" disabled={!author || pub.s === 'sending' || !!titleProblem(pubTitle)}>
                {pub.s === 'sending' ? (updateId !== null ? t('Güncelleniyor…') : t('Yayınlanıyor…')) : updateId !== null ? t('Yayındakini Güncelle') : t('Topluluğa Yayınla')}
              </button>
              <p className="text-[13px] text-muted">{author ? t('{name} adıyla yayınlanır; herkes galeride görüp oynayabilir.', { name: author.name }) : t('Oturum denetleniyor…')}</p>
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
    </>
  )

  const bossTab = (
    <>
      <h2 className="font-display text-[18px] text-cream">{t('Boss Tasarımcısı')}</h2>
      <p className="text-[13px] leading-snug text-muted">{t('Kural her boss’ta aynı: işaret, saldırı, yorgunluk, üstüne bas. Sen boss’u, eşini, kademesini, hızını ve canını seçersin.')}</p>
      {!hasBoss && (
        <div className="grid gap-2 border-2 border-line p-2.5">
          <p className="text-[14px] text-cream">{t('Haritada henüz boss yok. Boss Arenası parçasını koy ya da Düşman sekmesinden Boss (Q) karosunu yerleştir. Seçimin şimdiden saklanır.')}</p>
          <button
            type="button"
            className="pixel-btn justify-self-start py-1 text-[13px]"
            onClick={() => {
              chooseStamp('arena')
              if (layout !== 'wide') setTab('karolar')
              setCat('parca')
            }}
          >
            ＋ {t('Boss Arenası Koy')}
          </button>
        </div>
      )}
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
        <BossFigure city={boss1} className="h-20 w-[5.5rem] border-2 border-line bg-panel-2" />
        <label className="grid min-w-0 gap-1 text-[13px] text-cream">
          <span>{t('Boss')}</span>
          <select value={boss1} onChange={(e) => putBoss({ boss: e.target.value as CityKey })} className={`w-full min-w-0 ${field}`}>
            {bossOptions}
          </select>
          <span className="text-[12px] text-muted">{t('Can {hp} · Kademe {tier}', { hp: def1.hp + (texts.bossHp ?? 0), tier: tierOf(def1.tier) })}</span>
        </label>
      </div>
      <p className="text-[12px] leading-snug text-muted">{lang === 'en' ? def1.tauntEn : def1.taunt}</p>
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
        {def2 && texts.boss2 ? <BossFigure city={texts.boss2} className="h-20 w-[5.5rem] border-2 border-line bg-panel-2" /> : <div className="grid h-20 place-items-center border-2 border-dashed border-line text-[12px] text-muted">{t('Eş Yok')}</div>}
        <label className="grid min-w-0 gap-1 text-[13px] text-cream">
          <span>{t('İkinci Boss')}</span>
          <select value={texts.boss2 ?? ''} onChange={(e) => putBoss({ boss2: (e.target.value || undefined) as CityKey | undefined })} className={`w-full min-w-0 ${field}`}>
            <option value="">{t('Yok: tek boss')}</option>
            {bossOptions}
          </select>
          <span className="text-[12px] text-muted">{def2 ? t('Arenanın öbür ucundan katılır; kapı ikisi de düşünce açılır.') : t('İstersen arenaya ikinci bir boss kat.')}</span>
        </label>
      </div>
      <fieldset className="grid gap-1.5">
        <legend className="text-[13px] text-cream">{t('Kademe')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {([undefined, 2, 3] as const).map((v) => (
            <button key={v ?? 0} type="button" className={seg(texts.bossTier === v)} aria-pressed={texts.bossTier === v} onClick={() => putBoss({ bossTier: v })}>
              {v ? t('En Az {n}', { n: v }) : t('Kendi')}
            </button>
          ))}
        </div>
        <p className="text-[12px] leading-snug text-muted">{t('Kademe 2 öngörülü nişan alır ve dört kez sıçrar; kademe 3 şok dalgası yollar, iki kez dalar, sahte kabarır.')}</p>
      </fieldset>
      <fieldset className="grid gap-1.5">
        <legend className="text-[13px] text-cream">{t('Hız')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {BOSS_SPEEDS.map((v) => (
            <button key={v} type="button" className={seg((texts.bossSpeed ?? 100) === v)} aria-pressed={(texts.bossSpeed ?? 100) === v} onClick={() => putBoss({ bossSpeed: v === 100 ? undefined : v })}>
              {t(SPEED_NAMES[v])} <span className="text-muted">%{v}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-1.5">
        <legend className="text-[13px] text-cream">{t('Fazladan Can')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: BOSS_HP_MAX + 1 }, (_, v) => (
            <button key={v} type="button" className={seg((texts.bossHp ?? 0) === v)} aria-pressed={(texts.bossHp ?? 0) === v} onClick={() => putBoss({ bossHp: v || undefined })}>
              +{v}
            </button>
          ))}
        </div>
      </fieldset>
      {(texts.boss || texts.boss2 || texts.bossTier || texts.bossSpeed || texts.bossHp) && (
        <button type="button" className="pixel-btn justify-self-start py-1 text-[13px]" onClick={() => putBoss({ boss: undefined, boss2: undefined, bossTier: undefined, bossSpeed: undefined, bossHp: undefined })}>
          {t('Varsayılana Dön')}
        </button>
      )}
    </>
  )

  const metinTab = (
    <>
      <h2 className="font-display text-[18px] text-cream">{t('Harita')}</h2>
      <label className="grid gap-1 text-[13px] text-cream">
        <span>{t('Haritanın Adı')}</span>
        <input value={texts.title ?? ''} maxLength={MAP_TITLE_MAX} placeholder={t('“Rüzgârlı Köprü”')} onChange={(e) => setTexts((old) => ({ ...old, title: e.target.value }))} className={`w-full ${field}`} />
      </label>
      <label className="grid gap-1 text-[13px] text-cream">
        <span>{t('Kısa Açıklama')}</span>
        <textarea value={texts.desc ?? ''} maxLength={MAP_DESC_MAX} rows={2} placeholder={t('Oyunun başında görünür: haritayı bir cümleyle anlat.')} onChange={(e) => setTexts((old) => ({ ...old, desc: e.target.value }))} className={`w-full resize-y ${field}`} />
      </label>
      <h2 className="font-display text-[18px] text-cream">{t('Metinler')}</h2>
      {signCount === 0 && npcCount === 0 ? (
        <p className="text-[14px] text-muted">{t('Haritaya tabela (?) ya da şehir insanı (n) koyunca sözleri burada yazılır. İkisi de Nesne sekmesinde.')}</p>
      ) : (
        <p className="text-[13px] text-muted">{t('Tabelalar ve şehir insanları haritada soldan sağa sıralanır. Yazdığın söz oyunda başlarının üstünde baloncukta görünür.')}</p>
      )}
      {usedTexts.signs.map((sgn, k) => (
        <label key={`s${k}`} className="grid gap-1 text-[13px] text-cream">
          <span>{t('Tabela {n}', { n: k + 1 })}</span>
          <input
            value={sgn}
            maxLength={SIGN_MAX}
            placeholder={t('Ne yapılacağını kısaca yaz: “Duvara tutun, yukarı sek.”')}
            onChange={(e) => setTexts((old) => ({ ...old, signs: Array.from({ length: Math.max(old.signs.length, k + 1) }, (_, i) => (i === k ? e.target.value : (old.signs[i] ?? ''))) }))}
            className={`w-full ${field}`}
          />
          <select
            value=""
            aria-label={t('Hazır Öneri')}
            onChange={(e) => {
              const v = e.target.value
              if (v) setTexts((old) => ({ ...old, signs: Array.from({ length: Math.max(old.signs.length, k + 1) }, (_, i) => (i === k ? v : (old.signs[i] ?? ''))) }))
            }}
            className={`w-full ${field} py-1 text-[13px] text-muted`}
          >
            <option value="">{t('Hazır Öneri Seç…')}</option>
            {SIGN_TIPS.map((x) => (
              <option key={x} value={x}>
                {t(x)}
              </option>
            ))}
          </select>
        </label>
      ))}
      {usedTexts.npcs.map((npc, k) => {
        const put = (patch: Partial<CustomTexts['npcs'][number]>) =>
          setTexts((old) => ({ ...old, npcs: Array.from({ length: Math.max(old.npcs.length, k + 1) }, (_, i) => (i === k ? { ...usedTexts.npcs[k], ...patch } : (old.npcs[i] ?? usedTexts.npcs[i] ?? { name: '', text: '', look: 'amca' }))) }))
        return (
          <fieldset key={`n${k}`} className="grid gap-1.5 border-2 border-line p-2">
            <legend className="px-1 text-[13px] text-cream">{t('Şehir İnsanı {n}', { n: k + 1 })}</legend>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input value={npc.name} maxLength={NPC_NAME_MAX} placeholder={t('Adı: “Simitçi Hasan Amca”')} onChange={(e) => put({ name: e.target.value })} className={`min-w-0 ${field}`} aria-label={t('Adı')} />
              <select value={npc.look} onChange={(e) => put({ look: e.target.value as CustomTexts['npcs'][number]['look'] })} className={field} aria-label={t('Kılığı')}>
                {NPC_LOOKS.map((l) => (
                  <option key={l} value={l}>
                    {t({ amca: 'Amca', teyze: 'Teyze', usta: 'Usta', genc: 'Genç', coban: 'Çoban', ozan: 'Ozan' }[l])}
                  </option>
                ))}
              </select>
            </div>
            <select
              value=""
              aria-label={t('Hazır Öneri')}
              onChange={(e) => {
                const tip = NPC_TIPS[Number(e.target.value)]
                if (tip) put({ name: tip[0], text: tip[1], look: tip[2] })
              }}
              className={`w-full ${field} py-1 text-[13px] text-muted`}
            >
              <option value="">{t('Hazır Öneri Seç…')}</option>
              {NPC_TIPS.map((x, i) => (
                <option key={x[0]} value={i}>
                  {t(x[0])}
                </option>
              ))}
            </select>
            <textarea value={npc.text} maxLength={NPC_TEXT_MAX} rows={2} placeholder={t('Sözü: şehri anlat, saklı köşeyi üstü kapalı fısılda.')} onChange={(e) => put({ text: e.target.value })} className={`w-full resize-y ${field}`} aria-label={t('Sözü')} />
          </fieldset>
        )
      })}
    </>
  )

  const openWizard = () => setWiz((w) => w ?? { step: 0, city, template: 'flat', width: 0, boss: false })
  const wizTpl = wiz ? (TEMPLATES.find((x) => x.id === wiz.template) ?? TEMPLATES[0]) : TEMPLATES[0]
  const wizTplWidth = useMemo(() => wizTpl.make()[0].length, [wizTpl])
  const wizBuild = () => {
    if (!wiz) return
    const next = wizardMap({ template: wiz.template, width: wiz.width, boss: wiz.boss })
    setCity(wiz.city)
    newMap(() => next)
    setWiz(null)
    setNotice('Harita kuruldu: geri al ile eski haline dönebilirsin.')
  }
  const WIZ_STEPS = ['Şehir', 'Şablon', 'Boyut', 'Boss']

  const wizard = wiz && (
    <section aria-label={t('Yeni Harita Sihirbazı')} className="grid gap-2 border-2 border-accent bg-panel-2 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[17px] text-cream">{t('Yeni Harita Sihirbazı')}</h2>
        <button type="button" className="grid size-8 place-items-center text-[18px] text-muted hover:text-cream" onClick={() => setWiz(null)} aria-label={t('Sihirbazı Kapat')}>
          ×
        </button>
      </div>
      <ol className="flex gap-1 text-[12px]" aria-label={t('Adımlar')}>
        {WIZ_STEPS.map((n, k) => (
          <li key={n} aria-current={wiz.step === k ? 'step' : undefined} className={`flex-1 border-b-4 pb-0.5 text-center ${wiz.step === k ? 'border-gold text-cream' : k < wiz.step ? 'border-teal text-muted' : 'border-line text-muted'}`}>
            {k + 1}. {t(n)}
          </li>
        ))}
      </ol>
      {wiz.step === 0 && (
        <>
          <p className="text-[13px] text-muted">{t('Haritanın görünüşü, müziği ve boss’un varsayılanı bu şehirden gelir.')}</p>
          <div className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto pr-1">
            {LEVELS.map((l) => (
              <button key={l.id} type="button" aria-pressed={wiz.city === l.city} onClick={() => setWiz({ ...wiz, city: l.city })} className={`flex items-center gap-1.5 border-2 px-1.5 py-1 text-left text-[13px] ${wiz.city === l.city ? 'border-gold bg-panel text-cream' : 'border-line text-muted hover:text-cream'}`}>
                <span className="size-3 shrink-0 rounded-full border border-line" style={{ background: CITY[l.city]?.sky?.[1] ?? '#555' }} aria-hidden />
                <span className="truncate">{l.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {wiz.step === 1 && (
        <div className="grid max-h-52 gap-1 overflow-y-auto pr-1">
          {TEMPLATES.map((tp) => (
            <button key={tp.id} type="button" aria-pressed={wiz.template === tp.id} onClick={() => setWiz({ ...wiz, template: tp.id })} className={`border-2 px-2 py-1 text-left ${wiz.template === tp.id ? 'border-gold bg-panel' : 'border-line hover:border-accent'}`}>
              <span className="block text-[14px] text-cream">{t(tp.name)}</span>
              <span className="block text-[12px] leading-snug text-muted">{t(tp.desc)}</span>
            </button>
          ))}
        </div>
      )}
      {wiz.step === 2 && (
        <>
          <p className="text-[13px] text-muted">{t('Şablon {n} sütun. Daha uzun seçersen yol sağa düz zeminle uzar, aralara bayrak konur, çıkış sona taşınır.', { n: wizTplWidth })}</p>
          <div className="flex flex-wrap gap-1.5">
            {WIZ_WIDTHS.filter((v) => v === 0 || v > wizTplWidth).map((v) => (
              <button key={v} type="button" className={seg(wiz.width === v)} aria-pressed={wiz.width === v} onClick={() => setWiz({ ...wiz, width: v })}>
                {v === 0 ? t('Kendi Boyu') : t('{n} Sütun', { n: v })}
              </button>
            ))}
          </div>
        </>
      )}
      {wiz.step === 3 && (
        <>
          <p className="text-[13px] text-muted">{t('İstersen yolun sonuna boss arenası eklenir: tabela, bayrak, kale duvarları, boss, kapı ve yeni çıkış.')}</p>
          <div className="flex gap-1.5">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" className={seg(wiz.boss === v)} aria-pressed={wiz.boss === v} onClick={() => setWiz({ ...wiz, boss: v })}>
                {v ? t('Boss Var') : t('Boss Yok')}
              </button>
            ))}
          </div>
          <p className="border-2 border-line px-2 py-1 text-[13px] text-cream">
            {t('{city} · {tpl} · {w} · {boss}', { city: LEVELS.find((l) => l.city === wiz.city)?.name ?? '', tpl: t(wizTpl.name), w: wiz.width ? t('{n} Sütun', { n: wiz.width }) : t('Kendi Boyu'), boss: wiz.boss ? t('Boss Var') : t('Boss Yok') })}
          </p>
        </>
      )}
      <div className="flex justify-between gap-2">
        <button type="button" className="pixel-btn px-3 py-1 text-[13px]" disabled={wiz.step === 0} onClick={() => setWiz({ ...wiz, step: (wiz.step - 1) as Wizard['step'] })}>
          ← {t('Geri')}
        </button>
        {wiz.step < 3 ? (
          <button type="button" className="pixel-btn primary px-3 py-1 text-[13px]" onClick={() => setWiz({ ...wiz, step: (wiz.step + 1) as Wizard['step'] })}>
            {t('İleri')} →
          </button>
        ) : (
          <button type="button" className="pixel-btn primary px-3 py-1 text-[13px]" onClick={wizBuild}>
            {t('Haritayı Kur')}
          </button>
        )}
      </div>
    </section>
  )

  const haritaTab = (
    <>
      <h2 className="font-display text-[18px] text-cream">{t('Yeni Harita')}</h2>
      <p className="text-[13px] text-muted">{t('Bir başlangıç seç. Şimdiki harita geri al ile döner; saklamak istersen önce taslak olarak kaydet.')}</p>
      {wizard ?? (
        <button type="button" className="pixel-btn primary justify-self-start py-1.5 text-sm" onClick={openWizard}>
          ✦ {t('Sihirbazla Başla')}
        </button>
      )}
      <details className="border-2 border-line">
        <summary className="cursor-pointer px-2 py-1.5 font-display text-[15px] text-cream">{t('Hazır Şablonlar ({n})', { n: TEMPLATES.length })}</summary>
        <div className="grid gap-1.5 p-1.5">
          {TEMPLATES.map((tp) => (
            <button key={tp.id} type="button" onClick={() => newMap(tp.make)} className="border-2 border-line bg-panel-2 px-2.5 py-1.5 text-left hover:border-gold">
              <span className="block font-display text-[15px] text-cream">{t(tp.name)}</span>
              <span className="block text-[13px] leading-snug text-muted">{t(tp.desc)}</span>
            </button>
          ))}
        </div>
      </details>
      <h2 className="font-display text-[18px] text-cream">{t('Görünüş Şehri')}</h2>
      <p className="text-[13px] text-muted">{t('Gökyüzü, zemin, canlılar ve müzik seçtiğin şehirden gelir. Haritanın içeriği değişmez.')}</p>
      <div className="grid grid-cols-2 gap-1">
        {LEVELS.map((l) => (
          <button key={l.id} type="button" aria-pressed={city === l.city} onClick={() => setCity(l.city)} className={`flex items-center gap-1.5 border-2 px-1.5 py-1 text-left text-[13px] ${city === l.city ? 'border-gold bg-panel-2 text-cream' : 'border-line text-muted hover:text-cream'}`}>
            <span className="size-3 shrink-0 rounded-full border border-line" style={{ background: CITY[l.city]?.sky?.[1] ?? '#555' }} aria-hidden />
            <span className="truncate">{l.name}</span>
          </button>
        ))}
      </div>
      <h2 className="font-display text-[18px] text-cream">{t('Harita Boyutu')}</h2>
      <div className="flex flex-wrap items-center gap-1.5">
        {WIDTH_PRESETS.map((v) => (
          <button key={v} type="button" className={seg(cols === v)} aria-pressed={cols === v} onClick={() => resizeTo(v)}>
            {v}
          </button>
        ))}
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(widthInput)
            if (Number.isInteger(n)) resizeTo(n)
            setWidthInput('')
          }}
        >
          <input value={widthInput} onChange={(e) => setWidthInput(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder={String(cols)} className={`w-16 ${field} py-1`} aria-label={t('Sütun Sayısı')} />
          <button type="submit" className="pixel-btn px-2.5 py-1 text-[13px]" disabled={!widthInput}>
            {t('Uygula')}
          </button>
        </form>
      </div>
      <p className="text-[12px] leading-snug text-muted">{t('{min}–{max} sütun. Küçültünce sağdan kesilir, büyütünce zemin uzar.', { min: MIN_W, max: MAX_W })}</p>
      <h2 className="font-display text-[18px] text-cream">{t('Yineleme')}</h2>
      <p className="text-[12px] leading-snug text-muted">{t('Seçim aracıyla bir alan seç; Ctrl+D hemen sağına kopyalar, Yinele bu ayarla art arda dizer.')}</p>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-cream">
        <label className="flex items-center gap-1.5">
          {t('Kopya')}
          <input type="number" min={1} max={20} value={rep.times} onChange={(e) => setRep((r) => ({ ...r, times: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))} className={`w-14 ${field} py-1`} />
        </label>
        <label className="flex items-center gap-1.5">
          {t('Boşluk')}
          <input type="number" min={0} max={20} value={rep.gap} onChange={(e) => setRep((r) => ({ ...r, gap: Math.max(0, Math.min(20, Number(e.target.value) || 0)) }))} className={`w-14 ${field} py-1`} />
        </label>
      </div>
      <h2 className="font-display text-[18px] text-cream">{t('Taslaklar')}</h2>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          saveDraft()
        }}
      >
        <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={40} placeholder={t('Taslak adı')} className={`min-w-0 flex-1 ${field}`} aria-label={t('Taslak Adı')} />
        <button type="submit" className="pixel-btn py-1.5 text-sm">
          {t('Taslağı Kaydet')}
        </button>
      </form>
      {drafts.length === 0 ? (
        <p className="text-[14px] text-muted">{t('Henüz taslak yok. Kaydettiklerin bu cihazda saklanır.')}</p>
      ) : (
        <ul className="grid gap-1.5">
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
      <h2 className="font-display text-[18px] text-cream">{t('Kısayollar')}</h2>
      <p className="text-[14px] leading-snug text-muted">{t('Sol tık boyar, sağ tık siler, Alt+tık karoyu seçer. Bütün kısayollar için ? tuşuna bas.')}</p>
      <button type="button" className="pixel-btn justify-self-start py-1 text-[14px]" onClick={() => setShowKeys(true)}>
        {t('Kısayolları Göster')}
      </button>
    </>
  )

  const btn = 'pixel-btn shrink-0 px-2.5 py-1 text-sm'
  const sep = <span className="h-5 w-px shrink-0 bg-gradient-to-b from-transparent via-line to-transparent" aria-hidden />

  const play$ = playing && <EditorPlay level={playing} onExit={endPlay} />

  const guideCard = guide && !playing && (
    <aside aria-label={t('İlk Adımlar')} className="absolute left-2 top-9 z-10 grid w-[min(18rem,calc(100%-1rem))] gap-2 border-2 border-accent bg-panel/95 p-3 shadow-[0_6px_0_#0e0d22]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[17px] text-cream">{t('İlk Adımlar')}</h2>
        <button type="button" className="grid size-8 place-items-center text-[18px] text-muted hover:text-cream" onClick={closeGuide} aria-label={t('Rehberi Kapat')}>
          ×
        </button>
      </div>
      <ol className="grid gap-1.5">
        {steps.map((st, k) => (
          <li key={k} className={`flex items-start gap-2 text-[14px] leading-snug ${st.done ? 'text-muted line-through decoration-1' : 'text-cream'}`}>
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold ${st.done ? 'border-teal bg-teal text-ink' : 'border-gold text-gold'}`} aria-hidden>
              {st.done ? '✓' : k + 1}
            </span>
            <span>{t(st.text)}</span>
          </li>
        ))}
      </ol>
      <p className="hidden text-[12px] leading-snug text-muted wide:block">{t('Hızlı yol: Sihirbaz şehri, şablonu, boyutu ve boss’u sorup haritayı kurar. Parçalar sekmesinde {n} hazır parça var.', { n: STAMPS.length })}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className="pixel-btn px-2 py-0.5 text-[13px]"
          onClick={() => {
            setTab('harita')
            openWizard()
          }}
        >
          ✦ {t('Sihirbazla Başla')}
        </button>
        {!(hasP && hasE) ? (
          <>
            <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => chooseTile('P')}>
              {t('Başlangıç Seç')}
            </button>
            <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => chooseTile('E')}>
              {t('Çıkış Seç')}
            </button>
          </>
        ) : (
          !tested && playBtn('px-2.5 py-0.5 text-[13px]')
        )}
      </div>
    </aside>
  )

  const keysCard = showKeys && (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/75 p-3" onClick={() => setShowKeys(false)}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('Kısayollar')}
        className="grid max-h-[calc(100dvh-1.5rem)] w-[min(54rem,100%)] grid-rows-[auto_minmax(0,1fr)] border-2 border-line bg-panel shadow-[0_8px_0_#0e0d22]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-2 border-b-2 border-line px-4 py-2.5">
          <h2 className="font-display text-[20px] text-cream">{t('Kısayollar')}</h2>
          <button type="button" className="pixel-btn back-btn px-2.5 py-1 text-[14px]" onClick={() => setShowKeys(false)} data-back autoFocus>
            {t('Kapat')}
          </button>
        </header>
        <div className="grid content-start gap-4 overflow-y-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KEY_GROUPS.map((g) => (
              <section key={g.title} className="grid content-start gap-1.5">
                <h3 className="font-display text-[15px] text-gold">{t(g.title)}</h3>
                <dl className="grid gap-1">
                  {g.rows.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 text-[14px]">
                      <dt className="shrink-0">
                        <kbd className="rounded-[3px] border border-line bg-panel-2 px-1.5 text-[13px] text-cream">{t(k)}</kbd>
                      </dt>
                      <dd className="text-right text-muted">{t(v)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
          <section className="grid gap-1.5">
            <h3 className="font-display text-[15px] text-gold">{t('Araçlar ve Karolar')}</h3>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-1">
              {TOOLS.map((x) => (
                <li key={x.id} className="flex items-center gap-2 border-2 border-line px-1.5 py-1 text-[14px] text-cream">
                  <kbd className="min-w-6 rounded-[3px] border border-line bg-panel-2 text-center text-[13px]">{x.key}</kbd>
                  <span aria-hidden className="w-[26px] text-center text-[16px]">
                    {x.glyph}
                  </span>
                  <span className="min-w-0 truncate">{t(x.name)}</span>
                </li>
              ))}
              {TILES.filter((x) => x.key).map((x) => (
                <li key={x.sym} className="flex items-center gap-2 border-2 border-line px-1.5 py-1 text-[14px] text-cream">
                  <kbd className="min-w-6 rounded-[3px] border border-line bg-panel-2 text-center text-[13px]">{x.key}</kbd>
                  <Swatch sym={x.sym} look={look} city={city} mode={view} />
                  <span className="min-w-0 truncate">{t(x.name)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  )

  return (
    <div className="ed-shell flex h-dvh flex-col overflow-hidden text-cream">
      {/* üst çubuk: geri, amblem + başlık, harita araçları (dar ekranda yana kayar), dene ve oyna */}
      <header className="ed-top flex shrink-0 items-center gap-2 px-2 py-1.5">
        <Link href="/" className="pixel-btn back-btn shrink-0 px-2.5 py-1 text-sm" aria-label={t('Oyuna Dön')}>
          ← <span className="hidden wide:inline">{t('Oyuna Dön')}</span>
        </Link>
        <span className="hidden shrink-0 items-center gap-2 sm:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-emblem.png" width={30} height={30} alt="" className="drop-shadow-[0_2px_0_#0e0d22]" />
          <h1 className="hidden font-display text-xl leading-none text-cream [text-shadow:0_2px_0_#0e0d22] 2xl:block">{t('Bölüm Düzenleyici')}</h1>
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
          <button type="button" className={btn} onClick={() => {
              setTab('harita')
              openWizard()
            }}
            title={t('Şablonlar ve taslaklar')}
            aria-label={t('Yeni Harita')}
          >
            ＋ <span className="max-sm:hidden">{t('Yeni Harita')}</span>
          </button>
          <select value={city} onChange={(e) => setCity(e.target.value as CityKey)} className="shrink-0 border-2 border-line bg-panel-2 px-1.5 py-1 text-[14px] text-cream" aria-label={t('Şehir')} title={t('Şehir: görünüş, müzik ve boss’un varsayılanı')}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.city}>
                {l.name}
              </option>
            ))}
          </select>
          {sep}
          <button type="button" className={btn} onClick={undo} disabled={!past.current.length} title={`${t('Geri Al')} (Ctrl+Z)`} aria-label={t('Geri Al')}>
            ↶
          </button>
          <button type="button" className={btn} onClick={redo} disabled={!future.current.length} title={`${t('Yinele')} (Ctrl+Y)`} aria-label={t('Yinele')}>
            ↷
          </button>
          {sep}
          <span className="flex shrink-0 items-center gap-1">
            <button type="button" className={btn} onClick={() => resize(-10)} disabled={cols <= MIN_W} aria-label={t('Daralt')} title={t('Daralt')}>
              −10
            </button>
            <span className="min-w-16 text-center text-[13px] tabular-nums text-cream">{t('{n} Sütun', { n: cols })}</span>
            <button type="button" className={btn} onClick={() => resize(10)} disabled={cols >= MAX_W} aria-label={t('Genişlet')} title={t('Genişlet')}>
              +10
            </button>
          </span>
          {sep}
          <span className="flex shrink-0 items-center gap-1">
            <button type="button" className={btn} onClick={() => zoom(-1)} disabled={cell <= ZOOMS[0]} aria-label={t('Uzaklaştır')} title={`${t('Uzaklaştır')} (−, Ctrl+Tekerlek)`}>
              −
            </button>
            <span className="min-w-10 text-center text-[13px] tabular-nums text-cream">{Math.round((cell / 20) * 100)}%</span>
            <button type="button" className={btn} onClick={() => zoom(1)} disabled={cell >= ZOOMS[ZOOMS.length - 1]} aria-label={t('Yakınlaştır')} title={`${t('Yakınlaştır')} (+, Ctrl+Tekerlek)`}>
              +
            </button>
          </span>
          {sep}
          <span role="group" aria-label={t('Görünüş')} className="flex shrink-0">
            {(['oyun', 'sema'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                title={v === 'oyun' ? t('Harita oyundaki gibi: şehrin zemini, canlılar ve nesneler') : t('Sade karolar: her karo tek bakışta okunur')}
                className={`-ml-0.5 border-2 px-2.5 py-1 text-[14px] first:ml-0 ${view === v ? 'relative z-[1] border-gold bg-panel-2 text-cream' : 'border-line bg-panel text-muted hover:text-cream'}`}
              >
                {v === 'oyun' ? t('Oyun') : t('Şema')}
              </button>
            ))}
          </span>
          <button type="button" className={btn} aria-pressed={showGrid} onClick={() => setShowGrid((v) => !v)} title={t('Izgara çizgilerini aç ya da kapat')} aria-label={t('Izgara Çizgileri')}>
            #
          </button>
          <button type="button" className={btn} onClick={mirror} title={t('Seçimi ya da bütün haritayı sağdan sola çevirir.')}>
            ⇋ <span className="hidden wide:inline">{t('Yatay Çevir')}</span>
          </button>
          <button type="button" className={btn} onClick={() => setShowKeys(true)} title={`${t('Kısayollar')} (?)`} aria-label={t('Kısayollar')}>
            ?
          </button>
        </div>
        <button
          type="button"
          className="pixel-btn shrink-0 px-2.5 py-1 text-sm"
          onClick={() => {
            runSolver()
            setTab('dene')
          }}
          disabled={!!problem || solveState.s === 'running'}
          title={problem ? t(problem) : t('Bitirilebilir mi?')}
        >
          ✓<span className="hidden wide:inline"> {t('Dene')}</span>
        </button>
        {playBtn('shrink-0 px-3 py-1 text-sm')}
      </header>

      <main
        className={`relative grid min-h-0 flex-1 gap-2 p-2 ${layout === 'wide' ? 'grid-cols-[15rem_minmax(0,1fr)_20rem]' : layout === 'side' ? 'grid-cols-[minmax(0,1fr)_17rem]' : 'grid-rows-[minmax(0,1.3fr)_minmax(0,1fr)]'}`}
      >
        {layout === 'wide' && <aside className="ed-panel flex min-h-0 min-w-0 flex-col gap-2 p-2 [--tone:var(--color-gold)]">{palette(false)}</aside>}

        <div className="flex min-h-0 min-w-0 flex-col gap-1.5">
          {/* ızgara: kutuya sığar; kaydırma kutusu tam genişlikte, tuvaller yalnız görünen bölgeyi çizer */}
          <div ref={fitBox} className="relative min-h-0 flex-1">
            <div className="absolute inset-x-0 top-0 flex h-full max-h-full flex-col gap-1.5">
              <div className="relative flex min-h-0 flex-col">
                <div ref={scroller} className={`ed-canvas min-h-0 overflow-auto border-2 bg-panel ${picking ? 'border-teal' : 'border-line'}`} onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}>
                  <div style={{ width: cols * cell, height: ROWS * cell }}>
                    <div className="sticky left-0" style={{ width: viewW || '100%', height: ROWS * cell }}>
                      <canvas ref={canvas} className="absolute inset-0 block" style={{ width: viewW || '100%', height: ROWS * cell }} aria-hidden />
                      <canvas
                        ref={overlay}
                        className={`absolute inset-0 block ${tool === 'pan' || spaceHeld ? (drag?.kind === 'pan' ? 'cursor-grabbing' : 'cursor-grab') : picking ? 'cursor-pointer touch-none' : tool === 'select' ? 'cursor-cell touch-none' : 'cursor-crosshair touch-none'}`}
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
                </div>
                {guideCard}
                {layout === 'wide' && play$}
              </div>

              {/* durum satırı: seçili karo ve son kullanılanlar, sonra seçim ve parça düğmeleri, yoksa imleçteki karo ya da haritanın ilk sorunu */}
              {/* durum satırı ve şerit sütunun dibine yaslanır: orta sütun soldaki ve sağdaki panellerle aynı yerde biter */}
              <div ref={status} className="mt-auto flex h-9 shrink-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[13px]">
                <span role="group" aria-label={t('Son Kullanılanlar')} className="flex shrink-0 items-center gap-1">
                  {recent.map((sym) => {
                    const def = TILES.find((x) => x.sym === sym)
                    const on = tile === sym && paints
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => chooseTile(sym)}
                        aria-pressed={on}
                        aria-label={def ? t(def.name) : sym}
                        title={def ? `${t(def.name)}${def.key ? ` (${def.key})` : ''}` : sym}
                        className={`grid size-8 place-items-center border-2 ${on ? 'border-gold bg-panel-2' : 'border-line bg-panel hover:border-accent'}`}
                      >
                        <Swatch sym={sym} look={look} city={city} mode={view} px={22} />
                      </button>
                    )
                  })}
                </span>
                {sep}
                {picking ? (
                  <>
                    <span className="px-1 text-teal">{t('Başlayacağın yere dokun: karakter orada doğar.')}</span>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => setPicking(false)} title="Esc">
                      {t('Vazgeç')}
                    </button>
                  </>
                ) : sel ? (
                  <>
                    <span className="px-1 text-muted">{t('Seçim {w}×{h}', { w: norm(sel).x1 - norm(sel).x0 + 1, h: norm(sel).y1 - norm(sel).y0 + 1 })}</span>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={copySel} title="Ctrl+C">
                      {t('Kopyala')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => copySel() && clearSel()} title="Ctrl+X">
                      {t('Kes')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={mirror} title="Shift+H">
                      ⇋ {t('Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={flipV} title="Shift+V">
                      ⇅ {t('Dikey Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={rotate} title="Shift+R">
                      ↻ {t('Döndür')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={clearSel} title="Delete">
                      {t('Boşalt')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => void dupSel()} title="Ctrl+D">
                      ⧉ {t('Çoğalt')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={repeatSel} title={t('Harita sekmesindeki yineleme ayarıyla sağa yineler.')}>
                      ↦ {t('Yinele ×{n}', { n: rep.times })}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={groundSel} title={t('Seçili alanda ilk zeminden aşağısını doldurur.')}>
                      ▤ {t('Zemini Doldur')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => setSel(null)} title="Esc">
                      {t('Seçimi Bırak')}
                    </button>
                  </>
                ) : tool === 'stamp' && float ? (
                  <>
                    <span className="px-1 text-muted">{t('Yerleştirmek için haritaya dokun; aynı parçayı istediğin kadar koyabilirsin.')}</span>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={mirror} title="Shift+H">
                      ⇋ {t('Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={flipV} title="Shift+V">
                      ⇅ {t('Dikey Çevir')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={rotate} title="Shift+R">
                      ↻ {t('Döndür')}
                    </button>
                    <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={() => (setFloat(null), setTool('brush'))} title="Esc">
                      {t('Vazgeç')}
                    </button>
                  </>
                ) : hover ? (
                  <span className="px-1 text-muted">
                    {t('Sütun {x} · Satır {y}', { x: hover.x, y: hover.y })}
                    {hoverTile && hoverTile.sym !== ' ' ? <span className="text-cream"> · {t(hoverTile.name)}</span> : null}
                  </span>
                ) : problem ? (
                  <button type="button" className="px-1 text-left text-accent-2 underline-offset-4 hover:underline" onClick={() => setTab('dene')}>
                    ⚠ {t(problem)}
                  </button>
                ) : notes.length ? (
                  <button type="button" className="px-1 text-left text-gold underline-offset-4 hover:underline" onClick={() => setTab('dene')}>
                    {t('{n} uyarı: Dene sekmesinde', { n: notes.length })}
                  </button>
                ) : (
                  <span className="px-1 text-muted">{t('Harita hazır: ▶ Oyna ile burada dene, ✓ ile çözücüye sor.')}</span>
                )}
                {clip && !float && !picking && (
                  <button type="button" className="pixel-btn px-2 py-0.5 text-[13px]" onClick={paste} title="Ctrl+V">
                    {t('Yapıştır')}
                  </button>
                )}
              </div>

              {/* bütün harita: dokun ya da sürükle, oraya git */}
              <canvas ref={strip} className="block h-7 w-full shrink-0 cursor-pointer touch-none border-2 border-line wide:h-10" onPointerDown={stripJump} onPointerMove={stripJump} aria-label={t('Harita Şeridi')} />
            </div>
          </div>
        </div>

        {/* sekmeli panel: içerik kendi alanında kayar */}
        <section className="ed-panel flex min-h-0 min-w-0 flex-col overflow-hidden [--tone:var(--color-accent-2)]">
          <div role="tablist" aria-label={t('Panel')} className="flex shrink-0 overflow-x-auto border-b-2 border-line">
            {TABS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={`relative shrink-0 px-3 py-1.5 text-[14px] ${tab === x.id ? 'bg-panel-2 text-cream shadow-[inset_0_-3px_0_var(--color-gold)]' : 'text-muted hover:text-cream'}`}
              >
                {t(x.name)}
                {x.id === 'dene' && (problem || notes.length > 0) && <span className={`ml-1 inline-block size-2 rounded-full align-middle ${problem ? 'bg-flag' : 'bg-gold'}`} aria-hidden />}
                {x.id === 'boss' && hasBoss && <span className="ml-1 text-gold" aria-hidden>●</span>}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={t(TABS.find((x) => x.id === tab)?.name ?? '')} className="grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto overflow-x-hidden p-2.5">
            {notice && (
              <p role="status" className="text-[13px] text-accent-2">
                {t(notice)}
              </p>
            )}
            {tab === 'karolar' && palette(true)}
            {tab === 'dene' && dene}
            {tab === 'boss' && bossTab}
            {tab === 'metin' && metinTab}
            {tab === 'harita' && haritaTab}
          </div>
        </section>
        {layout !== 'wide' && play$}
      </main>
      {keysCard}
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
