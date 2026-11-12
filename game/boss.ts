/**
 * Şehir boss’ları: her bölümün meydanında, şehrin bir ayrıntısından doğan bekçi.
 *
 * Kural bütün şehirlerde aynıdır, her yaştan oyuncu bir kez öğrenir:
 *   1. Boss saldırmadan önce hep işaret verir (titrer, gölgesi düşer, toprak kabarır).
 *   2. Saldırırken dokunmak can yakar; saldırı bitince yorulur, başında yıldızlar döner.
 *   3. Yorgunken üstüne bas (ya da dash at): bir canı gider. Canı bitince meydan kapısı açılır.
 * Şehirden şehre değişen şey saldırının biçimidir (toslar, dalar, sıçrar, yerden çıkar, atar):
 * her biri başka bir akıl ister. Hareketler saate bağlıdır, rastgelelik yoktur.
 */
import type { Box, Projectile } from './sim'
import { T, type CityKey, type GameEvent } from './types'

export type BossMove = 'charge' | 'dive' | 'hop' | 'burrow' | 'throw'

export interface BossDef {
  name: string
  nameEn: string
  hp: number
  /** her can için saldırı biçimi: ilk can ilk hareket, sırayla döner */
  moves: BossMove[]
  /** hız çarpanı: kolay şehirde yavaş, zor şehirde çevik */
  speed: number
  w: number
  h: number
  /** meydana girince çıkan söz ve nasıl yenileceğinin ipucu */
  taunt: string
  tauntEn: string
}

