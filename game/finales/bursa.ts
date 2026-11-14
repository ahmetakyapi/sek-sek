import type { Prelude } from './types'

/**
 * Karagöz perdesi: iki katlı perde, beş şem’a (plaka). Işık dönünce gölgeler yer değiştirir; hangi şem’aya basıp
 * hangisinin üstünden atlayacağını ilerideki gölgeyi okuyarak bulursun (bas, atla, bas, bas, atla): gölge merdivenle
 * üst kata çık, gölge köprüyü geç, gölge kapıyı erit, kapağı eritip gölge merdivenle in, açık kapıyı kapatma.
 * Yanlış ışıkta düşen yalnız alt kata iner; ilk şem’a hep ulaşılır, kilitlenme olmaz.
 * Nazar boncuğu köprünün başında, "yanlış" ışıkta (köprü yokken) beliren iki koyu basamağın ucunda.
 */
export const prelude: Prelude = {
  medal: 50,
  hints: [
    'Karagöz perdesi. Şem’aya (plakaya) bas: ışık döner, soluk gölgeler katılaşır, koyu gölgeler erir. Bir daha basarsan geri döner.',
    'Her ışığa basılmaz. Önündeki köprü gölgeden: şem’aya basarsan erir, üstünden atla. Yanlış bastıysan inip yeniden bas.',
    'Koyu gölge kapağın üstünde durursun. Işığı çevir, kapak erisin; altında beliren gölge merdivenden in.',
  ],
  hintsEn: [
    'The Karagöz screen. Step on the lamp plate: the light turns, pale shadows grow solid and dark ones melt. Step again and it turns back.',
    'Not every lamp wants pressing. The bridge ahead is made of shadow: press the plate and it melts, so hop over it. If you pressed by mistake, step off and press again.',
    'You are standing above a dark shadow hatch. Turn the light to melt it, then walk down the shadow stairs that appear beneath.',
  ],
  npcs: [{ name: 'Perdeci Nilüfer', look: 'genc', text: 'Perdeyi her akşam ben gererim; şem’a yanınca Karagöz ile Hacivat dile gelir. Yanlış ışık diye bir şey yoktur, her ışığın gölgesi başkadır. Köprünün başında ışığı bir de ters çevir; arkanda, yukarıda ne belirecek bak.' }],
  npcsEn: [{ name: 'Nilüfer the Screen Keeper', text: 'I stretch the screen every evening; when the lamp is lit, Karagöz and Hacivat find their voices. There is no wrong light, each light casts its own shadow. At the head of the bridge, turn the light the other way once and see what appears behind you, up high.' }],
  chunks: [
    [
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                                    #                       ##      ',
      '                !                   #                       ##      ',
      '                [[                  #                       ##      ',
      '                                    ]                       ##      ',
      '                   [[               ]                       ##      ',
      '                   [[?  _         _ ] F ?  _          l     ##      ',
      '                 #########]]]]]]##############[[[#############      ',
      '                                    #                       ##      ',
      '              ]]                    #         ]]]           ##      ',
      '                                    #                       [[      ',
      '           ]]                       #             ]]        [[      ',
      ' ?  n   _             o             #    o               _  [[  l   ',
      '####################################################################',
      '####################################################################',
      '####################################################################',
      '####################################################################',
    ],
  ],
}
