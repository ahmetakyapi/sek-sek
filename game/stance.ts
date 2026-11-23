/**
 * Duruş: bekleme (idle) pozları ve "canlı" küçük hareketler, koşu tarzı seçimi için ortak ön izleme döngüsü.
 * Oyuncu, Co-op eşi, hayalet ve Mağaza önizlemesi aynı kodu çağırır; hepsi çağıranın tuttuğu tampona yazar
 * (`newPose`), kare başına nesne ayırmaz. Her şey saate (`t`) ve hareketsiz kalma süresine (`idleT`) bağlıdır:
 * kare hızından bağımsızdır, rastgelelik yok.
 *
 * Bekleme duruşları (game/looks.ts STANCES): rahat, eller belde, kollar bağlı, eller cepte, etrafa bakınır, esneyip durur,
 * düşünceli (el çenede), sek sek (yerinde seker). Birkaç saniye hareketsiz kalınca duruşa göre sırayla küçük hareketler
 * başlar: etrafa bakınma, ayak oynatma, esneme, el sallama, tek ayak sekme. Sürekli olanlar: nefes (heroDraw), göz kırpma, saç ve atkının hafif salınımı.
 */
import { STANCES, type IdleMove } from './looks'
import { POSES, airPoseInto, gaitInto, lerpPoseInto, newPose, type Pose } from './heroDraw'

const PI2 = Math.PI * 2
const smooth = (u: number) => u * u * (3 - 2 * u)

/** taban duruşlar: [uzak bacak, yakın bacak, uzak kol, yakın kol] eklem açıları */
const BASE: Record<string, { legs: [[number, number], [number, number]]; arms: [[number, number], [number, number]] }> = {
  rahat: { legs: [[-7, 3], [7, 3]], arms: [[8, 14], [-8, 10]] },
  // eller belde: dirsekler geriye açık, ön kollar beli tutar; ayaklar biraz açık
  bel: { legs: [[-11, 4], [11, 4]], arms: [[-34, 62], [-28, 70]] },
  // kollar bağlı: dirsekler öne açık, ön kollar göğse doğru geri döner (profilde kavuşturulmuş kol)
  bagli: { legs: [[-4, 3], [9, 6]], arms: [[30, -95], [42, -100]] },
  // eller cepte: dirsekler hafif geride, eller kalça cebinde
  cep: { legs: [[-5, 3], [6, 3]], arms: [[-10, 34], [-14, 40]] },
  // düşünceli: yakın elin üstünde çene, uzak kol karnın önünden yakın dirseği tutar
  cene: { legs: [[-4, 3], [8, 5]], arms: [[24, -88], [80, 205]] },
}

/** hareketlerin süresi (sn) ve ardışık hareketler arasındaki boşluk */
const DUR: Record<IdleMove, number> = { bak: 3.4, tik: 3.2, esne: 3.4, sal: 1.9, sek: 2.4 }
const SLOT = 6.6
/** hareketsiz kaldıktan bu kadar sonra ilk hareket */
const FIRST = 3
const ARMS_UP: [[number, number], [number, number]] = [[208, 212], [198, 202]]
const WAVE: [number, number] = [105, 140]

const lerp = (a: number, b: number, u: number) => a + (b - a) * u

/**
 * Bekleme pozu. stance: duruş kimliği (boş: rahat), idleT: kıpırdamadan geçen süre (sn), t: saat (sn).
 * `out` döner. Hareketsiz süre kısaysa yalnız taban duruş + nefes + göz kırpma.
 */
