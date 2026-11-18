export const T = 16

export type CityKey = 'istanbul' | 'edirne' | 'kocaeli' | 'bursa' | 'canakkale' | 'izmir' | 'antalya' | 'ankara' | 'konya' | 'nevsehir' | 'adana' | 'gaziantep' | 'sanliurfa' | 'diyarbakir' | 'mardin' | 'malatya' | 'corum' | 'sinop' | 'ordu' | 'trabzon' | 'sivas' | 'van' | 'erzurum' | 'kayseri' | 'hatay' | 'eskisehir' | 'ardahan' | 'amasya' | 'mugla' | 'bayburt' | 'rize' | 'artvin' | 'kars' | 'agri' | 'giresun' | 'tokat' | 'denizli' | 'bitlis' | 'zonguldak' | 'mersin'

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
  /** Gezgin’in yol defterindeki not (hikâye) */
  note: string
  /** haritadaki n karakterleri, soldan sağa */
  npcs: Npc[]
  /** madalya süreleri (saniye): altın, gümüş, bronz */
  medals: [number, number, number]
  /** düşünce ara sıra çıkan esprili satırlar */
  quips: string[]
  /** yatay rüzgâr ivmesi (px/s²); periyodik esintiyle çarpılır */
  wind?: number
  /** kapalı dikenli çukurlar zehirli suya döner (öldüren suyla aynı kural, yeşil ve köpüren çizilir) */
  poison?: boolean
  /** Kaygan Dünya (zor mod): bütün zeminler buz gibi kayar */
  slippery?: boolean
  /** Çöken Dünya (zor mod): basılan her yüzey çatlak taş gibi çöker ve bir süre sonra geri gelir */
  crumbleAll?: boolean
  /** Ay Yerçekimi (zor mod): oyuncunun yerçekimi ve düşüş hızı azalır, atlayış yükselir ve süzülür */
  lowGravity?: boolean
  /** Kovalamaca: oyuncunun izini süren bir Kangal (World.chaser); yakalarsa düşülür */
  chaser?: boolean
  /** boss başka bir şehrin boss'u (Bölüm Düzenleyici: istenen boss seçilir); yoksa bölümün şehrininki */
  bossOf?: CityKey
  /** Co-op Boss Kapışması: arenaya ikinci boss (bu şehrin boss'u) arenanın öbür ucundan katılır; kapı ikisi de düşünce açılır */
  bossOf2?: CityKey
  /** Co-op Boss Kapışması ve Bölüm Düzenleyici zorluğu: boss'lar en az bu kademede, bu hız çarpanıyla ve `hp` kadar fazla canla
   *  dövüşür (kural aynı: işaret, saldırı, yorgunluk, bas) */
  bossBoost?: { tier: 1 | 2 | 3; speed: number; hp?: number }
  /** Fırtına (zor mod): rüzgâr (wind) birkaç saniyede bir yön değiştirir: önce arkadan, sonra karşıdan eser */
  storm?: boolean
  /** Ayna Yolu: harita sağdan sola çevrilmiş (game/mirror.ts); hareketli platformlar da ayna fazında başlar */
  mirror?: boolean
  /** final eklenince hesaplanır: finalin ipuçları ve kişileri listelerde nereden başlıyor */
  finaleAt?: { hint: number; npc: number }
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
  | { type: 'grab' }
  | { type: 'swim' }
  | { type: 'dash' }
  | { type: 'land' }
  | { type: 'death'; x: number; y: number }
  | { type: 'respawn' }
  /** derin suda nefes azalıyor: kalan saniye (3, 2, 1) */
  | { type: 'breath'; left: number }
  /** derin suda nefes bitti */
  | { type: 'drown' }
  | { type: 'checkpoint'; index: number }
  | { type: 'collect'; index: number }
  | { type: 'spring' }
  | { type: 'stomp'; x: number; y: number }
  | { type: 'crumble' }
  | { type: 'shoot' }
  | { type: 'complete' }
  | { type: 'crystal' }
  | { type: 'nitro' }
  | { type: 'beat' }
  | { type: 'perfect' }
  | { type: 'key' }
  | { type: 'stamp' }
  /** saklı nazar boncuğu bulundu */
  | { type: 'charm' }
  | { type: 'switch' }
  /** meydan kapısından finale geçildi */
  | { type: 'warp' }
  | { type: 'bossWake'; x: number; y: number }
  /** boss yere/duvara vurdu */
  | { type: 'bossSlam'; x: number; y: number }
  | { type: 'bossHit'; x: number; y: number; hp: number }
  | { type: 'bossDown'; x: number; y: number }
  /** gelgit birazdan değişecek: su yükselecek ya da çekilecek */
  | { type: 'tideUp' }
  | { type: 'tideDown' }
  /** Kovalamaca: Kangal yaklaştı (yetişmesine az kaldı) */
  | { type: 'growl' }
  /** Kovalamaca: Kangal yetişti */
  | { type: 'bite'; x: number; y: number }
  /** co-op: biri ötekinin omzundan sekti */
  | { type: 'shoulder'; x: number; y: number; /** seken eş mi (2. oyuncu) */ partner: boolean }
  /** dost bir hayvanı sevdin */
  | { type: 'pet'; x: number; y: number }
