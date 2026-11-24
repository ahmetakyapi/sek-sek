import type { Prelude } from './types'

/**
 * Otelin gece havuzu: iki teyze, iki plaka, iki renk kapak. Başta mavi kapaklar ([) birinci havuzun üstünü örter:
 * kapalıyken üstünden görünmeden yürünür. Birinci teyzenin üstündeki sekiden ızgaraya (=) sırtı dönükken in,
 * adadaki plakaya bas: mavi kapaklar açılır, kırmızılar (]) ikinci havuzu örter. Kırmızı kapaklardan ikinci sekiye
 * yürü; sekideki plaka kırmızıları açar ve kabin kapısını (]) kaldırır; ızgaradan teyzenin sırtı dönükken in.
 * Plakasız da gidilir: ikinci havuza dalıp teyzenin altından geçen kapıya varır.
 * Nazar boncuğu birinci (en derin) havuzun dibinde, teyzenin tam altında: sekinin yanındaki sudan dal, teyzenin
 * arkasında kalan yandan çık.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: ['Gece havuzu: mavi kapaklar kapalıyken üstünden yürü, teyzeler görmez. Izgarada sırtları dönükken geç. Plaka kapakların rengini değiştirir; mermer basamaktaki plaka kabin kapısını açar.'],
  hintsEn: ['The night pool: walk over the blue covers while they are shut, the aunties cannot see you. On the grates, pass while their backs are turned. A plate swaps the colour of the covers; the plate on the bench opens the cabin door.'],
  npcs: [{ name: 'Havlucu Perihan', look: 'teyze', text: 'Otuz yıldır havlu katlarım, bu havuzun her köşesini bilirim. Teyzeler gece de uyumaz, sağa sola bakar! İlk havuz en derinidir: dibinde, teyzenin tam ayaklarının altında bir göz parlar. Mermer basamağın yanından dal, arkasından çık.' }],
  npcsEn: [{ name: 'Perihan the Towel Keeper', text: 'Thirty years I have folded towels; I know every corner of this pool. The aunties do not sleep at night either, they look left and right! The first pool is the deepest: at its bottom, right under an auntie’s feet, an eye glints. Dive beside the bench, come up behind her.' }],
  chunks: [
    [
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '        ############################################    ',
      '                                               ]        ',
      '                                               ]        ',
      '                                               ]        ',
      '                                    _          ]        ',
      '                ###                ###         ]        ',
      '  ?  n                     _                   ]        ',
      '##########[[[[[[W"W======####]]]]]]W"W======############',
      '##########WWWWWWWWWWWWWWW####WWWWWWWWWWWWWWW############',
      '##########WWWWWWW!WWWWWWW####WWWWWWWWWWWWWWW############',
      '########################################################',
    ],
  ],
}
