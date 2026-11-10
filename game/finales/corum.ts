import type { Prelude } from './types'

/**
 * Hattuşa Yerkapı (potern): surun altındaki alçak tünel. Plaka iki mavi kapıyı birden açar; alttaki
 * geçit kırmızı kapıda biter, üstteki oklu geçidin sonundaki ikinci plaka o kapıyı açar ve aşağı inilir.
 * Nazar boncuğu alt geçidin mavi döşeme taşının altında: yalnız "yanlış" kapıdan girince açıktır.
 */
export const prelude: Prelude = {
  medal: 80,
  hints: [
    'Yerkapı: surun altından geçen taş tünel. Tavan alçak, zıplayışın kısalır: geniş dikeni dash atarak geç, okların ritmini bekle.',
    'Plaka iki mavi kapıyı da açar: biri altta, biri üstte. Hangisi çıkışa götürür? Mavi taşların hepsi birlikte kalkar.',
    'Kırmızı kapı kapalı, bu geçit çıkmaz. Üst geçidin sonundaki plaka kırmızıyı açar.',
  ],
  hintsEn: [
    'Yerkapı: a stone tunnel under the ramparts. The ceiling is low, so your jump is cut short: dash across the wide spikes and wait for the rhythm of the arrows.',
    'The plate opens both blue doors: one below, one above. Which leads out? Every blue stone lifts together.',
    'The red door is shut, this passage is a dead end. The plate at the end of the upper passage opens the red.',
  ],
  npcs: [{ name: 'Kazı Bekçisi Hıdır', look: 'amca', text: 'Otuz yıldır bu surun dibinde nöbet tutarım. Hitit askeri bu tünelden sessizce çıkarmış; iki geçidi vardır, biri yanıltır. Ama yanılan da boş dönmez, döşemedeki mavi taşa iyi bak!' }],
  npcsEn: [{ name: 'Hıdır the Dig Watchman', text: 'I have kept watch at the foot of this wall for thirty years. Hittite soldiers slipped out through this tunnel; it has two passages, and one misleads. But even the misled don’t leave empty-handed: take a good look at the blue stone in the floor!' }],
  chunks: [
    [
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        #                                                         ',
      '        ##################################################        ',
      '        ##################################################        ',
      '        ##################################################        ',
      '        ##################################################        ',
      '        ##################################################        ',
      '        #         [                  #####################        ',
      '        #         [                  #                  ##        ',
      '        #         [    ^   ^   _     <                  ##        ',
      '        #       #################  ###       ^   ^^     <#        ',
      '                  [                  ]    ###########             ',
      '             ==   [                  ]  #############             ',
      '  ?  n     _   ?  [                ? ]F #############        l    ',
      '##########################[[######################################',
      '##########################! ######################################',
      '##################################################################',
      '##################################################################',
    ],
  ],
}
