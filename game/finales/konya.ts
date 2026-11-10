import type { Prelude } from './types'

/**
 * Sema halkaları zinciri: şadırvan havuzunun üstünde dönen dört halka, komşular ters yönde döner; halka sana
 * yaklaşırken binip öbürü yaklaşırken geçilir. Ortada dinlenme taşı var. Nazar boncuğu setin üstündeki beşinci
 * halkanın en yüksek noktasından ulaşılan sahanlıkta.
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'Sema halkaları: komşu halkalar ters döner. Halka sana doğru gelirken bin, öbürü yaklaşınca geç.',
    'Dinlen, ritmi izle. İkinci halka seni yukarı, setin üstüne taşır; acele eden havuza düşer.',
  ],
  hintsEn: [
    'The whirling rings: neighbours turn opposite ways. Step on as a ring swings toward you, cross when the next one comes close.',
    'Rest and watch the rhythm. The second ring carries you up onto the terrace; hurry and you land in the pool.',
  ],
  npcs: [{ name: 'Neyzen Hüsrev Dede', look: 'ozan', text: 'Ney üflerken nefesi saymam, dinlerim. Halkalar da öyle: sayma, dinle. Setin üstündeki halka en yükseğe çıkar; göğe en yakın yerde sana bir emanet bıraktım.' }],
  npcsEn: [{ name: 'Hüsrev the Ney Player', text: 'When I play the ney I do not count my breath, I listen. The rings are the same: don’t count, listen. The ring on the terrace climbs highest; where it is nearest the sky, I left something in your keeping.' }],
  chunks: [
    [
      '                                                         ',
      '                                                         ',
      '                                                         ',
      '                                                         ',
      '                                                         ',
      '                                                         ',
      '                                                         ',
      '                                              !          ',
      '                                             ==          ',
      '                                                         ',
      '                                                         ',
      '                                         OO              ',
      '                                                         ',
      '                                       a                 ',
      '                                      ########           ',
      '                                  OO  ########           ',
      '                                      ##########         ',
      '            OO   OO          OO       ##########         ',
      '                                      ############       ',
      ' ?  n l                ?              ############  k l  ',
      '########~~~~~~~~~~~~~~####~~~~~~~~~~~~###################',
      '########~~~~~~~~~~~~~~####~~~~~~~~~~~~###################',
      '########~~~~~~~~~~~~~~####~~~~~~~~~~~~###################',
      '########~~~~~~~~~~~~~~####~~~~~~~~~~~~###################',
    ],
  ],
}
