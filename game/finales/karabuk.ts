import type { Prelude } from './types'

/**
 * Cinci Han'ın Kapıları: avlunun dört kapısı. Tavana kadar uzanan kapılar plakayla çevrilir (turuncu [ kapalıyken katı,
 * mavi ] açıkken katı; her plaka bütün kapıları birden çevirir ve bir daha basınca geri döner). Han bir hava kilidi
 * gibi çalışır: bir kapıdan geçince arkandan kapanır, sonraki plaka bir sonrakini açar. Sıra: turuncu (açık durum),
 * mavi (kapalı durum), turuncu, mavi.
 *  1. Başlangıçta basılmamış durum: turuncu kapı kapalı. İlk plakaya bas, geç. İkinci plaka (bayraktan sonra) mavi kapıyı açar.
 *  2. Mavi kapıdan sonra iki plaka art arda: ikisine de basarsan durum değişmez. Birine bas, ötekinin üstünden atla
 *     (yanlış bastıysan geri dönüp bir daha bas: kilitlenme yok, plaka istendiği kadar basılır).
 *  3. Turuncu kapıdan sonra son plaka maviyi açar. Nazar boncuğu han avlusunun üst sedirlerinde, son kapının önünde:
 *     sedirlerden sedire zıpla.
 * Düğme bayrakla saklanır (F ikinci odada): ölünce o durumda doğarsın; tavana kadar kapılar kaçak bırakmaz.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: [
    'Cinci Han’ın kapıları. Plakaya bas: turuncu kapılar açılır, mavi kapılar kapanır; bir daha basarsan geri döner. Kapıdan geçince arkandan kapanır.',
    'Her kapı kendi renginde açılır: önündeki kapı maviyse plaka onu açmalı. İki plaka art arda geliyorsa birine bas, ötekinin üstünden atla: ikisine de basarsan hiçbir şey değişmez.',
    'Son kapı mavi: son plakaya bas, turuncular kapanır, maviler açılır. Kapıdan önce başını kaldır: avlunun üst sedirleri görünür.',
  ],
  hintsEn: [
    'The gates of Cinci Han. Step on a plate: the orange gates open and the blue gates close; step again and they swap back. Once you pass a gate it closes behind you.',
    'Each gate opens in its own colour: if the gate ahead is blue, the plate must open it. When two plates come in a row, step on one and hop over the other: press both and nothing changes.',
    'The last gate is blue: press the last plate, the orange ones close and the blue ones open. Before the gate, look up: the upper benches of the courtyard come into view.',
  ],
  npcs: [{ name: 'Hancı Tahsin Efendi', look: 'amca', text: 'Cinci Han’ın kapıları üç yüz yıldır arkandan kapanır evlat; biri açılırsa öbürü kapanır, han böyle çalışır. İki plaka yan yanaysa ikisine basmak boşunadır. Son kapıya varınca yukarı bak: avlunun sedirlerinde bir göz parlar.' }],
  npcsEn: [{ name: 'Tahsin the Innkeeper', text: 'The gates of Cinci Han have closed behind travellers for three hundred years, my child; when one opens the other closes, that is how the inn works. If two plates sit side by side, pressing both is wasted effort. When you reach the last gate, look up: an eye glints on the benches of the courtyard.' }],
  chunks: [
    [
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
      '            [[          ]]             [[               ]]      ',
      '            [[          ]]             [[               ]]      ',
      '            [[          ]]             [[       !       ]]      ',
      '            [[          ]]             [[      ===      ]]      ',
      '            [[          ]]             [[               ]]      ',
      '            [[          ]]             [[  ===          ]]      ',
      '            [[          ]]             [[               ]]      ',
      '  n ?  _    [[  ?  F _  ]]  ?  _  _    [[           _   ]]      ',
      '################################################################',
      '################################################################',
      '################################################################',
      '################################################################',
    ],
  ],
}
