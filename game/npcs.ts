import type { Npc } from './types'

/** Şehir insanları: 12 genişlik, alttan hizalı. */
export const NPC_ART: Record<Npc['look'], { rows: string[]; pal: Record<string, string> }> = {
  amca: {
    pal: { G: '#5a5560', s: '#e8b48c', e: '#1d1a22', M: '#6a6060', w: '#efe8dc', v: '#4a3a5a', p: '#3a3440', b: '#2a1f22' },
    rows: ['....GGGG....', '...GGGGGGGG.', '...Gsssss...', '...sseesss..', '...ssssss...', '...sMMMMs...', '....ssss....', '...wvvvvw...', '..swvvvvws..', '..swvvvvws..', '...wvvvvw...', '...pppppp...', '...pp..pp...', '...pp..pp...', '..bbb..bbb..'],
  },
  teyze: {
    pal: { F: '#c8553d', f: '#f2d38a', s: '#e8b48c', e: '#1d1a22', d: '#5a3e7a', D: '#7a5a9a', b: '#2a1f22' },
    rows: ['....FFFF....', '...FfFFfF...', '..FFssssF...', '..FsseseF...', '..FFssssF...', '...FFssFF...', '...ddddddd..', '..sdddddds..', '..sddDdddd..', '...dddDddd..', '...dddddd...', '...dddddd...', '...dDddDd...', '...dddddd...', '...bb..bb...'],
  },
  usta: {
    pal: { w: '#f4efe6', s: '#e0a880', e: '#1d1a22', M: '#3a2a22', j: '#3a4a6a', a: '#f4efe6', p: '#3a3440', b: '#2a1f22' },
    rows: ['....wwww....', '...wwwwww...', '...ssssss...', '...sseses...', '...ssssss...', '...ssMMss...', '....ssss....', '...jaaaaj...', '..sjaaaajs..', '..sjaaaajs..', '...jaaaaj...', '...paaaap...', '...pp..pp...', '...pp..pp...', '..bbb..bbb..'],
  },
  genc: {
    pal: { h: '#2a1a14', s: '#eebd96', e: '#1d1a22', m: '#c0705a', o: '#3f8f6a', O: '#2f6f52', p: '#3a3a52', b: '#f4efe6' },
    rows: ['....hhhh....', '...hhhhhhh..', '...hsssssh..', '...sseses...', '...ssssss...', '....ssms....', '...oooooo...', '..sooOOoos..', '..soooooos..', '...oooooo...', '...pppppp...', '...pp..pp...', '...pp..pp...', '...pp..pp...', '..bbb..bbb..'],
  },
  coban: {
    pal: { h: '#3a2a20', s: '#e0a880', e: '#1d1a22', M: '#3a2a20', K: '#8a6a44', k: '#6a4e30', t: '#5a3c26', p: '#3a3440', b: '#2a1f22' },
    rows: ['....hhhh....', '...hhhhhh...', '...ssssss...', '...sseses...', '...sMMMMs...', '....ssss...t', '..KKKKKKKK.t', '.KKkKKKKkKKt', '.KKKKKKKKKst', '.KKkKKKKkK.t', '..KKKKKKKK.t', '..KKKKKKKK.t', '...pp..pp..t', '...pp..pp..t', '..bbb..bbb.t'],
  },
  ozan: {
    pal: { K: '#2a2420', s: '#e0a880', e: '#1d1a22', W: '#f0ece4', c: '#6a2a2a', o: '#a8693a', O: '#7a4a24', b: '#2a1f22' },
    rows: ['....KKKK....', '...KKKKKK...', '...ssssss...', '...sseses...', '...WWWWWW...', '...WWWWWW...', '....WWWW....', '...cccccc...', '..scccccoO..', '..sccccooooO', '...cccoooo..', '...cccccc...', '...cccccc...', '...cccccc...', '..bbb..bbb..'],
  },
}
