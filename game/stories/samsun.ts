import { talk, type Talk } from './types'

/** Samsun: ilk iki şehir insanının Hikâye Gezisi konuşması (ad levels.ts ile aynı). */
export const STORY_SAMSUN: Record<string, Talk> = {
  'Pideci Recai Usta': talk(
    ['Hoş geldin {rol}! Kürekten geçen pideye dikkat et, kayık gibi uzun, kapıdan yan geçer. Bafra’nın tereyağı kokusu sokağın başına kadar gider.', 'Welcome, {rol}! Mind the pide coming off the peel; it is long as a rowing boat and goes through the door sideways. The smell of Bafra butter reaches the end of the street.'],
    [
      [['Bafra pidesini ötekilerden ayıran ne?', 'What makes Bafra pide different?'], ['Hamuru çok ince açarım, kıymayı içine koyup kenarlarını kapatırım. Taş fırında kızarınca dilimler, üstüne tereyağı sürerim. Kapalı olduğu için içi sulu kalır, dışı çıtır.', 'I roll the dough very thin, put the minced meat inside and close the edges. Once it browns in the stone oven I slice it and brush butter on top. Because it is closed, the inside stays juicy and the outside crisp.']],
      [['Pide neden bu kadar uzun?', 'Why is the pide so long?'], ['Fırının dibine kadar uzansın diye! Bir keresinde müşteri “kısa olsun” dedi, ben de yarısını kestim. Öbür yarısını kim yedi diye sorma, çırak bilir.', 'So it reaches the back of the oven! Once a customer said “make it short”, so I cut it in half. Do not ask who ate the other half; ask the apprentice.']],
      [['Bu fırın kaç yıllık?', 'How old is this oven?'], ['Ustamdan kaldı, ona da ustasından. Taşları kaç kez değişti bilmem ama ateşi hiç sönmedi. Bayram sabahları kapının önünde kuyruk olur, herkese yetiştiririm.', 'It came from my master, and to him from his. I do not know how many times the stones were changed, but the fire never went out. On holiday mornings there is a queue at the door, and I get to everyone.']],
    ],
    [['Pidecinin Defteri', 'The Pide Maker’s Page'], ['Hamur sabır ister, fırın dikkat. Defterine yaz: pideyi kapat ki suyu kaçmasın, sofrayı aç ki kimse dışarıda kalmasın. Samsun’da pide sıcak yenir, sohbet uzun sürer.', 'Dough wants patience, the oven wants care. Write it: close the pide so its juice stays in, open the table so nobody is left out. In Samsun pide is eaten hot and the conversation runs long.']],
  ),
  'Çaycı Nebahat Teyze': talk(
    ['Gel otur {rol}, ince belli bardakta çayın hazır. Karşında Karadeniz, arkanda Atakum; daha ne istersin?', 'Come and sit, {rol}, your tea is ready in a tulip glass. The Black Sea in front of you, Atakum behind; what more could you want?'],
    [
      [['Karadeniz neden bu kadar dalgalı?', 'Why is the Black Sea so wavy?'], ['Rüzgârı açıktan gelir, önünde onu durduracak ada yoktur. Mendirekler o yüzden yapıldı; dalga taşa vurur, kumsal sakin kalır. Kış gelince dalgaların sesi evime kadar gelir.', 'Its wind comes from the open sea and no island stands in its way. That is why the jetties were built; the waves hit the stone and the beach stays calm. In winter the sound of the waves reaches my house.']],
      [['Günde kaç demlik çay demliyorsun?', 'How many pots of tea do you brew a day?'], ['Saymayı bıraktım, martılar sayıyor! Her demlikte biri gelip simit kırıntısı bekler. Ben de onlara “önce çay, sonra simit” derim, dinlemezler.', 'I stopped counting; the seagulls count for me! With every pot one of them comes to wait for simit crumbs. I tell them “tea first, simit after”, but they never listen.']],
      [['Atakum eskiden nasıldı?', 'What was Atakum like in the old days?'], ['Kumsalı, birkaç yazlık evi ve bahçeleri vardı. Şimdi kocaman bir sahil yolu oldu, akşamları herkes yürüyüşe çıkar. Değişmeyen tek şey denizin rengi; o hâlâ aynı.', 'It had its beach, a few summer houses and gardens. Now there is a huge seaside promenade, and in the evenings everyone goes for a walk. The only thing that never changed is the colour of the sea; it is still the same.']],
    ],
    [['Çaycının Defteri', 'The Tea Maker’s Page'], ['Deniz kızar da sakinleşir de; sen bardağını dolu tut. Defterine yaz: çay demini bekler, dalga sahilini bulur. Atakum’da gün batımı izlenmeden eve dönülmez.', 'The sea grows angry and calms down again; you keep your glass full. Write it: tea waits for its brew, a wave finds its shore. In Atakum nobody goes home before watching the sunset.']],
  ),
}
