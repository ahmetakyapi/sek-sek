export const T = 16

export type CityKey = 'istanbul' | 'kocaeli' | 'izmir' | 'ankara' | 'konya' | 'nevsehir' | 'adana' | 'gaziantep' | 'mardin' | 'malatya' | 'corum' | 'ordu' | 'sivas' | 'ardahan' | 'bayburt'

export interface Fact {
  title: string
  text: string
}

export interface Npc {
  name: string
  look: 'amca' | 'teyze' | 'usta' | 'genc' | 'coban' | 'ozan'
  text: string
}

export interface LevelDef {
  id: string
  city: CityKey
  name: string
  /** il plaka kodu */
  plate: number
  subtitle: string
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Çok Zor'
  /** collectible adı (tekil) */
  item: string
  intro: string
  facts: [Fact, Fact, Fact]
  /** gizli pulla açılan bonus sayfa */
  secret: Fact
  hints: string[]
  /** parantez içinde gösterilen yerel ad: Çorum (Çorumçe) */
  nickname?: string
  /** dedenin defterindeki not (hikâye) */
  note: string
  /** haritadaki n karakterleri, soldan sağa */
  npcs: Npc[]
  /** madalya süreleri (saniye): altın, gümüş, bronz */
  medals: [number, number, number]
  /** düşünce ara sıra çıkan esprili satırlar */
  quips: string[]
  /** yatay rüzgâr ivmesi (px/s²); periyodik esintiyle çarpılır */
  wind?: number
  map: string[]
}

export interface Input {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jump: boolean
  jumpPressed: boolean
  dashPressed: boolean
}

export const emptyInput = (): Input => ({
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  jumpPressed: false,
  dashPressed: false,
})

export type GameEvent =
  | { type: 'jump' }
  | { type: 'walljump' }
  | { type: 'dash' }
  | { type: 'land' }
  | { type: 'death'; x: number; y: number }
  | { type: 'respawn' }
  | { type: 'checkpoint'; index: number }
  | { type: 'collect'; index: number }
  | { type: 'spring' }
  | { type: 'stomp'; x: number; y: number }
  | { type: 'crumble' }
  | { type: 'shoot' }
  | { type: 'complete' }
  | { type: 'crystal' }
  | { type: 'key' }
  | { type: 'stamp' }
  | { type: 'switch' }
  /** dost bir hayvanı sevdin */
  | { type: 'pet'; x: number; y: number }
