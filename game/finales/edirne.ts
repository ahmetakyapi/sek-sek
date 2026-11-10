import type { Prelude } from './types'

/**
 * Kırkpınar er meydanı: itilen sandık burada tanışılır. Önce tribünden meydana inilir, sandık duvara kadar itilir,
 * üstünden rafa çıkılır. Sonra ikinci sandık tahta iskelenin ucundan aşağı düşürülür, inilip karşı duvara sürülür.
 * Kilit yok: ters yöne itilen sandık tribünün ya da iskelenin altındaki suya düşer ve ilk yerine döner; iskelenin
 * altındaki basamak oyuncuyu yine yukarı çıkarır. Nazar boncuğu ikinci sandığın tam üstündeki rafta: sandık
 * düşürülmeden önce üstüne çıkılıp alınır (düşürüldüyse suya itilip geri getirilir).
 */
export const prelude: Prelude = {
  medal: 45,
  hints: [
    'Er meydanı! Sandığa doğru yürü, itilir. Duvara dayanınca üstüne çık, oradan zıpla. Ters gittiyse sola, suya it: sandık yerine döner.',
    'Bu sandığı iskelenin ucundan aşağı it. Sonra in, soluna geç, karşı duvara kadar sür. Geri çıkmak için iskelenin altındaki taşa çık, oradan zıpla.',
  ],
  hintsEn: [
    'The wrestling field! Walk into the crate to push it. When it meets the wall, climb on and jump from there. Went the wrong way? Push it left into the water and it comes back.',
    'Push this crate off the end of the scaffold. Then drop down, get to its left and slide it to the far wall. To climb back up, hop onto the stone under the scaffold and jump.',
  ],
  npcs: [{ name: 'Pehlivan Recep', look: 'genc', text: 'Kırkpınar’da 14. yüzyıldan beri güreş tutulur derler; kispetimiz manda derisindendir. Pehlivan yükünü iter ama aceleyle değil: sandığı iskeleden aşağı yuvarlamadan önce bir üstüne çık, başını kaldır da bak.' }],
  npcsEn: [{ name: 'Recep the Wrestler', text: 'They say men have wrestled at Kırkpınar since the 14th century; our kispet trousers are made of buffalo hide. A wrestler pushes his load, but never in a hurry: before you roll the crate off the scaffold, climb on top of it and look up.' }],
  chunks: [
    [
      '                               !                        ',
      '                              ===                       ',
      '                                                        ',
      '                    F  ?       p                        ',
      '                  ##########====      ######            ',
      '       #####      ##########          ######            ',
      ' ?  n #####   p   ###########         ######    l    k  ',
      '###########~#################~##########################',
      '###########~#################~##########################',
      '########################################################',
      '########################################################',
    ],
  ],
}
