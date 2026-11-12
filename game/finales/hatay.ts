import type { Prelude } from './types'

/**
 * Hatay Arkeoloji Müzesi, mozaik salonları: plakaya basınca turuncu ve mavi mozaik taşları yer değiştirir
 * (bas, atla, bas, bas). 1) Girişteki plaka turuncu duvarı kaldırır, mavi köprüyü kurar · 2) köprünün başındaki plakaya
 * basılmaz, üstünden atlanır (basan köprüyü kaldırır; inip yeniden basar) · 3) mavi duvarın önündeki plaka duvarı
 * açar, dikenli salona turuncu taşları serer · 4) adadaki plaka turuncuyu kaldırıp mavi taşı getirir.
 * Nazar boncuğu ikinci salonun tavanında: "yanlış" plakaya bilerek basınca beliren turuncu merdivenin ucunda.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: [
    'Arkeoloji Müzesi. Plakaya bas: turuncu taşlar kalkar, mavi taşlar yerine oturur. Bir daha basarsan geri döner.',
    'Köprü mavi taştan. Önündeki plakaya basarsan köprü kalkar: üstünden atla. Bastıysan in, yeniden bas.',
    'Dikenli salon. Turuncu taşlara bas, adaya çık. Adadaki plaka sıradaki mavi taşı getirir.',
  ],
  hintsEn: [
    'The Archaeology Museum. Step on the plate: the orange stones lift away and the blue ones settle into place. Step again and they swap back.',
    'The bridge is made of blue stones. Step on the plate in front of it and the bridge lifts: hop over it. If you pressed it, step off and press again.',
    'The hall of spikes. Cross on the orange stones and climb onto the island. The plate there brings the next blue stone.',
  ],
  npcs: [{ name: 'Müze Bekçisi Mustafa', look: 'amca', text: 'Bu salonlarda Roma’dan kalma mozaikler yatar evlat; Okeanos ile Tethys bile burada. Taşlar renk renk dizilir, her plaka resmi değiştirir. Köprünün başındaki plakaya bir kez bilerek bas, sonra başını kaldır: tavana çıkan turuncu taşlar bir şey saklıyor.' }],
  npcsEn: [{ name: 'Mustafa the Museum Guard', text: 'Roman mosaics lie in these halls, my child; even Oceanus and Tethys are here. The stones are laid colour by colour, and every plate changes the picture. Step on the plate at the head of the bridge once on purpose, then look up: the orange stones climbing to the ceiling are hiding something.' }],
  chunks: [
    [
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[                      ]]                                ',
      '            [[  !                   ]]                                ',
      '            [[  [[                  ]]                                ',
      '            [[                      ]]                                ',
      '            [[     [[               ]]                                ',
      '            [[                      ]]                                ',
      '            [[  [[                  ]]                                ',
      '            [[                      ]]             _                  ',
      '            [[     [[               ]]        [[  ###  ]]             ',
      ' ?  n    _  [[ ?      _          _  ]] F ?  ^^^^^^###^^^^^^    l      ',
      '#########################]]]]]########################################',
      '#########################     ########################################',
      '#########################^^^^^########################################',
      '######################################################################',
    ],
  ],
}
