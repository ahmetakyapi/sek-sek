import type { Prelude } from './types'

/**
 * Bandırma Vapuru'nun makine dairesi: iki katlı, tavanı güverte. Tek düğme, iki takım vana: kırmızı kapaklar ([)
 * düğme kapalıyken, mavi kapaklar (]) düğme açıkken katıdır; her vanaya (plaka) basış düğmeyi çevirir.
 *  1. Alt katta vanaya bas: kırmızı kapak açılır, mavi merdiven belirir, üst kata çık.
 *  2. Üst katta vana mavi kapağı açar, kırmızı köprü gelir (merdiven arkada kaybolur). Köprünün ardındaki vana
 *     kırmızı kapağı açar, köprü kaybolur. Köprüden düşen kuyuya iner, kuyudaki mavi basamaklarla karşıya çıkar
 *     (köprü yalnız düğme açıkken yoktur, basamaklar da o zaman vardır). Üst kattan merdivenin başına düşen alt
 *     kattaki yedek vanayla düğmeyi çevirir (kilitlenme yok).
 *  3. Bayraktan sonra pistonlar ({ }): biri inerken öbürü kalkar; yanıp sönen pistondan öbürüne atla. Altta dikenli
 *     karter.
 * Nazar boncuğu köprünün üstünde, tavanın dibinde: köprüyü geçip vanaya basınca köprünün yerinde mavi bir basamak
 * belirir; geri dönüp ona çıkan alır (Çarkçıbaşı: "köprüyü geçince arkana bak").
 */
export const prelude: Prelude = {
  medal: 55,
  hints: [
    'Makine dairesi. Vanaya (plakaya) bas: kırmızı kapaklar açılır, mavi kapaklar kapanır. Bir daha basarsan geri döner.',
    'Bu vana mavi kapağı açar, kırmızı köprüyü getirir. Köprüden düşersen kuyudaki mavi basamaklardan karşıya çık.',
    'Pistonlar: biri inerken öbürü kalkar. Yanıp sönen pistondan öbürüne atla; altta dikenli karter var.',
  ],
  hintsEn: [
    'The engine room. Step on the valve (plate): red hatches open, blue hatches close. Step again and it switches back.',
    'This valve opens the blue hatch and brings the red bridge. If you fall from the bridge, climb the blue steps in the well to the far side.',
    'The pistons: as one sinks, the other rises. Jump from the blinking piston to the other one; below lies the spiked crankcase.',
  ],
  npcs: [{ name: 'Çarkçıbaşı İlhami', look: 'amca', text: 'Bu makineyi yüz yıldır kimse kurcalamadı, ben hariç! Vanalar sırayla çevrilir: her basış bir kapağı açar, ötekini kapar. Köprüyü geçip vanaya basınca bir de arkana bak; tavanın dibinde bir göz parlıyor.' }],
  npcsEn: [{ name: 'İlhami the Chief Engineer', text: 'Nobody has tinkered with this engine for a hundred years, except me! The valves turn in order: every press opens one hatch and closes the other. Once you cross the bridge and step on the valve, look behind you; an eye glints up under the ceiling.' }],
  chunks: [
    [
      '####################################################################    ',
      '####################################################################    ',
      '####################################################################    ',
      '####################################################################    ',
      '####################################################################    ',
      '####################################################################    ',
      '####################################################################    ',
      '             [[                ]]             [[                        ',
      '             [[                ]]     !       [[                        ',
      '             [[                ]]             [[                        ',
      '             [[                ]]     ]]      [[                        ',
      '             [[                ]]             [[          }}            ',
      '             [[             _  ]] ?       _   [[ ?F                     ',
      '             [[           ###########[[[[############  {{    {{ ###     ',
      '             [[        ]]    #####   ]]     #########                   ',
      '             [[              #####          #########                   ',
      '             [[     ]]       #####      ]]  #########                   ',
      '             [[              #####          #########                   ',
      '             [[  ]]          #####   ]]     #########                   ',
      ' ?  n   _    [[           _  #####          #########                   ',
      '#####################################################^^^^^^^^^^^########',
      '########################################################################',
      '########################################################################',
      '########################################################################',
    ],
  ],
}
