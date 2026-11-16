import type { Prelude } from './types'

/**
 * Hierapolis'in Antik Havuzu (Kleopatra Havuzu): ılık suda devrik sütunlar. İki havuzu göğe dek çıkan bir duvar ayırır;
 * altındaki su yolunu turuncu kapak keser. Plaka birinci havuzda sudan çıkan bir sütun başlığında: basınca kapak açılır,
 * mavi taş gelir (ikinci havuzun çıkış basamağı). Plaka her basışta çevirir: kilitlenme yok.
 * İkinci havuzu ortasındaki duvar böler; altında dikenli bir çukur var, kulaçla yüksekte kalıp geçilir. Nazar çukurun
 * hemen sağında, iki devrik sütunun arasındaki aralıkta: duvarın altından geçen görür, dibe biraz sokulan alır.
 * Çözücü aşağı basmaz: suda kendiliğinden batılır.
 */
export const prelude: Prelude = {
  medal: 75,
  hints: [
    'Antik Havuz’a hoş geldin. Sütun başlığındaki plakaya bas: turuncu kapak açılır, öbür havuzda mavi basamak belirir. Duvarın altındaki çukur dikenli, geçerken kulaç at.',
  ],
  hintsEn: [
    'Welcome to the Antique Pool. Step on the plate on the column capital: the orange gate opens and a blue step appears in the next pool. The pit under the wall is spiky, so keep stroking as you pass.',
  ],
  npcs: [{ name: 'Cankurtaran Tarık', look: 'genc', text: 'Bu havuza Kleopatra da girmiş derler; suyu hep ılık, sütunlarını bir deprem devirmiş. İkinci havuzda duvarın altından geçerken dibe sarkma, diken var. Ama hemen ötesinde iki devrik sütunun arasında bir şey parlıyor.' }],
  npcsEn: [{ name: 'Tarık the Lifeguard', text: 'They say Cleopatra herself bathed in this pool; the water is always warm, and an earthquake toppled its columns. In the second pool, do not sink too low as you pass under the wall, there are spikes. But just beyond it, something shines between two fallen columns.' }],
  chunks: [
    [
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##                    ',
      '                      ##      ##      #####         ',
      '               _      ##      ##      #####         ',
      '               ##     ##      ##    ]]#####         ',
      '        ##WWWWW##WWWWW##WWWWWW##WWWWWW#######       ',
      '        ##WWWWWWWWWWWW[WWWWWWW##WWWWWW#######       ',
      ' ?  n   ##WWWWWWWWWWWW[WWWWWWWWWWW###########       ',
      '############################WWWWWWWWW###############',
      '############################WWWWWWWW!###############',
      '############################W^^^^W##################',
      '####################################################',
    ],
  ],
}