export const BOSSES: Record<CityKey, BossDef> = {
  istanbul: { name: 'Simit Hırsızı Martı', nameEn: 'The Simit-Thief Gull', hp: 3, moves: ['dive'], speed: 0.85, w: 22, h: 18, taunt: 'Gölgesi düşünce kenara çekil; gagası yere saplanınca üstüne bas!', tauntEn: 'Step aside when its shadow falls; stomp it when its beak gets stuck!' },
  kocaeli: { name: 'Pişmaniye Yumağı', nameEn: 'The Pişmaniye Tumbler', hp: 3, moves: ['charge'], speed: 0.85, w: 24, h: 22, taunt: 'Yuvarlanırken üstünden atla; duvara çarpıp sersemleyince bas!', tauntEn: 'Jump over it as it rolls; stomp it once it hits the wall and gets dizzy!' },
  canakkale: { name: 'Truva Atı', nameEn: 'The Trojan Horse', hp: 3, moves: ['charge', 'throw'], speed: 0.9, w: 26, h: 26, taunt: 'Tekerlekleriyle üstüne gelir, sonra karnından üç kalkan fırlatır. Duvara toslayınca sırtına bas!', tauntEn: 'It rolls at you on its wheels, then flings three shields from its belly. Stomp its back when it hits the wall!' },
  diyarbakir: { name: 'Dev Karpuz', nameEn: 'The Giant Watermelon', hp: 4, moves: ['charge', 'hop', 'throw'], speed: 1.05, w: 26, h: 24, taunt: 'Yuvarlanır, seker, çekirdek savurur. Yorulup çatlayınca üstüne bas!', tauntEn: 'It rolls, bounces and spits seeds. Stomp it when it tires and cracks!' },
  sinop: { name: 'Diyojen’in Fıçısı', nameEn: 'Diogenes’ Barrel', hp: 4, moves: ['charge', 'hop', 'burrow'], speed: 1.1, w: 24, h: 24, taunt: '“Gölge etme!” diye yuvarlanır, seker, kumdan çıkar. Sersemleyince üstüne bas!', tauntEn: 'It rolls shouting “Out of my light!”, bounces, pops out of the sand. Stomp it when it is dizzy!' },
  edirne: { name: 'Kırkpınar Davulu', nameEn: 'The Kırkpınar Drum', hp: 3, moves: ['charge', 'hop'], speed: 0.85, w: 24, h: 24, taunt: 'Gümbür gümbür yuvarlanır, sonra üç kez zıplar. Tokmağı düşünce üstüne bas!', tauntEn: 'It rolls in with a boom, then bounces three times. Stomp it when it drops its mallet!' },
  bursa: { name: 'Karagöz’ün Gölgesi', nameEn: 'Karagöz’s Shadow', hp: 3, moves: ['burrow', 'hop'], speed: 0.9, w: 22, h: 26, taunt: 'Perdenin dibinden belirir, sonra hoplaya zıplaya gelir. Şaşkın şaşkın bakınınca üstüne bas!', tauntEn: 'It rises from the foot of the screen, then comes hopping. Stomp it when it looks around bewildered!' },
  antalya: { name: 'Aspendos Maskesi', nameEn: 'The Mask of Aspendos', hp: 3, moves: ['dive', 'throw'], speed: 1, w: 24, h: 24, taunt: 'Sahnenin üstünde süzülür, dalar; sonra üç defne yaprağı savurur. Yere düşünce üstüne bas!', tauntEn: 'It floats above the stage and dives, then flings three laurel leaves. Stomp it when it falls!' },
  sanliurfa: { name: 'Dikilitaş Bekçisi', nameEn: 'The Standing-Stone Keeper', hp: 4, moves: ['hop', 'burrow', 'throw'], speed: 1.05, w: 22, h: 28, taunt: 'On iki bin yıllık taş uyanmış: sıçrar, yerden çıkar, çakıl savurur. Yorulunca tepesine bas!', tauntEn: 'A twelve-thousand-year-old stone has woken: it leaps, rises from the ground, flings pebbles. Stomp its top when it tires!' },
  van: { name: 'Göl Canavarı', nameEn: 'The Lake Monster', hp: 4, moves: ['dive', 'burrow', 'throw'], speed: 1.15, w: 26, h: 24, taunt: 'Gölden fırlar, dalar, kıyıdan çıkar, köpük atar. Karaya vurunca üstüne bas!', tauntEn: 'It bursts from the lake, dives, surfaces at the shore, spits foam. Stomp it when it beaches itself!' },
  erzurum: { name: 'Palandöken Çığı', nameEn: 'The Palandöken Avalanche', hp: 4, moves: ['charge', 'hop', 'dive'], speed: 1.2, w: 26, h: 26, taunt: 'Buzda yuvarlanır, sıçrar, tepeden çöker. Dağılıp toparlanırken üstüne bas!', tauntEn: 'It rolls across the ice, leaps and crashes from above. Stomp it while it pulls itself together!' },
  izmir: { name: 'Körfez Ahtapotu', nameEn: 'The Gulf Octopus', hp: 3, moves: ['burrow'], speed: 0.9, w: 22, h: 22, taunt: 'İskele hangi delikten kabarıyorsa oradan çıkar; mürekkebinden atla, sersemleyince bas!', tauntEn: 'It pops out where the pier bubbles; hop over its ink, stomp it when it is dizzy!' },
  ankara: { name: 'Evrak Canavarı', nameEn: 'The Paperwork Monster', hp: 3, moves: ['throw'], speed: 0.95, w: 22, h: 24, taunt: 'Üç mühür fırlatır, sonra soluklanır. Mühürlerin altından yürü, soluklanınca bas!', tauntEn: 'It hurls three stamps, then catches its breath. Walk under the stamps and stomp it then!' },
  konya: { name: 'Dev Topaç', nameEn: 'The Giant Spinning Top', hp: 3, moves: ['charge', 'hop'], speed: 1, w: 22, h: 24, taunt: 'Dönerek gelir, sonra üç kez seker. Yorulup yalpalayınca üstüne bas!', tauntEn: 'It spins at you, then bounces three times. Stomp it when it wobbles!' },
  nevsehir: { name: 'Kaçak Balon', nameEn: 'The Runaway Balloon', hp: 3, moves: ['dive', 'throw'], speed: 1, w: 24, h: 26, taunt: 'Tepeden iner ya da kum torbası atar. Yere oturunca sepetine bas!', tauntEn: 'It drops from above or lobs sandbags. Stomp its basket when it lands!' },
  adana: { name: 'Acı Biber', nameEn: 'The Hot Pepper', hp: 3, moves: ['hop'], speed: 1.05, w: 20, h: 24, taunt: 'Üç kez sıçrar: altından koş! Dili yanıp soluklanınca üstüne bas!', tauntEn: 'It leaps three times: run under it! Stomp it when it stops to cool its tongue!' },
  gaziantep: { name: 'Fıstık Hırsızı', nameEn: 'The Pistachio Bandit', hp: 3, moves: ['burrow', 'charge'], speed: 1.05, w: 22, h: 20, taunt: 'Çuvalların arasından çıkar, sonra üstüne koşar. Sersemleyince bas!', tauntEn: 'It pops out among the sacks, then charges. Stomp it when it is dizzy!' },
  mardin: { name: 'Şahmaran’ın Sınavı', nameEn: 'Shahmaran’s Trial', hp: 4, moves: ['burrow', 'throw'], speed: 1.05, w: 22, h: 26, taunt: 'Taşın altından yükselir, sonra üç mücevher fırlatır. Başını eğince üstüne bas!', tauntEn: 'It rises from under the stone, then tosses three jewels. Stomp when it bows its head!' },
  malatya: { name: 'Dev Kayısı', nameEn: 'The Giant Apricot', hp: 4, moves: ['hop', 'charge'], speed: 1.1, w: 24, h: 24, taunt: 'Önce seker, sonra yuvarlanır. Yorulunca sapına bas!', tauntEn: 'First it bounces, then it rolls. Stomp its stem when it tires!' },
  corum: { name: 'Leblebi Tavası', nameEn: 'The Roasting Pan', hp: 4, moves: ['throw', 'hop'], speed: 1.1, w: 26, h: 20, taunt: 'Kızgın leblebi savurur, sonra hoplar. Soğuyunca üstüne bas!', tauntEn: 'It flings hot chickpeas, then hops. Stomp it once it cools down!' },
  ordu: { name: 'Fındık Kurdu', nameEn: 'The Hazelnut Weevil', hp: 4, moves: ['burrow', 'hop'], speed: 1.15, w: 22, h: 22, taunt: 'Topraktan çıkar, sonra üç kez sıçrar. Sersemleyince bas!', tauntEn: 'It digs out of the soil, then leaps three times. Stomp it when it is dizzy!' },
  trabzon: { name: 'Hamsi Kralı', nameEn: 'The Anchovy King', hp: 4, moves: ['hop', 'dive'], speed: 1.15, w: 26, h: 18, taunt: 'Sıçrar, sonra tepeden dalar. Karaya vurunca üstüne bas!', tauntEn: 'It leaps, then dives from above. Stomp it when it flops ashore!' },
  sivas: { name: 'Ayaz Dede', nameEn: 'Old Man Frost', hp: 4, moves: ['throw', 'charge'], speed: 1.15, w: 22, h: 26, taunt: 'Kartopu atar, sonra buzda kayarak gelir. Duvara toslayınca bas!', tauntEn: 'It throws snowballs, then slides at you on the ice. Stomp it when it hits the wall!' },
  ardahan: { name: 'Dev Kaz', nameEn: 'The Giant Goose', hp: 4, moves: ['charge', 'dive'], speed: 1.2, w: 24, h: 24, taunt: 'Tıslayıp koşar, sonra havalanıp dalar. Sersemleyince üstüne bas!', tauntEn: 'It hisses and charges, then takes off and dives. Stomp it when it is dizzy!' },
  bayburt: { name: 'Tepegöz', nameEn: 'Tepegöz the Cyclops', hp: 5, moves: ['charge', 'hop', 'throw', 'dive', 'burrow'], speed: 1.2, w: 26, h: 28, taunt: 'Dede Korkut’un devi her canında başka oyun oynar. Gözü dönünce üstüne bas!', tauntEn: 'Dede Korkut’s giant changes its game with every heart. Stomp it when its eye spins!' },
}

