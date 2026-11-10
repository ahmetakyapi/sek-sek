import type { Prelude } from './types'

/**
 * Sisli yayla yolu: horon halkaları kemençenin ritmiyle zıplar. İlk halka yerde, güvenle öğretir (yükselirken zıpla);
 * sonra halkalar sisin üstünde basamak basamak yaylaya çıkar, inişte ağır ritimli koçari halkaları bekler.
 * Nazar boncuğu yayla yamacındaki kovukta: son halkadan kısa atlayan sahte duvarın içine düşer.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Horon halkası ritimle zıplar. Halka yükselirken sen de zıpla: tek başına çıkamayacağın yere atar seni.',
    'Halkalar sisin üstünde yaylaya tırmanır. Hepsi aynı kemençeyle zıplar; ritmi dinle, halka tepedeyken atla.',
  ],
  hintsEn: [
    'The horon ring bounces to the beat. Jump while it rises: it throws you higher than you could ever climb alone.',
    'The rings climb to the plateau above the fog. They all bounce to the same kemençe; listen to the beat and jump at the top.',
  ],
  npcs: [{ name: 'Yaylacı Emine Nine', look: 'teyze', text: 'Sis çökünce yayla yolu kaybolur uşağum, biz kemençenin sesine yürürüz. Yukarıda horon, inişte koçari tutarlar: koçari ağır vurur, sabırla bekle. Yaylanın yamacı da göründüğü kadar sağlam değildir; son halkadan kısa atlarsan şaşırma.' }],
  npcsEn: [{ name: 'Granny Emine of the Plateau', text: 'When the fog settles the plateau road disappears, my child; we walk towards the sound of the kemençe. Up there they dance the horon, on the way down the koçari: its beat is heavy, so wait for it. And the plateau’s slope is not as solid as it looks; do not be surprised if you jump short from the last ring.' }],
  chunks: [
    [
      '                              t  k                       ',
      '                           #########                     ',
      '                           #########                     ',
      '                           #########  JJJJ               ',
      '                      HHH  % #######                     ',
      '            ?              %!#######                     ',
      '           ####  HHH       #########         JJJJ        ',
      '           ####            #########                     ',
      ' ?  n      ####            #########                  l  ',
      '########HHH####            #########               ######',
      '###############            #########               ######',
      '###############            #########               ######',
      '###############            #########               ######',
    ],
  ],
}
