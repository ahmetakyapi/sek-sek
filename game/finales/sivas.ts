import type { Prelude } from './types'

/**
 * Buzlu medrese avlusu: buzda durulmaz, sütuna yaslanıp durulur (önce avluda, sonra dikenlerin arasında).
 * Dehlizdeki taç kapı tek basışta açılır; buz iki plakanın ikisine de bastırır ve kapıyı geri kapatır.
 * Çözüm damdan: bacadan inip yalnız ikinci plakaya bas. Nazar boncuğu damın ucundaki sahte duvarın içinde.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Avlu buz tuttu: buzda duramazsın. Sütuna yaslan, öyle dur; sonra üstünden atla.',
    'Taç kapı tek basışta açılır, ikinci basışta yine kapanır. Dehlizde iki plaka var, buz ikisine de bastırır. Dam da bir yoldur!',
  ],
  hintsEn: [
    'The courtyard has frozen over: you cannot stop on ice. Lean against the pillar to stop, then jump over it.',
    'The portal opens on one press and shuts again on the second. The hall has two plates and the ice carries you over both. The roof is a road too!',
  ],
  npcs: [{ name: 'Hattat Nuri Efendi', look: 'amca', text: 'Gök Medrese’nin taç kapısına bak evladım: her düğümü sabırla atılmış. Buzda acele eden kayar; önce nerede duracağını düşün, sonra adımını at. Damın ucundaki duvar da göründüğü kadar sağlam değildir.' }],
  npcsEn: [{ name: 'Nuri the Calligrapher', text: 'Look at the portal of the Gök Medrese, my child: every knot was carved with patience. Whoever hurries on ice slips; think first about where you will stop, then take your step. And the wall at the end of the roof is not as solid as it looks.' }],
  chunks: [
    [
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        ###       ',
      '                                                        % #       ',
      '                                                        %!#       ',
      '                                    #########  ############       ',
      '              #       #          ==                     [         ',
      ' ? n          # l     #         ?       _          _    [    l k  ',
      '#####IIIIIIIII###^^IIII^^IIIII^^####IIIIIIIIIIIIIIIIIIII##########',
      '##################################################################',
      '##################################################################',
      '##################################################################',
    ],
  ],
}
