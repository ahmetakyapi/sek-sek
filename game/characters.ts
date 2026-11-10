/**
 * İki oynanabilir karakterin kimliği. Oyun içi çizim game/heroDraw.ts'te
 * (vektör çizim); çarpışma kutusu 12×14 kalır, ayaklar kutunun tabanına oturur.
 */
export type CharacterId = 'uktun' | 'memo'

export interface CharacterDef {
  id: CharacterId
  name: string
  /** hikâye ve diyaloglarda kısa ad */
  short: string
  role: string
  bio: string
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  uktun: {
    id: 'uktun',
    name: 'Uktun',
    short: 'Uktun',
    role: 'Haritacı',
    bio: 'İstanbullu, 26 yaşında. Kadıköy vapurlarında büyüdü, haritaları ezbere bilir ama hiçbir yolu sahafta bulduğu o defter kadar merak etmedi. Uzun saçlarını rüzgâra bırakır, yolu hep kendisi bulur.',
  },
  memo: {
    id: 'memo',
    name: 'Memo',
    short: 'Memo',
    role: 'Telefoncu',
    bio: 'Diyarbakırlı, 28 yaşında. Surların dibinde küçük bir telefon dükkânı var; kırık ekranı bir bakışta tanır. Cebinde Gezgin’in defteri ve her şehri kaydettiği eski bir telefon.',
  },
}

