export interface StoryPage {
  title: string
  text: string
}

export const STORY: StoryPage[] = [
  {
    title: 'Tavan Arasındaki Defter',
    text: '{name}, dedesi Yusuf’un eski evini toplarken tavan arasında tozlu bir defter buldu. Kapağında soluk harflerle tek bir kelime yazıyordu: Memleket.',
  },
  {
    title: 'Yarım Kalan Sayfalar',
    text: 'Her sayfa bir şehre ayrılmıştı: İstanbul, Mardin, Malatya, Çorum, Sivas, Bayburt. Her sayfada dededen kısa bir not ve üç boş kutu vardı. Her şehirden üç hatıra… Yolculuk yarım kalmıştı.',
  },
  {
    title: 'Son Satır',
    text: 'Son sayfada yalnızca bir cümle vardı: “Yolun sonu, başladığım yer.” {name} sırt çantasını hazırladı, kırmızı atkısını boynuna doladı. Defter tamamlanacaktı.',
  },
]

export const ENDING: StoryPage = {
  title: 'Defter Tamamlandı',
  text: '{name}, Bayburt Kalesi’nin burcunda defterin son sayfasını açtı. Dede Yusuf burada doğmuş, ilk kopuz sesini Çoruh kıyısında duymuştu. Altı şehir geride kaldı. Yol bitti ama memleket bitmez: sıradaki şehirler yolda.',
}

export const fill = (t: string, name: string) => t.replaceAll('{name}', name)
