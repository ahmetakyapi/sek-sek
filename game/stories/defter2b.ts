import { talk, type Talk } from './types'

/** İkinci defter, ikinci yarı: Tokat, Denizli, Zonguldak, Mersin, Karabük, Aydın */
export const DEFTER2B: Record<string, Talk> = {
  'Yazmacı Hacer Hanım': talk(
    ['Hoş geldin kızım, oğlum! Ellerime bak: mavi ve kırmızı boyayla evlenmiş; Tokat yazması böyle doğar.', 'Welcome, dear! Look at my hands: wed to blue and red dye; this is how a Tokat print is born.'],
    [
      [['Yazma nasıl basılır?', 'How is a print made?'], ['Ahşap kalıbı boyaya batırır, kumaşa bastırırız; her vuruş bir motif. Kalıp elimde dans eder, kumaş sessiz dinler. Desen oturmazsa baştan başlarız.', 'We dip the wooden block in dye and press it to cloth; each strike a motif. The block dances in my hand, the cloth listens in silence. If the pattern does not sit, we begin again.']],
      [['Üç yazmanı unuttun demişsin, nerede kaldılar?', 'You said you forgot three prints, where did they end up?'], ['Biri hanın damında kurur, biri kalenin tepesinde dalgalanır, biri tavan arasında uyur. Yazmalar benden daha hareketli, ben yalnız boya kokuyorum.', 'One dries on the han’s roof, one waves atop the castle, one sleeps in the attic. The prints are livelier than I, I only smell of dye.']],
      [['Bu kalıpları kimden devraldınız?', 'From whom did you inherit these blocks?'], ['Anneannemden. Üstlerinde yüz yıllık parmak izi var. Her bastığımda onunla el ele çalıştığımı hissediyorum.', 'From my grandmother. They carry a hundred-year-old fingerprint. Each time I print I feel I work hand in hand with her.']],
    ],
    [['Yazmacının Defteri', 'The Printer’s Page'], ['Bir motif, bir kere basılır ve silinmez. Defterine yaz: bir sözü de, bir dostluğu da dikkatle bas; bir daha silinmez. Tokat’ta yazma, hatırayı kumaşa işlemektir.', 'A motif is printed once and never fades. Write it: print a word and a friendship with care; it will not fade. In Tokat a print is memory stitched into cloth.']],
  ),
  'Hancı Rıfat Efendi': talk(
    ['Hoş geldin! Taşhan’ın avlusu yorgun kervanlara açıktı; şimdi senin gibi yolculara da açık. Çay hazır.', 'Welcome! Taşhan’s courtyard was open to weary caravans; now it is open to travellers like you. Tea is ready.'],
    [
      [['Hanlar neden yapılırdı?', 'Why were hans built?'], ['Yolcu ve hayvan bir gecelik dinlensin diye. Kapı sağlam, avlu geniş, oda küçük. Hanın en büyük hizmeti güvendi: biri yola çıkarsa dönebileceğini bilir.', 'So traveller and beast could rest a night. Sturdy door, wide yard, small room. The han’s greatest service was trust: one who set out knew they could return.']],
      [['Kervanlar şimdi çay içiyor, doğru mu?', 'The caravans drink tea now, is that so?'], ['Kervan gitti, çaycılar kaldı; ama avluda biri hâlâ “develeri nereye bağlayayım” diye sorar. Ben de “şu çınara” derim, o da gülümser.', 'The caravans left, the tea makers stayed; but someone in the yard still asks “where shall I tie the camels.” I say “to that plane tree,” and they smile.']],
      [['Bu han sizin için ne ifade ediyor?', 'What does this han mean to you?'], ['Bir ev. Duvarları yüzlerce yolcunun hikâyesini duymuş. Ben sadece kapıyı açan bekçiyim; hikâyeleri yolcular taşıyor.', 'A home. Its walls have heard hundreds of travellers’ stories. I am only the keeper who opens the door; the travellers carry the stories.']],
    ],
    [['Hancının Defteri', 'The Innkeeper’s Page'], ['Atölyede son tokmağın ardında tavana zıpla; kirişlerin arası bir yerde boştur. Ama asıl sır, konaklayanın kalbini tanımaktır. Defterine yaz: kapıyı açan, yolu açmış olur.', 'In the workshop, leap to the ceiling behind the last hammer; between the beams there is a gap somewhere. But the real secret is knowing the lodger’s heart. Write it: whoever opens a door opens the road.']],
  ),
  'Havlucu Gülten Hanım': talk(
    ['Hoş geldin yavrum! Denizli’de havlu kuru olmaz, sevgiyle kurur. Dokun bakalım, yumuşaklığı hisset.', 'Welcome dear! In Denizli a towel is not simply dried, it is dried with love. Touch it, feel the softness.'],
    [
      [['Denizli havlusu neden bu kadar yumuşak?', 'Why is Denizli towelling so soft?'], ['Pamuk iyi, su iyi, sabır iyi. Kumaşı yıkar, çırpar, güneşe seririz. Yumuşaklık bir makineden değil, ilgiden gelir.', 'Good cotton, good water, good patience. We wash, beat and lay the cloth in the sun. Softness comes not from a machine but from attention.']],
      [['Rüzgâr havluları horozun başına mı uçurdu?', 'Did the wind blow towels onto the rooster’s head?'], ['Evet, ve horoz çok sinirlendi! Ama sonra bir havlunun üstünde uyudu; bir hafta bana selam vermedi. Horozlar da küsme bilir.', 'Yes, and the rooster was furious! But then he slept on one; for a week he did not greet me. Roosters know how to sulk.']],
      [['Pamukkale’nin havlu işine bir etkisi var mı?', 'Does Pamukkale have any effect on the towel trade?'], ['Su, taş ve beyazlık; hepsi bizde ilham verir. Bir havlu bile Pamukkale’yi hatırlatsın isterim: temiz, yumuşak, sakin.', 'Water, stone and whiteness; all inspire us. I want even a towel to recall Pamukkale: clean, soft, calm.']],
    ],
    [['Havlucunun Defteri', 'The Towel Maker’s Page'], ['Yumuşaklık güçsüzlük değildir; suyu emen, ağırlığı taşıyan şey yumuşaktır. Defterine yaz: nazik ol, sağlam kal. Denizli’de ipin ucuna gökyüzü asılır.', 'Softness is not weakness; what absorbs water and carries weight is soft. Write it: be gentle, stay strong. In Denizli the sky is hung at the end of the line.']],
  ),
  'Horozcu Cemal Amca': talk(
    ['Selam yolcu! Horozumu görmeden gitme; öterken bütün şehir susar, hatta güneş bile erteler.', 'Hello traveller! Do not leave without seeing my rooster; when he crows the whole city falls silent, even the sun postpones.'],
    [
      [['Denizli horozu neden uzun öter?', 'Why does the Denizli rooster crow so long?'], ['Uzun ötüşlü cins; nefes, ses ve sabır ister. Horoz da insan gibi çalışırsa gelişir. Ben horozla sabah altıda başlarım, o da benimle.', 'A long-crowing breed; it needs breath, voice and patience. A rooster, like a person, grows by training. I begin with him at six each morning, he with me.']],
      [['Horozunuz yarışmada hiç kaybetti mi?', 'Has your rooster ever lost a contest?'], ['Bir kere, hakem öttü diye başladı, horoz bunu kendine sandı. “Ben bundan uzun öterim” deyip yarışmayı terk etti. Bence haklıydı.', 'Once, the referee’s whistle began and the rooster took it personally. “I crow longer than that,” he said, and left the contest. I think he was right.']],
      [['Laodikeia’nın sütunları sizin için ne anlama geliyor?', 'What do Laodikeia’s columns mean to you?'], ['Zamanın dayanıklılığı. Bin yıl ayakta kalmış taşlar bile dinlenir; insan ise unutur. Sütunlara bakarak biraz yavaşlıyorum.', 'The endurance of time. Even stones standing a thousand years rest; people forget. Looking at the columns I slow down a little.']],
    ],
    [['Horozcunun Defteri', 'The Rooster Keeper’s Page'], ['Sütunların dibine bak, çatlak bir taş vardır; kırılınca altındaki saklı oda görünür. Ama defterine asıl şunu yaz: bir sesi uzun taşıyan, sabrı da taşır.', 'Look at the foot of the columns, there is a cracked stone; when broken, the hidden room beneath appears. But write this in your book: whoever carries a voice long carries patience too.']],
  ),
  'Lambacı Fikret Usta': talk(
    ['Hoş geldin evlat! Her lamba bir madencinin gözüdür; ben o gözleri parlak tutmaya çalışıyorum.', 'Welcome, child! Every lamp is a miner’s eye; I try to keep those eyes bright.'],
    [
      [['Madenci lambası nasıl çalışır?', 'How does a miner’s lamp work?'], ['Yağ ya da karpit, bir fitil, bir de cam. Alev küçük ama karanlık büyük; küçük ışığa güvenmek, yeraltının ilk dersi.', 'Oil or carbide, a wick, and glass. The flame is small but the darkness large; trusting a small light is underground’s first lesson.']],
      [['Üç lamba nasıl denizin dibine düşer?', 'How do three lamps fall to the seabed?'], ['Kendi başlarına yüzmek istemişler! Denizi bir kere görmüşler, “yeraltından çıktık, şimdi dalış yapalım” demişler. Lambalarım maceraperest.', 'They wanted to swim on their own! They saw the sea once and said “we came up from underground, now let us dive.” My lamps are adventurous.']],
      [['Madenciler sizin için ne ifade ediyor?', 'What do miners mean to you?'], ['Yürek. Her sabah karanlığa inen, akşam ışığa dönen. Onları bekleyen kadınlar, çocuklar; hepsi lambamın ışığında. Saygı duymak az gelir.', 'Heart. Those who descend into darkness each morning and return to light each night. The women and children who wait, all by my lamp’s light. To say respect is too little.']],
    ],
    [['Lambacının Defteri', 'The Lamp Maker’s Page'], ['Karanlık, ona yürüyenin ışığıyla tanınır. Defterine yaz: yanında bir ışık taşıyan, başkasına da yol gösterir. Zonguldak’ta ocağın başında ışık bir ekmek gibi paylaşılır.', 'Darkness is known by the light of the one who walks into it. Write it: one who carries a light also shows the way to others. In Zonguldak at the pit’s mouth light is shared like bread.']],
  ),
  'Dalgıç Tülin': talk(
    ['Selam! Dalış öncesi nefesini say, sonra denizi dinle. Deniz bağıranı sevmez, sessizi sever.', 'Hi! Before diving count your breath, then listen to the sea. The sea dislikes shouters, loves the quiet.'],
    [
      [['Dalgıçlar nefeslerini nasıl tutar?', 'How do divers hold their breath?'], ['Derin nefes, yavaş bırakış; sonra zihni boşaltmak. Panik, oksijeni yer. Ben bir kere sıkıştım, “sakin ol” dedim, beş saniye sonra sakindim.', 'A deep breath, a slow release; then emptying the mind. Panic eats oxygen. Once I got stuck, told myself “stay calm,” and five seconds later I was.']],
      [['Köpekbalığını gerçekten gördün mü?', 'Did you really see the shark?'], ['Gördüm, o da beni gördü; ikimiz de aynı anda geri döndük. Sonradan öğrendim ki o da ilk kez insan görüyormuş. Karşılıklı utandık.', 'I saw it and it saw me; we both turned back at the same moment. Later I learned it was seeing a human for the first time. We were mutually embarrassed.']],
      [['Denizin altı sizin için ne ifade ediyor?', 'What does the underwater mean to you?'], ['Sessizlik ve özgürlük. Yüzeyde dünya gürültülü, dipte sade. Orada insan, kendi kalp atışını duyar; bu bir dinginlik.', 'Silence and freedom. On the surface the world is loud, at the bottom simple. There a person hears their own heartbeat; it is a calm.']],
    ],
    [['Dalgıcın Defteri', 'The Diver’s Page'], ['Yüzeye çıkmayı hiç unutma; derin gitmek cesaret, zamanında dönmek akıldır. Defterine yaz: her ikisi de gerekli. Zonguldak’ın denizinde sabırlı olan, hazineyi bulur.', 'Never forget to surface; going deep is courage, returning in time is wisdom. Write it: both are needed. In Zonguldak’s sea the patient find the treasure.']],
  ),
  'Tantunici Cevdet Usta': talk(
    ['Hoş geldin evlat! Sac cızırdıyor, tantuni sabırla hazırlanıyor. Limon sıkmadan gitme!', 'Welcome, child! The griddle sizzles, tantuni is being prepared with patience. Do not leave without a squeeze of lemon!'],
    [
      [['Tantuni nasıl yapılır?', 'How is tantuni made?'], ['Et ince doğranır, sacda pamuk yağında soteleyip pişirilir, sonra lavaşa sarılır. Sesi cızırtı, kokusu şölen. Pişirme süresinde aceleci olmayacaksın.', 'The meat is thinly chopped, sautéed on the griddle in cottonseed oil, then wrapped in thin bread. Its sound a sizzle, its smell a feast. You must not be hasty in cooking.']],
      [['Cezerye dilimlerini nasıl kaybettin?', 'How did you lose the cezerye slices?'], ['Kızkalesi’ne yürüyorlarmış gibi göründüler, dört ayak üstünde! Şaka, ama ağzım dolu olunca gözüm başka yerde kalıyor. Bulursan yarısı sana.', 'They seemed to be walking to the Maiden’s Castle on four legs! A joke, but when my mouth is full my eyes stray. Find them and half is yours.']],
      [['Mersin’in tadı sizin için ne ifade ediyor?', 'What does Mersin’s taste mean to you?'], ['Limon, acı biber, deniz tuzu. Kıyının ve ovanın buluşması. Her lokmada hem denizi hem toprağı yersin.', 'Lemon, hot pepper, sea salt. The meeting of coast and plain. Every bite you eat both sea and soil.']],
    ],
    [['Tantunicinin Defteri', 'The Tantuni Maker’s Page'], ['Sıcak yemek, soğuk bir günde bile insana hatırlatır: dünya bir sofradır. Defterine yaz: paylaştığın lokma yoldaş kazandırır. Mersin’de limon sıkan, bir dostun elini sıkmış gibi olur.', 'A hot meal reminds you even on a cold day: the world is a table. Write it: a shared bite earns a companion. In Mersin whoever squeezes a lemon is like shaking a friend’s hand.']],
  ),
  'Masalcı Nazlı Teyze': talk(
    ['Gel yavrum, yanıma otur! Kızkalesi’nin masalını hem acı hem tatlı anlatırım; hangisini önce istersin?', 'Come, dear, sit by me! I tell the Maiden’s Castle tale both bitter and sweet; which do you want first?'],
    [
      [['Kızkalesi masalı ne anlatır?', 'What does the Maiden’s Castle tale tell?'], ['Bir kral kızını yılandan korumak için denizin ortasına kale yaptırdı; ama kader sepetle geldi. Masal der ki: ne kadar korursan koru, gelecek gelir.', 'A king had a castle built in the middle of the sea to protect his daughter from a snake; but fate came in a basket. The tale says: however you guard, the future arrives.']],
      [['Yılan sepetle nasıl girdi, kimse bakmadı mı?', 'How did the snake enter by basket, did no one look?'], ['Masalda kimse bakmaz, yoksa masal biter! Üzüm sepeti tatlı görünür; tatlıya bakmazsan, tatlı sana bakar. Şaka bir yana, bu bir uyarı.', 'In tales no one looks, or the tale ends! A grape basket looks sweet; if you do not look at sweetness, sweetness looks at you. Joking aside, this is a warning.']],
      [['Masalları kimden dinlediniz?', 'From whom did you hear these tales?'], ['Büyükannemden. Gece kandil ışığında, çaydanlık kaynarken. Masal dinleyen çocuk, uykusunda bile bir ülke dolaşır.', 'From my grandmother. At night by lamplight while the kettle boiled. A child who listens to tales roams a country even in sleep.']],
    ],
    [['Masalcının Defteri', 'The Storyteller’s Page'], ['Kalenin damına çıkarsan su yükselince yüz, balkona sıçra. Ama asıl sır masalın kendisi: anlatan yaşar. Defterine yaz: bir masal bir şehri bin yıl ayakta tutar.', 'If you climb to the castle roof, swim when the water rises and leap to the balcony. But the real secret is the tale itself: the teller lives. Write it: a tale holds up a city for a thousand years.']],
  ),
  'Lokumcu Haşim Usta': talk(
    ['Hoş geldin evlat! Lokum acele işi değil; nişasta, şeker ve safran birbirine alışsın diye saatlerce karıştırırız.', 'Welcome, child! Lokum is not hasty work; we stir for hours so starch, sugar and saffron grow used to each other.'],
    [
      [['Lokum neden bu kadar yumuşak?', 'Why is lokum so soft?'], ['Şeker şerbeti ve nişasta uzun süre pişirilir, sonra dinlenmeye bırakılır. Yumuşaklık, beklemenin bir meyvesi; sert hamur sabırsızlığın cezası.', 'Sugar syrup and starch are cooked long, then left to rest. Softness is a fruit of waiting; hard dough is impatience’s punishment.']],
      [['Safranı kaybetmenin cezası nedir?', 'What is the penalty for losing saffron?'], ['Lokumun rengi solar, benim yüzüm de! Ama bulmak için bir yol arıyorum; belki yolcu bana yardım eder. Safran altından kıymetli, dikkat et.', 'Lokum’s colour fades, and so does my face! But I look for a way to find it; perhaps a traveller will help me. Saffron is worth more than gold, be careful.']],
      [['Safranbolu’nun lokumu size ne anlatıyor?', 'What does Safranbolu’s lokum tell you?'], ['Bir kasabanın tatlı hafızası. Safran buraya bir zamanlar çok gelirmiş; adı kasabaya yapışmış. Lokum, tarihin tatlandırılmış hâli.', 'A town’s sweet memory. Saffron once came here in plenty; its name stuck to the town. Lokum is history sweetened.']],
    ],
    [['Lokumcunun Defteri', 'The Lokum Maker’s Page'], ['Bir şeyi tatlı kılmak, ona zaman vermektir. Defterine yaz: sertleşen şey, acele edilmiş şeydir. Karabük’te tatlı bir söz, yüz acı lokmayı örter.', 'To make a thing sweet is to give it time. Write it: what hardens has been hurried. In Karabük a sweet word covers a hundred bitter bites.']],
  ),
  'Rehber Feyza': talk(
    ['Selam! Kanyonun gürültüsü bir an için kes; bak, suyun sesini duyuyor musun? Ben her gün dinlerim, hâlâ sıkılmadım.', 'Hi! Pause the canyon’s noise a moment; do you hear the water? I listen every day and I am still not bored.'],
    [
      [['Tokatlı Kanyonu nasıl oluşmuş?', 'How was Tokatlı Canyon formed?'], ['Milyonlarca yıl su taşı oymuş; her damla bir kalem. Kanyon, sabrın en büyük yazı hâli. Bir şeyi yavaşça yapan, onu kalıcı yapar.', 'Over millions of years water carved the stone; each drop a pen. The canyon is patience’s greatest handwriting. Whoever does a thing slowly makes it lasting.']],
      [['Cam yolda ayağın hiç titrediği oldu mu?', 'Did your feet ever tremble on the glass path?'], ['İlk gün, bacaklarım jelatin gibiydi! Bir turist elimden tuttu, “korkma” dedi; ben rehberdim. İkimiz de gülünce korku geçti.', 'The first day my legs were like jelly! A tourist took my hand and said “do not be afraid”; I was the guide. When we both laughed the fear passed.']],
      [['Rehber olmak size ne veriyor?', 'What does being a guide give you?'], ['Başkasının ilk bakışını görmek. Her turist kanyona ilk kez bakar, ben o ilk bakışı tekrar tekrar yaşarım. İnsan bir yeri başkasının gözüyle yeniden sever.', 'Seeing another’s first look. Every tourist looks at the canyon for the first time, and I relive that first look again and again. A person loves a place anew through another’s eyes.']],
    ],
    [['Rehberin Defteri', 'The Guide’s Page'], ['İki duvar arasında sıkışmış gibi hissedersen sekerek çık; yön yukarıdır. Defterine yaz: dar yer, dayanıklılık öğretir. Karabük’te kanyon, doğanın en sabırlı hocasıdır.', 'If you feel squeezed between two walls, bounce up; the direction is upward. Write it: a narrow place teaches endurance. In Karabük the canyon is nature’s most patient teacher.']],
  ),
  'İncirci Sabiha Hanım': talk(
    ['Hoş geldin yavrum! Aydın inciri dalında kurur, kimseye boyun eğmez; sen de dikkatle yürü, ağaçlar çok eski.', 'Welcome dear! Aydın figs dry on the branch and bow to no one; walk carefully, the trees are very old.'],
    [
      [['Aydın inciri neden bu kadar tatlı?', 'Why is the Aydın fig so sweet?'], ['Toprak sıcak, güneş uzun, rüzgâr hafif. İncir dalında kuruyup kendi şekerini yapar. Ben her sabah ağaca “günaydın” derim; bence bu da tatlandırıyor.', 'The soil is warm, the sun long, the wind light. The fig dries on the branch and makes its own sugar. I say “good morning” to the tree each day; I think that sweetens it too.']],
      [['İncirleri ipe dizmişsin, rüzgâr neden almış?', 'You strung the figs and the wind took them, why?'], ['Rüzgâr da tatlı sever! Celsus’a, tiyatroya, Didim’e dağıttı; sanki bir yolculuk planı yaptı. Ben de “sen karar verdin” dedim.', 'The wind loves sweets too! It scattered them to Celsus, the theatre, Didim; as if it planned a journey. I told it “you decided.”']],
      [['İncir bahçesinde çalışmak nasıl bir şey?', 'What is it like to work in a fig orchard?'], ['Sıcak ve tatlı. Öğleyin ağaç gölgesi ev gibi gelir. İşin yorgunluğunu incirin kokusu alır; ben bu kokuyu yaşlanınca da isterim.', 'Hot and sweet. At noon the tree’s shade feels like home. The fig’s scent takes the work’s weariness; I want this scent in old age too.']],
    ],
    [['İncircinin Defteri', 'The Fig Seller’s Page'], ['Kuruyan şey tatlanır, olgunlaşan şey uzun yaşar. Defterine yaz: zaman düşman değil, şeker yapıcıdır. Aydın’da sabrı olan, hem incirden hem hayattan tat alır.', 'What dries sweetens, what ripens lives long. Write it: time is not an enemy but a sugar-maker. In Aydın whoever has patience gets taste from both figs and life.']],
  ),
  'Tiyatro Bekçisi Reşat Amca': talk(
    ['Hoş geldin evlat! Burada eskiden binlerce kişi oturur, ben ise şimdi tek başıma bekçiyim. Ama yalnız sayılmam.', 'Welcome, child! Thousands once sat here, and now I am the lone keeper. But I do not count as alone.'],
    [
      [['Antik tiyatro nasıl bu kadar iyi ses taşıyor?', 'How does the ancient theatre carry sound so well?'], ['Eğimi, taşın düzeni, hava; hepsi ahenkli. Sahnede fısıldasan en üst sıradan duyulur derler. Tasarım, dinleyiciye saygıdır.', 'The slope, the stone’s arrangement, the air; all in harmony. They say a whisper on the stage is heard from the top row. Design is respect for the listener.']],
      [['Kırk yıldır fısıldıyorsun, cevap gelmedi mi?', 'You have whispered for forty years, no answer yet?'], ['Hâlâ yok! Ama bir akşam ses geldi: bir kedi miyavladı. Ben “cevap bu muydu” diye düşündüm, kediye teşekkür ettim.', 'Still nothing! But one evening a sound came: a cat meowed. I wondered “was that the reply,” and thanked the cat.']],
      [['Bu tiyatroda geceler nasıl geçiyor?', 'How do the nights pass in this theatre?'], ['Yıldızlar sahneyi seyreder, ben de onları. Sessizlik büyük bir seyirci; sabaha dek alkış tutmaz ama hiç kalkmaz da.', 'The stars watch the stage, and I watch them. Silence is a great audience; it does not clap till morning but never leaves.']],
    ],
    [['Bekçinin Defteri', 'The Keeper’s Page'], ['Ritim taşlarında acele eden düşer; yanıp sönen takımdan öbürüne, tam kaybolurken zıpla. Ama asıl öğüt: fısıltı da duyulur, yeter ki dinleyen olsun. Aydın’da sabır bir sahne, dinlemek bir roldür.', 'On the rhythm stones the hasty fall; from the blinking set to the other, leap just as it vanishes. But the real counsel: a whisper is heard too, as long as there is a listener. In Aydın patience is a stage, listening a role.']],
  ),
}
