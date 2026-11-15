import type { Prelude } from './types'

/**
 * Çay fabrikası: yaprağın yıkandığı üç kazan, üç plaka. Bir plaka bütün blokları çevirir (turuncu açılır, mavi
 * kapanır; bir daha basınca geri döner). Turuncu bloklar hem kapı hem kazan kapağıdır.
 *  1. Öğretir: açık kazanı yüzerek geç, öbür yandaki plakaya bas, turuncu kapı açılır.
 *  2. Sınar: ikinci kazanın kapağı da turuncu, şimdi açık. Ortadaki duvarın altından dal, sete çık, plakaya bas: mavi
 *     kapı açılır, kapak arkandan kapanır.
 *  3. Birleştirir: üçüncü kazanın kapağı kapalı, üstünden yürünür; kapağı açan plaka kazanın öbür ucunda. Bas, geri dön,
 *     açılan kazana atla, arka duvarın altından yüzerek dışarı çık.
 * Kilitlenme yok: her plaka yeniden basılınca geri çevirir; kazanlar üç karo derin, boğulma yok.
 * Nazar boncuğu ikinci kazanın ortasındaki kalın duvarın içinde, bir hava cebinde: duvarın altından dalarken
 * yukarı kulaç atan cebe çıkar (cebin ağzı suyun üstünde, karanlık bir oyuk olarak görünür).
 */
export const prelude: Prelude = {
  medal: 50,
  hints: [
    'Rize Çay Fabrikası. Plakaya bas: turuncu bloklar açılır, mavi bloklar kapanır. Kazanda yüz, kulaçla kenara çık.',
    'Bu kazanın kapağı kapalı: üstünden yürü. Kapağı açan plaka öbür uçta; bas, açılan kazana atla, duvarın altından dal.',
  ],
  hintsEn: [
    'Rize Tea Factory. Step on a plate: the orange blocks open and the blue blocks close. Swim across the vat and stroke your way up onto the edge.',
    'This vat’s lid is shut: walk across it. The plate that opens it is at the far end; press it, jump into the open vat and dive under the wall.',
  ],
  npcs: [{ name: 'Harman Ustası Şevket Dayı', look: 'usta', text: 'Yaş yaprak buraya gelir evlat: yıkanır, soldurulur, kıvrılır, mayalanır. Kazanların kapağı plakaya bağlıdır; acele eden kapağı arkasından kapatır. İkinci kazanın duvarının altından geçerken başını kaldır: taşın içinde bir hava cebi var, orada bir şey parlar.' }],
  npcsEn: [{ name: 'Uncle Şevket the Tea Blender', text: 'The fresh leaf comes here, my child: washed, withered, rolled and fermented. The vat lids are tied to the plates; whoever hurries shuts the lid behind him. When you swim under the wall of the second vat, look up: there is an air pocket inside the stone, and something shines there.' }],
  chunks: [
    [
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##################################################       ',
      '     ##                [[       ####        ]]       ##       ',
      '     ##                [[       ####        ]]       ##       ',
      '     ##                [[       ####        ]]       ##       ',
      '     ##                [[       ####        ]]       ##       ',
      '     ##                [[       ####        ]]       ##       ',
      '     ##                [[       ####        ]]       ##       ',
      '                       [[       ####        ]]       ##       ',
      '                       [[       # !#        ]]       ##       ',
      '                     _ [[       #  #      _ ]]?     _##       ',
      '     ######        #########[[[[#  #[[[[#######[[[[[###       ',
      '    #######WWWWWWWW#########WWWWWWWWWWWW#######WWWWWWWWWWW##  ',
      ' ? n#######WWWWWWWW#########WWWWWWWWWWWW#######WWWWWWWWWWW##  ',
      '###########WWWWWWWW#########WWWWWWWWWWWW#######WWWWWWWWWWW####',
      '##############################################################',
      '##############################################################',
      '##############################################################',
    ],
  ],
}
