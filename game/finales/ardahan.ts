import type { Prelude } from './types'

/**
 * Donmuş Çıldır Gölü: çatlak buz üstünde durmadan koş (ilkinin altı taş, güvenle öğretir; sonrakilerin altı göl).
 * Gölün ortasında Akçakale kayalığı yolu keser: balıkçı kulübesindeki çatlak buzda bu kez durmak gerekir,
 * buz kırılınca kayanın altındaki oyuktan geçilir. Nazar boncuğu oyuğun solunda, sahte duvarın ardında.
 */
export const prelude: Prelude = {
  medal: 65,
  hints: [
    'Çıldır’ın buzu çatlak: üstünde durursan kırılır. İlk çatlağın altı taş, orada dene; sonrakilerin altı göl, durmadan koş!',
    'Akçakale kayalığı yolu kesti. Balıkçı kulübesindeki çatlak buzda bu kez dur: buz kırılsın, kayanın altından geç.',
  ],
  hintsEn: [
    'The ice on Lake Çıldır is cracked: stand on it and it breaks. The first crack has rock beneath, try it there; the rest are over the lake, so keep running!',
    'The Akçakale rock blocks the way. On the cracked ice in the fishing hut, stand still this time: let it break and pass under the rock.',
  ],
  npcs: [{ name: 'Balıkçı Kadir Dayı', look: 'amca', text: 'Çıldır’da balığı buzun altından tutarız: deliği açar, ağı salar, sabırla bekleriz. Buzda koşan geçer, duran düşer; ama bazen düşmek de bir yoldur. Kulübemin altına inince sola da bir bak.' }],
  npcsEn: [{ name: 'Uncle Kadir the Fisherman', text: 'On Çıldır we fish from under the ice: cut the hole, lower the net, wait patiently. On ice the runner crosses and the dawdler falls; but sometimes falling is a way through. When you drop below my hut, take a look to the left too.' }],
  chunks: [
    [
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                        ##                      ',
      '                                    ######                      ',
      '                                        ##                      ',
      ' ? n                              ?     ##    l            l k  ',
      '######IIIXXXXIIXXXXXXXXII   XXX  IIIIXXI##  IIIIXXXX  XXX#######',
      '###############        ##        ## %       ####         #######',
      '###############~~~~~~~~##~~~~~~~~##!%      #####~~~~~~~~~#######',
      '###############~~~~~~~~##~~~~~~~~###############~~~~~~~~~#######',
    ],
  ],
}