export type BossState = 'sleep' | 'intro' | 'move' | 'warn' | 'attack' | 'tired' | 'hurt' | 'down'

export interface Boss extends Box {
  def: BossDef
  hp: number
  state: BossState
  move: BossMove
  timer: number
  dir: 1 | -1
  vx: number
  vy: number
  /** hareket içi sayaç: kaçıncı sıçrayış, kaçıncı atış */
  n: number
  /** hedef x (sıçrayışın ineceği, dalışın düşeceği, yerden çıkılacak yer) */
  tx: number
  /** canlandırma saati */
  t: number
  /** gövdenin sol kenarının gezebileceği aralık ve zemin üstü */
  min: number
  max: number
  floor: number
  /** yerin altındayken görünmez ve dokunulmaz */
  hidden: boolean
  /** yorgunluğun toplam süresi (sn): başındaki geri sayım buna göre boşalır */
  span?: number
  home: { x: number; y: number }
}

/** Boss dünyadan yalnız bunları ister: oyuncu, mermi listesi, olay kuyruğu. */
export interface BossHost {
  player: Box & { vy: number; dead: boolean; dashTime: number }
  projectiles: Projectile[]
  events: GameEvent[]
  /** oyuncunun bu adımdan önceki ayak hizası: üstten mi geldi */
  prevFeet?: number
}

