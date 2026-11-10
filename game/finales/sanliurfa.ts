import type { Prelude } from './types'

/**
 * Göbeklitepe kazı alanı, iki açma. 1) Sandık: taşın dibine it, üstüne çık, başlığa zıpla (solu su, sağı taş: sandık
 * birkaç karodan öteye gitmez, suya düşerse yerine döner). 2) Plaka: ilk plaka kırmızı köprüyü getirir, mavi kapıyı
 * açar; köprüden sonraki ikinci plakaya basılırsa kapı yine kapanır, üstünden atlanır. Plakaya yalnız oyuncu basar.
 * Nazar boncuğu ilk açmada, girişin hemen üstünde: sandık taşa değil geriye, suyun kıyısına itilip üstünden zıplanır.
 */
export const prelude: Prelude = {
  medal: 55,
  hints: [
    'Göbeklitepe kazısı: sandığa doğru yürü, itilir. Taşın dibine kadar it, üstüne çık, başlığa zıpla.',
    'Plakaya bas: kırmızı taşlar köprü olur, mavi kapı açılır. Bir daha basılırsa hepsi eski hâline döner.',
    'Kapı açık, öyle kalsın: yerdeki ikinci plakaya basma, üstünden atla. Bastıysan bir daha bas.',
  ],
  hintsEn: [
    'The Göbeklitepe dig: walk into the crate and it slides. Push it to the foot of the stone, climb on it and jump to the cap.',
    'Step on the plate: the red stones become a bridge and the blue gate opens. Step again and everything goes back.',
    'The gate is open, so keep it that way: do not step on the second plate, jump over it. If you did, step on it once more.',
  ],
  npcs: [{ name: 'Kazı Başkanı Eyüp', look: 'usta', text: 'Bu taşlar piramitlerden binlerce yıl eski; daha çanak çömlek yokken dikilmiş. Sandığımız ağırdır ama yürürsen kayar. Onu taşa itmeden önce bir de geriye, suyun kıyısına it derim: üstüne çık, yukarı bak. Suya düşerse korkma, yerine döner.' }],
  npcsEn: [{ name: 'Eyüp the Dig Director', text: 'These stones are thousands of years older than the pyramids; they were raised before there was any pottery. Our crate is heavy, but walk into it and it slides. Before you push it to the stone, push it back to the water’s edge first: climb on it and look up. If it falls in the water, never mind, it comes back to its place.' }],
  chunks: [
    [
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '                                  ##        ',
      '      !                           ##        ',
      '                                  ##        ',
      '           ###                    [[        ',
      '            ##                    [[        ',
      ' ? n    p  ### F ? _       ? _    [[   l    ',
      '#####~###############]]]]]##################',
      '#####~###############^^^^^##################',
      '#####~######################################',
      '#####~######################################',
    ],
  ],
}
