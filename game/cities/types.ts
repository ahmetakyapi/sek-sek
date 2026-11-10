/**
 * Yeni şehirlerin ana yolu: şehir başına bir dosya (game/cities/<şehir>.ts).
 * Parçalar alttan hizalıdır (son dört satır zemin, oyuncu 19. satırda yürür) ve soldan sağa birleşir.
 * İlk parçada başlangıç (P), son parçada çıkış (E) bulunur; E oyunda meydan kapısına dönüşür.
 * Tabelalar (?) soldan sağa şehrin `hints` sırasını, kişiler (n) `npcs` sırasını izler (ikisi de game/levels.ts'te).
 */
export interface CityRoad {
  chunks: string[][]
}