export const BOSS = {
  intro: 1.3,
  hurt: 0.9,
  /** yorgunluk süreleri (saniye): oyuncunun yanaşıp basması için pay */
  tired: { charge: 2.2, dive: 2.1, hop: 2.2, burrow: 2.0, throw: 2.4 },
  hover: 74,
  hopAir: 0.95,
  hopHeight: 58,
  lobAir: 1.0,
  lobG: 560,
} as const

export function makeBoss(def: BossDef, x: number, floor: number, min: number, max: number): Boss {
  const hx = Math.min(max, Math.max(min, x))
  return { def, x: hx, y: floor - def.h, w: def.w, h: def.h, hp: def.hp, state: 'sleep', move: def.moves[0], timer: 0, dir: -1, vx: 0, vy: 0, n: 0, tx: hx, t: 0, min, max, floor, hidden: def.moves[0] === 'burrow', home: { x: hx, y: floor - def.h } }
}

export function resetBoss(b: Boss) {
  Object.assign(b, makeBoss(b.def, b.home.x, b.floor, b.min, b.max))
}

/** yerden çıkış delikleri: arenaya eşit aralıkla dizilir */
export function burrowHoles(b: Boss): number[] {
  const n = Math.max(3, Math.min(5, Math.round((b.max - b.min) / (T * 5))))
  return Array.from({ length: n }, (_, i) => b.min + ((b.max - b.min) * (i + 0.5)) / n)
}

const pace = (b: Boss) => b.def.speed * (1 + 0.1 * (b.def.hp - b.hp))

function begin(b: Boss, host: BossHost) {
  b.move = b.def.moves[(b.def.hp - b.hp) % b.def.moves.length]
  b.n = 0
  b.vx = 0
  b.vy = 0
  b.hidden = false
  const px = host.player.x + host.player.w / 2
  b.dir = px > b.x + b.w / 2 ? 1 : -1
  switch (b.move) {
    case 'charge':
    case 'throw':
      b.state = 'move'
      b.timer = 0
      break
    case 'dive':
      b.state = 'move'
      b.timer = 1.7 / pace(b)
      break
    case 'hop':
      b.state = 'warn'
      b.timer = 0.6
      break
    case 'burrow':
      b.state = 'move'
      b.hidden = true
      b.timer = 1.0 / pace(b)
      break
  }
}

function tire(b: Boss) {
  b.state = 'tired'
  b.timer = BOSS.tired[b.move] / (1 + 0.06 * (b.def.hp - b.hp))
  b.span = b.timer
  b.vx = 0
  b.vy = 0
  b.y = b.floor - b.h
}

function lob(b: Boss, host: BossHost) {
  const p = host.player
  const sx = b.x + b.w / 2 - 4
  const sy = b.y + 2
  const dx = p.x + p.w / 2 - 4 - sx
  // oyuncunun durduğu yere düşer: yürüyen oyuncunun arkasında kalır
  const vx = Math.max(-190, Math.min(190, dx / BOSS.lobAir))
  host.projectiles.push({ x: sx, y: sy, w: 8, h: 8, vx, vy: -BOSS.lobG * BOSS.lobAir * 0.5 + (b.floor - 8 - sy) / BOSS.lobAir, g: BOSS.lobG })
  host.events.push({ type: 'shoot' })
}

