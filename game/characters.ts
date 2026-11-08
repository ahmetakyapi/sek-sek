/**
 * İki oynanabilir karakter. Sprite 16×20, yüzü sağa bakar.
 * Çarpışma kutusu 10×14 kalır; sprite ayakları kutunun tabanına oturur.
 */
export type CharacterId = 'uktun' | 'memo'

export interface CharacterDef {
  id: CharacterId
  name: string
  /** hikâye ve diyaloglarda kısa ad */
  short: string
  role: string
  bio: string
  pal: Record<string, string>
  /** baş (10-11 satır, sağa bakar) */
  head: string[]
  /** gövdenin arkasına düşen uzun saç (8. satırdan başlar) */
  hairBack: string[]
  /** at kuyruğu gibi sallanan saç parçası: başa göre ofsetli kareler */
  tail?: { x: number; y: number; frames: string[][] }
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  uktun: {
    id: 'uktun',
    name: 'Uktun',
    short: 'Uktun',
    role: 'Haritacı',
    bio: 'İstanbullu, 26 yaşında. Kadıköy vapurlarında büyüdü, haritaları ezbere bilir ama hiçbir yolu dedesinin defteri kadar merak etmedi. Uzun saçlarını rüzgâra bırakır, yolu hep kendisi bulur.',
    pal: {"e": "#1d1a22", "W": "#ffffff", "r": "#d6403a", "R": "#9e2a2a", "b": "#5a3424", "B": "#3a2018", "o": "#f2c14e", "H": "#5a2420", "h": "#8e3e26", "q": "#b25a30", "Q": "#d27a44", "s": "#f6c8a2", "S": "#d9997a", "n": "#ec8f7e", "m": "#b04652", "j": "#e0a23a", "J": "#a86c1c", "y": "#ffd884", "p": "#3e4a7a", "P": "#2a3256", "X": "#f4e4c0"},
    head: [
      '.....HHHHH......',
      '....HqQQqhH.....',
      '...HqQqqhhhH....',
      '...HhqhhhhhhH...',
      '...HhhSsssshH...',
      '...HhSsesssesS..',
      '...HhSsnssssns..',
      '...HhhSsssmsS...',
      '...Hhh.SSSSS....',
    ],
    hairBack: [
      '..Hhh...........',
      '..Hhq...........',
      '...Hh...........',
      '...Hh...........',
      '....H...........',
    ],
  },
  memo: {
    id: 'memo',
    name: 'Memo Çelik',
    short: 'Memo',
    role: 'Telefoncu',
    bio: 'Diyarbakırlı, 28 yaşında. Surların dibinde küçük bir telefon dükkânı var; kırık ekranı bir bakışta tanır. Cebinde dedesinin defteri ve her şehri kaydettiği eski bir telefon.',
    pal: {"e": "#1d1a22", "W": "#ffffff", "r": "#d6403a", "R": "#9e2a2a", "b": "#5a3424", "B": "#3a2018", "o": "#f2c14e", "H": "#1a1210", "h": "#2e211c", "q": "#4a362c", "Q": "#6a5040", "s": "#e0aa80", "S": "#b87a58", "n": "#c88a68", "m": "#7a3a30", "G": "#3a2a22", "g": "#5a4234", "j": "#2f7a8a", "J": "#1e5662", "y": "#6cb8bc", "p": "#3a3a4a", "P": "#24242e", "X": "#7ad8ff"},
    head: [
      '.....HHHHH......',
      '....HhqQqhH.....',
      '...HhqQqqhhH....',
      '...HhhhhhhhhH...',
      '...HhSsssssSh...',
      '...HSsesssesS...',
      '...HSsssssssss..',
      '....SsGGGGsS....',
      '.....SSsgsSS....',
    ],
    hairBack: [],
  },
}

