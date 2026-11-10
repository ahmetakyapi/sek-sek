import type { Prelude } from './types'

/**
 * Taşköprü: kemerlerin çatlak taşları basınca dağılır, karşıdan ok gelir. Pamuk balyası (yay) kemer
 * ayağının tepesine fırlatır; oradan ya yukarıdaki çatlak taşlardan sekilir ya da aşağıdaki oklu
 * geçide inilir. Nazar boncuğu kemer ayağının oyuğunda: aşağı inip sahte duvardan geri yürü.
 */
export const prelude: Prelude = {
  medal: 65,
  hints: [
    'Taşköprü’nün taşları çatlak: basınca dağılır, durmadan yürü. Karşıdan ok gelirse üstünden zıpla!',
    'Pamuk balyası seni kemer ayağının tepesine fırlatır. Yukarıda çatlak taşlar, aşağıda oklar: yolunu sen seç.',
  ],
  hintsEn: [
    'The stones of Taşköprü are cracked: they crumble underfoot, so keep moving. If an arrow comes at you, jump over it!',
    'The cotton bale flings you to the top of the pier. Cracked stones above, arrows below: pick your own way.',
  ],
  npcs: [{ name: 'Köprü Bekçisi Durdu', look: 'amca', text: 'Bu köprü bin yedi yüz yıldır Seyhan’ın üstünde, evladım. Kemer ayaklarının birinin içi oyuktur, dibinde karanlık bir ağzı var; eskiler kıymetlisini oraya saklarmış.' }],
  npcsEn: [{ name: 'Durdu the Bridge Keeper', text: 'This bridge has stood over the Seyhan for seventeen hundred years, my child. One of the piers is hollow, with a dark opening at its foot; the old folk hid their treasures inside.' }],
  chunks: [
    [
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                                                            ',
      '                        #### XXX  XXX                       ',
      '                        ####           XXX                  ',
      '                     S  ####                                ',
      '                  ?  #  #  %               #                ',
      ' ?  n l #        <####  #! %   #          <#      S     lk  ',
      '#########XXXXXXXX#####~~#######################XX~#~~#######',
      '#########~~~~~~~~#####~~#######################~~~#~~#######',
      '#########~~~~~~~~#####~~#######################~~~#~~#######',
      '#########~~~~~~~~#####~~#######################~~~#~~#######',
    ],
  ],
}
