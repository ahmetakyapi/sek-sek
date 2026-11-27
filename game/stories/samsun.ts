import { talk, type Talk } from './types'

/** Samsun: ilk iki şehir insanının Hikâye Gezisi konuşması. TASLAK (yeni-sehir: metin ajanı yazar; ad levels.ts ile aynı). */
export const STORY_SAMSUN: Record<string, Talk> = {
  'Samsun Ustası (TASLAK)': talk(
    ['TASLAK: Samsun Ustası selam verir, kendini ve işini bir cümleyle anlatır.', 'TASLAK: The Master of Samsun greets you and sums up their trade in a sentence.'],
    [
      [['TASLAK: Samsun Ustası için merak sorusu', 'TASLAK: curious question for person 1'], ['TASLAK: Samsun Ustası merak sorusuna cevap verir.', 'TASLAK: person 1 of Samsun answers the curious question.']],
      [['TASLAK: Samsun Ustası için şaka sorusu', 'TASLAK: joking question for person 1'], ['TASLAK: Samsun Ustası şakaya şakayla karşılık verir.', 'TASLAK: person 1 of Samsun answers the joke with a joke.']],
      [['TASLAK: Samsun Ustası için saygı sorusu', 'TASLAK: respectful question for person 1'], ['TASLAK: Samsun Ustası saygılı soruya içten cevap verir.', 'TASLAK: person 1 of Samsun answers the respectful question warmly.']],
    ],
    [['TASLAK: 1. defter sayfası', 'TASLAK: notebook page 1'], ['TASLAK: Samsun Ustası deftere şehre özgü bir söz yazdırır.', 'TASLAK: person 1 of Samsun has you write a saying in the notebook.']],
  ),
  'Samsun Teyzesi (TASLAK)': talk(
    ['TASLAK: Samsun Teyzesi selam verir, kendini ve işini bir cümleyle anlatır.', 'TASLAK: The Auntie of Samsun greets you and sums up their trade in a sentence.'],
    [
      [['TASLAK: Samsun Teyzesi için merak sorusu', 'TASLAK: curious question for person 2'], ['TASLAK: Samsun Teyzesi merak sorusuna cevap verir.', 'TASLAK: person 2 of Samsun answers the curious question.']],
      [['TASLAK: Samsun Teyzesi için şaka sorusu', 'TASLAK: joking question for person 2'], ['TASLAK: Samsun Teyzesi şakaya şakayla karşılık verir.', 'TASLAK: person 2 of Samsun answers the joke with a joke.']],
      [['TASLAK: Samsun Teyzesi için saygı sorusu', 'TASLAK: respectful question for person 2'], ['TASLAK: Samsun Teyzesi saygılı soruya içten cevap verir.', 'TASLAK: person 2 of Samsun answers the respectful question warmly.']],
    ],
    [['TASLAK: 2. defter sayfası', 'TASLAK: notebook page 2'], ['TASLAK: Samsun Teyzesi deftere şehre özgü bir söz yazdırır.', 'TASLAK: person 2 of Samsun has you write a saying in the notebook.']],
  ),
}
