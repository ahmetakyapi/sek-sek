import type { Prelude } from './types'

/**
 * Ferhat’ın su kanalı: dağın içine oyulmuş iki katlı tünel, dört plaka, beş kapak. Bir plaka bütün kapakları çevirir
 * (turuncu açılır, mavi kapanır); kapaklar kayaya gömülü, üstlerinden aşılmaz. İki kilit, önce öğretir sonra sınar:
 *  1. Öndeki turuncu kapağı açan plaka, sıradaki mavi kapağı kapatır ve artık arkanda kalmıştır. Çözüm üst galeride:
 *     basamaklardan çık, geri yürü, ilk odanın üstündeki plakaya bas (turuncu arkandan kapanır, mavi açılır), in, geç.
 *  2. Turuncu kapağın plakası kapağın öbür yanında, yalnız galeriden inilen kuyunun dibinde. Kuyuya in, bas: kapak
 *     seni geri çıkarmak için açılır; aynı basış galerinin ucundaki turuncu taşı (ambar kapağı) da kaldırır. Geri dön,
 *     yeniden galeriye tırman, kuyunun ağzından atla, açılan ağızdan son odaya in; oradaki plaka mavi çıkışı açar.
 * Kilitlenme yok: her odada ya bir plaka ya da geri dönüş var; bayrak ikinci kilidin başında (düğme kapalıyken alınır).
 * Nazar boncuğu galerinin ucundaki cepte, turuncu kapağın ardında: ambar ağzı açıkken içine inmeden üstünden atlayan alır.
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'Ferhat’ın kanalı. Plakaya bas: turuncu kapaklar açılır, mavi kapaklar kapanır. Bir plaka hepsini birden çevirir; bir daha basarsan geri döner.',
    'Bu turuncu kapağın plakası öbür yanında, kuyunun dibinde. Galeriden dolaş, kuyuya in. Aynı basış galerideki turuncu taşı da kaldırır: önce düşün, sonra atla.',
  ],
  hintsEn: [
    'Ferhat’s channel. Step on a plate: the orange gates open and the blue gates close. One plate turns them all at once; step again and they swap back.',
    'The plate for this orange gate is on its far side, at the bottom of the well. Go round by the gallery and drop in. The same press lifts the orange stone up in the gallery too: think first, then jump.',
  ],
  npcs: [{ name: 'Savakçı İlyas Dayı', look: 'amca', text: 'Ferhat bu kanalı Şirin’e kavuşmak için kayaya oymuş derler evlat; suyu şehre o getirecekmiş. Savakçının hüneri kapağı açmak değil, hangisini arkasından kapatacağını bilmektir. Yukarıdaki ambar ağzı açılınca hemen inme: ağzın ötesinde, galerinin ucunda bir şey parlar.' }],
  npcsEn: [{ name: 'Uncle İlyas the Sluice Keeper', text: 'They say Ferhat carved this channel through the rock to win Şirin, my child; he was to bring water to the city. A sluice keeper’s skill is not opening a gate, but knowing which one to close behind him. When the hatch up in the gallery opens, do not drop in at once: past its mouth, at the end of the gallery, something shines.' }],
  chunks: [
    [
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ############################################################    ',
      '      ##                    ########                        [  ###    ',
      '      ##                    ########                        [  ###    ',
      '      ##                    ########                        [ !###    ',
      '      ##  _                 ########                        [  ###    ',
      '      ###############      #############  ######  #######[[#######    ',
      '      ###############      #############  ######  #######[[#######    ',
      '                 [[  ==         ]]          [[       ##         ]]    ',
      '                 [[             ]]          [[       ##         ]]    ',
      '                 [[     ##      ]]      ##  [[       ##         ]]    ',
      ' ? n      _      [[     ##      ]] F ?  ##  [[    _  ##      _  ]]  l ',
      '#############~~#############~~########################################',
      '#############~~#############~~########################################',
      '#############~~#############~~########################################',
      '#############~~#############~~########################################',
    ],
  ],
}
