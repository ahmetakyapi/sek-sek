import { talk, type Talk } from './types'

/** İç Anadolu ve güney: Ankara, Konya, Nevşehir, Kayseri, Adana, Hatay, Gaziantep */
export const IC: Record<string, Talk> = {
  'Kuruyemişçi Nihat Amca': talk(
    ['Hoş geldin evlat! Kale’nin gölgesinde elli yıl geçti; leblebinin soğuğunu da sıcağını da bilirim.', 'Welcome, child! Fifty years in the Castle’s shadow; I know chickpeas hot and cold.'],
    [
      [['Hangi çerez Ankara’ya özgü?', 'Which snack is truly Ankara’s?'], ['Leblebi bizim değil ama bozkırın tadı ona çok yakışır. Bir avuç ağzına at, sabırla çiğne; ağzında şehrin sesi çıtırdar.', 'Chickpeas are not ours, but the steppe’s taste suits them well. Toss a handful in, chew with patience; the city crackles in your mouth.']],
      [['Elli yıl sattıysanız ağzınız hiç kurumadı mı?', 'After fifty years of selling, never a dry mouth?'], ['Kuruyemişçinin ağzı kurumaz evlat, çünkü söze doyar! Müşteri tartıda yanılsa, ben sohbette yanılmam.', 'A nut seller’s mouth never dries, child, since he is filled with talk! A customer may err at the scale, I never err in conversation.']],
      [['Kale’yi bunca yıl izlemek size ne öğretti?', 'What did watching the Castle for so many years teach you?'], ['Kale kimseyi yargılamaz, yalnız bakar. Telaşla yürüyenin de, oturup çay içenin de aynı taşın dibinden geçtiğini görürsün.', 'The Castle judges no one, it only looks. You see that the hurried and the tea-sipping pass by the same stone.']],
    ],
    [['Kuruyemişçinin Defteri', 'The Nut Seller’s Page'], ['Yola çıkarken cebine bir avuç kuruyemiş at; hem karnını hem moralini doyurur. Defterine yaz: bozkırda bile umut çıtırdar, yeter ki dinleyecek kulak olsun.', 'Put a handful of nuts in your pocket when you set out; it feeds belly and spirits. Write it: even on the steppe hope crackles, provided there is an ear to hear it.']],
  ),
  'Öğrenci Zeynep': talk(
    ['Selam! Sınav haftasıyım ama şehri yukarıdan izlemeye vaktim hep var. Sen yeni mi geldin?', 'Hi! It is exam week but I always have time to watch the city from above. Did you just arrive?'],
    [
      [['Atakule’den bakınca ne görüyorsun?', 'What do you see looking from Atakule?'], ['Dümdüz bozkırın ortasında kıpır kıpır bir şehir. Ne zaman bunalsam çıkarım, yüzlerce pencere, her birinde bir hayat.', 'A busy city in the middle of a flat steppe. Whenever I feel stifled I come up; hundreds of windows, each one a life.']],
      [['Sınav haftasında burada ne arıyorsun?', 'What are you doing here in exam week?'], ['Not peşindeyim! Şakayı bırak, ders çalışırken en iyi fikirler hep oyalanırken geliyor. Bir saat geç, sonra çalış.', 'Chasing notes! Joking aside, the best ideas come while procrastinating. Wander an hour, then study.']],
      [['Bu şehirde öğrenci olmak nasıl?', 'What is it like to be a student in this city?'], ['Herkes bir yere yetişiyor ama kimse kimseyi ezmiyor. Öğrenci olarak yardım isteyen bir yabancıya bile durulur, bunu çok seviyorum.', 'Everyone is rushing somewhere yet no one tramples anyone. Even a stranger asking a student for help gets a stop; I love that.']],
    ],
    [['Öğrencinin Defteri', 'The Student’s Page'], ['Başkent dediğin yer, büyük kurumlardan çok küçük kahvelerde yaşar. Bir köşe bul, bir not defteri aç, kendine bir saat ayır. Defterine yaz: dinlenmek de çalışmaktır.', 'A capital lives less in big institutions than in small cafés. Find a corner, open a notebook, give yourself an hour. Write it: resting is working too.']],
  ),
  'Çini Ustası Nurten': talk(
    ['Hoş geldin kızım, oğlum, ellerine dikkat; çini boyası dostunu da düşmanını da lekeler.', 'Welcome, dear. Mind your hands: tile paint stains friend and foe alike.'],
    [
      [['Çini nasıl yapılır, renkler nereden gelir?', 'How is a tile made, where do the colours come from?'], ['Kuvars, beyaz bir çamur ve ateş. Turkuaz bakırdan, lacivert kobalttan; renkler ocakta kendi kararını verir, biz sadece bekleriz.', 'Quartz, white clay and fire. Turquoise from copper, navy from cobalt; the colours decide for themselves in the kiln, we only wait.']],
      [['Çinide hata yaparsan ne oluyor?', 'What happens if you make a mistake on a tile?'], ['Fırın hatayı büyütür! Ama bazı hatalar yeni desen olur, çeşme gibi. Ustalığın yarısı hatayı güzel kılmaktır.', 'The kiln magnifies mistakes! But some become new patterns, like a fountain. Half of mastery is making the mistake beautiful.']],
      [['Karatay’ın kubbesindeki yıldızları anlatır mısınız?', 'Would you tell me about the stars in Karatay’s dome?'], ['Onlar Selçuklu ustasının gökyüzüne yazdığı mektup. Her yıldız bir sabır, her sıra bir dua. Başını kaldırırsan iç çekersin, bu normal.', 'They are a letter the Seljuk master wrote to the sky. Each star a patience, each row a prayer. Raise your head and you sigh, that is normal.']],
    ],
    [['Çinicinin Defteri', 'The Tile Maker’s Page'], ['Dönüşün de sırrı var kızım: yıldız dediğin sekiz uçludur, sekizinin de ucunu bir yere bağlarsın. Hayatta da bir fikre bağlı kalan, kaybolmaz. Defterine yaz.', 'There is a secret in the turning too, dear: a star has eight points and you tie each to somewhere. In life too, whoever stays tied to an idea does not get lost. Write it in your book.']],
  ),
  'Semazen Ali': talk(
    ['Hoş geldin, dost. Dönmeyi bir an bırak, dinlemeyi bir an dene.', 'Welcome, friend. Stop turning for a moment, try listening for a moment.'],
    [
      [['Dönerken başın dönmüyor mu?', 'Does your head not spin while whirling?'], ['İlk yıl çok döndü, sonra bir noktaya bakmayı öğrendim. Hayatta da böyle: gözün bir yerde sabitse dünya dönse de ayakta kalırsın.', 'It spun a lot the first year, then I learned to fix my eye on one point. Life is the same: if your eye is steady, you stand though the world turns.']],
      [['Bir gün durup dönmeyi unutursan ne olur?', 'What if one day you stop and forget how to whirl?'], ['Elbette unutmam, ama unutursam bütün kıyafetim bana gülerdi! Kabarmış beyaz etek bir kâğıt gibi yere serilir, ayağım ona takılır.', 'Surely I would not, but if I did my whole garment would laugh at me! The billowing white skirt would fall like paper and trip my foot.']],
      [['Bu yola ilk nasıl girdiniz?', 'How did you first enter this path?'], ['Dedem sessiz biriydi, nasıl durduğuna hep bakardım. Bir gün onunla durdum, sonra döndüm. Öğrenmek, önce izlemektir.', 'My grandfather was a quiet man; I always watched how he stood. One day I stood with him, then turned. Learning begins with watching.']],
    ],
    [['Semazenin Defteri', 'The Whirler’s Page'], ['Bir elin göğe, bir elin yere bakar; ortada sen dengelisin. Defterine yaz: alırken ver, verirken al. Konya’da kapı herkese açıktır, kalbin de öyle olsun.', 'One hand toward heaven, one toward earth; you are the balance between. Write it: give as you take, take as you give. In Konya the door is open to all, may your heart be too.']],
  ),
  'Balon Pilotu Deniz': talk(
    ['Hoş geldin! Hava bugün uysal, sabah en kolayı. Sen yukarıdan bakmaya hazır mısın?', 'Welcome! The air is gentle today, morning is easiest. Are you ready to look from above?'],
    [
      [['Balon nasıl yükselir, nasıl iner?', 'How does a balloon rise, how does it descend?'], ['Sıcak hava hafiftir; alev yakınca çıkar, söndürünce sakin sakin iner. Rüzgâr yönü belirler, biz sadece yükseklikle oynarız.', 'Hot air is light; flame lifts it, rest lets it settle. The wind sets the direction, we only play with height.']],
      [['Hiç sepetin dışına bakınca korktun mu?', 'Ever feel afraid looking over the basket?'], ['Her sabah, ama sonra peribacalarını görünce bütün korkum çay gibi buharlaşıyor. Zaten korkmamak değil, korkuyla birlikte yükselmek cesaret.', 'Every morning, but then I see the fairy chimneys and my fear evaporates like tea. Courage is not fearlessness, it is rising with the fear.']],
      [['Sabah erken kalkmak zor değil mi?', 'Is getting up early not hard?'], ['Zor ama güneş doğarken vadiyi altın gibi görmek, uykuyla değiştirilmez. İyi yolculuğun bedeli bir erken kalkıştır.', 'It is hard, but seeing the valley gold at sunrise cannot be traded for sleep. The price of a good journey is one early rising.']],
    ],
    [['Pilotun Defteri', 'The Pilot’s Page'], ['Yükseğe çıkınca kimse küçük görünmez, her şey birbirine bağlı görünür. Defterine yaz: yolculukta kayboldun sanıyorsan biraz yüksel; yol çoktan görünür olmuştur.', 'High up, nothing seems small, everything appears connected. Write it: if you think you are lost on the road, rise a little; the way is already in view.']],
  ),
  'Yeraltı Rehberi Elif': talk(
    ['Hoş geldin, başını eğ; tüneller alçak ama hikâyeler yüksek. Elindeki ışığı sakın bırakma.', 'Welcome, mind your head; the tunnels are low but the stories are high. Never let go of your light.'],
    [
      [['Yeraltı şehrinde insanlar nasıl yaşamış?', 'How did people live in the underground city?'], ['Mutfağı, kilerleri, ahırı, havalandırması vardı. Tehlike olunca bütün aile aşağı iner, kapı değirmen taşı gibi yuvarlanır, dış dünya sessizleşirdi.', 'It had a kitchen, pantries, stables, ventilation. When danger came the whole family went down, a millstone door rolled shut, the outside world went quiet.']],
      [['Hiç bu tünellerde kaybolduğun oldu mu?', 'Ever got lost in these tunnels?'], ['Birkaç kere! İlk yıl grubumu aramak için iki katman indim, sonra onların beni aradığını gördüm. Artık haritayı içimde taşıyorum.', 'A few times! My first year I went two levels down to look for my group, then found they were looking for me. Now I carry the map inside.']],
      [['Buraya inmek insana ne hissettiriyor?', 'How does going down here make a person feel?'], ['Küçülmek ve büyümek, aynı anda. Bin yıllık bir kapının önünde dururken insan kendi sorunlarını hafifletir.', 'Shrinking and growing at once. Standing before a thousand-year-old door, a person lightens their own troubles.']],
    ],
    [['Rehberin Defteri', 'The Guide’s Page'], ['Yeraltında ışık, havadan değerlidir. Hayatta da dikkat edeceğin tek şey sana yol gösterene teşekkür etmektir. Defterine yaz: gizli bir yer, onu sevenlere kendini gösterir.', 'Underground, light is worth more than air. In life the only thing to heed is to thank whoever lights your way. Write it: a hidden place shows itself to those who love it.']],
  ),
  'Pastırmacı Zekeriya Usta': talk(
    ['Hoş geldin, çemenin kokusu yolunu bulur! Pastırma yüksek sesle kesilmez, sabırla dilimlenir.', 'Welcome, the scent of çemen finds its way! Pastırma is not cut loudly, but sliced with patience.'],
    [
      [['Pastırma nasıl yapılır?', 'How is pastırma made?'], ['Et tuzlanır, sıkıştırılır, kurur; sonra bol çemenle sarılır ve rüzgârda bekler. Kayseri’nin kuru havası bunun yarı ustasıdır.', 'The meat is salted, pressed, dried; then wrapped in plenty of çemen and left to the wind. Kayseri’s dry air is half the master.']],
      [['Mantı bohçaları gerçekten kaçtı mı?', 'Did the mantı bundles really run away?'], ['Kaçtı demedim, kendi kendine bir yere gitti dedim! Bohça açıldı mı mantı yuvarlanır, zaten mantının tek kusuru hızlı olmasıdır.', 'I did not say they ran, I said they went off on their own! Open the bundle and the mantı rolls; the only fault of mantı is being quick.']],
      [['Zanaatın zorluğu nerede?', 'Where does the craft turn hard?'], ['Bıçağı doğru tutmakta. İnce keserken elinin hafif, kafanın sakin olması gerekir. Ustalık, hırsını bıçaktan çekmektir.', 'In holding the knife right. Slicing thin, your hand must be light and your mind calm. Mastery is pulling your impatience off the blade.']],
    ],
    [['Pastırmacının Defteri', 'The Pastırma Maker’s Page'], ['İyi şeyler zamanla olur: pastırma, dostluk, ustalık. Acele edeni rüzgâr geri çevirir. Defterine yaz, Kayseri’de en kıymetli koku sabırdır.', 'Good things happen with time: pastırma, friendship, mastery. The wind turns back the hasty. Write it: in Kayseri the most precious scent is patience.']],
  ),
  'Mantıcı Hasret Teyze': talk(
    ['Hoş geldin yavrum, ellerin soğuk, sen bir otur! Mantı sıcak yenir, hikâye daha sıcak.', 'Welcome, dear, your hands are cold, sit! Mantı is eaten hot, stories hotter.'],
    [
      [['Bir kaşığa kırk mantı nasıl sığar?', 'How do forty mantı fit on one spoon?'], ['Hamuru kâğıt gibi açar, kibrit kutusundan küçük keseriz. İçine tuzlu bir et, dışına yoğurt, üstüne sumak. Her mantı bir sevgi parçası.', 'We roll the dough like paper, cut smaller than a matchbox. Salted meat inside, yoghurt outside, sumac over it. Each one a piece of love.']],
      [['Kırk mantı yiyen bir rekor sahibi var mı?', 'Is there a record-holder for forty mantı?'], ['Var, benim torunum! Ama o on dakika sonra yatağa uzandı. Ben dedim ki: mantıyı değil, tadını bitir.', 'There is, my grandson! But ten minutes later he lay down. I said: finish the taste, not the mantı.']],
      [['Şifahane avlusunu bir de siz anlatır mısınız?', 'Would you describe the healing house courtyard too?'], ['Burada eskiden hastalar su sesi, müzik ve çiçek kokusuyla iyileşirmiş. Avlunun serinliği hâlâ yorgunu dinlendirir; bir duvarına yaslanırsan fark edersin.', 'Here, patients once healed with water sounds, music and flowers. The courtyard’s coolness still rests the tired; lean against one wall and you notice.']],
    ],
    [['Mantıcının Defteri', 'The Mantı Maker’s Page'], ['Küçük yapmak, büyük sevmektir yavrum. Defterine yaz: ne kadar ince işlersen o kadar çok kişiye yetersin. Kayseri’de cömertlik bir kaşıkta kırk tanedir.', 'To make small is to love big, dear. Write it: the finer you work, the more people you reach. In Kayseri generosity is forty to a spoon.']],
  ),
  'Kebapçı Halil Usta': talk(
    ['Buyur yolcu, mangal hazır! Adana’nın sıcağı zaten ateş, benim mangalım ise eğlence.', 'Welcome, traveller, the grill is ready! Adana’s heat is already fire; my grill is the fun part.'],
    [
      [['Adana kebabının sırrı nedir?', 'What is the secret of Adana kebab?'], ['Zırhla kıyılan et, kuyruk yağı ve acı biber; şişi bastırınca düz, çevirince yumuşak olur. En büyük sır sabırdır, ateşi bekler.', 'Hand-chopped meat, tail fat and hot pepper; pressed it is flat, turned it is soft. The biggest secret is patience, it waits for the fire.']],
      [['Acı biber çok kaçarsa sonuç ne olur?', 'What if too much hot pepper goes in?'], ['Ağlayan müşteri, gülen şalgamcı! Ama iyi usta acıyı dozunda tutar; ağlatırsan bir daha gelmez, güldürürsen kapıya kuyruk olur.', 'A weeping customer, a laughing şalgam seller! A good master measures the heat; make them weep and they never return, make them smile and a queue forms.']],
      [['Mangalın başında yıllarca durmak ağır olmuyor mu?', 'Is standing at the grill for years not heavy?'], ['Ağır ama şeref. Ateşin başında durmak, insana sabrı öğretir. Yemeği sevenin sabırlı olması, mangalın armağanıdır.', 'Heavy, but an honour. Standing by the fire teaches patience. A food lover being patient is the grill’s gift.']],
    ],
    [['Kebapçının Defteri', 'The Kebab Maker’s Page'], ['Ateşi sev ama saygı göster. Defterine yaz: lezzet de, sıcaklık da paylaşılınca değer kazanır. Adana’da yabancı sofraya oturdu mu bir daha yabancı olmaz.', 'Love fire but respect it. Write it: both flavour and warmth gain value when shared. In Adana a stranger at the table is a stranger no more.']],
  ),
  'Kayıkçı Sevgi': talk(
    ['Selam yolcu! Seyhan bugün sakin, sal da hafif sallanıyor. Bin bakalım, ama acele etme.', 'Hello, traveller! The Seyhan is calm today, and the raft sways lightly. Climb on, but do not hurry.'],
    [
      [['Seyhan neden bu kadar sakin akıyor?', 'Why does the Seyhan flow so calmly?'], ['Barajdan sonra yavaşladı, ama sessizlik geçici: yağmurlar gelince ova bile titrer. Nehir sakinken ona saygı göster.', 'It slowed after the dam, but the quiet is temporary: when rains come, even the plain trembles. Respect the river when it is calm.']],
      [['Salı sallayan sen misin, nehir mi?', 'Who rocks the raft, you or the river?'], ['İkimiz de! Ben biraz sallarım ki yolcu uyanık dursun, nehir biraz sallar ki ben uyanık durayım. İş birliği.', 'Both of us! I rock a little so the passenger stays alert, the river rocks a little so I stay alert. Teamwork.']],
      [['Bu işi seçmenizin sebebi neydi?', 'What made you choose this work?'], ['Nehre çocukken bakmak sevinçti, sonra iş oldu. Sevdiğin bir şeye emek verebilmek en büyük şans bence.', 'Looking at the river as a child was joy, then it became work. Giving effort to something you love is the greatest luck, I think.']],
    ],
    [['Kayıkçının Defteri', 'The Boatwoman’s Page'], ['Nehirde yön yok, akış var. Defterine yaz: hayatta bazen kürek çekmez, akıntıyı dinlersin. Seyhan’da kayıkçı hızla değil dikkatle ustalaşır.', 'On a river there is no direction, only flow. Write it: sometimes in life you do not row, you listen to the current. On the Seyhan a boatwoman masters not by speed but by attention.']],
  ),
  'Künefeci Necdet Usta': talk(
    ['Hoş geldin evladım! Antakya’da künefe aceleye gelmez; peynir ısınmadan şerbet dökülmez.', 'Welcome, child! In Antakya künefe does not take haste; no syrup before the cheese is warm.'],
    [
      [['Künefenin tadı Antakya’ya özgü mü?', 'Is künefe’s taste special to Antakya?'], ['Tel kadayıf, tuzsuz peynir ve şerbet herkeste var, ama bizim suyumuz, bizim ocağımız, bizim ellerimiz başka. Tadı yere, yeri insana bağlarım.', 'Shredded pastry, unsalted cheese and syrup exist everywhere, but our water, our hearth, our hands differ. I bind taste to place, and place to people.']],
      [['Üç dilim künefe nasıl kaybolur?', 'How do three slices of künefe get lost?'], ['Yürümeyi öğrenmiş künefeler! Biri sıcağından kaçtı, biri şerbetten sıkıldı, biri de yolculara gönderdim. Bulursan yiyebilirsin.', 'Künefes that learned to walk! One fled the heat, one tired of syrup, one I sent to travellers. If you find it, you may eat.']],
      [['Antakya’da farklı inançlar yan yana yaşar, değil mi?', 'Different faiths live side by side in Antakya, don’t they?'], ['Evet evladım; kilise, cami, sinagog birbirine komşu. Bayramda birbirimize tatlı gönderirdik. Tatlı en iyi tercümandır.', 'Yes, child; church, mosque and synagogue are neighbours. At festivals we sent each other sweets. Sweets are the best interpreter.']],
    ],
    [['Künefecinin Defteri', 'The Künefe Maker’s Page'], ['Tatlı, yalnız yenmez, paylaşılırsa tatlıdır. Defterine yaz: ayrı ayrı yaşayanlar bir tabakta buluşabilir. Antakya’nın en büyük sırrı komşuluktur.', 'Sweets are not eaten alone, they are sweet when shared. Write it: those who live apart can meet on one plate. Antakya’s greatest secret is neighbourliness.']],
  ),
  'Sabuncu Elias Amca': talk(
    ['Hoş geldin! Defne yaprağının kokusu bir kere burnuna girdi mi, çıkmaz. Dur, bir parça koklasana.', 'Welcome! Once the scent of bay laurel enters your nose it never leaves. Wait, smell a piece.'],
    [
      [['Defne sabunu nasıl yapılır?', 'How is bay laurel soap made?'], ['Zeytinyağını ve defne yağını kazanda kaynatırız, tahtalı kalıplara döker, aylarca kurutur, her tarafını çevirip havalandırırız. Beklemek malzemenin yarısı.', 'We boil olive and laurel oil in a cauldron, pour into wooden moulds, dry for months, turn each side to air it. Waiting is half the material.']],
      [['Kayanın dibindeki karanlık aralığa niye bakmalıyım?', 'Why should I look at the dark gap beneath the rock?'], ['Ben bir şey demedim, dedim ki karanlık aralıklar meraklıları sever. Meraklı yolcu, sabunun kokusuna bir iz bulur.', 'I said nothing, I said dark gaps like the curious. A curious traveller finds a trail in the soap’s scent.']],
      [['Uzun Çarşı sizin için ne ifade ediyor?', 'What does Uzun Çarşı mean to you?'], ['Ömrüm. Burnum hâlâ sabun kokusundan yolumu bulur; her köşe başka bir koku, başka bir komşu. Bir şehir kokusuyla hatırlanır.', 'My lifetime. My nose still finds its way by soap; each corner a different scent, a different neighbour. A city is remembered by its smell.']],
    ],
    [['Sabuncunun Defteri', 'The Soap Maker’s Page'], ['Koku, yolculukta en iyi hafızadır. Bir gün Antakya’yı unutsan bile defne kokusu seni geri çağırır. Defterine yaz: unutmak istemediğin şeyi kokla da öyle kaydet.', 'Scent is the best memory on a journey. Even if you forget Antakya one day, the laurel scent calls you back. Write it: smell what you do not want to forget and record it so.']],
  ),
  'Bakırcı Mehmet Usta': talk(
    ['Gel gel, dinle! Tokmak üç vurur, sonra sessizlik gelir. Sessizlikte işin yarısı bitmiştir.', 'Come, listen! The hammer strikes three, then comes silence. In the silence half the job is done.'],
    [
      [['Bakır neden bu kadar dayanıklı?', 'Why is copper so durable?'], ['Dövüldükçe sertleşir ve sertleştikçe uzun yaşar. Bakırcının sevdiği şey sıcaklıktır; çünkü ısınan bakır ustasına itaat eder.', 'It hardens as it is hammered, and the harder it is the longer it lives. A coppersmith’s love is warmth, since heated copper obeys its master.']],
      [['Bunca vuruş sonunda kulağın sağır olmadı mı?', 'After so many strikes, did your ears not go deaf?'], ['Ne dedin? Şaka şaka, vuruş sesine bir ritim buldum ve kulağım ona alıştı. Müzik çıkarmak, gürültüyü sevmekle başlar.', 'What did you say? Joking, I found a rhythm in the striking and my ear grew used to it. Making music starts with loving noise.']],
      [['Bu atölyede kaç nesil çalıştı?', 'How many generations worked in this workshop?'], ['Dört. Dedemin tokmağı hâlâ duvarda; kimse dokunmaz ama herkes ona bakar. Alet, ustasından daha uzun yaşar.', 'Four. My grandfather’s hammer still hangs on the wall; no one touches it but everyone looks. The tool outlives its master.']],
    ],
    [['Bakırcının Defteri', 'The Coppersmith’s Page'], ['Ritmi bulan, işi kolay yapar. Hayatın tokmağı da üç vurur, sonra bekler. Defterine yaz: zor günlerde vuruşu say, bir sessizlik gelecektir.', 'Whoever finds the rhythm makes work easy. Life’s hammer also strikes three and then waits. Write it: on hard days count the strikes, a silence will come.']],
  ),
  'Müze Rehberi Zeynep': talk(
    ['Hoş geldiniz! Mozaikler yüzyıllardır sabırla bekliyor, siz de biraz bekleyebilirsiniz.', 'Welcome! The mosaics have waited patiently for centuries, you can wait a little too.'],
    [
      [['Zeugma mozaikleri nasıl kurtarıldı?', 'How were the Zeugma mosaics rescued?'], ['Baraj suları yükselmeden önce kazı ekipleri günlerce çalıştı. Bir kısmı sular altında kaldı, ama en güzelleri kurtarıldı. Kurtarmak, sevmenin başka bir ismidir.', 'Before the dam waters rose, excavation teams worked for days. Some lay under water, but the most beautiful were saved. Rescuing is another name for love.']],
      [['Mozaik parçasını yanlış yere koyarsam ne olur?', 'What if I put a mosaic piece in the wrong place?'], ['O zaman bir göz yanlış bakar, bir burun kayar, ve gülmeyen portre gülmeye başlar! Restoratörlerimiz bu konuda çok hassas, bence biraz kıskanç.', 'Then an eye looks wrong, a nose slips, and a solemn portrait starts to smile! Our restorers are very particular, and a bit jealous, I think.']],
      [['Sizi bu işe çeken şey neydi?', 'What drew you to this work?'], ['Küçük bir parçanın bütün resmi tamamlaması. Her biri kendi başına sıradan taş, ama birlikte bir bakışı yeniden canlandırıyor.', 'A small piece completing the whole picture. Each is an ordinary stone alone, but together they revive a gaze.']],
    ],
    [['Rehberin Defteri', 'The Guide’s Page'], ['Defterine yaz: bütün büyük resimler küçük parçalardan oluşur. Her gün ufak bir şey ekle, bir gün baktığında bir yüz görürsün. Gaziantep’in tadı da böyle: ince ince dokunur.', 'Write it: all great pictures are made of small pieces. Add something tiny each day, and one day you look up and see a face. Gaziantep’s taste is like that: woven finely.']],
  ),
}
