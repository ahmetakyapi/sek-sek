import type { Prelude } from './types'

/**
 * Boztepe teleferiği: vadiyi gidip gelen kabinlerle geç. İlk kabin fındık bahçesinin üstünde güvenle öğretir;
 * sonra iki kabin vadinin ortasında kavuşur (birinden ötekine atla), en sonda ikincisi bir basamak yukarıdan geçer.
 * Direk adasında dalda saksağan bekler. Nazar boncuğu bahçe çukurunun dibindeki sahte duvarın ardında.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Boztepe teleferiği: kabine bin, karşıya varınca yamaca zıpla. Alttaki fındık bahçesi yumuşaktır, düşersen korkma.',
    'İki kabin vadinin ortasında kavuşur: yan yana geldiklerinde ötekine atla. Karşıdaki dalda saksağan bekler; kanat çırparsa dalacak demektir, durma, altından koşup geç!',
  ],
  hintsEn: [
    'Boztepe cable car: ride the cabin and hop onto the slope on the far side. The hazelnut grove below is soft, so do not fear a fall.',
    'The two cabins meet in the middle of the valley: jump across when they are side by side. A magpie waits on the branch beyond; when it flaps it is about to dive, so do not stop, run under it!',
  ],
  npcs: [{ name: 'Çaycı Nuriye Abla', look: 'teyze', text: 'Boztepe’nin çayı demli, manzarası bedava. Kabinler acele etmez, sen de etme; ikisi ortada kavuşunca geç. Bahçenin dibine de bir bak: sincaplar fındığı kovuğa saklar.' }],
  npcsEn: [{ name: 'Nuriye the Tea Seller', text: 'Boztepe’s tea is strong and the view is free. The cabins never hurry, and neither should you; cross when the two meet in the middle. Take a look at the bottom of the grove too: squirrels hide their hazelnuts in a hollow.' }],
  chunks: [
    [
      '                                         j                         ',
      '                                                                   ',
      '                                                                   ',
      '                                                           t       ',
      '                 ?                   t            |    MMM###      ',
      '                ####MMM    |    MMM########MMM    |       #####    ',
      ' ? n  l         ####               ########               #####  l ',
      '########MMM     ####               ########               #########',
      '#####! % k      ####               ########               #########',
      '####################~~~~~~~~~~~~~~~########~~~~~~~~~~~~~~~#########',
      '####################~~~~~~~~~~~~~~~########~~~~~~~~~~~~~~~#########',
    ],
  ],
}
