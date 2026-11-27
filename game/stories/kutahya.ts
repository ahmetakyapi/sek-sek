import { talk, type Talk } from './types'

/** Kütahya: ilk iki şehir insanının Hikâye Gezisi konuşması. TASLAK (yeni-sehir: metin ajanı yazar; ad levels.ts ile aynı). */
export const STORY_KUTAHYA: Record<string, Talk> = {
  'Kütahya Ustası (TASLAK)': talk(
    ['TASLAK: Kütahya Ustası selam verir, kendini ve işini bir cümleyle anlatır.', 'TASLAK: The Master of Kütahya greets you and sums up their trade in a sentence.'],
    [
      [['TASLAK: Kütahya Ustası için merak sorusu', 'TASLAK: curious question for person 1'], ['TASLAK: Kütahya Ustası merak sorusuna cevap verir.', 'TASLAK: person 1 of Kütahya answers the curious question.']],
      [['TASLAK: Kütahya Ustası için şaka sorusu', 'TASLAK: joking question for person 1'], ['TASLAK: Kütahya Ustası şakaya şakayla karşılık verir.', 'TASLAK: person 1 of Kütahya answers the joke with a joke.']],
      [['TASLAK: Kütahya Ustası için saygı sorusu', 'TASLAK: respectful question for person 1'], ['TASLAK: Kütahya Ustası saygılı soruya içten cevap verir.', 'TASLAK: person 1 of Kütahya answers the respectful question warmly.']],
    ],
    [['TASLAK: 1. defter sayfası', 'TASLAK: notebook page 1'], ['TASLAK: Kütahya Ustası deftere şehre özgü bir söz yazdırır.', 'TASLAK: person 1 of Kütahya has you write a saying in the notebook.']],
  ),
  'Kütahya Teyzesi (TASLAK)': talk(
    ['TASLAK: Kütahya Teyzesi selam verir, kendini ve işini bir cümleyle anlatır.', 'TASLAK: The Auntie of Kütahya greets you and sums up their trade in a sentence.'],
    [
      [['TASLAK: Kütahya Teyzesi için merak sorusu', 'TASLAK: curious question for person 2'], ['TASLAK: Kütahya Teyzesi merak sorusuna cevap verir.', 'TASLAK: person 2 of Kütahya answers the curious question.']],
      [['TASLAK: Kütahya Teyzesi için şaka sorusu', 'TASLAK: joking question for person 2'], ['TASLAK: Kütahya Teyzesi şakaya şakayla karşılık verir.', 'TASLAK: person 2 of Kütahya answers the joke with a joke.']],
      [['TASLAK: Kütahya Teyzesi için saygı sorusu', 'TASLAK: respectful question for person 2'], ['TASLAK: Kütahya Teyzesi saygılı soruya içten cevap verir.', 'TASLAK: person 2 of Kütahya answers the respectful question warmly.']],
    ],
    [['TASLAK: 2. defter sayfası', 'TASLAK: notebook page 2'], ['TASLAK: Kütahya Teyzesi deftere şehre özgü bir söz yazdırır.', 'TASLAK: person 2 of Kütahya has you write a saying in the notebook.']],
  ),
}
