import type { Prelude } from './types'

/**
 * SEKA iskelesi: körfezin üstünde çatlak kalaslar, ardından yay kasasıyla kâğıt balyalarının tepesine çıkış.
 * Balyalar arasındaki avlu güvenli: düşen, oradaki yayla yeniden yukarı fırlar; ritmi tutturan kalaslardan geçer.
 * Nazar boncuğu ilk balya yığınının içinde: yığının avluya bakan sağ yüzü sahte duvar, içi boş.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'SEKA iskelesi: çatlak kalasların üstünde oyalanma, sek sek karşıya geç!',
    'Yay kasasına atla: seni kâğıt balyalarının tepesine fırlatır. Kalaslardan düşersen avludaki yay yine yukarı atar.',
  ],
  hintsEn: [
    'The SEKA pier: don’t linger on the cracked planks, hop across one by one!',
    'Jump on the spring crate: it flings you onto the paper bales. If you fall off the planks, the spring in the yard sends you back up.',
  ],
  npcs: [{ name: 'Balyacı Saniye Abla', look: 'teyze', text: 'Otuz yıl bu iskelede kâğıt balyası saydım. Bir sır vereyim: balyaların hepsi dolu değildir, kimi yığının içi bomboştur. Duvar sandığın şeye bir yaslan bak.' }],
  npcsEn: [{ name: 'Saniye the Bale Counter', text: 'Thirty years I counted paper bales on this pier. Here is a secret: not every bale is full, some stacks are hollow inside. Lean on what you take for a wall and see.' }],
  chunks: [
    [
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                             o  l               o         ',
      '                           ########  XX  XX  ######       ',
      '                           ########          ######       ',
      '                           ###   %%          ########     ',
      ' ?  n  o              ?   S### ! %% S   k    ########  l  ',
      '#########~XX~~XX~~XX~#####################################',
      '#########~~~~~~~~~~~~#####################################',
      '#########~~~~~~~~~~~~#####################################',
      '#########~~~~~~~~~~~~#####################################',
    ],
  ],
}
