import type { Prelude } from './types'

/**
 * Dört Ayaklı Minare ve Keçi Burcu. Önce minarenin altından, alçak tavanda kaideden kaideye geçilir.
 * Burcun alt kapısı mavidir, plakası en üst kattadır; plakaya varmak için üstünden yürünen mavi döşeme de
 * plakayla birlikte gider. Çözüm içeri düşmemek: boşluğun üstünden geri atla, merdivenden in, alt kapıdan çık.
 * Nazar boncuğu içeri düşenin bulduğu cumbada: orta kat plakası kırmızı döşemeyi götürür, cumba kapısını açar.
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Dört Ayaklı Minare: ayakların arasından geç. Tavan alçak, zıplayışın kısalır; kaideden kaideye kısa adımlarla atla.',
    'Keçi Burcu: alt kapı mavi, plakası en üst katta. Plaka mavi taşların hepsini götürür; ayağının altındaki döşeme de mavi!',
    'Mavi kapı kapalı. Dışarıdaki merdivenden en üst kata çık; plakaya basınca boşluğa düşme, geri atla ve buraya in.',
    'Burcun içine düştün. Bu plaka kırmızıları götürür: döşeme gider, cumbanın kapısı açılır. Aşağı inince dışarı çık, yeniden tırman.',
  ],
  hintsEn: [
    'The Four-Legged Minaret: pass between its legs. The ceiling is low, so your jump is cut short; hop from base to base in small steps.',
    'The Goat Bastion: the lower door is blue and its plate is on the top floor. The plate takes every blue stone away, and the floor under your feet is blue too!',
    'The blue door is shut. Take the stairs outside to the top floor; once you press the plate, don’t drop into the gap: jump back and come down here.',
    'You fell inside the bastion. This plate takes the red stones away: the floor goes and the door of the bay opens. Once you are down, walk out and climb again.',
  ],
  npcs: [{ name: 'Burç Bekçisi Şehmus', look: 'amca', text: 'Minarenin dört ayağının arasından yedi kez geçenin dileği olurmuş, derler. Keçi Burcu da surların en eskisidir: kapısı altta, plakası tepede. Plakaya bas ama ayağını bastığın taşa da bak; içine düşen boş dönmez, yine de merdiveni bir daha çıkar.' }],
  npcsEn: [{ name: 'Şehmus the Bastion Keeper', text: 'They say a wish comes true for whoever passes seven times between the four legs of the minaret. The Goat Bastion is the oldest on the walls: its door is at the bottom, its plate at the top. Press the plate, but mind the stone you stand on; whoever falls inside does not leave empty-handed, yet climbs the stairs once more.' }],
  chunks: [
    [
      '                                             #        ',
      '                                             #        ',
      '                                             #        ',
      '                                             #        ',
      '              ##                             #        ',
      '              ##                             #        ',
      '              ##                            _#        ',
      '              ##                      ##[[[###        ',
      '             ####                 ####       #        ',
      '              ##                  #  ]       #        ',
      '              ##                ==#  ]       #        ',
      '              ##                  #! ]    ? _#        ',
      '              ##              ==  ####]]]#####        ',
      '         ############                        #        ',
      '         ############       ==               #        ',
      '         ############                        #        ',
      '         ############     ==                 [        ',
      '                                             [        ',
      '                        ==                   [        ',
      '  ?  n    #^^#^^#^^#  ?                  ?   [   l k  ',
      '######################################################',
      '######################################################',
      '######################################################',
      '######################################################',
    ],
  ],
}
