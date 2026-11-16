import type { Prelude } from './types'

/**
 * Ballıca Mağarası: tavandan sarkıtlar sarkar, dikitler basamak olur. Üst galeri ile alttaki salonun arasında bir
 * plaka bulmacası (turuncu taşlar basınca kalkar, mavi taşlar belirir; bir daha basınca geri döner):
 *  1. Dikitlerden üst galeriye çık. Yolu turuncu kapak kesiyor; önündeki çatlak damlataşta dur, kırılır, salona inersin.
 *  2. Salondaki plaka turuncu kapağı kaldırır, salonda mavi basamaklar çıkarır; ama galerinin sonundaki mavi kapağı
 *     kapatır. Basamaklardan galeriye dön; oradaki plaka mavileri geri alır, çıkış açılır.
 * Kilitlenme yok: galeriden salona açık aralık ve çatlak taştan her zaman inilir, iki plaka da istendiği kadar basılır;
 * mavi kapak kapalıyken salonun tavanı kapalıdır (aşağıdan sekerek atlanmaz). Nazar boncuğu salonun dibinde, turuncu
 * perdenin ardında dikitlerin arasında: salon plakasına basınca perde de kalkar, sağa bakan görür.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Ballıca Mağarası. Turuncu kapak yolu kesiyorsa önündeki çatlak damlataşta dur: kırılır, alttaki salona inersin.',
    'Plakaya bas: turuncu taşlar kalkar, mavi basamaklar çıkar. Galerideki plaka mavileri geri alır, çıkış açılır.',
  ],
  hintsEn: [
    'Ballıca Cave. If an orange lid blocks the way, stand on the cracked dripstone in front of it: it breaks and you drop into the hall below.',
    'Step on the plate: the orange stones lift and blue steps appear. The plate up in the gallery takes the blue ones back and opens the way out.',
  ],
  npcs: [{ name: 'Mağara Rehberi Nimet Hanım', look: 'teyze', text: 'Ballıca’nın sarkıtları damla damla, milyonlarca yılda uzadı evladım; başını kaldırırken dikkat et. Salondaki plakaya basınca turuncu perde de kalkar; mağaranın en dibinde, dikitlerin ardında bir göz parlar.' }],
  npcsEn: [{ name: 'Nimet the Cave Guide', text: 'The stalactites of Ballıca grew drop by drop over millions of years, my dear; mind your head when you look up. When you step on the plate in the hall, the orange curtain lifts too; at the very back of the cave, behind the stalagmites, an eye glimmers.' }],
  chunks: [
    [
      '        ########################################################',
      '        ########################################################',
      '        ########################################################',
      '        ########################################################',
      '        ########################################################',
      '        ########################################################',
      '           v   v   v         v   v      [[          v    ]] v   ',
      '                                        [[               ]]     ',
      '                                        [[               ]]     ',
      '                                        [[               ]]     ',
      '                                        [[               ]]     ',
      '                                        [[       _       ]]     ',
      '                        #############XXX####   #################',
      '                        ###                     [        ##     ',
      '                     ######                 ]]] [        ##     ',
      '                     ######                     [        ##     ',
      '                 ### ######             ]]]     [        ##     ',
      '                 ### ######                     [        ##     ',
      '             ### ### ######         ]]]         [        ##     ',
      '  ?  n       ### ### ###### ?  _  ^             [  ^^  ! ##     ',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
    ],  ],
}
