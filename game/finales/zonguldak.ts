import type { Prelude } from './types'

/**
 * Maden kuyusu: kafes asansörleri ve havalandırma kapakları. Bir plaka hepsini birden çevirir: dikey kapı ve sağdaki
 * yatay kapak ([) birlikte açılıp kapanır, soldaki yatay kapak (]) tersine.
 *  1. Kafes A oyuncuyu galeriye çıkarır. İlk plaka havalandırma kapısını açar, ama sağdaki kapak da açılır (delik).
 *  2. Kapağın önünde havada asılı dar taşın üstünde ikinci plaka: üstüne zıpla, kapak kapanır, üstünden geç.
 *     Basmadan yürüyen kapaktan eski hava odasına düşer (kapan yok): odadaki plaka soldaki kapağı açar, yay yukarı atar.
 *  3. Kafes B dikenli kuyuya iner; kuyunun dibindeki yeraltı yolundan çıkış.
 * Nazar boncuğu kafes B'nin yolunda, kuyunun karşı duvarındaki kömür damarında: kafes inerken sağa adım at
 * (ya da galerinin ucundan atla); kafes hep geri gelir.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: ['Vardiya başlıyor: kafese bin, galeriye çık. Plaka havalandırma kapaklarının hepsini birden çevirir: biri açılırsa öbürü kapanır. Basmadan önce önündeki kapağa bak.'],
  hintsEn: ['The shift begins: board the cage and ride up to the gallery. A plate turns all the vent hatches at once: when one opens, the other closes. Look at the hatch ahead before you press.'],
  npcs: [{ name: 'Vardiya Amiri Turgay', look: 'amca', text: 'Kırk yıl bu kuyuda vardiya tuttum evlat. Kapaktan düşen eski hava odasına iner; korkma, yay seni yukarı atar. İkinci kafes inerken herkes ayağının altına bakar; ben karşı duvara bakarım, kömür damarında bir göz parlar.' }],
  npcsEn: [{ name: 'Turgay the Shift Foreman', text: 'I kept the shift in this shaft for forty years, my child. Whoever falls through a hatch lands in the old air room; no fear, the spring throws you back up. When the second cage goes down, everyone looks at their feet; I look at the far wall, an eye glints in the coal seam.' }],
  chunks: [
    [
      '           ###############################            ',
      '           ###############################            ',
      '           ###############################            ',
      '           ###############################            ',
      '           ###############################            ',
      '                 [                ########            ',
      '                 [   _            ########            ',
      '                 [   ##           ########            ',
      '                 [                ########            ',
      '        :    _   [             :  ########            ',
      '           #######]]]###[[[####NNN########            ',
      '           #######         ####     ######            ',
      '           #######         ####    !######            ',
      '           #######         ####   ########            ',
      '           ####### S   _   ####                       ',
      '           ####################                       ',
      '           ####################                       ',
      '           ####################   ########            ',
      '           ####################:  ############        ',
      '  ?  n  NNN####################^^^############   l    ',
      '######################################################',
      '######################################################',
      '######################################################',
      '######################################################',
    ],
  ],
}