export function idlePose(out: Pose, stance: string | undefined, idleT: number, t: number): Pose {
  const def = STANCES[stance ?? 'rahat'] ?? STANCES.rahat
  const b = BASE[def.base]
  // nefes: dizler hafifçe esner
  const br = 2 + 5 * (0.5 + 0.5 * Math.sin(t * 2.6))
  const wide = def.base === 'bel'
  out.legs[0][0] = b.legs[0][0]
  out.legs[0][1] = wide ? 4 + br * 0.3 : br
  out.legs[1][0] = b.legs[1][0]
  out.legs[1][1] = wide ? 4 + br * 0.3 : br
  out.arms[0][0] = b.arms[0][0]
  out.arms[0][1] = b.arms[0][1]
  out.arms[1][0] = b.arms[1][0]
  out.arms[1][1] = b.arms[1][1]
  out.lean = 0
  out.tilt = def.base === 'bagli' ? 0.015 : def.base === 'cene' ? 0.03 : 0
  out.bob = 0
  // hafif esinti: saç ve atkı dururken de oynar
  out.hair = 0.1 + 0.08 * Math.sin(t * 1.3)
  out.lift = 0.06 * Math.sin(t * 0.9 + 0.5)
  out.ground = true
  out.reach = 1
  // düşünceli: baş hafif kalkık, gözler yukarı-ileri
  out.head = def.base === 'cene' ? -0.05 : 0
  out.gaze = def.base === 'cene' ? 0.5 : 0
  out.mouth = undefined
  out.mood = undefined
  // göz kırpma: ~3,6 sn'de bir, ara sıra çift
  const bt = (t + 1.7) % 3.6
  out.blink = bt < 0.11 || (t % 11.3 < 0.3 && bt > 0.22 && bt < 0.33)

  const u0 = idleT - FIRST
  if (u0 < 0) return out
  const slot = Math.floor(u0 / SLOT)
  const move = def.moves[slot % def.moves.length]
  const d = DUR[move]
  const u = (u0 - slot * SLOT) / d
  if (u >= 1) return out
  const env = smooth(Math.sin(Math.PI * u))
  switch (move) {
    case 'bak': {
      // etrafa bakınır: başı kaldırıp çevirir, bakış ileri-geri kayar, gövde hafifçe döner
      const s = Math.sin(PI2 * u)
      out.head = env * (-0.1 - 0.09 * Math.sin(PI2 * u + 0.6))
      out.gaze = s * env
      out.lean = s * 0.9 * env
      break
    }
    case 'tik': {
      // ayak oynatır: yakın ayak topuğunu üç kez vurur, baş ritme eşlik eder
      const tap = Math.max(0, Math.sin(PI2 * 3 * u)) * env
      out.legs[1][1] += 16 * tap
      out.legs[1][0] += 4 * tap
      out.head = 0.035 * Math.sin(PI2 * 3 * u) * env
      out.bob = 0.4 * tap
      break
    }
    case 'esne': {
      // esneme: kollar başın üstüne uzanır, gövde geriye kavislenir, göz kapanır, ağız açılır
      const e = env
      out.arms[0][0] = lerp(out.arms[0][0], ARMS_UP[0][0], e)
      out.arms[0][1] = lerp(out.arms[0][1], ARMS_UP[0][1], e)
      out.arms[1][0] = lerp(out.arms[1][0], ARMS_UP[1][0], e)
      out.arms[1][1] = lerp(out.arms[1][1], ARMS_UP[1][1], e)
      out.legs[0][1] *= 1 - 0.6 * e
      out.legs[1][1] *= 1 - 0.6 * e
      out.tilt = -0.13 * e
      out.lean = -1.1 * e
      out.head = -0.16 * e
      out.reach = 1 + 0.1 * e
      if (e > 0.3) out.blink = true
      if (e > 0.62) out.mouth = 'yawn'
      break
    }
    case 'sek': {
      // sek sek: yakın ayak bükülüp kalkar, öbür ayakla üç kez yerinde sekilir; kollar dengede yana açılır
      const hop = Math.max(0, Math.sin(PI2 * 3 * u))
      out.legs[1][0] = lerp(out.legs[1][0], 26, env)
      out.legs[1][1] = lerp(out.legs[1][1], 74, env)
      out.legs[0][1] += 10 * hop * env
      out.bob = -4.2 * hop * env
      out.arms[0][0] = lerp(out.arms[0][0], -34, env)
      out.arms[0][1] = lerp(out.arms[0][1], -10, env)
      out.arms[1][0] = lerp(out.arms[1][0], 40, env)
      out.arms[1][1] = lerp(out.arms[1][1], 70, env)
      out.hair = 0.1 + 0.5 * hop * env
      out.lift = -0.4 * hop * env
      if (env > 0.3) out.mood = 'happy'
      break
    }
    case 'sal': {
      // el sallar: yakın kol kalkar, ön kol sallanır
      out.arms[1][0] = lerp(out.arms[1][0], WAVE[0], env)
      out.arms[1][1] = lerp(out.arms[1][1], WAVE[1] + Math.sin(t * 13) * 22, env)
      out.head = 0.04 * env
      break
    }
  }
  return out
}

