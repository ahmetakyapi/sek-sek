import type { Prelude } from './types'

/**
 * Teleferik istasyonları: tek bir tel dört istasyonun üstünden geçer; tele asılı iki renkli kapı ve son istasyonun
 * köprüsü plakalarla çevrilir (bir plaka hepsini birden çevirir: turuncu açılırsa mavi kapanır).
 *  1. A istasyonunun plakası turuncu kapıyı açar: tele asıl, geç, B istasyonuna in.
 *  2. Sıradaki kapı mavi: B’nin plakasına bas (turuncu arkanda kapanır, mavi açılır), yeniden asıl, ara direğe in.
 *  3. C’nin köprüsü mavi, ama mavi şimdi kapalı: ara direğin plakası köprüyü kurar. Tele dön, köprüye in.
 * Kilitlenme yok: B, ara direk ve A’da plaka var; vadi aralıkları (10 karo) dash’le aşılmaz.
 * Nazar boncuğu telin üstünde, ara direğin yanındaki dar taşın hizasında sallanır: telden taşa in, telin içinden
 * yukarı zıpla (düşerken tel seni yeniden yakalar).
 */
export const prelude: Prelude = {
  medal: 70,
  hints: [
    'Teleferik istasyonları. Plakaya bas: turuncu kapılar açılır, mavi kapılar kapanır. Bir plaka hepsini birden çevirir; tele asılıp kapıdan geç.',
    'Sıradaki kapı mavi. Buradaki plaka onu açar ama arkandaki turuncuyu kapatır. Ara direkte bir plaka daha var: karşı istasyonun köprüsüne bak, sonra bas.',
  ],
  hintsEn: [
    'The cable car stations. Step on a plate: the orange gates open and the blue gates close. One plate turns them all at once; hang from the wire and pass the gate.',
    'The next gate is blue. This plate opens it but closes the orange one behind you. There is one more plate on the middle pylon: look at the far station’s bridge, then press.',
  ],
  npcs: [{ name: 'İstasyon Şefi Kâmil Dayı', look: 'amca', text: 'Köyün sepeti kırk yıldır bu telde gider gelir evlat; kapıyı açan da benim, kapatan da. Ara direğin yanında dar bir taş var; tam onun üstünde, telin de üstünde bir şey sallanıyor. Sepetten bakan görmez, taşa inen görür.' }],
  npcsEn: [{ name: 'Uncle Kâmil the Station Master', text: 'The village basket has run on this wire for forty years, my child; I am the one who opens the gates and closes them too. Beside the middle pylon there is a narrow stone; right above it, above the wire too, something dangles. Nobody sees it from the basket, but whoever steps down on the stone does.' }],
  chunks: [
    [
      '                                            !                         ',
      '                                                                      ',
      '            RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR               ##    ',
      '                    [            ]                              ##    ',
      '                    [            ]          ##              ######    ',
      '              _           ? _           _   ##           F  ######    ',
      '            ####          ####          ### ##]]]]]]]]]]###########   ',
      '            ####          ####          ### ##          ###########   ',
      '          ######          ####          ### ##          ###########   ',
      '  ?  n    ######          ####          ### ##          ###########   ',
      '################          ####          ### ##          ##############',
      '################          ####          ### ##          ##############',
      '################^^^^^^^^^^####^^^^^^^^^^###^##^^^^^^^^^^##############',
      '######################################################################',
    ],
  ],
}
