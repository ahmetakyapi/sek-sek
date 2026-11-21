import { talk, type Talk } from './types'

/** Güneydoğu, Doğu Anadolu'nun batısı ve Karadeniz kıyısı: Şanlıurfa, Diyarbakır, Mardin, Malatya, Çorum, Sinop, Ordu */
export const GUNEYDOGU: Record<string, Talk> = {
  'İsotçu Bozan Dayı': talk(
    ['Hoş geldin evlat! İsot, gün boyu güneşte kurur, gece torbada terler. Bu şehirde sabır da acı da yavaş pişer.', 'Welcome, child! Isot dries in the sun by day and sweats in a bag by night. In this city patience and heat both cook slowly.'],
    [
      [['İsotun rengi neden bu kadar koyu?', 'Why is isot so dark?'], ['Gece torbada terleyince biber kararır, yağı iç ten yayılır. Kurur, ezilir, bir daha sarılır; her adımda başka bir derinlik kazanır.', 'When it sweats in the bag at night the pepper darkens, its oil spreads within. Dried, crushed, wrapped again; every step gives it another depth.']],
      [['Yemeğe fazla isot atarsam ne olur?', 'What if I put too much isot in a dish?'], ['Önce ağlarsın, sonra gülersin, sonra bir bardak daha su istersin. Şanlıurfa’da isot bir selamlaşmadır; sen de iyi karşıla.', 'First you weep, then you laugh, then you ask for another glass of water. In Şanlıurfa isot is a greeting; greet it well.']],
      [['Bu zanaat sizde kaç kuşaktır sürüyor?', 'For how many generations has this craft run in your family?'], ['Dedemin dedesi Harran’dan getirmiş tohumu. Biz tarlayı sevmeyi, tarla da bizi dinlemeyi öğrendi. Toprağa saygı bir ömürlük borç.', 'My grandfather’s grandfather brought the seed from Harran. We learned to love the field, and the field learned to listen. Respect for the land is a lifelong debt.']],
    ],
    [['İsotçunun Defteri', 'The Isot Seller’s Page'], ['Acıyı iyi yönet; çok olursa yakar, az olursa tat vermez. Hayat da böyle dayı derdi bana. Defterine yaz: ayarın ustası olmak, ustalığın en büyüğüdür.', 'Handle heat well; too much burns, too little gives no taste. Life is like that, my uncle used to say. Write it: being a master of measure is the greatest mastery.']],
  ),
  'Göl Bekçisi Müslüm': talk(
    ['Hoş geldin yolcu, balıklara sesini yükseltme; onlar bu suyun asıl sahipleri.', 'Welcome, traveller, do not raise your voice at the fish; they are the true owners of this water.'],
    [
      [['Balıklar neden kutsal sayılır?', 'Why are the fish considered sacred?'], ['Rivayete göre göl İbrahim’in anısına bağlı; yüzyıllardır kimse balığa dokunmamış. İnanç bazen bir yeri korumanın en güzel yoludur.', 'Tradition ties the lake to the memory of Abraham; no one has touched the fish for centuries. Faith is sometimes the most beautiful way of protecting a place.']],
      [['Balıklar sana laf anlatıyor mu?', 'Do the fish talk back to you?'], ['Yemi görünce kaynayıp bana bakıyorlar, ben de onlara “yavaş” diyorum. Birbirimizi anlamak için konuşmamız gerekmiyor.', 'When they see food they boil up and look at me, and I tell them “slowly.” We need no words to understand each other.']],
      [['Bu gölü her gün görmek nasıl bir şey?', 'What is it like to see this lake every day?'], ['Su yine su, ama aynası her sabah başka. Gece ay ışığında bütün kalenin gölgesi gölde yatar. Ben o gölgeyi bekçisiyim.', 'The water is still water, but its mirror differs every morning. By moonlight the whole castle’s shadow lies in the lake. I am keeper of that shadow.']],
    ],
    [['Bekçinin Defteri', 'The Keeper’s Page'], ['Bir yeri korumak, ona dokunmamayı bilmektir. Defterine yaz: en iyi bakım bazen sadece seyretmektir. Balıklar sana yavaşlamayı öğretecek, bırak öğretsin.', 'To protect a place is to know not to touch it. Write it: the best care is sometimes only watching. The fish will teach you slowness, let them.']],
  ),
  'Telefoncu Çırağı Baran': talk(
    ['«Ooo, Uktun, yolun buraya mı düştü?||Usta! Dükkânı bana bırakıp gittin, ama bak, çay hâlâ demli!» Gel, otur; surun gölgesi serin.', '«Oh, Uktun, did your road lead here?||Master! You left the shop to me, yet look, the tea is still brewing!» Come sit; the wall’s shade is cool.'],
    [
      [['Dükkânı nasıl yönetiyorsun?', 'How do you run the shop?'], ['Kırık ekranlar geliyor, ben bakıyorum, sonra “bu usta gelince bakar” diyorum! Şaka, öğrendim ki iyi tamirci önce ekranı değil, sahibini dinler.', 'Broken screens come, I look, then say “the master will see to it when he returns!” Joking; I learned a good repairer first listens to the owner, not the screen.']],
      [['En garip tamir ne oldu?', 'What was the strangest repair?'], ['Biri telefonunu çaya düşürmüş, “bir bardak da ben içeyim” dedi. Telefon çalıştı ama çay soğudu. Bazen telefonu değil sohbeti onarıyorsun.', 'Someone dropped a phone in tea and said “I will drink a glass too.” The phone worked but the tea went cold. Sometimes you repair not the phone but the conversation.']],
      [['Surların dibinde çalışmak sana ne veriyor?', 'What does working in the shadow of the walls give you?'], ['Sabır ve küçüklük duygusu. Bu duvarlar bin yıl sonrasını da görecek, benim telefonum ise iki yıl. Bunu hatırlayınca acelem kalmıyor.', 'Patience and a sense of smallness. These walls will see a thousand years more; my phone work lasts two. Remembering that, my hurry disappears.']],
    ],
    [['Çırağın Defteri', 'The Apprentice’s Page'], ['Ustam hep “cihazı değil, dertli olanı onar” derdi. Defterine yaz: bir kırık ekranın ardında çoğu zaman bir hatıra vardır. Dikkatli ol, hatırayı kırma.', 'My master always said “mend not the device but the troubled one.” Write it: behind a broken screen there is often a memory. Be careful not to break the memory.']],
  ),
  'Dengbêj Seyda': talk(
    ['Selam yolcu, otur bakalım. Burada bir hikâye sesle başlar; sesin bittiği yerde de bir başkası devralır.', 'Greetings, traveller, sit. Here a tale begins with a voice, and where one voice ends, another takes over.'],
    [
      [['Dengbêj ne anlatır?', 'What does a dengbêj tell?'], ['Savaşı, aşkı, kaybı, yolcuyu. Bir kılam, bir ömrün özetidir. Yazı yoksa ses, ses yoksa hafıza taşır; biz hafızayı sesle taşırız.', 'War, love, loss, the traveller. A kılam is a lifetime in summary. If there is no writing, voice carries it; if no voice, memory; we carry memory by voice.']],
      [['Sesin hiç kısıldığı oldu mu?', 'Did your voice ever crack?'], ['Bir gün, dinleyenler ağlarken ben de tıkandım. Sonra anladım ki kısılan ses de hikâyenin parçasıdır. Dinleyen tamamlar.', 'Once, while the listeners wept I choked too. Then I understood a cracked voice is part of the story. The listener completes it.']],
      [['Bu surlar size ne söylüyor?', 'What do these walls tell you?'], ['“Dayan” derler. Binlerce yıldır dayanmışlar. Her kapıda bir kılam, her burçta bir kayıp yatar; sonra yine ayağa kalkmışlar.', 'They say “endure.” They have endured thousands of years. A kılam lies at every gate, a loss in every tower; and yet they stood up again.']],
    ],
    [['Dengbêjin Defteri', 'The Dengbêj’s Page'], ['Bir şeyi unutturmamanın yolu söylemektir, yazmak ikinci yoldur. Defterine yaz: duyduğunu birine anlat, hikâye yaşar. Sen de bir gün birine yolculuğunu anlatacaksın.', 'The way not to let something be forgotten is to say it; writing is the second way. Write it: tell what you heard to someone, and the story lives. One day you too will tell your journey to someone.']],
  ),
  'Mırracı Cemil Usta': talk(
    ['Hoş geldin! Mırra acıdır, ama dostluk onu tatlandırır. Otur, bir fincan paylaşalım.', 'Welcome! Mırra is bitter, but friendship sweetens it. Sit, let us share a cup.'],
    [
      [['Mırra neden bu kadar acı?', 'Why is mırra so bitter?'], ['Çekirdekleri ağır ağır kavurur, saatlerce kaynatırız. Acısı derinliğinden gelir; yüzeysel tat çabuk geçer ama derin acı akılda kalır.', 'We roast the beans slowly and boil for hours. Its bitterness comes from its depth; a shallow taste fades fast, a deep bitterness stays in mind.']],
      [['Fincanı niye elden ele veriyorsunuz?', 'Why do you hand the cup from hand to hand?'], ['Masaya koyarsan sohbet kopar! Fincan elden ele dolaşır, herkes bir yudum alır. Birlikte içmeyen mırrayı bilmez.', 'Put it on the table and the talk breaks! The cup travels hand to hand, each takes a sip. Whoever does not drink together does not know mırra.']],
      [['Mardin’in kahve geleneği sizin için ne ifade ediyor?', 'What does Mardin’s coffee tradition mean to you?'], ['Misafirliği. Kapı açık, fincan hazır. Misafir bir kere gelirse iki kere özlenir; mırra o özlemin sıcak hâlidir.', 'Hospitality. Door open, cup ready. A guest who comes once is missed twice; mırra is the warm form of that longing.']],
    ],
    [['Mırracının Defteri', 'The Mırra Maker’s Page'], ['Acıyı paylaşmak, onu yarıya indirir. Defterine yaz: ağır bir günde birine fincan uzat. Mardin’de dert de mırra gibi yavaş içilir, tek yudumda bitmez.', 'Sharing bitterness halves it. Write it: on a heavy day hand someone a cup. In Mardin sorrow, like mırra, is sipped slowly and not finished in one gulp.']],
  ),
  'Telkari Ustası Meryem': talk(
    ['Hoş geldin, dikkat et; nefesin telimi bozar. Yaklaş ama yavaş.', 'Welcome, take care; your breath may disturb my wire. Come close, but slowly.'],
    [
      [['Telkari nasıl işlenir?', 'How is filigree worked?'], ['Gümüş eritilir, tel olana dek çekilir, saç telinden ince hale getirilir. Sonra bükülür, kıvrılır, lehimlenir; her kıvrım bir düşünce.', 'Silver is melted, drawn to a wire, thinned finer than hair. Then bent, curled, soldered; each curl a thought.']],
      [['Sinirli bir günde telkari örmek mümkün mü?', 'Can you weave filigree on a nervous day?'], ['İmkânsız! Tel sinirle titrer ve kendini bozar. O gün ben çay içer, pencereye bakarım; ertesi gün tel bana güler.', 'Impossible! The wire trembles with nerves and spoils itself. That day I drink tea and gaze out the window; the next day the wire smiles at me.']],
      [['Bu sanatı sürdürmek zor mu?', 'Is it hard to keep this art alive?'], ['Çok zor; sabır çağı geçiyor. Ama bir çocuk teli eline alıp “bu ne” diyince umut yeniden doğuyor. Sanat meraklıya sığınır.', 'Very hard; the age of patience is passing. But when a child picks up the wire and asks “what is this,” hope is born again. Art takes shelter with the curious.']],
    ],
    [['Telkarinin Defteri', 'The Filigree Maker’s Page'], ['İnce işi yapan kaba olmaz; ince düşün, ince konuş, ince bak. Defterine yaz: Mardin’de duvarlar taş ama süsler tel gibi nazik. Sen de yumuşak ol, sağlam kal.', 'One who does fine work is never coarse; think fine, speak fine, look fine. Write it: in Mardin walls are stone yet ornaments delicate as wire. Be soft, stay strong.']],
  ),
  'Kayısıcı Fadime Teyze': talk(
    ['Gel kuzum, al bir avuç! Güneş bu kayısıyı kırk gün tatlandırdı, sen kırk saniyede yersin.', 'Come, dear, take a handful! The sun sweetened these apricots for forty days, and you will eat them in forty seconds.'],
    [
      [['Kayısı nasıl kurutuluyor?', 'How are apricots dried?'], ['Yarıya bölünür, damlara serilir, gündüz güneşte, gece örtünün altında kurur. Sabırla çevirirsin, kendiliğinden tatlanır. Hızlı kurutursan lezzet kaçar.', 'Halved, spread on roofs, dried in the sun by day, under covers by night. Turned patiently, it sweetens itself. Dry it fast and the flavour flees.']],
      [['Bu kadar kayısı yersem karnım ağrır mı?', 'Will I get a stomach ache if I eat so many apricots?'], ['Ağrır elbet! Ama tatlı ağrıdır; ben kırk yıldır yiyorum, şikâyetim yok. Yalnız ağzının tadını kaçırma, o da kayısı kadar kıymetli.', 'Of course! But a sweet ache; I have eaten them forty years, no complaint. Just do not lose the taste in your mouth, it is as precious as the apricot.']],
      [['Malatya’nın kayısısı neden dünyaca bilinir?', 'Why is Malatya’s apricot known worldwide?'], ['Toprağı, iklimi, eli bir araya gelmiş. Ama asıl sebep sevgiyle toplanması. Elin kokusu meyveye siner, meyve de tadını yolcuya taşır.', 'Soil, climate and hand came together. But the real reason is that it is gathered with love. A hand’s scent seeps into the fruit, and the fruit carries the flavour to the traveller.']],
    ],
    [['Teyzenin Defteri', 'The Teyze’s Page'], ['Dalında olgunlaşan, yolda ezilmez; kıymeti beklemekten gelir. Defterine yaz: bir şeyi acele toplayan, tadını kaçırır. Kayısı da insan gibi: güneşi sever, zamanı sever.', 'What ripens on the branch is not bruised on the road; its worth comes from waiting. Write it: whoever gathers in haste loses the taste. An apricot is like a person: it loves sun and loves time.']],
  ),
  'Bahçıvan Ali': talk(
    ['Selam yolcu! Ayağını dikkatli bas, fidanlar küçük ama darılgan. Arılar da seni gözetliyor.', 'Hello, traveller! Step carefully, the saplings are small but touchy. The bees are watching you too.'],
    [
      [['Bahçede en zor iş nedir?', 'What is the hardest job in the orchard?'], ['Beklemek. Fidan dikersin, üç yıl bir şey olmaz; sonra bir bahar dalı çiçek açar ve bütün bekleme unutulur.', 'Waiting. You plant a sapling, nothing happens for three years; then one spring a branch blooms and all the waiting is forgotten.']],
      [['Arılar seni hiç soktu mu?', 'Have the bees ever stung you?'], ['Bir kere, ilk yıl, bal çaldığımı sandılar. O günden beri onlara selam veriyorum, bana da veriyorlar. Bir tür sözleşme.', 'Once, my first year, they thought I stole honey. Since then I greet them, and they greet me. A kind of treaty.']],
      [['Kasalara zıplayınca uçmak size ne hissettiriyor?', 'How does flying when jumping on the crates feel to you?'], ['Çocukken ben de uçardım, onlar bir şey demezdi. Şimdi yaşlandım ama bir gün bahçemin en yüksek dalından Malatya’ya bakmak isterim.', 'As a child I flew too, and they never minded. I am old now but one day I want to look at Malatya from the highest branch of my orchard.']],
    ],
    [['Bahçıvanın Defteri', 'The Gardener’s Page'], ['Toprağın nabzını al, sonra ekmeye başla. Defterine yaz: her şeyin bir mevsimi var; sen acele edince mevsim şaşırır. Bahçede dost, hem arı hem fidan.', 'Take the earth’s pulse before sowing. Write it: everything has a season, and when you hurry the season gets confused. In an orchard friends are both bee and sapling.']],
  ),
  'Leblebici Osman Usta': talk(
    ['Hoş geldin evlat! Leblebi üç kere pişer, üç kere dinlenir; aceleyle kavrulursa taş gibi olur.', 'Welcome, child! Leblebi is cooked three times and rests three times; roast it hasty and it turns to stone.'],
    [
      [['Leblebi nasıl yapılır?', 'How is leblebi made?'], ['Nohut ıslatılır, sıcak kuma konur, bir dinlenir, tekrar kavrulur. Dinlenme, pişmenin parçasıdır; dinlenmeyen nohut çatlar.', 'Chickpeas are soaked, put in hot sand, rested, roasted again. Rest is part of cooking; a chickpea that does not rest cracks.']],
      [['Leblebiyi çıtırdatmak için ne yapıyorsun?', 'What do you do to make leblebi crunch?'], ['Bir gizli dua okuyorum, “çıtır olsun yoksa seni çorbaya atarım” diyorum. Çıtırlık yüze gülünce gelir!', 'I say a secret prayer, “be crisp or I will toss you in a soup.” Crunch comes when you smile at it!']],
      [['Çorum’un leblebisi sizin için ne ifade ediyor?', 'What does Çorum’s leblebi mean to you?'], ['Kimliğim. Nerede olursam olayım, bir avuç leblebi bende memleketi yeniden kurar. Küçük bir şey büyük bir yeri taşıyabilir.', 'My identity. Wherever I am, a handful of leblebi rebuilds home for me. A small thing can carry a large place.']],
    ],
    [['Leblebicinin Defteri', 'The Leblebi Maker’s Page'], ['Kavrulmak acıtır ama olgunlaştırır. Defterine yaz: bazen dinlenmek, devam etmenin en iyi yoludur. Çorum’da sabır bir çuvalda dokunmadan beklemiş nohuttur.', 'Roasting hurts but ripens. Write it: sometimes resting is the best way to go on. In Çorum patience is a chickpea that waited untouched in a sack.']],
  ),
  'Arkeolog Defne': talk(
    ['Selam! Dikkat, fırçam yerde; bu toprağın altında üç bin yıllık bir yazı yatıyor, ayağınla okumaya çalışma!', 'Hi! Careful, my brush is on the ground; three-thousand-year-old writing lies under this soil, do not try to read it with your foot!'],
    [
      [['Hititçe tabletler nasıl okunur?', 'How are Hittite tablets read?'], ['Çivi yazısıdır; her işaret bir hece ya da kelime. Kırık parçaları yan yana getirir, sonra cümleleri tamamlarız. Bir yap-boz gibi ama yapboz bin yıl sürer.', 'It is cuneiform; each sign a syllable or word. We place broken pieces side by side, then complete the sentences. Like a jigsaw, but a jigsaw that takes a thousand years.']],
      [['“Barış” kelimesini gerçekten sen mi buldun?', 'Did you really find the word “peace” yourself?'], ['Dürüst olayım: ilk ben duyduğumu sandım, sonra hocam “o yıllar önce çevrildi” dedi. Ama benim için ilk kez okumaktı; her okuyucu kendi keşfinin ilkidir.', 'Honestly: I thought I was the first, then my teacher said “that was translated years ago.” But for me it was the first reading; every reader is first in their own discovery.']],
      [['Arkeoloji sabır isteyen bir iş sanırım?', 'Archaeology must demand a lot of patience?'], ['Fazlasıyla. Bir fırça darbesiyle beş santim ilerlersin ve bu bile bir zafer. Ama o santimde elinde bir hikâye tutarsın.', 'More than enough. One stroke of the brush moves you five centimetres and even that is a victory. But in that centimetre you hold a story.']],
    ],
    [['Arkeoloğun Defteri', 'The Archaeologist’s Page'], ['İnsanlar bin yıl önce de aynı şeyi istemiş: barış, ekmek, güvenli yol. Defterine yaz: geçmişe bakmak, geleceğe cevap vermenin bir yoludur. Çorum’un toprağı kendi ağzıyla konuşur.', 'People a thousand years ago wanted the same: peace, bread, a safe road. Write it: looking at the past is a way of answering the future. Çorum’s soil speaks with its own mouth.']],
  ),
  'Maketçi Rasim Usta': talk(
    ['Hoş geldin yolcu! Rüzgâr bir maketi alır götürür ama bir hikâyeyi hep geri getirir.', 'Welcome, traveller! The wind takes a model and carries it off, but always brings a story back.'],
    [
      [['Gemi maketleri nasıl yapılır?', 'How are ship models made?'], ['Önce gövdeyi tahtadan oyarım, sonra kaburgaları dizerim, yelkeni ince bezle dikerim. Her ip bir halat, her çivi bir ölçüdür.', 'First I carve the hull from wood, then set the ribs, then sew the sail from fine cloth. Every thread is a rope, every nail a measure.']],
      [['Maket gemiler gerçekten denize açılır mı?', 'Do model ships really set out to sea?'], ['Bir keresinde çocuğun biri maketi göle bıraktı; yarım saat sonra bir kayıkçı getirdi. Gemi yelkenini ben dikmişim, ama yolunu kendisi bulmuş.', 'Once a child set a model on a pond; half an hour later a boatman brought it back. I sewed the sail, but it found its own way.']],
      [['Kırk yıl aynı işi yapmak yorucu değil mi?', 'Is doing the same work for forty years not tiring?'], ['Aynı iş değil ki evlat! Her gemi başka bir deniz, başka bir yolculuk. Aynı el, ama her seferinde farklı bir ufuk.', 'It is not the same work, child! Each ship a different sea, a different voyage. The same hand, but a different horizon each time.']],
    ],
    [['Maketçinin Defteri', 'The Model Maker’s Page'], ['Küçük bir gemi, büyük bir denizi içinde taşır. Defterine yaz: büyük hayaller küçük ellerden çıkar. Sinop’ta denize bakan, hep bir yola çıkar.', 'A small ship carries a great sea within. Write it: big dreams come from small hands. In Sinop whoever looks at the sea always sets out on a road.']],
  ),
  'Mantıcı Nezahat Abla': talk(
    ['Gel gel, ellerini yıka! Sinop mantısı iki yüzlüdür: bir yanı yoğurtlu, bir yanı cevizli; sen hangisinden başlarsın?', 'Come, wash your hands! Sinop mantı has two faces: yoghurt on one side, walnut on the other; which do you start with?'],
    [
      [['Mantının yarısı cevizli olması nereden geliyor?', 'Where does the walnut half of the mantı come from?'], ['Bu yöre cevizi çok sever; bahçelerde dalları sarkıtır. Ceviz Karadeniz’de bereket demektir, mantının yarısına da bu yüzden girmiş.', 'This region loves walnuts; they hang from garden branches. In the Black Sea a walnut means abundance, so it got into half the mantı.']],
      [['İkisini birden yersem şişer miyim?', 'If I eat both, will I swell?'], ['Şişersin ama mutlu şişersin! Ben kırk yıldır ikisini birden yerim, boyum da yarım metre uzadı… hayır, yalan söylüyorum, ama keyfim uzadı.', 'You will swell, but happily! I have eaten both for forty years, and I grew half a metre… no, I am lying, but my mood grew.']],
      [['Limanın kokusu bu işe bir şey katıyor mu?', 'Does the harbour’s smell add something to this work?'], ['Tuz, tahta ve balık kokusu; mantıya girmez ama iştahı açar. Denize bakmadan mantı yenmez Sinop’ta, bu gelenek.', 'Salt, wood and fish; it does not enter the mantı but opens the appetite. In Sinop no mantı is eaten without looking at the sea, that is the custom.']],
    ],
    [['Ablanın Defteri', 'The Abla’s Page'], ['İki ayrı tadı bir tabakta barıştırmak ustalıktır. Defterine yaz: farklı olan şey kötü değil, bazen birbirini tamamlar. Sinop mantısı da, Sinop insanı da böyle.', 'Reconciling two tastes on one plate is mastery. Write it: what is different is not bad, sometimes it completes the other. Sinop mantı and Sinop people are like that.']],
  ),
  'Fındıkçı Hatice Teyze': talk(
    ['Hoş geldin yavrum! Fındık dalında sabırla büyür, ben de burada bir sabır heykeli gibi bekliyorum.', 'Welcome, dear! Hazelnuts grow patiently on their branch, and I wait here like a statue of patience.'],
    [
      [['Fındık nasıl toplanır?', 'How are hazelnuts gathered?'], ['Ağustosta dalından silkelenir, yerden toplanır, harmanda kurutulur. Yağmur gelirse bütün köy koşar; fındık ıslanmasın diye.', 'In August it is shaken from the branch, gathered from the ground, dried on the threshing floor. If rain comes the whole village runs so the hazelnuts stay dry.']],
      [['Yaban domuzlarıyla barıştınız mı?', 'Have you made peace with the wild boars?'], ['Hayır, ama bir antlaşmamız var: onlar gece gelir, ben gündüz toplarım. Bir de çit yaptık; domuz ona da “selam” dedi.', 'No, but we have a pact: they come by night, I gather by day. We also built a fence; the boar said “hello” to that too.']],
      [['Fındık bahçelerinde çalışmak ağır mı?', 'Is working in the hazelnut groves heavy?'], ['Yamaç dik, sırt yorulur, ama bu topraktan ekmek çıkıyor. Zor iş değil, şerefli iş. Ellerimin kabarığına şükrediyorum.', 'The slope is steep, the back tires, but bread comes from this soil. Not hard work, honourable work. I give thanks for the blisters on my hands.']],
    ],
    [['Fındıkçının Defteri', 'The Hazelnut Picker’s Page'], ['Kabuk sert olur, içi tatlı. Defterine yaz: bazı insanlar da böyledir; kabuğunu kırmaya sabrın olsun. Ordu’da gönül bir fındık gibi: sert bakar, yumuşak kalır.', 'The shell is hard, the kernel sweet. Write it: some people are like that; have patience to crack the shell. In Ordu the heart is like a hazelnut: hard to look at, soft inside.']],
  ),
  'Teleferik Görevlisi Murat': talk(
    ['Hoş geldin! Kabin geliyor, dikkatli bin. Boztepe’den bütün şehir ayağının altında.', 'Welcome! The cabin is coming, board carefully. From Boztepe the whole city lies beneath your feet.'],
    [
      [['Teleferik nasıl çalışıyor?', 'How does the cable car work?'], ['Halat sürekli dönüyor, kabinler bir aşağı bir yukarı gidiyor. Ben kolu tutuyorum, kabinler hep birbirine selam veriyor yarı yolda.', 'The rope turns continuously, cabins go down and up. I hold the lever, and the cabins greet each other halfway.']],
      [['Yukarıda yüksekten korkan yolcu oluyor mu?', 'Are there passengers afraid of heights up there?'], ['Çok! En çok da aşağı bakıp “ay inmeyi unuttum” diyenler. Onlara hep “yukarı bak” derim, deniz de gökle buluşur.', 'Plenty! Most of all those who look down and say “oh, I forgot how to come down.” I always tell them “look up,” the sea meets the sky.']],
      [['Her gün bu yolu çıkıp inmek sıkmıyor mu?', 'Does going up and down every day not bore you?'], ['Her inişte yeni biri, her çıkışta yeni bir ışık. Aynı yol, başka ruh. Sıkılmak yerine insanlara bakıyorum.', 'A new face each descent, a new light each ascent. Same road, different spirit. Instead of getting bored I watch the people.']],
    ],
    [['Teleferikçinin Defteri', 'The Cable Car Man’s Page'], ['Yukarıdan bakınca küçülen dertlerdir, şehir değil. Defterine yaz: zor bir gün olursa yüksek bir yere çık, bütün şehir bir selam gibi karşılar. Ordu’nun hediyesi manzaradır.', 'Seen from above, it is troubles that shrink, not the city. Write it: if a day is hard, climb somewhere high and the whole city greets you. Ordu’s gift is the view.']],
  ),
}
