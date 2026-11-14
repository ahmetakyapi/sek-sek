import type { Prelude } from './types'

/**
 * Truva'nın katmanları: höyüğün kesitinde üç kat. Mavi basamaklar kazı terasına çıkarır ama terasta bir katman
 * eksiktir; raftaki plaka kırmızı katmanı getirir, mavi basamakları götürür. Çatlak taştan alt odaya inilir:
 * katmanı getiren renk çıkış kapısını da kapatmıştır, odadaki plaka onu açar.
 * Nazar boncuğu Troya I çukurunda: katman eksikken boşluğa inilir, içerideki basamaktan geri çıkılır.
 */
export const prelude: Prelude = {
  medal: 60,
  hints: [
    'Truva kazısı: dokuz şehir üst üste. Plakaya basarsan mavi basamaklar gider, yukarıda kırmızı katman belirir; bir daha bas, geri gelsin.',
    'Önünde bir katman eksik, altı Troya I çukuru. Raftaki plaka kırmızı katmanı getirir ama mavi basamakları götürür.',
    'Kırmızı kapı kapalı: katmanı getiren renk kapıyı da kapatır. Soldaki plakaya bas!',
  ],
  hintsEn: [
    'The Troy dig: nine cities stacked on top of each other. Step on the plate and the blue steps vanish while a red layer appears above; step again to bring them back.',
    'A layer is missing ahead, with the Troy I pit beneath it. The plate on the shelf brings the red layer but takes the blue steps away.',
    'The red gate is shut: the colour that brings the layer also closes the gate. Step on the plate to the left!',
  ],
  npcs: [{ name: 'Kazıcı Nazım Usta', look: 'usta', text: 'Kırk yazdır bu höyükte mala sallarım. Her katman bir şehir, en eskisi en dipte. Yukarıda eksik katmanı görünce hemen kapatma; önce çukura in, Troya I’in köşesine bak. İçerideki basamaktan geri çıkarsın.' }],
  npcsEn: [{ name: 'Master Nazım the Digger', text: 'Forty summers I have swung a trowel on this mound. Every layer is a city, the oldest at the very bottom. When you see the missing layer up there, don’t close it right away; drop into the pit first and look in the corner of Troy I. The step inside will get you back out.' }],
  chunks: [
    [
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '                                    ##          ',
      '              _                     ##          ',
      '             ===                    ##          ',
      '           ?               o  l     ##          ',
      '          ########]]]]]]]#######XX####          ',
      '          #              ##         ]]          ',
      '       [[ #       ##     ##         ]]          ',
      ' ?  n _[[ # !     ##     ## _ ?     ]]   k   l  ',
      '################################################',
      '################################################',
      '################################################',
      '################################################',
    ],
  ],
}
