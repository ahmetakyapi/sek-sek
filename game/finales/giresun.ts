import type { Prelude } from './types'

/**
 * Aksu Şenliği, Giresun Adası: dilek taşı (plaka) gelgiti çevirir. Gelgit çekilince mavi taşlar sudan çıkar, turuncu
 * taşlar batar; bir daha basınca geri döner.
 *  1. Öğretir: kıyıdaki dilek taşına bas, mavi taş köprü çıkar; boğazı yürüyerek geç.
 *  2. Sınar: adanın eteğinden mavi basamaklarla kayalığın tepesine çık. Karşıya giden köprü turuncu ve şimdi batık:
 *     tepedeki dilek taşına bas, turuncu köprü çıkar (mavi basamaklar batar, dönüş gerekmez).
 *  3. Karabatak kayalığından karşı kıyıya in.
 * Kilitlenme yok: eteğin ucunda da bir dilek taşı var; tepeden düşen ona basıp basamakları geri çıkarır.
 * Nazar boncuğu kayalığın dibindeki kovukta, mavi taşın ardında: köprüden gelgit yüksekken geçilir, kapı kapalıdır.
 * Eteğin ucundaki dilek taşına basan kapıyı açar (basamaklar batar), boncuğu alır, bir daha basıp basamakları çıkarır.
 */
export const prelude: Prelude = {
  medal: 45,
  hints: [
    'Aksu Şenliği! Dilek taşına bas: gelgit döner. Mavi taşlar sudan çıkar, turuncular batar; bir daha basarsan geri döner.',
    'Karşıya turuncu köprü gider, şimdi suyun altında. Tepedeki dilek taşına bas, köprü çıksın.',
  ],
  hintsEn: [
    'The Aksu Festival! Step on a wishing stone and the tide turns: the blue stones rise from the sea and the orange ones sink. Step again and it turns back.',
    'The orange bridge leads across, but it is under water now. Step on the wishing stone up here and the bridge will rise.',
  ],
  npcs: [{ name: 'Çiçekçi Şükran Teyze', look: 'teyze', text: 'Mayısın yirmisinde bütün Giresun kıyıya iner: başımızda çiçek, cebimizde yedi taş. Dileğini taşa söyler, denize atarsın. Adanın dibindeki mavi taşın ardında bir kovuk var; gelgit çekilmeden açılmaz, merdiven batar diye korkma.' }],
  npcsEn: [{ name: 'Auntie Şükran the Flower Seller', text: 'On the twentieth of May all of Giresun comes down to the shore: flowers in our hair, seven pebbles in our pocket. You whisper your wish to a pebble and throw it into the sea. Behind the blue stone at the foot of the island there is a hollow; it will not open until the tide goes out, and do not fear when the steps sink.' }],
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
      '                                 ?   _                        ',
      '                               ##########[[[[[[[[####         ',
      '                           ]]  ##########        ####         ',
      '                               ##########        ######       ',
      '                        ]]     ##########        ######       ',
      '                               ##########        ########     ',
      '                     ]]        ##########        ########     ',
      '                               ]   ######        ##########   ',
      '  ?  n  _         ##         _ ] ! ######        ##########   ',
      '##########]]]]]]]]#######################~~~~~~~~#############',
      '##########~~~~~~~~#######################~~~~~~~~#############',
      '##########~~~~~~~~#######################~~~~~~~~#############',
      '##########~~~~~~~~#######################~~~~~~~~#############',
    ],
  ],
}
