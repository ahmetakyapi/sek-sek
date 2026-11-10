import type { Npc } from '../types'

/**
 * Meydan yolu: meydan kapısından sonra, boss arenasından önce gelen bulmaca / meydan okuma parçası.
 * Parçalar alttan hizalıdır (son dört satır zemin, oyuncu 19. satırda yürür); ilk parçanın sol
 * kenarı ve son parçanın sağ kenarı düz zeminle biter. Tabelalar (?) soldan sağa `hints` sırasını,
 * şehir insanları (n) `npcs` sırasını izler.
 */
export interface Prelude {
  /** madalya sürelerine eklenecek saniye (yol + boss) */
  medal: number
  hints: string[]
  hintsEn: string[]
  npcs?: Npc[]
  npcsEn?: { name: string; text: string }[]
  chunks: string[][]
}