export function updateBoss(b: Boss, host: BossHost, dt: number) {
  const p = host.player
  b.t += dt
  const k = pace(b)
  const pcx = p.x + p.w / 2
  const bcx = () => b.x + b.w / 2
  switch (b.state) {
    case 'sleep':
      // oyuncu meydana adım atınca uyanır
      if (!p.dead && pcx > b.min - T && pcx < b.max + b.w + T) {
        b.state = 'intro'
        b.timer = BOSS.intro
        b.hidden = false
        b.dir = pcx > bcx() ? 1 : -1
        host.events.push({ type: 'bossWake', x: bcx(), y: b.y })
      }
      return
    case 'intro':
      b.timer -= dt
      if (b.timer <= 0) begin(b, host)
      return
    case 'hurt':
      b.timer -= dt
      if (b.timer <= 0) begin(b, host)
      return
    case 'tired':
      b.timer -= dt
      if (b.timer <= 0) begin(b, host)
      return
    case 'down':
      // yenildikten sonra geçen süre: çizim veda sahnesini buna göre oynatır
      b.timer += dt
      return
  }
  if (p.dead) return

  switch (b.move) {
    case 'charge': {
      if (b.state === 'move') {
        // oyuncuya dön, biraz yaklaş; yeterince bakınca işaret ver
        b.dir = pcx > bcx() ? 1 : -1
        b.timer += dt
        if (Math.abs(pcx - bcx()) > T * 7) b.x = Math.min(b.max, Math.max(b.min, b.x + b.dir * 30 * k * dt))
        if (b.timer > 0.9 / k) {
          b.state = 'warn'
          b.timer = 0.75
        }
      } else if (b.state === 'warn') {
        b.timer -= dt
        if (b.timer <= 0) b.state = 'attack'
      } else {
        b.x += b.dir * 150 * k * dt
        if (b.x <= b.min || b.x >= b.max) {
          b.x = Math.min(b.max, Math.max(b.min, b.x))
          tire(b)
          host.events.push({ type: 'bossSlam', x: bcx(), y: b.y + b.h })
        }
      }
      break
    }
    case 'dive': {
      const top = b.floor - BOSS.hover - b.h
      if (b.state === 'move') {
        // havalan ve oyuncunun tepesine süzül
        b.y = Math.max(top, b.y - 110 * dt)
        const want = Math.min(b.max, Math.max(b.min, pcx - b.w / 2))
        const step = 62 * k * dt
        b.x += Math.max(-step, Math.min(step, want - b.x))
        b.dir = want > b.x ? 1 : -1
        if (b.y <= top) b.timer -= dt
        if (b.timer <= 0) {
          b.state = 'warn'
          b.timer = 0.7
          b.tx = b.x
        }
      } else if (b.state === 'warn') {
        b.timer -= dt
        if (b.timer <= 0) {
          b.state = 'attack'
          b.vy = 120
        }
      } else {
        b.vy = Math.min(380, b.vy + 900 * dt)
        b.y += b.vy * dt
        if (b.y >= b.floor - b.h) {
          tire(b)
          host.events.push({ type: 'bossSlam', x: bcx(), y: b.floor })
        }
      }
      break
    }
    case 'hop': {
      if (b.state === 'warn') {
        b.timer -= dt
        if (b.timer <= 0) {
          // iniş yeri kalkışta belli olur: oyuncu altından koşabilir
          const reach = T * 7
          const want = Math.min(b.max, Math.max(b.min, pcx - b.w / 2))
          b.tx = Math.max(b.x - reach, Math.min(b.x + reach, want))
          b.dir = b.tx >= b.x ? 1 : -1
          b.vx = (b.tx - b.x) / BOSS.hopAir
          b.timer = 0
          b.state = 'attack'
        }
      } else {
        b.timer += dt
        const u = Math.min(1, b.timer / BOSS.hopAir)
        b.x += b.vx * dt
        b.x = Math.min(b.max, Math.max(b.min, b.x))
        b.y = b.floor - b.h - BOSS.hopHeight * 4 * u * (1 - u)
        if (u >= 1) {
          b.y = b.floor - b.h
          b.n++
          host.events.push({ type: 'bossSlam', x: bcx(), y: b.floor })
          if (b.n >= 3) tire(b)
          else {
            b.state = 'warn'
            b.timer = 0.45 / k
          }
        }
      }
      break
    }
    case 'burrow': {
      if (b.state === 'move') {
        b.timer -= dt
        if (b.timer <= 0) {
          // oyuncuya en yakın delik: kabarır, oyuncu kenara çekilir
          const holes = burrowHoles(b)
          let best = holes[0]
          for (const h of holes) if (Math.abs(h + b.w / 2 - pcx) < Math.abs(best + b.w / 2 - pcx)) best = h
          b.tx = best
          b.x = best
          b.y = b.floor - b.h
          b.state = 'warn'
          b.timer = 0.9
        }
      } else if (b.state === 'warn') {
        b.timer -= dt
        if (b.timer <= 0) {
          b.hidden = false
          b.state = 'attack'
          b.timer = 0.9 / k
          b.dir = pcx > bcx() ? 1 : -1
          // çıkar çıkmaz yerden bir şey savurur: üstünden atlanır
          host.projectiles.push({ x: b.dir > 0 ? b.x + b.w : b.x - 8, y: b.floor - 9, w: 8, h: 7, vx: b.dir * 80 * k })
          host.events.push({ type: 'shoot' })
        }
      } else {
        b.timer -= dt
        if (b.timer <= 0) tire(b)
      }
      break
    }
    case 'throw': {
      if (b.state === 'move') {
        // oyuncudan uzak köşeye çekilir
        const far = pcx < (b.min + b.max + b.w) / 2 ? b.max : b.min
        const step = 70 * k * dt
        b.x += Math.max(-step, Math.min(step, far - b.x))
        b.dir = pcx > bcx() ? 1 : -1
        if (Math.abs(far - b.x) < 0.5) {
          b.state = 'warn'
          b.timer = 0.6
        }
      } else if (b.state === 'warn') {
        b.dir = pcx > bcx() ? 1 : -1
        b.timer -= dt
        if (b.timer <= 0) {
          lob(b, host)
          b.n++
          b.state = 'attack'
          b.timer = 0.55 / k
        }
      } else {
        b.timer -= dt
        if (b.timer <= 0) {
          if (b.n >= 3) tire(b)
          else {
            b.state = 'warn'
            b.timer = 0.4
          }
        }
      }
      break
    }
  }
}

