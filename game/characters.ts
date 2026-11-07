/**
 * İki oynanabilir karakter. Sprite 16×20, yüzü sağa bakar.
 * Çarpışma kutusu 10×14 kalır; sprite ayakları kutunun tabanına oturur.
 */
export type CharacterId = 'uktun' | 'kerem'

export interface CharacterDef {
  id: CharacterId
  name: string
  role: string
  bio: string
  pal: Record<string, string>
  /** baş + gövde (15 satır) */
  body: string[]
  /** at kuyruğu gibi sallanan saç parçası: başa göre ofsetli kareler */
  tail?: { x: number; y: number; frames: string[][] }
}

const SHARED = {
  e: '#1d1a22',
  W: '#ffffff',
  m: '#c0705a',
  n: '#f0a090',
  s: '#f2c49c',
  S: '#d99e78',
  r: '#d6403a',
  R: '#9e2a2a',
  k: '#8a5a35',
  K: '#6b4428',
  f: '#e30a17',
  F: '#ffffff',
  b: '#5a3424',
  B: '#3a2018',
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  uktun: {
    id: 'uktun',
    name: 'Uktun',
    role: 'Haritacı',
    bio: 'Ankaralı, 26 yaşında. Haritaları ezbere bilir ama hiçbir yolu dedesinin defteri kadar merak etmemiştir. Uzun saçlarını rüzgâra bırakır, yolu hep kendisi bulur.',
    pal: {
      ...SHARED,
      h: '#7a3420',
      H: '#4e1c10',
      j: '#e0a23a',
      J: '#b47a22',
      y: '#f6d48a',
      p: '#55507e',
      P: '#3e3a62',
      l: '#d9666e',
      g: '#f2c14e',
    },
    body: [
      '.....HHHHH......',
      '....HhhhhhhH....',
      '...HhhhhhhhhH...',
      '..HhhhhhhhhhhH..',
      '..HhhhhhSsshhH..',
      '..HhhhSsesssesH.',
      '.HhhhSssesssesh.',
      '.HhhgSsnsssssnh.',
      '.HhhhHSssslssh..',
      '.HhhhhHSSsss.h..',
      '.Hhhhrrrrrrrrh..',
      '.HhhhrRjjjyjjr..',
      '.HhhhHJjjyjjjj..',
      '..HhhHJjjyjjjjs.',
      '..HHhHJjjyjjjjs.',
    ],
  },
  kerem: {
    id: 'kerem',
    name: 'Kerem',
    role: 'Fotoğrafçı',
    bio: 'İstanbullu, 28 yaşında. Boynunda eski bir fotoğraf makinesi, cebinde dedesinin defteri. Her şehri bir kareye sığdırmak istiyor.',
    pal: {
      ...SHARED,
      h: '#2e2219',
      H: '#1a120c',
      j: '#2f7a8a',
      J: '#215a68',
      y: '#c9d6dc',
      p: '#44669a',
      P: '#30507c',
      c: '#1d1a22',
      C: '#9aa3b5',
    },
    body: [
      '................',
      '.....HHHHHH.....',
      '....HhhhhhhhH...',
      '...HhhhhhhhhhH..',
      '...HhhhhhhhhhH..',
      '...HhSHHssHHh...',
      '...HhSsessseS...',
      '...HSssessseS...',
      '...HSsnsssssn...',
      '....SSsssmsS....',
      '...rrrrrrrrrr...',
      '..KkrRjccjjjr...',
      '..KfJjcCcjjjj...',
      '..KkJjjccjjjjs..',
      '..KkJjjjjyjjjs..',
    ],
  },
}

const LEGS: Record<string, string[]> = {
  idle: ['...JJJJJJJJ.....', '....pppPpp......', '....pp..pp......', '....pp..pp......', '...bbb..bbbB....'],
  runA: ['...JJJJJJJJ.....', '...pppPPppp.....', '..pp.....ppp....', '.pp........bb...', '.bb.............'],
  runB: ['...JJJJJJJJ.....', '.....pppp.......', '.....pp.pp......', '.....pp.pp......', '.....bb.bbB.....'],
  runC: ['...JJJJJJJJ.....', '....ppPPpp......', '....pp...ppp....', '...pp.....bb....', '...bb...........'],
  jump: ['...JJJJJJJJ.....', '...pppp.pp......', '..pp...pp.......', '..bb....pp......', '........bb......'],
  fall: ['...JJJJJJJJ.....', '...pp...pp......', '..pp.....pp.....', '..pp......pp....', '.bb.......bb....'],
  wall: ['...JJJJJJJJ.....', '....pp.ppp......', '....pp...pp.....', '....pp....bb....', '...bbb..........'],
}

export type Pose = keyof typeof LEGS

export function frameRows(c: CharacterDef, pose: Pose, bob: number, blink = false): string[] {
  let body = c.body
  if (blink) body = body.map((r) => r.replace(/[eW]/g, 'S'))
  // nefes / koşu sallanması: boyun satırı düşer, ayaklar yerde kalır
  if (bob) body = ['................', ...body.slice(0, 9), ...body.slice(10)]
  return [...body, ...LEGS[pose]]
}

export const SPRITE_W = 16
export const SPRITE_H = 20
