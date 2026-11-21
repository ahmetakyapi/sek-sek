import type { Prelude } from './types'

/**
 * Artemis Tapınağı'nın Sütunları: tek düğme (plaka), iki takım taş. Mavi taşlar (]) düğme açıkken, turuncu taşlar ([)
 * düğme kapalıyken katıdır; her plaka basışta düğmeyi çevirir. Üç plaka da çukurun ya da sahanlığın tam kıyısında: bas,
 * önündeki yol belirsin (üstünden atlarsan çukura düşersin). Her basışta bir öncekinin yolu kaybolur: sıra önemli.
 *  1. Giriş plakası: mavi köprü çıkar, geç. Bayrağın ardında mavi sütunlar iki basamak yükselir (düğme açıkken katı).
 *  2. Sütunların tepesindeki sahanlıkta plakaya bas: düğme kapanır, mavi sütunlar kaybolur (arkanda kalır), çukurun
 *     üstünde turuncu köprü belirir. Köprünün ardında basamaklarla yere inilir, bayrak.
 *  3. Son çukurun kıyısındaki plaka düğmeyi yeniden açar, mavi köprü çıkar. Bu plakanın ardında, bayraktan sonra, ritim
 *     basamakları ({ }) yükselir: kaybolmadan önce yanıp sönen takımdan öbürüne zıpla; en tepedeki taş sahanlıkta nazar
 *     boncuğu. Düşen yere iner, yeniden dener.
 * Düğme bayrakla saklanır: ölen, bayrağı aldığı düğme durumuyla doğar; her durumdan bir plakaya dönülür (kilitlenme yok).
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Artemis’in sütunları: mavi taşlar plaka açıkken, turuncu taşlar plaka kapalıyken durur. Plaka çukurun kıyısında: bas, köprü belirsin. Her basış bir öncekinin yolunu kaldırır.',
    'Mavi sütunların tepesindeki plaka düğmeyi kapatır: turuncu köprü gelir, mavi sütunlar gider. Aşağıda ritim basamakları var: yanıp sönen takımdan öbürüne zıpla; en tepede nazar boncuğu parlıyor.',
  ],
  hintsEn: [
    'The columns of Artemis: blue stones stand while the plate is on, orange stones while it is off. The plate sits at the edge of the pit: step on it and the bridge appears. Every press removes the way behind you.',
    'The plate on top of the blue columns switches the stones off: the orange bridge comes and the blue columns go. Below there are rhythm steps: jump from the blinking set to the other one; a nazar bead glints at the very top.',
  ],
  npcs: [{ name: 'Efe Necati', look: 'amca', text: 'Artemis’in tapınağında yüz yirmi yedi sütun vardı derler, bir tanesi bile yerli yerinde sayılmazdı: her biri bir sıraya girerdi. Bastığın plakayı say; çifte basan yerinde sayar. Bayraktan sonra yükselen ritim taşlarının tepesinde de bir şey parlıyor, ama oraya çıkmak sabır ister.' }],
  npcsEn: [{ name: 'Efe Necati', text: 'They say the temple of Artemis had a hundred and twenty-seven columns, and every one of them kept to its row. Count the plates you step on: step twice and you stay where you were. Something also glints at the top of the rising rhythm stones after the flag, but getting up there takes patience.' }],
  chunks: [
    [
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                                       ',
      '                                                         !             ',
      '                                                        ##             ',
      '                                                        ##             ',
      '                                                     {{                ',
      '                                                                       ',
      '                                                  }}                   ',
      '                            _                                          ',
      '                      ]] ####[[[[[[[####       {{                      ',
      '                      ]] ####       ####                               ',
      '                   ]] ]] ####       ######  ##                         ',
      ' ? n    _        F ]] ]] ####       ######?F##             _           ',
      '#########]]]]]]]#############       ########################]]]]]]]####',
      '#########       #############       ########################       ####',
      '#########^^^^^^^#############^^^^^^^########################^^^^^^^####',
      '#######################################################################',
    ],
  ],
}
