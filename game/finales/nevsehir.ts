import type { Prelude } from './types'

/**
 * Derinkuyu: balonla kayanın üstüne çıkılır, çatlak taş kapaklar çökünce kat kat aşağı inilir (her katta kapak
 * öbür uçta). En alt kat çıkmaz gibi görünür: sağdaki duvar sahtedir, ardındaki bacadan balonla gün ışığına çıkılır.
 * Nazar boncuğu ikinci katın sol ucundaki sahte duvarın arkasında.
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'Sepete bin: balon seni kayanın üstüne çıkarır. Derinkuyu’nun girişi yukarıda.',
    'Çatlak taş kapağın üstünde dur: çöker, bir alt kata inersin. Her katın kapağı öbür uçtadır.',
    'En alt kat çıkmaz gibi durur. Derinkuyu’da bazı duvarlar yalnız perdedir: sonuna kadar yürü.',
  ],
  hintsEn: [
    'Hop in the basket: the balloon lifts you onto the rock. The way into Derinkuyu is up there.',
    'Stand on the cracked stone lid: it gives way and drops you a floor down. Each floor has its lid at the far end.',
    'The lowest floor looks like a dead end. In Derinkuyu some walls are only curtains: walk all the way to the end.',
  ],
  npcs: [{ name: 'Bekçi Satılmış Dayı', look: 'coban', text: 'Dedem tavuk kovalarken duvarın ardında koca bir şehir bulmuş derler. Sekiz kat aşağı iner bu dehlizler. Ben derim ki bir duvara iki kere bak; ikinci katın dibinde bile sürpriz çıkar.' }],
  npcsEn: [{ name: 'Satılmış the Watchman', text: 'They say my grandfather was chasing a hen when he found a whole city behind a wall. These tunnels go eight floors down. I say look at a wall twice; even at the far end of the second floor there is a surprise.' }],
  chunks: [
    [
      '                                        #                 ',
      '                                        #                 ',
      '                                        #                 ',
      '                                        #                 ',
      '                                        #                 ',
      '                                        #                 ',
      '                                        #                 ',
      '    :       n       t       ?           #:     l          ',
      '        ##########################XX#####    #####        ',
      '        ####                          ###    #####        ',
      '        ####                          ###    #####        ',
      '        ####          l               ###    #####        ',
      '        ######XX#########################    #####        ',
      '        ####                          ###    #####        ',
      '        ## %                          ###    #####        ',
      '        ##!%            l             ###    #####        ',
      '        #########################XX######    #####        ',
      '        ##                             ##    #####        ',
      '    BBB ##                             %%BBB #####        ',
      ' ?      ## o o                ?        %%    #####   k l  ',
      '##########################################################',
      '##########################################################',
      '##########################################################',
      '##########################################################',
    ],
  ],
}