/** Oyuncuyla temas: 'hit' boss can kaybetti (oyuncu sektirilir), 'kill' oyuncu yandı, null temas yok. */
export function touchBoss(b: Boss, host: BossHost): 'hit' | 'kill' | null {
  const p = host.player
  if (b.hidden || b.state === 'sleep' || b.state === 'intro' || b.state === 'hurt' || b.state === 'down') return null
  const hit = p.x + 1 < b.x + b.w && p.x + p.w - 1 > b.x && p.y + 1 < b.y + b.h && p.y + p.h - 1 > b.y
  if (!hit) return null
  if (b.state !== 'tired') return 'kill'
  // yorgunken zararsız: üstüne basış ya da dash can götürür. Basış cömert sayılır: üstten geldiysen (önceki adımda
  // ayaklar tepenin üstündeydi) ya da ayakların gövdenin üst yarısında ve yükselmiyorsan
  const feet = p.y + p.h
  const fromAbove = host.prevFeet !== undefined && host.prevFeet <= b.y + 4 && p.vy > -150
  const stomp = fromAbove || (p.vy >= -30 && feet - b.y < Math.max(10, b.h * 0.5))
  if (!stomp && p.dashTime <= 0) return null
  b.hp--
  const x = b.x + b.w / 2
  if (b.hp <= 0) {
    b.state = 'down'
    b.timer = 0
    b.y = b.floor - b.h
    host.events.push({ type: 'bossDown', x, y: b.y })
  } else {
    b.state = 'hurt'
    b.timer = BOSS.hurt
    host.events.push({ type: 'bossHit', x, y: b.y, hp: b.hp })
  }
  return 'hit'
}
