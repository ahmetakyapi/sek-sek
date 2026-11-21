import { talk, type Talk } from './types'

/** Marmara, Ege ve Akdeniz'in batısı: İstanbul, Edirne, Kocaeli, Bursa, Eskişehir, Çanakkale, İzmir, Antalya */
export const BATI: Record<string, Talk> = {
  'Simitçi Hasan Amca': talk(
    ['Gel bakalım {rol}, tepsi sıcak! Kırk yıldır aynı iskelede satarım; martılar bile beni tanır.', 'Come on, {rol}, the tray is hot! Forty years at the same pier, and even the gulls know me.'],
    [
      [['Simit neden bu kadar çok susamlı?', 'Why so much sesame on a simit?'], ['Susam kokusu uzaktan çağırır evladım. Pekmeze batırılır, fırına öyle girer; parlaklığı ondandır.', 'The smell calls from far away, son. It gets dipped in molasses before the oven; that is where the shine comes from.']],
      [['Martılara pay ayırıyor musun?', 'Do you save a share for the gulls?'], ['Ayırmıyorum, onlar kendi payını alıyor! Geçen gün biri sepetten bütün bir simidi kaptı, bir de dönüp baktı bana.', 'I do not, they take their own! Last week one grabbed a whole simit from the basket and then turned to look at me.']],
      [['Bu iskelenin hikâyesini sorsam anlatır mısınız?', 'Would you tell me this pier’s story?'], ['Vapur düdüğü benim saatimdir evladım. İlk vapur sabahın ilk simidini yedirir, son vapur son çayı. Aradakiler hep misafir.', 'The ferry horn is my clock, son. The first boat eats the first simit of the day, the last one drinks the last tea. Everyone between is a guest.']],
    ],
    [['Simitçinin Defteri', 'The Simit Seller’s Page'], ['Defterine yaz, hep sabah bir simit ye. İstanbul’u en iyi iskelede, elinde sıcak bir şeyle, denize bakarken anlarsın. Bunu bana ilk simitçi öğretti.', 'Write it in your book: always eat a simit in the morning. You understand Istanbul best at a pier, something warm in your hand, looking at the sea. The first simit seller taught me that.']],
  ),
  'İskele Görevlisi Selin': talk(
    ['Hoş geldin! Halat bende, vapur sende. Her gün binlerce kişi bu iskeleden geçer; çoğu telaşlı, sen biraz yavaşsın.', 'Welcome! The rope is mine, the ferry is yours. Thousands pass this pier every day, most of them in a hurry; you seem a little slower.'],
    [
      [['Halatı nasıl atıyorsun, hiç kaçırdığın oldu mu?', 'How do you throw the rope, ever miss?'], ['İlk yıl iki kez denize attım halatı, vapur kaptanı hâlâ anlatır! Şimdi gözüm kapalı bağlarım, ama gözüm kapalı demem.', 'My first year I threw it into the sea twice, and the captain still tells it! Now I could tie up with my eyes closed, though I would not say so aloud.']],
      [['İskele mi vapuru yoksa vapur mu iskeleyi bekler?', 'Does the pier wait for the ferry, or the ferry for the pier?'], ['Gel de çöz bu muammayı! Bence ikisi de yolcuyu bekler. Yolcu yoksa ikisi de sadece demir ve ahşap.', 'Solve that riddle for me! I think both wait for the passenger. Without one, they are only iron and wood.']],
      [['Bu kadar kalabalığa nasıl sabrediyorsun?', 'How do you stay patient with such crowds?'], ['Herkesin bir yere yetişmesi gerekiyor, bunu unutmam. Birinin yüzü gülerse iskeleyi iki kat sever oldum.', 'Everyone has somewhere to be, I never forget that. When someone’s face lights up, I love the pier twice as much.']],
    ],
    [['İskelenin Defteri', 'The Pier’s Page'], ['Yolcuların çoğu yanından geçtiği şehri görmez. Sen bak: karşı kıyı her gün başka renk. Bu şehir bir kere görülmez, her sabah yeniden görülür.', 'Most passengers never see the city they pass. You look: the far shore is a different colour every day. This city is not seen once, it is seen anew each morning.']],
  ),
  'Cazgır Şaban Dayı': talk(
    ['Hoş geldin evlat! Cazgır bu meydanda pehlivanı yarıştırır, ama senin gibi yolcuyu da sevinçle karşılar.', 'Welcome, child! In this field a cazgır pairs the wrestlers, and also greets a traveller like you with joy.'],
    [
      [['Cazgır ne yapar, tam olarak?', 'What exactly does a cazgır do?'], ['Pehlivanı çağırır, güreşi anlatır, seyirciyi coşturur. Sesim kısılmasın diye her sabah bal yerim, söz!', 'He calls the wrestler, narrates the bout, stirs the crowd. I eat honey every morning so my voice never cracks, I swear!']],
      [['Sen hiç güreştin mi, dayı?', 'Did you ever wrestle yourself, dayı?'], ['Gençliğimde bir kere yağa girdim, iki dakika sonra çıkıp kendime cazgırlık yolunu seçtim. Eli yağlı, sözü yağlı olmak daha rahat.', 'Once in my youth I entered the oil, and two minutes later chose the cazgır’s road. Slick words are easier than slick arms.']],
      [['Pehlivanlara en çok neyi öğütlersin?', 'What advice do you give wrestlers most?'], ['Alttayken yılma, üstteyken kibirlenme. Meydan herkesi bir kere alta alır, evlat. Asıl pehlivan kalkıp yeniden tutandır.', 'Do not despair underneath, do not boast on top. The field puts everyone underneath once. The real wrestler is the one who gets up and grips again.']],
    ],
    [['Meydanın Duası', 'The Field’s Prayer'], ['Bir gün başın dara düşünce hatırla: “Alta geldim diye yerinme.” Defterine yaz, Edirne’nin bütün güreşçileri bunu bilir. Asıl yenilmek, tutmayı bırakmaktır.', 'When you are in trouble, remember: “Do not grieve for being down.” Write it in your book; every wrestler of Edirne knows it. Real defeat is only letting go of the grip.']],
  ),
  'Sabuncu Müzeyyen Hanım': talk(
    ['Gel evladım, bir koklasana! Burnunun hakkını ver, sabunum sabırla karar verir.', 'Come, child, give it a sniff! Let your nose have its due; my soap decides with patience.'],
    [
      [['Meyve sabunu neden bu kadar güzel kokar?', 'Why does fruit soap smell so lovely?'], ['Yağı kaynatır, ince ince kurutur, koku katarız. Acele edersen sabun çatlar, nazlıdır o. Ben sekiz ay beklerim.', 'We boil the oil, dry it slowly, then add the scent. Hurry and the soap cracks, she is dainty. I wait eight months.']],
      [['Sepete üç sabun yuvarlandı demişsin, peşinden koşmadın mı?', 'Three soaps rolled out of your basket, did you not run after them?'], ['Dizim ağrıyor ya, bırak yuvarlansınlar dedim. Hem koklarsın bulursun, sabun sahibine kendi kokusuyla çağırır.', 'My knee aches, so I said let them roll. Besides, you sniff and find them; a soap calls its owner by its scent.']],
      [['Eski çeyiz sandıklarını anlatır mısınız?', 'Would you tell me about the old dowry chests?'], ['Gelin sandığına üç sabun koyardık: biri kendine, biri kaynanaya, biri komşuya. İlk sabun hep tatlı komşuluk içindi.', 'A bride’s chest held three soaps: one for herself, one for her mother-in-law, one for the neighbour. The first soap was always for good neighbourliness.']],
    ],
    [['Sabunun Defteri', 'The Soap Maker’s Page'], ['Kokuyu kalıcı kılan şey sabırdır. Birine bir şey bırakacaksan yüksek sesle değil, hoş kokuyla bırak. Çantan sabunumla kokarsa Edirne’yi hatırlarsın.', 'Patience is what makes scent last. If you leave something with someone, leave it not loudly but sweetly. If your bag smells of my soap, you will remember Edirne.']],
  ),
  'Pişmaniyeci Gülsüm Teyze': talk(
    ['Hoş geldin kuzum, ellerini yıka da gel! Pişmaniye soğuk elle olmaz, sıcak kalple olur.', 'Welcome, dear, wash your hands first! Pişmaniye is not made with cold hands, but with a warm heart.'],
    [
      [['Teller nasıl bu kadar ince çıkıyor?', 'How do the strands get so fine?'], ['Şekeri kaynatır, un kavrulmuş yağla karar, sonra çeke çeke, çeke çeke… Yüz kat katlarız, her kat bir sabır.', 'We boil the sugar, roast the flour in butter, then pull and pull and pull. A hundred folds, each one a measure of patience.']],
      [['Hiç karıştırmadan yedin mi pişmaniyeyi?', 'Ever eaten pişmaniye without making a mess?'], ['Mümkün değil kuzum! Nefes alırsan uçar, üflersen dağılır. Bütün Kocaeli beyaz bıyıkla gezer, bilirsin.', 'Impossible, dear! Breathe and it flies, blow and it scatters. All of Kocaeli walks about with a white moustache, you know.']],
      [['Bu zanaatı kimden öğrendiniz?', 'Who taught you this craft?'], ['Annemden, o da annesinden. Mutfakta ses yapmadan, gözümle izleyerek. Öğretmek sevgisini göstermektir kızım.', 'From my mother, who learned it from hers. Silently in the kitchen, just watching. To teach is to show your love, my girl.']],
    ],
    [['Teyzenin Defteri', 'The Teyze’s Page'], ['Yolculuk uzun olunca cebinde bir şey tatlı olsun, çünkü yorgunluk tatlıyla geçer. Kocaeli’ne gelip de elini boş döndüren olmaz, defterine bunu da yaz.', 'On a long road keep something sweet in your pocket, since sweetness cures tiredness. No one leaves Kocaeli empty-handed; write that in your book too.']],
  ),
  'Kâğıt Ustası Kemal': talk(
    ['Dur, sayfayı çevirmeden önce dokun biraz. Kâğıdın da yüzü, sırtı, sesi var.', 'Wait, before you turn the page, touch it a little. Paper has a face, a back, a voice.'],
    [
      [['Kâğıt nasıl yapılır, ham maddesi nedir?', 'How is paper made, what is its raw material?'], ['Odun, saman, eski kâğıt; hepsi suda lapa olur, ince bir ağdan süzülür, pres altında kurur. Kâğıdın sırrı süzmektir.', 'Wood, straw, old paper; all become pulp in water, strained through a fine screen, then pressed dry. The secret of paper is straining.']],
      [['Bir ömür kâğıtla uğraşmak sıkmadı mı?', 'Did a lifetime with paper never bore you?'], ['Sıkılsam kendimi yırtardım! Her sayfa bambaşka bir şey olur: kimi mektup, kimi dilekçe, kimi çocuk resmi.', 'If I got bored I would have torn myself up! Every sheet becomes something else: a letter, a petition, a child’s drawing.']],
      [['Fabrikanın bacalarını görünce ne hissediyorsunuz?', 'What do you feel when you see the factory chimneys?'], ['Gururlanırım ama biraz da hüzünlenirim. Bacalar artık duman çıkarmıyor, ama şehre hâlâ iş gününü hatırlatıyor.', 'Pride, and a bit of sorrow. The chimneys no longer smoke, but they still remind the city of its working day.']],
    ],
    [['Ustanın Defteri', 'The Master’s Page'], ['Defterini taşıyorsun ya, sayfalarını nemden korumayı ihmal etme. Kâğıt şehri unutmaz: içine ne yazılırsa bir gün gelip seni bulur, iyi şey yaz.', 'You carry a notebook, so never forget to guard its pages from damp. Paper does not forget the city: what is written in it comes back to find you one day, so write something good.']],
  ),
  'Hayalî Sabri Usta': talk(
    ['Perde arkasına hoş geldin! Karagöz’ün de Hacivat’ın da dili benim ağzımda; sen kime selam vereceksin?', 'Welcome backstage! Karagöz’s tongue and Hacivat’s both live in my mouth; whom do you greet?'],
    [
      [['Suretler neden deveden yapılır?', 'Why are the figures made of camel hide?'], ['Deri ışığı sever evladım; ince yontulur, renk emer, ışığı geçirir ama gölgesini bırakır. Deve de sabırlıdır, o da iş görür.', 'Hide loves light, child; it is scraped thin, takes colour, lets light through but keeps its shadow. The camel is patient too, which helps.']],
      [['Karagöz mü Hacivat mı daha çok güldürür?', 'Who is funnier, Karagöz or Hacivat?'], ['İkisi de ayrı bela! Karagöz yanlış anlar, Hacivat yanlış anlatır; ortada kalan seyircidir, o da kahkahayı basar.', 'They are separate troubles! Karagöz mishears, Hacivat misspeaks; the audience in the middle just bursts out laughing.']],
      [['Gölge oyununun Bursa’yla bağını anlatır mısınız?', 'Could you tell me how shadow play ties to Bursa?'], ['Anlatılana göre iki usta Bursa’da çalışırken çok güldürdükleri için işleri aksamış. Gülen işçi çalışamaz, derler. Gülmek şehre yakışır.', 'The tale says two masters who worked here made the others laugh so much that the building fell behind. They say a laughing worker cannot work. Laughter suits this city.']],
    ],
    [['Perdenin Defteri', 'The Screen’s Page'], ['Gölge, ışığa sırtını dönene dek kısalır, yüzünü dönünce uzar. Bu hayatın da böyle: dönünce uzar, bakınca kısalır. Defterine bunu not et; gülmeyi de unutma.', 'A shadow shortens as it turns its back to the light and grows when it faces it. Life is like that: it lengthens when you turn, shortens when you look. Note it down, and do not forget to laugh.']],
  ),
  'Kozacı Feride Teyze': talk(
    ['Koza Han’a hoş geldin yavrum! Burada ipek de konuşur, sen sessiz dinle.', 'Welcome to Koza Han, dear! Even silk speaks here; you listen quietly.'],
    [
      [['Kozadan ipek nasıl çıkıyor?', 'How does silk come out of a cocoon?'], ['Kozayı sıcak suya atarız, iplik çözülür; birkaç kozadan bir tek tel döner. Bin metreyi geçen bir tel, düşünsene!', 'We drop the cocoon in hot water, the thread loosens; several cocoons feed a single strand. A strand beyond a thousand metres, imagine!']],
      [['Kestane şekerini sen mi yoldun, yoksa yolda mı kayboldu?', 'Did you lose the candied chestnuts, or did they wander?'], ['Kesin yolda kayboldu! Ağzım tatlıya tutulmuş, yemem ama yolcuya dağıtırım. Bulursan bir tanesini bana getir, söz ver.', 'They wandered, surely! I am no sweet-tooth, but I do hand them out to travellers. If you find one, bring it to me, promise.']],
      [['Han’ın geçmişini sorsam ne söylersiniz?', 'What would you say of the han’s past?'], ['Ağır yüklü develer avlunun ortasında dururdu, tüccarlar çayını burada içerdi. Duvarlar beş yüz yıldır aynı yükü taşıyor, şikâyet etmiyor.', 'Heavy-laden camels stood in the middle of the courtyard, merchants drank their tea here. The walls have carried the same load for five hundred years without complaint.']],
    ],
    [['İpekçinin Defteri', 'The Silk Seller’s Page'], ['İpek kolay kopmaz ama düğümlenmezse çözülür. Yani sözünü, yolunu, arkadaşını bir düğümle bağla yavrum. Hem sağlam, hem güzel bir düğüm olsun.', 'Silk does not snap easily, but unknotted it comes undone. So bind your word, your road, your friend with a knot, dear. Make it strong and make it beautiful.']],
  ),
  'Lüleci Hüsnü Usta': talk(
    ['Eyvallah, hoş geldin! Lületaşını avucuna al; ağır mı hafif mi söyle bakalım.', 'Welcome! Take the meerschaum in your palm, and tell me: heavy or light?'],
    [
      [['Lületaşı nasıl oluşuyor?', 'How does meerschaum form?'], ['Yerin altında yumuşak, kil gibi çıkar, havayla kurur. Eskişehir’in toprağı bu taşı verir; dünyada pek az yerde çıkar.', 'It comes out soft like clay underground, then dries in the air. The soil of Eskişehir gives this stone; very few places in the world do.']],
      [['Kaybolan üç parçayı bulabilecek miyim?', 'Will I manage to find the three lost pieces?'], ['Evlat, taş kendini kaybettirmez, kaybolmuş olmak ister. Renkli evlerin arasında yuvarlanırken bir kediyle de karşılaşmış olabilir.', 'Child, a stone does not lose itself, it only wants to be lost. Rolling between the colourful houses, it may even have met a cat.']],
      [['Bu işte en zor kısım nedir?', 'What is the hardest part of this work?'], ['Tıraşlarken yavaşlamak. Her kazıma geri alınmaz; taşın sana ne dediğini dinleyeceksin. Usta olmak, beklemeyi öğrenmektir.', 'Slowing down while carving. Every cut is final; you must hear what the stone tells you. To become a master is to learn to wait.']],
    ],
    [['Lülecinin Defteri', 'The Pipe Maker’s Page'], ['Taş işlendikçe parlar, insan da öyle: kullandıkça, dokundukça, ilgilendikçe. Defterine bunu not et; parlayan şey zamanla daha değerli olur.', 'A stone shines the more it is worked, and so does a person: through use, touch, attention. Note that in your book; what shines grows more precious over time.']],
  ),
  'Gondolcu Erkan': talk(
    ['Hoş geldin! Kürek bende, nehir sende; bir tur hem de ücretsiz gel, hem de acele etme.', 'Welcome! The oar is mine, the river is yours; take a round for free, and do not hurry.'],
    [
      [['Porsuk’ta gondol sürmek zor mu?', 'Is rowing a gondola on the Porsuk hard?'], ['İlk günlerde bir yana dönüp durur, yolcuya bakar bakar gülerdim. Şimdi nehir benim ellerimi tanıyor, ben de onun huyunu.', 'In the first days I turned in circles and the passengers smiled at me. Now the river knows my hands and I know its moods.']],
      [['Bugüne kadar suya düşen çıktı mı?', 'Has anyone ever fallen in?'], ['Çok! En sevdiğim düşenden biri telefonla selfie çeken amcaydı. Gondol sallandı, amca kendini suya bıraktı, telefon elinde havada kaldı.', 'Plenty! My favourite was an uncle taking a selfie. The gondola rocked, he plunged in, and the phone stayed up high in his hand.']],
      [['Şehir nehre ne borçlu sizce?', 'What does the city owe the river, in your view?'], ['Serinlik, yavaşlık ve bir bahane: insanlar nehre bakmak için dururlar. Bir şehir insanı durdurmayı bilirse güzeldir.', 'Coolness, slowness and an excuse: people stop to look at the river. A city that knows how to make people stop is beautiful.']],
    ],
    [['Gondolcunun Defteri', 'The Gondolier’s Page'], ['Suyla uğraşan kimse saatle uğraşmaz. Yolculukta bir saat boyunca hiçbir yere varmamak da bir varıştır. Defterine yaz, nehir gibi akmak da öğreticidir.', 'Whoever works with water does not argue with the clock. An hour on the road spent arriving nowhere is also an arrival. Write it down: flowing like a river teaches too.']],
  ),
  'Çaycı Halil Usta': talk(
    ['Buyur, çay tazedir! Boğaz’ın havası da cabası. Saat Kulesi bile durup dinleniyor.', 'Here, the tea is fresh! The Strait’s air is a bonus. Even the Clock Tower pauses to rest.'],
    [
      [['Çayın Kordon’da başka tadı mı olur?', 'Does tea really taste different on the Kordon?'], ['Olur tabii! Rüzgâr çayı soğutur, bardak tutmayı öğretir. Boğaz’a bakarak içilen çay dört derece daha sıcak gelir.', 'Of course! The wind cools the tea and teaches you to hold the glass. Tea sipped facing the Strait feels four degrees warmer.']],
      [['Kaç bardak demledin, saymadın mı?', 'How many glasses have you brewed, ever counted?'], ['Saymadım! Saysam çay gibi tükenirmiş gibi gelir. Kırk yıl çay yapınca sayı değil kişi hatırlanır; yüzünüzü bilirim.', 'I never counted! If I did, it would feel as if it would run out like tea. After forty years you remember faces, not numbers.']],
      [['Boğaz’ı her gün görünce kanıksamıyor musunuz?', 'Does seeing the Strait daily not grow stale?'], ['Hiç evladım. Her gün başka mavi, başka gemi. Bir yere vermiş olduğun saygı, her gün yenilenir; ben de selam vermeden başlamam güne.', 'Never, child. Every day a different blue, a different ship. Respect given to a place renews daily; I never start my day without greeting it.']],
    ],
    [['Çaycının Defteri', 'The Tea Maker’s Page'], ['Acele eden çay içemez, çünkü çay beklemeyi sever. Defterine yaz: bu şehir için “acele etme” demek, “hoş geldin” demektir. Yolun uzun, bardağın dolu olsun.', 'A hurried person cannot drink tea, since tea loves waiting. Write it: in this city “do not hurry” means “welcome.” May your road be long and your glass full.']],
  ),
  'Seramikçi Gülsüm': talk(
    ['Hoş geldin evladım, çamurun da selamı var. Elini yıka, tezgâh açık.', 'Welcome, child, even clay sends its greetings. Wash your hands, the bench is open.'],
    [
      [['At başlı testi neden bu kadar meşhur?', 'Why is the horse-headed jug so famous?'], ['Çanakkale seramiği hem toprak hem hikâye taşır: testinin boynundaki at başı yolcuya selam durur. Bir tane evinde olursa eve rüzgâr gelir.', 'Çanakkale ceramics carry both earth and story: the horse head at the jug’s neck greets the traveller. Have one at home and a breeze enters the house.']],
      [['Üç testiyi düşürmüşsün, ellerin mi titredi?', 'You dropped three jugs, did your hands tremble?'], ['Titremedi, vapura yetişmeye çalıştım. Telaşla yürürsen testi de sana kızar. Sen yavaş git evladım, onlar bulunur.', 'They did not tremble, I was racing a ferry. Hurry, and the jug itself takes offence. Go slowly, child, they will be found.']],
      [['Çamurla bu kadar uğraşmak yorucu değil mi?', 'Does working with clay for so long not tire you?'], ['Yorar, ama çamurdan bir kap çıkınca bütün yorgunluk seyre döner. Elim değil, gözüm gururlanır.', 'It tires, but when a vessel emerges all tiredness turns to watching. It is not my hand that is proud, but my eye.']],
    ],
    [['Seramikçinin Defteri', 'The Potter’s Page'], ['Çanak çatlarsa atmam, sıkıca bağlar yine kullanırım; çatlaklı çanak sofranın en çok anlatılanı olur. İnsan da öyle evladım. Düşersen kendine kızma, onar ve devam et.', 'If a bowl cracks I do not throw it, I bind it tight and use it again; the cracked bowl becomes the most talked-about on the table. People are the same, child. If you fall, do not scold yourself, mend and go on.']],
  ),
  'Boyozcu Rıfat Usta': talk(
    ['Selam yolcu! Boyoz sıcakken yenir; soğursa insanın yüzü gibi asılır.', 'Hello, traveller! Boyoz is eaten hot; cold, it droops like a face.'],
    [
      [['Boyoz İzmir’e nereden gelmiş?', 'Where did boyoz come from to İzmir?'], ['Yüzyıllardır bu kentte yapılan, Sefarad mutfağından gelen bir hamur işi bu. İzmir her kapıyı komşuya açar.', 'It is a pastry made here for centuries, from Sephardic cooking. İzmir opens every door to the neighbour.']],
      [['Boyoz mu simit mi, sahiden hangisi?', 'Boyoz or simit, honestly?'], ['Sorma, sorma! Sabah boyoz yenir, öğlen gevrek simit, akşam kumru. Hepsi kendi saatinde en doğru, aklında olsun.', 'Do not ask! Boyoz in the morning, crisp simit at noon, kumru at night. Each is right in its own hour, remember that.']],
      [['Bu zanaatı kime devredeceksiniz?', 'To whom will you pass this craft?'], ['Çırağım var. Elleri hamuru tanıyor, gözleri sabırlı. Şimdilik “kırk kat” demeyi öğreniyor ama bir gün öğrenecek.', 'I have an apprentice with the hands that know the dough and patient eyes. For now he is learning to say “forty layers,” but one day he will learn them.']],
    ],
    [['Boyozcunun Defteri', 'The Boyoz Maker’s Page'], ['İzmir’de bir şeye “bir de bakalım” demek, onu bir kere daha sevmektir. Defterine yaz: sabah güneşiyle boyoz yiyen yolcunun yolu açık olur.', 'In İzmir, to say “let’s try once more” is to love something once again. Write it down: the traveller who eats boyoz in the morning sun has an open road.']],
  ),
  'Asansör Görevlisi Nesrin': talk(
    ['Buyur, hoş geldin! İki mahallenin arası iki dakika. Tırmanmak istersen merdiven de var.', 'Welcome! Two minutes between two neighbourhoods. Stairs too, if you wish to climb.'],
    [
      [['Asansörün hikâyesini anlatır mısın?', 'Could you tell me the lift’s story?'], ['Yüz yılı aşkın zamandır aşağı mahalleyi yukarıya bağlıyor. Evvelden yüksek merdivenlerde yorulanlar için yapılmış; her yolcu cebinde bir hikâye taşır.', 'For over a century it has joined the lower neighbourhood to the upper. It was built for those who tired on the tall stairs; every passenger carries a story in the pocket.']],
      [['Burada çalışırken hiç yukarıdan aşağı baktığın oldu mu?', 'Ever looked down from the top while working here?'], ['Her gün ama hâlâ heyecanlanırım! Bir keresinde bir kadın “Bu şehir yukarıdan daha güzel” dedi, ben “aşağıdan da” dedim; ikimiz de haklıydık.', 'Every day, and I still get excited! Once a woman said “This city is prettier from above,” I said “and from below,” and we were both right.']],
      [['Burada çalışmanın en güzel yanı ne?', 'What is the best part of working here?'], ['İnsanların gözlerinin parlamasını görmek. Herkes yukarı çıkarken derin bir nefes alır, ben de onunla alırım.', 'Seeing people’s eyes light up. Everyone takes a deep breath on the way up, and I take it with them.']],
    ],
    [['Asansörün Defteri', 'The Lift’s Page'], ['Yükselmenin en güzel yolu basamak saymamaktır. Defterine yaz: bazen biri sana yol açar, sen sadece “buyur” de. Bu şehirde komşuluk böyle yürür.', 'The nicest way to rise is not counting steps. Write it down: sometimes someone opens the way for you, and you only need to say “thank you.” That is how neighbourliness runs here.']],
  ),
  'Kumrucu Erdem': talk(
    ['Hoş geldin! Kumruyu doğru yersen sosu çenene değil, mutluluğuna akar.', 'Welcome! Eat a kumru right and the sauce runs not down your chin, but into happiness.'],
    [
      [['Kumru nedir, neyle yapılır?', 'What is a kumru, what is it made with?'], ['Yumuşak, kıtır bir ekmek, sucuk, kaşar, domates, bir de sır gibi saklanan tarifim. Dilimi bırak, soframa otur.', 'A soft, crunchy bun, sausage, cheese, tomato, and a recipe I keep like a secret. Put away your knife, sit at my table.']],
      [['Şehirde her şey ekmek arası mı?', 'Is everything in this city between bread?'], ['Çoğu! Ama en güzeli, ekmeğin arasına sığmayan şeydir: sohbet, deniz, rüzgâr. Onları da kumruya katarım, bedava.', 'Most of it! But the best things are what do not fit between bread: chat, sea, breeze. I add those too, free of charge.']],
      [['Bu tezgâh ailenizden mi kaldı?', 'Did this stall come down from your family?'], ['Babam açtı, şimdi ben çeviriyorum. Her sabah onun çalıştığı saatte açarım. Onun ruhu da hâlâ ekmeği şişirir.', 'My father opened it, I run it now. I open every morning at the hour he worked. His spirit still puffs the bread.']],
    ],
    [['Kumrucunun Defteri', 'The Kumru Seller’s Page'], ['Yemek kadar sohbet de bir ikramdır. Yolda bir tezgâh görürsen bir dakika dur, adını sor. İzmir’de ekmeği paylaşan, yolu paylaşmış olur.', 'Talk is a treat as much as food. If you see a stall on the road, stop for a minute and ask a name. In İzmir sharing bread means sharing the road.']],
  ),
  'Portakalcı Dursun Amca': talk(
    ['Gel gel, kokusunu al! Antalya’da portakal yemekle olmaz, bir de kokulanmak gerekir.', 'Come, smell it! In Antalya you do not just eat an orange, you perfume yourself with it.'],
    [
      [['Portakal hangi mevsim en tatlıdır?', 'Which season is the orange sweetest?'], ['Kışın, ağaçta üşüyüp güneşi özlediği zaman. Bahar gelince çiçeği, kış gelince meyvesi; bahçemde hem koku hem tat.', 'In winter, when it has shivered on the tree and missed the sun. Blossom in spring, fruit in winter; my grove has both scent and taste.']],
      [['Üç portakal yuvarlanmış, sen niye koşmadın?', 'Three oranges rolled away, why did you not chase them?'], ['Kendi başlarına koşsun, bakalım nereye varıyorlar! Portakal yuvarlandığı yerde yetişir; sen bul, belki orada bir ağaç büyür.', 'Let them run alone, let us see where they get! An orange grows where it rolls; you find it, perhaps a tree sprouts there.']],
      [['Bu bahçeyi nasıl bu kadar iyi bakıyorsunuz?', 'How do you keep this grove so well?'], ['Her ağaca adını verdim. İsmi olan şeye insan iyi bakar evladım. Bir ağaç düşününce bile gönlüm ferahlar.', 'I named every tree. People care for what has a name, child. Even thinking of a tree makes my heart lighter.']],
    ],
    [['Portakalcının Defteri', 'The Orange Grower’s Page'], ['Bir dalda ne kadar çok meyve olursa dal o kadar eğilir, ama kırılmaz; çünkü kökü sağlamdır. İnsan da kök salmışsa yükünden korkmaz. Defterine bunu yaz.', 'The more fruit on a branch, the lower it bends, but it does not break, since its roots are firm. A rooted person fears no load. Write that in your book.']],
  ),
  'Kaleiçi Rehberi Sevim Hanım': talk(
    ['Hoş geldiniz, buyurun Kaleiçi’ne! Burada her taş bir hikâye, her kemer bir bekçi.', 'Welcome to Kaleiçi! Here every stone is a story, every arch a keeper.'],
    [
      [['Hadrian Kapısı neden bu kadar sevilir?', 'Why is Hadrian’s Gate so beloved?'], ['Üç kemeri, sütunları ve zarafetiyle şehre giriş bir tören gibi olur. Bir imparator uğramış diye değil, şehrin kendisi böyle kapıyı hak ediyor diye.', 'Its three arches and columns turn entering the city into a ceremony. Not because an emperor visited, but because the city itself deserves such a gate.']],
      [['Rehberlik yapınca kaybolduğunuz oldu mu?', 'Did you ever get lost while guiding?'], ['Bir kere, ilk yıl! Gruba “beni izleyin” dedim, dar sokakta bir kediyi izlemişim. Grup bana güldü, kedi bana güldü.', 'Once, in my first year! I told the group “follow me,” and had followed a cat down a narrow alley. The group laughed at me, the cat laughed at me.']],
      [['Bu şehri ilk gören yolcuya ne söylersiniz?', 'What do you tell a traveller who first sees this city?'], ['“Yavaş yürüyün, gölgede durun, bir sokağı iki kere dolaşın.” Kaleiçi’nin ikinci turu hep farklı.', '“Walk slowly, stand in the shade, wander one street twice.” The second round of Kaleiçi is always different.']],
    ],
    [['Rehberin Defteri', 'The Guide’s Page'], ['Defterin taş kadar sabırlı olsun. Bir yer, ona bir kez bakınca anlaşılmaz; ikinci bakışta gizlediği köşeyi gösterir. Kemerlerden birine uzun bak, sana bir şey söyleyecek.', 'May your book be as patient as stone. A place is not understood at one glance; at the second it shows the corner it hid. Look long at one of the arches, it will tell you something.']],
  ),
}
