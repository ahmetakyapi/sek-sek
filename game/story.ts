export interface StoryPage {
  title: string
  text: string
}

export const STORY: StoryPage[] = [
  {
    title: 'Sahaftaki Defter',
    text: '{name}, bir sahafın en alt rafında eski bir yol defteri buldu. Kapağında soluk harflerle tek bir kelime yazıyordu: Memleket. Kimden kaldığını sahaf da bilmiyordu; sayfaların altında hep aynı imza vardı: Seyyah.',
  },
  {
    title: 'Yarım Kalan Sayfalar',
    text: 'Her sayfa bir şehre ayrılmıştı. Her sayfada Seyyah’ın kısa bir notu vardı: ne yenir, nereden bakılır, kime selam verilir. Notun altında da üç boş kutu. Her şehirden üç hatıra… Seyyah kutuları doldurmamış, defteri bulana bırakmıştı.',
  },
  {
    title: 'Son Satır',
    text: 'Son sayfada yalnızca bir cümle vardı: “Yolun sonu, başladığım yer.” {name} sırt çantasını hazırladı, kırmızı atkısını boynuna doladı. Defter tamamlanacaktı.',
  },
]

export const ENDING: StoryPage = {
  title: 'Defter Tamamlandı',
  text: '{name}, Bayburt Kalesi’nin burcunda defterin son sayfasını açtı. Üç kutu da doldu. Seyyah kimdi, yola neden buradan çıktı, defter söylemiyor; sayfanın köşesinde yalnız küçük bir not var: “Sıra sende.” Yol bitti ama memleket bitmez: sıradaki şehirler yolda.',
}

export const fill = (t: string, name: string) => t.replaceAll('{name}', name)
