import { talk, type Talk } from './types'

/** Kütahya: ilk iki şehir insanının Hikâye Gezisi konuşması (ad levels.ts ile aynı). */
export const STORY_KUTAHYA: Record<string, Talk> = {
  'Çinici Hikmet Usta': talk(
    ['Hoş geldin {rol}! Fırçamı bırakamam, lalenin yaprağı yarım kaldı. Şu tabureye otur; sır kuruyana dek konuşuruz.', 'Welcome, {rol}! I can’t put my brush down, the tulip’s petal is half done. Sit on that stool; we can talk until the glaze dries.'],
    [
      [['Desen çiniye nasıl geçiyor?', 'How does the pattern get onto the tile?'], ['Önce kâğıda çizeriz, çizginin üstünü iğneyle delik delik ederiz. Kâğıdı çiniye koyup kömür tozu serperiz; toz deliklerden geçer, desen noktalarla belirir. Gerisi fırçanın ve sabrın işi.', 'First we draw it on paper and prick the line full of holes with a needle. We lay the paper on the tile and dust it with charcoal; the dust slips through the holes and the pattern appears in dots. The rest is up to the brush and patience.']],
      [['Fırına giren çini hiç kaçmaya çalışmaz mı?', 'Doesn’t a tile ever try to escape the kiln?'], ['Çiniler sabırlıdır, ama tabaklar değil! Üçü fırının sıcağına binip uçtu gitti. Biri kaleye konmuş, biri bacaya, biri de Zeus’un sütununa. Belli ki gezmeyi seviyorlar, sana benziyorlar.', 'Tiles are patient, plates are not! Three of them rode the kiln’s heat and flew off. One landed on the castle, one on a chimney, one on a column of Zeus. They clearly love to travel; they take after you.']],
      [['Bu zanaatı size kim öğretti?', 'Who taught you this craft?'], ['Rahmetli ustam. İlk yıl elime fırça vermedi, yalnız toprak yoğurttu, sır karıştırttı. “Çamuru tanımayan çiniyi tanımaz” derdi. Şimdi ben de çırağıma aynısını söylüyorum.', 'My late master. For the first year he gave me no brush, only had me knead clay and mix glaze. “He who doesn’t know the mud doesn’t know the tile,” he used to say. Now I tell my apprentice the very same.']],
    ],
    [['Çinicinin Defteri', 'The Tile Master’s Page'], ['Renk ateşten sonra gelir. Defterine yaz: fırına giren mavi soluk girer, parlak çıkar. Kütahya’da sabırla boyanan bir lale yüzyıllarca solmaz.', 'Colour comes after the fire. Write it down: the blue goes into the kiln pale and comes out bright. In Kütahya a tulip painted with patience does not fade for centuries.']],
  ),
  'Çaycı Bedia Teyze': talk(
    ['Gel yavrum, yokuş seni yormuştur; ince belli bardakta tavşan kanı bir çay vereyim. Kaleye çıkan herkes buradan bir yudum alır.', 'Come, dear, the slope must have tired you; let me pour you a tulip glass of tea, deep red. Everyone climbing to the castle takes a sip here.'],
    [
      [['Kaleyi kimler yaptırmış?', 'Who built the castle?'], ['Temelini Bizanslılar atmış, sonra Germiyan beyleri onarmış, Osmanlı da elden geçirmiş. Kütahya bir zaman Germiyanoğulları’nın başkentiymiş. Akşamüstü burca çık, bütün şehri görürsün.', 'The Byzantines laid its foundations, then the Germiyan lords repaired it, and the Ottomans went over it again. Kütahya was once the capital of the Germiyanids. Climb the tower at dusk and you’ll see the whole city.']],
      [['Burçlara duvardan sekerek çıkmak sizce de tuhaf değil mi?', 'Isn’t it odd to climb the towers by bouncing off the walls?'], ['Tuhaf olan merdiven! Ben gençken bu duvarlardan sekerek çıkardım, sonra da çaya inerdim. Şimdi dizlerim merdiveni seçiyor, ama çayım hâlâ sekiyor: bir bardakta durmuyor, ikincisi geliyor.', 'Stairs are the odd thing! When I was young I bounced up these walls, then came down for tea. Now my knees prefer the stairs, but my tea still bounces: it never stops at one glass, a second always follows.']],
      [['Bu yokuşta en çok neyi seviyorsunuz?', 'What do you love most about this slope?'], ['İnsanları. Kimi kaleye çıkar, kimi çarşıya iner, hepsi bir soluk durur. Çay bahane, hal hatır asıl iş. Yıllardır burada kimse yabancı kalmadı.', 'The people. Some climb to the castle, some go down to the market, and they all stop for a breath. Tea is the excuse, asking after each other is the real work. In all these years nobody has stayed a stranger here.']],
    ],
    [['Yokuşun Defteri', 'The Slope’s Page'], ['Yokuş yavaş çıkılır. Defterine yaz: acele eden burca yorgun varır, duran manzarayı da görür. Kütahya’da bir bardak çay iki yabancıyı komşu eder.', 'A slope is climbed slowly. Write it: whoever hurries reaches the tower tired; whoever pauses sees the view as well. In Kütahya a glass of tea turns two strangers into neighbours.']],
  ),
}
