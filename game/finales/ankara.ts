import type { Prelude } from './types'

/**
 * Ankara Kalesi: mavi köprü hazırdır ama iç kapı da mavidir; köprüden geçen kapıda kalır. Plakaya basınca köprü
 * gider, kapı açılır ve burca çıkan kırmızı basamaklar gelir: yol üstteki seyirdim yerinden. Kapının ardında bir
 * duvar sekmesi kuyusu. Nazar boncuğu iç avludaki kuytuda; oraya yalnız mavi taşlar dururken (köprü yolundan) çıkılır.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Mavi köprü seni iç avluya götürür. Ama acele etme: plaka kırmızıyı getirir, maviyi götürür.',
    'İç kapı mavi: mavi taşlar durdukça açılmaz. Geri dön, plakaya bas; köprü gider ama burca kırmızı basamak gelir.',
    'Burç kuyusu: zıpla, duvara yaslan, bir daha zıpla. Duvardan duvara sekerek çık!',
  ],
  hintsEn: [
    'The blue bridge leads to the inner yard. But don’t rush: the plate brings the red and takes the blue away.',
    'The inner gate is blue: it stays shut while the blue stones stand. Go back and press the plate; the bridge goes, but red steps rise to the rampart.',
    'The bastion well: jump, lean on the wall, jump again. Bounce from wall to wall to climb out!',
  ],
  npcs: [{ name: 'Kale Bekçisi Durmuş', look: 'amca', text: 'Bu burçlar Galatlardan, Romalılardan, Selçuklulardan taş taşır. Kale kimseyi tek yoldan içeri almaz; alttan giren kapıda kalır, üstten dolanan avluya iner. Önce bak, sonra yürü.' }],
  npcsEn: [{ name: 'Durmuş the Castle Keeper', text: 'These bastions carry stones from the Galatians, the Romans and the Seljuks. The castle lets no one in by a single road; enter from below and you stop at the gate, go round the top and you drop into the yard. Look first, then walk.' }],
  chunks: [
    [
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                            #                      ',
      '                       ######                      ',
      '             #######        #      b               ',
      '                           !#   #######            ',
      '           ]]             ###   #######            ',
      '                            [   #########          ',
      '        ]]           [[     [   #########          ',
      '  n ? _                  ?  [ ? #########   k  l   ',
      '##########[[[[[[[[[################################',
      '##########~~~~~~~~~################################',
      '##########~~~~~~~~~################################',
      '##########~~~~~~~~~################################',
    ],
  ],
}
