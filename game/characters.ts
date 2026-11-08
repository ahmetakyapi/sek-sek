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
    pal: {"e": "#1d1a22", "W": "#ffffff", "m": "#b04652", "r": "#d6403a", "R": "#9e2a2a", "o": "#f2c14e", "b": "#5a3424", "B": "#3a2018", "H": "#3c1418", "h": "#86361f", "q": "#b05428", "Q": "#e08a4a", "s": "#f6c8a2", "S": "#d9997a", "n": "#ec8f7e", "j": "#e0a23a", "J": "#a86c1c", "y": "#ffd884", "p": "#3e4a7a", "P": "#2a3256", "X": "#f4e4c0", "x": "#c79a62"},
    head: [
      '....HHHHH.......',
      '..HHhqqQQhH.....',
      '.HhqqQQQqqhH....',
      '.HhqqqqqhhqhH...',
      'HhhqhhhhhqqhhH..',
      'HhhhhhhHssshhhH.',
      'HhhhhhHsesssesH.',
      'HhhhhhHSsnsssss.',
      'hHhhhhhHSsssms..',
      'HhhhhhhhHSSsS...',
    ],
    hairBack: [
      'Hhhhh...........',
      'Hhhhq...........',
      'hHhhh...........',
      'Hhhqh...........',
      'HhhH............',
      '.Hh.............',
      '.H..............',
    ],
  },
  memo: {
    id: 'memo',
    name: 'Memo Çelik',
    short: 'Memo',
    role: 'Telefoncu',
    bio: 'Diyarbakırlı, 28 yaşında. Surların dibinde küçük bir telefon dükkânı var; kırık ekranı bir bakışta tanır. Cebinde dedesinin defteri ve her şehri kaydettiği eski bir telefon.',
    pal: {"e": "#1d1a22", "W": "#ffffff", "m": "#7a3a30", "r": "#d6403a", "R": "#9e2a2a", "o": "#f2c14e", "b": "#5a3424", "B": "#3a2018", "H": "#120c0c", "h": "#2a1e1a", "q": "#40302a", "Q": "#5e4a40", "s": "#d9a67c", "S": "#a8714e", "n": "#c48262", "j": "#2f7a8a", "J": "#1e5662", "y": "#6cb8bc", "p": "#3a3a4a", "P": "#24242e", "X": "#7ad8ff", "x": "#1d1a22"},
    head: [
      '.....HqHHH......',
      '...HHqQqqhH.....',
      '..HhqQQqqhhH....',
      '..HhhhqhhhhhH...',
      '..HhhhhhhhhhhH..',
      '..HhSHssssssh...',
      '..HSsSsessess...',
      '...SsssessesS...',
      '...HSsssssssss..',
      '...HHsHhhhhHs...',
      '....HHHhmmhH....',
    ],
    hairBack: [],
  },
}

/** gövde + kollar (satır 10..14): yüz sağa, arka kol 6. sütun, ön kol 12. sütun */
const TORSO: Record<string, string[]> = {
  idle: [
    '.......rrrrR....',
    '......JRjjjjJ...',
    '......JjjyjjJ...',
    '......JjjyjjJ...',
    '......sjjyjjXs..',
  ],
  runA: [
    '.......rrrrR....',
    '.....JJRjjjjjJ..',
    '....sJ.jjyjjjjs.',
    '.......jjyjjj...',
    '.......jjyjjj...',
  ],
  runB: [
    '.......rrrrR....',
    '......JRjjjjJ...',
    '......JjjyjJj...',
    '.......jjyJjj...',
    '.......jjysjj...',
  ],
  runC: [
    '.......rrrrR....',
    '......JRjjjjjJ..',
    '.....JjjjyjjjJs.',
    '....s.jjjyjjj...',
    '.......jjyjjj...',
  ],
  runD: [
    '.......rrrrR....',
    '......JRjjjjJ...',
    '......JjjyJjj...',
    '.......jjyJjj...',
    '.......jjyjsj...',
  ],
  jump: [
    '....s..rrrrR.s..',
    '....JJ.Rjjjj.J..',
    '.....JJjjyjjJ...',
    '.......jjyjjj...',
    '.......jjyjjj...',
  ],
  fall: [
    '.......rrrrR....',
    '....JJJRjjjjJJ..',
    '...s...jjyjjj.Js',
    '.......jjyjjj...',
    '.......jjyjjj...',
  ],
  wall: [
    '.......rrrrR..s.',
    '......JRjjjjJJJ.',
    '......JjjyjjJ...',
    '.......jjyjjj...',
    '.......jjyjjj...',
  ],
}

const LEGS: Record<string, string[]> = {
  idle: [
    '.......JjjjjJ...',
    '.......pPp.pP...',
    '.......pP..pP...',
    '.......pP..pP...',
    '......bbB.bbB...',
  ],
  runA: [
    '.......JjjjjJ...',
    '.......ppPPpp...',
    '......pP....pP..',
    '.....pP......bB.',
    '....bB..........',
  ],
  runB: [
    '.......JjjjjJ...',
    '........pPpp....',
    '........pPpP....',
    '........pPbB....',
    '.......bbB......',
  ],
  runC: [
    '.......JjjjjJ...',
    '.......ppPPpp...',
    '......pp...pP...',
    '.....bB.....pP..',
    '............bbB.',
  ],
  runD: [
    '.......JjjjjJ...',
    '........ppPp....',
    '.......pPpP.....',
    '......bB.pP.....',
    '.........bbB....',
  ],
  jump: [
    '.......JjjjjJ...',
    '.......pppPPp...',
    '.......pP...pP..',
    '.......bB...pP..',
    '............bB..',
  ],
  fall: [
    '.......JjjjjJ...',
    '......pP...pP...',
    '.....pP.....pP..',
    '.....pP.....pP..',
    '....bbB....bbB..',
  ],
  wall: [
    '.......JjjjjJ...',
    '.......pPPpp....',
    '.......pP..pP...',
    '.......pP...bB..',
    '......bbB.......',
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
  over(c.hairBack, 8 + bob)
  over(TORSO[pose], 10 + bob)
  over(LEGS[pose], 15)
  over(blink ? c.head.map((r) => r.replace(/e/g, 'S')) : c.head, bob)
  return g.map((r) => r.join(''))
}