/** Önizleme kipleri: tek tek ya da hepsi sırayla */
export type DemoMode = 'dur' | 'kos' | 'zipla' | 'dongu'

/** önizleme durumu: poz tamponu ve çizimin yeri/biçimi (dy: yukarı px olarak yükseklik oranı, boy birimiyle) */
export interface Demo {
  pose: Pose
  /** zıplama yüksekliği (karakter boyuna oranı) */
  dy: number
  kx: number
  ky: number
  moving: boolean
  /** 0..1: atkı savrulması */
  flow: number
}
export const newDemo = (): Demo => ({ pose: newPose(), dy: 0, kx: 1, ky: 1, moving: false, flow: 0.2 })
const land = POSES.land
const scratch = newPose()

/** zıplama: eğilme, kalkış, havada yükseliş-tepe-düşüş, iniş (squash ve stretch), toparlanma; periyot 1,7 sn */
const JUMP_T = 1.7

/**
 * Mağaza önizlemesi: oyundaki pozlarla aynı kod. mode 'dur': bekleme (etkinlikler hemen görünür: `t` hareketsiz süreyi de verir),
 * 'kos': koşu tarzıyla, 'zipla': zıplama ve iniş, 'dongu': üçü sırayla (3,6 sn dur · 2,4 sn koş · 1,7 sn zıpla).
 */
export function demoPose(d: Demo, mode: DemoMode, t: number, stance?: string, runStyle?: string): Demo {
  let m = mode
  let lt = t
  if (mode === 'dongu') {
    const cyc = 3.6 + 2.4 + JUMP_T
    lt = t % cyc
    if (lt < 3.6) m = 'dur'
    else if (lt < 6) (m = 'kos'), (lt -= 3.6)
    else (m = 'zipla'), (lt -= 6)
    // dur: hareketsiz kalma saati döngü başından sayılır; önizleme hemen bir hareket gösterir
  }
  d.dy = 0
  d.kx = 1
  d.ky = 1
  d.moving = false
  d.flow = 0.2
  if (m === 'dur') {
    // önizlemede ilk hareket erken gelsin: hareketsiz süre FIRST'ten başlar
    idlePose(d.pose, stance, FIRST + (mode === 'dongu' ? lt : t % 20), t)
    return d
  }
  if (m === 'kos') {
    gaitInto(d.pose, (lt * 1.6) % 1, 1, runStyle)
    d.moving = true
    d.flow = 1
    return d
  }
  // zıpla
  const u = (lt % JUMP_T) / JUMP_T
  const crouch = 0.14
  const air = 0.62
  if (u < crouch) {
    // eğilme: çömelir, gövde genişler
    const k = smooth(u / crouch)
    lerpPoseInto(d.pose, idlePose(scratch, stance, 0, t), land, k)
    d.kx = 1 + 0.14 * k
    d.ky = 1 - 0.12 * k
  } else if (u < crouch + air) {
    const a = (u - crouch) / air
    // basit balistik: vy yukarıdan aşağıya doğrusal, yükseklik parabol
    const vy = lerp(-420, 420, a)
    airPoseInto(d.pose, vy, t)
    d.dy = 4 * a * (1 - a) * 0.72
    const up = Math.max(0, -vy / 420) * 0.14
    const down = Math.max(0, vy / 420) * 0.07
    const apex = Math.max(0, 1 - Math.abs(vy) / 110)
    d.kx = 1 - (up + down) * 0.75 + 0.05 * apex
    d.ky = 1 + up + down - 0.04 * apex
    d.moving = true
    d.flow = 0.7
  } else {
    // iniş: sönümlü yay (önce çöker, sonra hafifçe uzar)
    const lt2 = (u - crouch - air) * JUMP_T
    const sq = Math.exp(-lt2 / 0.1) * Math.cos((PI2 * lt2) / 0.3)
    lerpPoseInto(d.pose, idlePose(scratch, stance, 0, t), land, Math.max(0, sq))
    d.kx = 1 + 0.2 * sq
    d.ky = 1 - 0.16 * sq
  }
  return d
}

/** iniş ve sekme için: bir poza `land` pozunu `k` oranında karıştırır, `out`a yazar (heroAnim) */
export const landInto = (out: Pose, base: Pose, k: number) => lerpPoseInto(out, base, land, k)
