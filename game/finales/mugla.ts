import type { Prelude } from './types'

/**
 * TASLAK: gerçek tasarım level-designer aşamasında. Bu harita yalnız oynanabilir bir iskelettir (çözücü geçer).
 * Rüzgâr yönü: meltem batıdan, arkadan eser ve esintiyle güçlenip diner. Denizin üstünde gidip gelen iki platform,
 * arada bir ada: platform yanaşınca bin, esinti güçlenince karşıya atla.
 * Nazar boncuğu son kayalığın tepesinde: kayaya çıkıp zıplayan alır.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Meltem arkandan eser, bir güçlenir bir diner. Platform yanaşınca bin; esinti güçlenince atla, rüzgâr seni taşır.',
    'İkinci geçit de aynı: platformu bekle, rüzgârı arkana al. Karşıdaki kayalığın tepesine de bir çık.',
  ],
  hintsEn: [
    'The meltem blows at your back, rising and easing. Board the platform when it comes in; jump when the gust picks up and let the wind carry you.',
    'The second crossing is the same: wait for the platform and put the wind behind you. Then climb to the top of the rocks on the far side.',
  ],
  npcs: [{ name: 'Paraşüt Pilotu Alper', look: 'genc', text: 'Babadağ’dan atlayan önce rüzgâra bakar: arkadan eserse beklersin, yüzüne dönünce koşarsın. Burada tersi: meltem arkandayken atla. Kayalığın tepesinden bakmayı da unutma, Ölüdeniz’in mavisi oradan başka görünür.' }],
  npcsEn: [{ name: 'Alper the Paragliding Pilot', text: 'Whoever jumps from Babadağ reads the wind first: if it is behind you, you wait; when it turns to your face, you run. Here it is the other way round: jump while the meltem is at your back. And do look from the top of the rocks; the blue of Ölüdeniz looks different from up there.' }],
  chunks: [
    [
      '                                           !                ',
      '                                                            ',
      '                                          ####              ',
      '                                          ####              ',
      ' ?  n    |MMM       |   ?    |MMM       | ####     l   k    ',
      '##########~~~~~~~~~~##########~~~~~~~~~~####################',
      '##########~~~~~~~~~~##########~~~~~~~~~~####################',
      '##########~~~~~~~~~~##########~~~~~~~~~~####################',
      '##########~~~~~~~~~~##########~~~~~~~~~~####################',
    ],
  ],
}