/** gövde + kollar (satır 9..14): yüz sağa, arka kol 5. sütun, ön kol 11. sütun */
const TORSO: Record<string, string[]> = {
  idle: [
    '......RrrrR.....',
    '.....JyjjjjJ....',
    '.....JjjJjjJ....',
    '.....JjjJjjJ....',
    '.....sjjJjjs....',
    '......JjjjJ.....',
  ],
  runA: [
    '......RrrrR.....',
    '....JJyjjjjJ....',
    '...s.JyJjjJJ....',
    '......jjJjjJs...',
    '......jjJjj.....',
    '......JjjjJ.....',
  ],
  runB: [
    '......RrrrR.....',
    '.....JyjjjjJ....',
    '.....JjjyjJj....',
    '......jjJJjj....',
    '......jjJsj.....',
    '......JjjjJ.....',
  ],
  runC: [
    '......RrrrR.....',
    '.....JyjjjjJJ...',
    '.....JjjJjjjJs..',
    '....s.jjJjj.....',
    '......jjJjj.....',
    '......JjjjJ.....',
  ],
  runD: [
    '......RrrrR.....',
    '.....JyjjjjJ....',
    '.....jjjJJjj....',
    '......jjJJjj....',
    '......jjJsj.....',
    '......JjjjJ.....',
  ],
  jump: [
    '....s.RrrrR.s...',
    '....JJyjjjjJJ...',
    '......jjJjj.....',
    '......jjJjj.....',
    '......jjJjj.....',
    '......JjjjJ.....',
  ],
  fall: [
    '......RrrrR.....',
    '...JJJyjjjjJJJ..',
    '..s...jjJjj...s.',
    '......jjJjj.....',
    '......jjJjj.....',
    '......JjjjJ.....',
  ],
  wall: [
    '......RrrrR..s..',
    '.....JyjjjjJJJ..',
    '.....JjjJjjJ....',
    '......jjJjj.....',
    '......jjJjj.....',
    '......JjjjJ.....',
  ],
}

const LEGS: Record<string, string[]> = {
  idle: [
    '......pPppP.....',
    '......pP.pP.....',
    '......pP.pP.....',
    '......pP.pP.....',
    '.....bbB.bbB....',
  ],
  runA: [
    '......pPPpp.....',
    '.....pP...pP....',
    '....pP.....pP...',
    '....pP......bB..',
    '...bB...........',
  ],
  runB: [
    '......pPpp......',
    '......pPpP......',
    '.......pPpP.....',
    '.......pP.bB....',
    '......bB........',
  ],
  runC: [
    '......ppPPp.....',
    '......pP..pP....',
    '.....pP....pP...',
    '....bB.....pP...',
    '...........bbB..',
  ],
  runD: [
    '.......pPp......',
    '......pPpP......',
    '.....pP.pP......',
    '....bB..pP......',
    '........bbB.....',
  ],
  jump: [
    '......pPPpp.....',
    '......pP..pP....',
    '.....bB...pP....',
    '..........bB....',
    '................',
  ],
  fall: [
    '......pPpPp.....',
    '.....pP...pP....',
    '.....pP...pP....',
    '....bbB...bbB...',
    '................',
  ],
  wall: [
    '......pPPp......',
    '......pP.pP.....',
    '......pP..bB....',
    '.....bbB........',
    '................',
  ],
}

export type Pose = 'idle' | 'runA' | 'runB' | 'runC' | 'runD' | 'jump' | 'fall' | 'wall'

/** Katmanları üst üste koyar: saç arkası → gövde → bacak → baş. bob: nefes/koşu sallanması (bacaklar yerde kalır). */
export function frameRows(c: CharacterDef, pose: Pose, bob: number, blink = false): string[] {
  const g = Array.from({ length: 20 }, () => Array(16).fill('.'))
  const over = (rows: string[], y0: number) =>
    rows.forEach((r, j) => {
      const y = y0 + j
      if (y < 0 || y >= 20) return
      for (let i = 0; i < r.length; i++) if (r[i] !== '.') g[y][i] = r[i]
    })
  over(c.hairBack, 9 + bob)
  over(TORSO[pose], 9 + bob)
  over(LEGS[pose], 15)
  over(blink ? c.head.map((r) => r.replace(/e/g, 'S')) : c.head, bob)
  return g.map((r) => r.join(''))
}

