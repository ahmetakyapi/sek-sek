import type { Prelude } from './types'

/**
 * Bin gölün yaylası: iki göl, aralarında bent. Birinci göldeki iki yüzen adadan bent taşına geçilir; taşın üstündeki
 * plaka (_) bendin kapağını ([, göğe dek) açar ve ikinci gölde bent taşlarını (]) yüzeye çıkarır. Taşlar olmadan
 * ikinci gölün ortası geçilmez. Adalar üstünde durana bir saniyede batar: durmadan geç. Düğme bayrakla saklanır.
 * Nazar boncuğu ikinci gölde, en son adanın altında suyun içinde: ada batınca ya da yandan dalınca alınır.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: ['Bin gölün yaylası: adalar üstünde durana batar, durmadan geç. Bentteki plaka kapağı açar, öbür gölde taşları yüzeye çıkarır.'],
  hintsEn: ['The pasture of a thousand lakes: the islands sink under anyone who stands still, so keep moving. The plate on the dam opens the gate and raises the stones in the far lake.'],
  npcs: [{ name: 'Arıcı Berivan', look: 'teyze', text: 'Kovanlarımı göl kıyısına koyarım, arılarım suya bakıp oyalanır! Öbür gölün son adasının altında bir göz parlar: adada dur, batınca dal, nefesin yeter.' }],
  npcsEn: [{ name: 'Berivan the Beekeeper', text: 'I set my hives by the lake shore, and my bees dawdle gazing at the water! Under the last island of the far lake an eye glints: stand still on it, dive when it sinks, your breath will last.' }],
  chunks: [
    [
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      '                           [[                                   ',
      ' ?  n                   _  [[                                   ',
      '########WW+++WWW+++WWW#######WW+++WW]]]WWW+++WW]]WW+++WW########',
      '########WWWWWWWWWWWWWW#######WWWWWWWWWWWWWWWWWWWWWWW!WWW########',
      '################################################################',
      '################################################################',
    ],
  ],
}
