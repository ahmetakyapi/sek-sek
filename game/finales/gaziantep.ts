import type { Prelude } from './types'

/**
 * Bakırcılar Çarşısı: tokmakların ritmiyle girilir, kepengin plakası üst kattaki çırak odasında.
 * Plaka kepengi açar ama çıkılan kapağı kapatır, ötedeki mavi kapağı açar: oradan kepengin dibine inilir.
 * Nazar boncuğu mavi kapağın ötesindeki sahte duvarın ardında: plakaya basmadan önce kapağın üstünden yürü.
 */
export const prelude: Prelude = {
  medal: 65,
  hints: [
    'Çarşının sonunda mavi kepenk kapalı. Plakası üst katta: tokmakların ritmini bekle, iskeleden çık.',
    'Plaka kepengi açar ama geldiğin kapağı kapatır. Ötedeki mavi kapak açılır: oradan in.',
    'Kepenk mavi: plakaya bir kez basılınca açılır. Kapalıysa üst kata dön.',
  ],
  hintsEn: [
    'The blue shutter at the end of the bazaar is down. Its plate is upstairs: wait for the mallets’ rhythm, then climb the scaffold.',
    'The plate opens the shutter but shuts the hatch you came through. The blue hatch beyond it opens: go down there.',
    'The shutter is blue: one press of the plate opens it. If it is closed, head back upstairs.',
  ],
  npcs: [{ name: 'Kalaycı Abuzer Usta', look: 'usta', text: 'Bakır dövülür, kalay sürülür, sabırla parlar. Çırağım üst katta bir boncuk saklamış; plakaya basarsan altındaki kapak açılır, yanına varamazsın. Önce boncuk, sonra plaka!' }],
  npcsEn: [{ name: 'Master Abuzer the Tinsmith', text: 'Copper is beaten, tin is laid on, and patience makes it shine. My apprentice hid a bead upstairs; press the plate and the hatch below opens, so you can’t reach it. Bead first, plate after!' }],
  chunks: [
    [
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '                                        #                   ',
      '             ############################                   ',
      '             #                        %##                   ',
      '             #                        %##                   ',
      '             #                        %##                   ',
      '             #        ?       _       %!#                   ',
      '      ##########]]]]]############[[[[[###   ###########     ',
      '        Y  Y       ==               ==  [    Y       Y      ',
      '                                        [                   ',
      '                ==               ==     [                   ',
      ' ? n                          ?         [ F     ^^       l  ',
      '############################################################',
      '############################################################',
      '############################################################',
      '############################################################',
    ],
  ],
}
