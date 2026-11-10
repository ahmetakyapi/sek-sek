import type { Prelude } from './types'

/**
 * Tarihî Asansör: platform oyuncuyu Karataş’ın üst terasına çıkarır. Terasta mavi kapıyı ilk plaka açar ve
 * kırmızı basamakları getirir; içerideki ikinci plaka basamakları geri götürür: üstünden atlamak (ya da iki kez
 * basmak) gerekir. Nazar boncuğu asansör tepedeyken sola, kuleye bakan küçük sahanlıkta. İniş merdivenli sokaktan.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Tarihî Asansör: platforma bin, seni Karataş’ın tepesine çıkarsın.',
    'İlk plaka mavi kapıyı açar, kırmızı basamakları getirir. İçerideki plakaya basarsan basamaklar gider: üstünden atla!',
    'Kordon ayaklarının altında. Aşağıya Karataş’ın merdivenli sokağından inilir.',
  ],
  hintsEn: [
    'The Historic Elevator: hop on the platform and let it lift you to the top of Karataş.',
    'The first plate opens the blue door and brings the red steps. Step on the plate inside and the steps vanish: jump over it!',
    'The Kordon lies at your feet. The way down is the stair street of Karataş.',
  ],
  npcs: [{ name: 'Karataşlı Selim Amca', look: 'amca', text: 'Eskiden bu yokuşu yüz elli beş basamakla çıkardık evladım. Asansör gelince dizlerimiz bayram etti. Tepeye varınca bir de sola bak; herkes manzaraya koşar, kuleyi unutur.' }],
  npcsEn: [{ name: 'Uncle Selim of Karataş', text: 'We used to climb this hill by a hundred and fifty-five steps, my child. When the elevator came, our knees rejoiced. At the top, glance to the left too; everyone runs to the view and forgets the tower.' }],
  chunks: [
    [
      '                   #                                    ',
      '                   #                                    ',
      '                   #                                    ',
      '                   #                                    ',
      '                   #                                    ',
      '                   #         l ? t b                    ',
      '                   #       ##########                   ',
      '      !            [       ##########                   ',
      '      ==           [     ]]############                 ',
      '         :   ?  _  [  _    ############                 ',
      '            #############################               ',
      '            #############################               ',
      '            ###############################             ',
      '            ###############################             ',
      '            #################################           ',
      '            #################################           ',
      '            ###################################         ',
      '            ###################################         ',
      '            #####################################       ',
      ' ?  n  t NNN#####################################  k l  ',
      '########################################################',
      '########################################################',
      '########################################################',
      '########################################################',
    ],
  ],
}
