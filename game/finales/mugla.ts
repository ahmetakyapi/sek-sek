import type { Prelude } from './types'

/**
 * Rüzgâr yönü: rüzgâr gülü (plaka) yönü çevirir. Lodos eserken turuncu taşlar, poyraz eserken mavi taşlar durur.
 * İki rüzgâr gülü, üç sal, tek soru: hangi taş ne zaman lazım?
 *  1. Sal ile kaya oyuğuna geç, rüzgâr gülüne bas (poyraz): oyuğun önünde mavi basamaklar belirir, kayanın tepesine çık.
 *  2. Tepeden sekiye çıkan basamaklar turuncu: poyrazla gelen çıkamaz, oyuktaki rüzgâr gülü de artık aşağıda kaldı
 *     (dönersen mavi basamaklar gider). İkinci rüzgâr gülü salın öbür ucundaki tünekte: sal ile git, bas (lodos),
 *     sal ile geri dön. Dönüşte turuncu taş salın yolunu keser: üstünden atlanır (ya da üstünden sekiye çıkılır).
 *  3. Seki (bayrak, lodosla alınır): son sal, yolunda yine bir turuncu taş.
 * Kilitlenme yok: her yerden bir rüzgâr gülüne dönülür. Plakasız, yalnız birinci ya da yalnız ikinci plakayla sona
 * varılamadığı çözücüyle denendi.
 * Nazar boncuğu kaya oyuğunun dibinde, mavi kapının ardında: kapı yalnız lodosta açıktır, yani rüzgâr gülüne basmadan
 * üstünden atlayan alır (basan, bir daha basıp kapıyı açabilir).
 */
export const prelude: Prelude = {
  medal: 100,
  hints: [
    'Rüzgâr gülüne basınca yön döner: turuncu lodos taşları gider, mavi poyraz taşları gelir. Bir daha basarsan geri döner. Sal yanaşınca bin; ilk rüzgâr gülü karşıdaki kaya oyuğunda.',
    'Sekiye çıkan basamaklar turuncu, sen poyrazla geldin. Oyuktaki rüzgâr gülü aşağıda kaldı; ona dönersen mavi basamaklar gider. Denize bak: salın öbür ucunda bir tane daha var.',
    'Son geçit. Sal yanaşınca bin, yolundaki turuncu taşın üstünden atla, karşı sekiye varınca in. Deniz derin, acele etme.',
  ],
  hintsEn: [
    'Step on a wind rose and the wind turns: the orange lodos stones go, the blue poyraz stones come. Step again and it turns back. Board the raft when it comes in; the first wind rose is in the rock hollow across the water.',
    'The steps up to the ledge are orange, and you came with the poyraz. The wind rose in the hollow is below you now; go back to it and the blue steps vanish. Look out to sea: there is another one at the far end of the raft’s run.',
    'The last crossing. Board the raft when it comes in, jump over the orange stone in its way, and step off at the far ledge. The sea is deep, so do not rush.',
  ],
  npcs: [{ name: 'Paraşüt Pilotu Alper', look: 'genc', text: 'Babadağ’dan atlayan önce rüzgâra bakar: lodos mu, poyraz mı? Burada yönü sen çevirirsin; ama her çevirişte bir yol açılır, bir yol kapanır. Kaya oyuğuna girince rüzgâr gülüne hemen basma: oyuğun dibinde bir şey parlıyor, poyraz eserse kapısı kapanır.' }],
  npcsEn: [{ name: 'Alper the Paragliding Pilot', text: 'Whoever jumps from Babadağ reads the wind first: lodos or poyraz? Here you turn it yourself, but every turn opens one way and closes another. When you enter the rock hollow, do not step on the wind rose at once: something shines at the back, and its door shuts when the poyraz blows.' }],
  chunks: [
    [
      '                                              [                 ',
      '                                     F ?      [                 ',
      '                                [[ #####|MMMM     | ####        ',
      '                                                                ',
      '                             [[                                 ',
      '                                                                ',
      '                          [[                                    ',
      '                        ? [[      [                             ',
      '                    ###########   [      _                      ',
      '                       ########MMMM     ###                     ',
      '                   ]   ########                                 ',
      '                       ########                                 ',
      '               ]]      ########                                 ',
      '                           ]  #                                 ',
      '                  ]]       ]  #                                 ',
      ' ?  n    |MMM     |     _F ] !#                              l  ',
      '########~~~~~~~~~~~~###########~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
      '########~~~~~~~~~~~~###########~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
      '########~~~~~~~~~~~~###########~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
      '########~~~~~~~~~~~~###########~~~~~~~~~~~~~~~~~~~~~~~~~~#######',
    ],
  ],
}
