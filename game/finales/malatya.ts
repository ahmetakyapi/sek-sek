import type { Prelude } from './types'

/**
 * Kayısı bahçesinin sulama kanalları: sallar (yatay platformlar) kanalı gidip gelir. Geniş kanalda iki
 * sal ortada buluşur, buluşmayı bekleyip aktarma yapılır; sonda kurutma sergilerinden dama çıkılır.
 * Nazar boncuğu damın altındaki kilerde: sergilere çıkmadan dümdüz yürü, duvar sahtedir.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Sulama kanalı derin: salı bekle, yanaşınca bin, karşıya varınca in.',
    'Geniş kanalda iki sal var: ortada buluşurlar. Buluşmayı bekle, o an öbürüne geç.',
    'Kurutma sergileri basamak gibidir: sergiden sergiye çık, damı aş.',
  ],
  hintsEn: [
    'The irrigation canal is deep: wait for the raft, step on when it docks, step off at the far side.',
    'The wide canal has two rafts: they meet in the middle. Wait for them to meet, then cross over.',
    'The drying racks work like steps: climb from rack to rack and cross the roof.',
  ],
  npcs: [{ name: 'Su Bekçisi İsmail', look: 'amca', text: 'Suyu sırayla veririz, her bahçenin saati bellidir; sal da öyle, vakti gelince yanaşır. Kilere uğramadan gitme: damın altındadır, kapısı duvar gibi durur ama içi gün kurusu dolu.' }],
  npcsEn: [{ name: 'İsmail the Water Warden', text: 'We share the water by turns, each orchard has its hour; the raft is the same, it docks when its time comes. Don’t leave without visiting the larder: it is under the drying roof, its door looks like a wall but inside it is full of sun-dried apricots.' }],
  chunks: [
    [
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                              ',
      '                                                    #####     ',
      '                                                 == #####     ',
      '                                                    #####     ',
      '                                               ==   %  ##     ',
      '  ?  n             t  k  ?                    ?     % !##  t  ',
      '########MMM     ############MMM     |     MMM#################',
      '########~~~~~~~~############~~~~~~~~~~~~~~~~~#################',
      '########~~~~~~~~############~~~~~~~~~~~~~~~~~#################',
      '########~~~~~~~~############~~~~~~~~~~~~~~~~~#################',
    ],
  ],
}
