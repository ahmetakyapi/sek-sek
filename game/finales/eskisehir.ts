import type { Prelude } from './types'

/**
 * Nasreddin Hoca’nın eşeğinin yolu: köprünün taşları çatlak, üstünde duran düşer; eşek gibi durmadan yürüyen geçer.
 * Önce güvenli: çatlak köprünün altı sığ hendek, düşen yürüyüp çıkar. Sonra dikenin üstünde aynı köprü.
 * En sonda ahırın damı duvara dayanır: çatlak taşta bilerek durulur, ahıra inilir, ahırdan sağa çıkılır.
 * Nazar boncuğu ahırın arka (sol) köşesinde: Hoca gibi "ters bakan", indiği yerden sola dönen görür.
 */
export const prelude: Prelude = {
  medal: 35,
  hints: [
    'Hoca’nın eşeği hiç durmaz. Köprünün taşları çatlak: üstünde durursan kırılır. Durmadan yürü!',
    'Bu köprünün altında diken var. Hızını kesme, karşıya kadar yürü.',
    'Dam duvara dayandı. Bu kez çatlak taşın üstünde dur: kırılır, ahıra inersin. Yol ahırdan sağa gider.',
  ],
  hintsEn: [
    'Hoca’s donkey never stops. The bridge stones are cracked: stand still and they break. Keep walking!',
    'There are spikes under this bridge. Don’t slow down, walk all the way across.',
    'The roof ends at a wall. This time stand still on the cracked stones: they break and you drop into the barn. The way goes on to the right.',
  ],
  npcs: [{ name: 'Şato Bekçisi Gülizar', look: 'teyze', text: 'Hoca bizim Sivrihisar’ın çocuğudur. Eşeğine hep ters binermiş, “Ben geride kalanı görmek isterim” dermiş. Sen de ahıra inince bir kere Hoca gibi ters dön evladım; arka köşede bir göz seni bekler.' }],
  npcsEn: [{ name: 'Gülizar the Castle Keeper', text: 'Hoca was a child of our own Sivrihisar. He always rode his donkey backwards: “I like to see what I leave behind,” he would say. When you drop into the barn, turn around once like Hoca, my dear; an eye is waiting for you in the back corner.' }],
  chunks: [
    [
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                                ##            ',
      '                                   ?            ##            ',
      '                                #############XXX##            ',
      '                                #                             ',
      ' ?  n  l         F ?          ###!                    l   k   ',
      '###########XXXX#######XXXXX###################################',
      '###########    #######^^^^^###################################',
      '##############################################################',
      '##############################################################',
    ],
  ],
}
