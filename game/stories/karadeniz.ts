import { talk, type Talk } from './types'

/** Karadeniz, Doğu ve Ege kıyısı: Trabzon, Sivas, Van, Erzurum, Ardahan, Amasya, Muğla, Bayburt */
export const KARADENIZ: Record<string, Talk> = {
  'Kemençeci Cemal Dayı': talk(
    ['Hoş geldun uşağum! Kemençenin teli üç ama yüreğin teli çok; hangisini çalayım sana?', 'Welcome, my lad! The kemençe has three strings but the heart has many; which shall I play for you?'],
    [
      [['Kemençe nasıl çalınır, zor mudur?', 'How is the kemençe played, is it hard?'], ['Yaya değil, yüreğe bakarsan öğrenirsin. Telin üstünde parmak değil, söz gezer. Ben ilk yıl yayı kırdım, ikinci yıl kemençeyi, üçüncü yıl yüreğimi.', 'Look at the heart, not the bow, and you learn. Not fingers but words wander over the string. My first year I broke the bow, the second the kemençe, the third my heart.']],
      [['Kemençeyle horon aynı anda yapılır mı?', 'Can one play kemençe and dance horon together?'], ['Yapılır ama sonuç komik olur! Bir kere düğünde çalarken horona karıştım, kemençeyi başımın üstüne alıp zıpladım. Düğün sahibi hâlâ güler.', 'It can, but the result is funny! Once at a wedding I joined the horon while playing, lifting the kemençe over my head and jumping. The host still laughs.']],
      [['Bu ezgileri kimden öğrendiniz?', 'From whom did you learn these tunes?'], ['Dedemden, o da kendinden öncekinden. Hiçbirimiz yazmadık; kulaktan kulağa, yürekten yüreğe. Bir ezgi, taşıyanından uzun yaşar.', 'From my grandfather, who learned it from his predecessor. None of us wrote them; ear to ear, heart to heart. A tune outlives its bearer.']],
    ],
    [['Kemençecinin Defteri', 'The Kemençe Player’s Page'], ['Deniz bir tane, ezgi yüzlerce; ikisi de dalgayla gelir. Defterine yaz: üzüntüyü ezgiye çevir, yük hafifler. Trabzon’da ağlayan da güler, güleni de çalgı ağlatır.', 'One sea, hundreds of tunes; both arrive with waves. Write it: turn sorrow into a tune and the load lightens. In Trabzon the one who weeps also laughs, and music makes the laughing weep.']],
  ),
  'Horoncu Yusuf': talk(
    ['Selam kardeş! Gel, kolunu uzat; horon yalnız oynanmaz, bir kol yetmez, dört kol lazım.', 'Hello, brother! Come, stretch out your arm; horon is not danced alone, one arm is not enough, you need four.'],
    [
      [['Horonun adımı nasıl öğrenilir?', 'How is the horon step learned?'], ['Önce yan adımı, sonra titreşimi. Ayağını değil omzunu dinle; hepimiz birlikte titrersek ahenk olur. Öğrenmek, birine tutunmayı bilmektir.', 'First the side step, then the shiver. Listen to your shoulders, not your feet; when we all tremble together it becomes harmony. Learning is knowing how to hold on to someone.']],
      [['Horon sırasında düşen oldu mu?', 'Has anyone fallen during the horon?'], ['Ben! İlk düğünde yanımdaki amcanın ayağına bastım, ikimiz de halıya yattık. Onun çorabı delikmiş, şimdi dostuz.', 'Me! At my first wedding I stepped on the uncle beside me and we both lay on the carpet. His sock had a hole, and now we are friends.']],
      [['Bu halkada yer almak sizin için ne ifade ediyor?', 'What does being part of this circle mean to you?'], ['Aidiyet. Kolun kolda, omzun omuzda; yalnız olmadığını bilmek. Dönerken kimse seni bırakmaz, düşersen kaldırır.', 'Belonging. Arm in arm, shoulder to shoulder; knowing you are not alone. No one drops you while turning, and if you fall they lift you.']],
    ],
    [['Horoncunun Defteri', 'The Horon Dancer’s Page'], ['Titremek zayıflık değil, birliğin sesi. Defterine yaz: kalabalıkta kendini bulmak, birlikte hareket etmeyi öğrenmektir. Trabzon’da bir halka asla kapanmaz, yeni gelen için açılır.', 'Trembling is not weakness but the sound of unity. Write it: finding yourself in a crowd means learning to move together. In Trabzon a circle never closes, it opens for the newcomer.']],
  ),
  'Çoban Mehmet ve Karabaş': talk(
    ['Selam yolcu. Sen yaklaşırken Karabaş kuyruk salladı; demek ki iyi niyetlisin. Burada köpek insanı tanır.', 'Greetings, traveller. Karabaş wagged his tail as you came near; so you are well-meaning. Here the dog knows the person.'],
    [
      [['Kangal köpeği neden bu kadar saygın?', 'Why is the Kangal dog so respected?'], ['Sürüyü kurttan korur, gerekirse canıyla. Güçlüdür ama sakin; ancak tehdit olursa kükrer. Gerçek güç, sakin durabilmektir.', 'It guards the flock from wolves, with its life if needed. Strong but calm; it roars only at a threat. Real strength is being able to stay calm.']],
      [['Karabaş seninle konuşuyor mu?', 'Does Karabaş talk with you?'], ['Hem de nasıl! Bir bakışıyla “kurt geldi” der, bir kuyruğuyla “gelen dost”. Kelime bilmez ama beni insanlardan iyi anlar.', 'And how! One look means “wolf is coming,” one wag means “the visitor is a friend.” He knows no words but understands me better than people do.']],
      [['Yalnız çobanlık yapmak zor olmuyor mu?', 'Is shepherding alone not hard?'], ['Yalnız değilim; Karabaş, sürü, yıldızlar, rüzgâr. Yalnızlık çoğu zaman bir ses eksikliğidir, ben sesi dağlardan duyuyorum.', 'I am not alone; Karabaş, the flock, the stars, the wind. Loneliness is mostly a lack of sound, and I hear it from the mountains.']],
    ],
    [['Çobanın Defteri', 'The Shepherd’s Page'], ['Sürüyü tutan ip değil, güvendir. Defterine yaz: bir canlıya güvenirsen, o seni de korur. Sivas’ta Kangal bir köpek değil, bir sözdür: verdiğini tutar.', 'What holds a flock is not rope but trust. Write it: trust a creature and it will guard you too. In Sivas a Kangal is not a dog but a word: it keeps what it promises.']],
  ),
  'Medrese Bekçisi Zehra': talk(
    ['Hoş geldin, ayakkabı sesin duvarlara düşüyor; ağır yürüme, taşlar uyur burada.', 'Welcome, your footsteps fall on the walls; do not tread heavily, the stones sleep here.'],
    [
      [['Çifte Minare’nin hikâyesi nedir?', 'What is the story of the Twin Minarets?'], ['Selçuklu döneminde yapılmış, iki minare yan yana. Biri ötekine bakar, ikisi de kapıya. Güzellik bazen simetriden değil, sabırdan doğar.', 'Built in the Seljuk era, two minarets side by side. One looks at the other, both at the door. Beauty is sometimes born not from symmetry but from patience.']],
      [['Geceleri burada korkmuyor musun?', 'Do you not get afraid here at night?'], ['Korkacak ne var ki? Taşlar, güvercinler ve rüzgâr. Bir keresinde bir kedi gelip yanıma uyudu, o günden beri yalnızlığa küstüm.', 'What is there to fear? Stones, pigeons and wind. Once a cat came to sleep by my side, and since then I have fallen out with loneliness.']],
      [['Bu binayı korumanın anlamı nedir?', 'What is the meaning of protecting this building?'], ['Bir gün burada ders veren hocaların izi hâlâ taşlarda. Binayı korumak, o izi yeni gelenlere teslim etmektir.', 'The marks of the teachers who once taught here are still in the stones. To protect the building is to hand that mark to those who come after.']],
    ],
    [['Bekçinin Defteri', 'The Warden’s Page'], ['Büyük işler sessizce yapılır. Defterine yaz: dikkat bir tür saygıdır, dinlemek bir tür öğrenmedir. Sivas’ta taş, ona kulak verene hikâyesini anlatır.', 'Great works are made quietly. Write it: attention is a kind of respect, listening a kind of learning. In Sivas the stone tells its story to whoever lends an ear.']],
  ),
  'Kahvaltıcı Gülbahar Abla': talk(
    ['Gel gel, sofra hazır! Van’da kahvaltı yemek değil, bir törendir; en az iki saat sürer.', 'Come, the table is set! In Van breakfast is not eating, it is a ceremony; it lasts at least two hours.'],
    [
      [['Van kahvaltısında olmazsa olmaz nedir?', 'What can never be missing from a Van breakfast?'], ['Otlu peynir, bal-kaymak, murtuğa. Her biri başka bir yöreden gelir ama sofrada barışırlar. Çay da demli, sohbet de uzun olmalı.', 'Herb cheese, honey and cream, murtuğa. Each comes from a different place but they make peace at the table. The tea must be strong, the talk long.']],
      [['Kahvaltı iki saat sürerse akşam yemeği ne zaman?', 'If breakfast takes two hours, when is dinner?'], ['Kahvaltı bitince öğle başlıyor, öğle bitince akşam. Bir Vanlı için gün üç öğündür, hiç aralık yok! Şaka, ama ağzın boş kalmaz.', 'When breakfast ends noon begins, when noon ends evening. For a Van person the day is three meals with no gap! A joke, but your mouth never sits empty.']],
      [['Bu sofrayı kimler için kuruyorsunuz?', 'For whom do you set this table?'], ['Misafir için. Sofrada bir tabak fazla, bir minder fazla; çünkü kapıya kim geleceğini bilmeyiz. Beklenen kadar beklenmeyen de baş köşedir.', 'For guests. One plate extra, one cushion extra; for we do not know who will come to the door. The unexpected is as honoured as the expected.']],
    ],
    [['Ablanın Defteri', 'The Abla’s Page'], ['Bir sofra bir şehrin kalbidir. Defterine yaz: birlikte yiyenler birbirini yargılayamaz. Van’da kahvaltı bir dost kazanmanın en kısa yoludur; bir de en tatlısı.', 'A table is a city’s heart. Write it: those who eat together cannot judge one another. In Van breakfast is the shortest way to win a friend, and the sweetest too.']],
  ),
  'Kayıkçı Sıddık': talk(
    ['Hoş geldin! Göl bugün kıpırdamıyor, bu iyi işaret. Ama sen yine de ellerini sudan uzak tut.', 'Welcome! The lake is not stirring today, a good sign. But keep your hands away from the water anyway.'],
    [
      [['Van Gölü neden sodalıdır?', 'Why is Lake Van soda-rich?'], ['Çevresi kapalı bir havza; sular denize çıkamaz, mineral birikir. Yani gölün suyu kendi içine sakladığı bir hazine.', 'It is a closed basin; waters cannot reach the sea, so minerals accumulate. The lake’s water is a treasure it keeps within itself.']],
      [['Gölde canavar var mı gerçekten?', 'Is there really a monster in the lake?'], ['Her kayıkçı bir kere görmüştür, ama kimse yakından bakmamış! Ben mi? Ben bir kere gördüm sanıp bir cam şişeye bakmıştım.', 'Every boatman has seen it once, but no one has looked closely! Me? Once I thought I saw it and was staring at a glass bottle.']],
      [['Akdamar’a geçiş sizin için ne ifade ediyor?', 'What does the crossing to Akdamar mean to you?'], ['Bir selam. Ada benden uzun yaşayacak, ben ona dalgayla yol açıyorum. Her yolcu bir gün ona dönüp bakar; ben de o bakışı taşırım.', 'A greeting. The island will outlive me, and I clear its road with waves. Every passenger looks back at it one day; I carry that look.']],
    ],
    [['Kayıkçının Defteri', 'The Boatman’s Page'], ['Dalgayı saymak, ona saygıdır. Defterine yaz: üçüncü dalgaya hazırlıklı ol; hayat da böyle, küçüklerle uyarır, büyükle sınar. Van Gölü’nde sabırlı olan karaya varır.', 'To count waves is to respect them. Write it: be ready for the third wave; life is like that, warns with small ones, tests with the big. On Lake Van the patient reach shore.']],
  ),
  'Oltu Taşı Ustası Abdurrahman': talk(
    ['Hoş geldin evladım, ellerini avucuma koy. Oltu taşı sıcağı sever; ısıtırsan sana konuşur.', 'Welcome, child, put your hands in my palm. Oltu stone loves warmth; warm it and it speaks to you.'],
    [
      [['Oltu taşı nasıl işlenir?', 'How is Oltu stone worked?'], ['Yerden yumuşak çıkar, havayı görünce sertleşir. İşlerken yağ gibi kayar, sonra bir cila ve ışık. Her taş kendine has bir damar taşır.', 'It comes out soft, hardens on meeting air. Worked it slides like butter, then a polish and light. Every stone carries a vein of its own.']],
      [['Taşlar tezgâhtan hep yuvarlanıyor mu?', 'Do stones always roll off the stall?'], ['Taş yuvarlanmaz, kaçar! Gözümü çevirdim mi bir tanesi cep arar. Bir yolcuya hediye olmak istiyorlar, aklım onlarda.', 'A stone does not roll, it flees! Turn my eyes and one is looking for a pocket. They want to be a traveller’s gift, I think so.']],
      [['Erzurum’un kışına dayanmak zor mu?', 'Is it hard to endure Erzurum’s winter?'], ['Soğuk, kemiğe işler ama yüreği ısıtır. Kış uzun, sohbet uzun, çay uzun. Soğuğa dayanmak insana şükretmeyi öğretir.', 'The cold seeps to the bone but warms the heart. Winter is long, talk is long, tea is long. Enduring the cold teaches a person gratitude.']],
    ],
    [['Taşçının Defteri', 'The Stone Master’s Page'], ['Taş sabrı sever: acele ederseniz çatlar, bekleyin parlar. Defterine yaz: elinde bir uğur taşı taşıyan, içinde bir sakinlik de taşır. Erzurum’un taşı ve insanı sertten yumuşar.', 'Stone loves patience: hurry and it cracks, wait and it shines. Write it: whoever carries a lucky stone carries calm within too. Erzurum’s stone and people soften from hardness.']],
  ),
  'Ciritçi Yavuz': talk(
    ['Selam kardeş! At ayağını bilir, sen ise gözünü; cirit gözün sesidir.', 'Hello, brother! The horse knows its feet, you know your eyes; cirit is the voice of the eye.'],
    [
      [['Cirit nasıl oynanır?', 'How is cirit played?'], ['İki takım atla karşılaşır, değnek fırlatılır, rakip eğilir ya da kaçar. Hız, öngörü ve incelik gerektirir. Kazanmak, vurmak değil, vurulmamaktır.', 'Two teams meet on horseback, a stick is thrown, the opponent ducks or dodges. It needs speed, foresight and finesse. Winning is not hitting but not being hit.']],
      [['Atın canı yanmaz mı, korkmuyor mu?', 'Does the horse not feel pain or fear?'], ['At bizden akıllı! Değneği daha önce görür, ben ise sonradan anlarım. Bir keresinde atım benim yerime eğildi, ben düştüm; at güldü, hiç unutmam.', 'The horse is smarter than us! It sees the stick first, I realise after. Once my horse ducked in my place and I fell; the horse laughed, I will never forget.']],
      [['Bu gelenek sizin için ne anlama geliyor?', 'What does this tradition mean to you?'], ['Atalarımızın bize armağanı. Her sezon bir şölen, her atış bir saygı. Cirit oynayan, geçmişle tokalaşır.', 'Our ancestors’ gift to us. Every season a feast, every throw a respect. Whoever plays cirit shakes hands with the past.']],
    ],
    [['Ciritçinin Defteri', 'The Cirit Player’s Page'], ['Hızını erken ayarla, son anda dönemezsin. Defterine yaz: yol uzunsa temposunu baştan seç; hayatta da buzda da aynı. Erzurum’da atlı, önce atını dinler.', 'Set your speed early, at the last moment you cannot turn. Write it: if the road is long choose your tempo from the start; in life as on ice. In Erzurum a rider first listens to his horse.']],
  ),
  'Kızakçı Erdal Amca': talk(
    ['Hoş geldin! Göl donunca kızak tıngır tıngır gider; sen sakin ol, at nasılsa yolu bilir.', 'Welcome! When the lake freezes the sleigh runs jingling; stay calm, the horse knows the way.'],
    [
      [['Atlı kızak nasıl yapılır?', 'How is a horse sleigh made?'], ['Tahtadan kayak, demirden kaplama, üstünde bir oturak. Zil tak, battaniye ser; kızak yolcunun kalbine hizmet eder.', 'A wooden runner, iron plating, a seat on top. Add bells, spread a blanket; the sleigh serves the traveller’s heart.']],
      [['Buzun üzerinde at kayıyor mu?', 'Does the horse slip on the ice?'], ['Kayıyor! Ama at inatçıdır, kaymayı öğrenince gülümsüyor. Bir kış kızağı ters çevirmişim, at bir bana bir kızağa baktı, haklı da.', 'It slips! But horses are stubborn, and once they learn to slide they smile. One winter I overturned the sleigh, the horse looked at me, then at the sleigh, and was right.']],
      [['Bu soğukta çalışmak ağır olmuyor mu?', 'Is working in this cold not heavy?'], ['Soğuk ağır ama bakışlar sıcak. Yolcu gülünce üşüdüğümü unutuyorum; yüz çay içsem de yetmez, bir yolcunun gülüşü yeter.', 'The cold is heavy but the looks are warm. When a traveller smiles I forget I am chilled; a hundred teas would not do it, one traveller’s smile does.']],
    ],
    [['Kızakçının Defteri', 'The Sleigh Driver’s Page'], ['Buzu çatlatan ses, bazen şarkı olur. Defterine yaz: durma, hızını koru, buz seni bekler ama sonsuza dek beklemez. Ardahan’da yolculuk ritimle yürür.', 'The sound that cracks the ice sometimes becomes a song. Write it: do not stop, keep your pace, the ice waits for you but not forever. In Ardahan a journey moves in rhythm.']],
  ),
  'Buz Balıkçısı Sabri': talk(
    ['Hoş geldin yolcu! Sessiz ol, balık kulağı çok hassas; ama selamın bir zararı yok.', 'Welcome, traveller! Be quiet, fish are sensitive of hearing; but a greeting does no harm.'],
    [
      [['Buzun altından balık nasıl tutulur?', 'How do you catch fish under the ice?'], ['Önce buz delinir, sonra ağ sallanır, bir de sabır. Balık gelmezse çay içersin; gelirse bütün gün çay içersin, çünkü sevinirsin.', 'First the ice is drilled, then the net is let down, then patience. If no fish come you drink tea; if they do you drink tea all day, from joy.']],
      [['Buz çatlarsa ne yaparsın?', 'What do you do if the ice cracks?'], ['İlk yıl çığlık attım, ikinci yıl koştum, şimdi “merhaba, nerelisin” diyorum. Aslında bunu söylemiyorum ama düşünüyorum.', 'The first year I screamed, the second I ran, now I say “hello, where are you from.” Actually I do not say it, but I think it.']],
      [['Bu göl size ne veriyor?', 'What does this lake give you?'], ['Hem ekmek hem sükûnet. Kış başı sessiz, kış ortası ağır, kış sonu müjde. Göl benim terbiyecimdir.', 'Both bread and quiet. Early winter hushed, mid-winter heavy, late winter good tidings. The lake is my teacher.']],
    ],
    [['Balıkçının Defteri', 'The Fisherman’s Page'], ['Dinlemek, sessizliği tanımaktır. Defterine yaz: bazen en iyi cevap beklemek, bazen sadece orada olmak. Ardahan’da sabır buzdur: dayanırsa taşır, acele ederse çatlar.', 'To listen is to know silence. Write it: sometimes the best answer is waiting, sometimes only being there. In Ardahan patience is ice: if it holds, it carries; if hurried, it cracks.']],
  ),
  'Elmacı Bedriye Teyze': talk(
    ['Gel yavrum, bir elma al! Amasya’da elma yenmez, bir hatıra gibi saklanır, sonra yenir.', 'Come, dear, take an apple! In Amasya an apple is not just eaten, it is kept like a memory and then eaten.'],
    [
      [['Misket elması neden bu kadar kokulu?', 'Why is the Misket apple so fragrant?'], ['Küçüktür ama sıkıdır; dalında güneşi, gecede serinliği içer. Kokusu odanın tavanına çıkar, bütün evi kaplar. Küçük şey büyük iz bırakır.', 'Small but firm; it drinks sun by day and cool by night on its branch. Its scent climbs to the ceiling, fills the whole house. A small thing leaves a large mark.']],
      [['Elma sepetinden üç tane kaçtı demişsin, nereye gittiler?', 'You said three apples escaped the basket, where did they go?'], ['Biri damlara tırmanmış, biri nehre bakıyor, biri bir kediyle oynuyor. Elmalar benden daha hareketli, yaşlandıkça yavaşladım.', 'One climbed to the roofs, one is watching the river, one is playing with a cat. The apples are livelier than I, I have slowed with age.']],
      [['Bu bahçeyi nasıl koruyorsunuz?', 'How do you look after this orchard?'], ['Ağaçlara adlarıyla seslenirim, tıpkı çocuklara gibi. İyi söz iyi meyve verir; kızarsan meyve ekşir, küserse dökülür.', 'I call the trees by name, just like children. Good words give good fruit; scold and the fruit sours, sulk and it falls.']],
    ],
    [['Elmacının Defteri', 'The Apple Seller’s Page'], ['Her ağacın bir dili var. Defterine yaz: dinleyen ve bekleyen toplar; koparan, ezmiş olur. Amasya’da elma bir meyve değil, bir selamdır; kimseye eli boş bakılmaz.', 'Every tree has a tongue. Write it: those who listen and wait gather; those who snatch bruise. In Amasya an apple is not a fruit but a greeting; no one is looked at empty-handed.']],
  ),
  'Rehber Tolga': talk(
    ['Hoş geldiniz! Kaya mezarlarına bakmadan Amasya’yı bitirmiş sayılmazsınız; yukarı bakın, ben de size anlatayım.', 'Welcome! You cannot finish Amasya without seeing the rock tombs; look up and I will tell you.'],
    [
      [['Bu mezarlar nasıl oyulmuş?', 'How were these tombs carved?'], ['Kaya yüzü yontulmuş, basamaklar, odalar ve cepheler açılmış; hepsi elle. Bir mezarın tamamlanması yıllar almıştır. Kral olmak, sabırlı usta kiralamaktır.', 'The rock face was carved, steps, chambers and façades opened; all by hand. Finishing one tomb took years. To be king is to hire a patient craftsman.']],
      [['Tırmanırken hiç korktunuz mu?', 'Did you ever feel afraid while climbing?'], ['İlk gün korktum, ikinci gün şakalaştım, üçüncü gün bir turist beni aşağı çekip “ben çıktım siz çıkmadınız” dedi. Artık kimseyi yargılamıyorum.', 'The first day I was afraid, the second I joked, the third a tourist pulled me down saying “I climbed, you did not.” Now I judge no one.']],
      [['Amasya’yı bir cümleyle anlatsanız?', 'If you described Amasya in one sentence?'], ['Nehir, taş ve elma bir araya gelmiş bir hikâye. Şehir akar gibi, kaya durur gibi; ikisi de aynı anda gerçek.', 'A story where river, stone and apple met. The city seems to flow, the rock seems to stand; both true at once.']],
    ],
    [['Rehberin Defteri', 'The Guide’s Page'], ['Yukarı bakmak, bir yere saygıyı bir göz hareketiyle söylemektir. Defterine yaz: bazı yerler, aşağıdan bakınca daha çok şey anlatır. Kayanın sağ yüzündeki karanlığı unutma; merak, haritanın bir parçasıdır.', 'To look up is to speak respect to a place with a movement of the eye. Write it: some places say more when seen from below. Do not forget the darkness on the rock’s right side; curiosity is part of the map.']],
  ),
  'Süngerci Hayri Kaptan': talk(
    ['Hoş geldin evlat! Deniz bir kitap, sünger de bir sayfası; bak, okumak istersen sana anlatırım.', 'Welcome, child! The sea is a book and the sponge a page; if you wish to read, I will tell you.'],
    [
      [['Süngerciler nefeslerini nasıl tutardı?', 'How did the sponge divers hold their breath?'], ['Önce derin bir nefes, sonra sakin bir zihin. Telaşlanan çabuk biter; sakin olan dipte uzun kalır. Denizin sırrı sakinliktir.', 'First a deep breath, then a calm mind. The anxious ends quickly; the calm stays long on the bottom. The sea’s secret is calm.']],
      [['Sünger gerçekten hayvan mı?', 'Is a sponge really an animal?'], ['Öyle derler! Ama ben bir sünger gördüm, bütün gün hiç kıpırdamadı, bir de bana bakmadı. Bence çok sakin bir arkadaş.', 'So they say! But I once saw a sponge that never moved all day, and never looked at me either. A very calm friend, I think.']],
      [['Bu mesleği bırakmak nasıl bir duygu?', 'What is it like to give up this trade?'], ['Bırakmak değil, bir başkasına devretmek. Denizi sevmeyi bıraktığımda ölürüm; ellerim bırakır ama gözüm hep dipte kalır.', 'Not giving up but handing over. I will die when I stop loving the sea; my hands let go but my eyes stay on the bottom.']],
    ],
    [['Süngercinin Defteri', 'The Sponge Diver’s Page'], ['Süngerin gücü suyu çekip bırakmamak, ama sıkılınca vermesidir. İnsan da böyle olmalı evlat: öğrenir, biriktirir, gerektiğinde paylaşır. Defterine yaz.', 'A sponge’s strength is to absorb water and not let go, yet to give it up when squeezed. A person should be so, child: learn, store, share when needed. Write it in your book.']],
  ),
  'Değirmenci Naciye Teyze': talk(
    ['Hoş geldin yavrum! Rüzgâr arkana gelsin, kanatlar dönsün; değirmen de bizim gibi esintiyi bekler.', 'Welcome, dear! May the wind come behind you, may the sails turn; a mill, like us, waits for the breeze.'],
    [
      [['Yel değirmeni nasıl çalışır?', 'How does a windmill work?'], ['Kanatlar rüzgârı yakalar, mili döndürür, taş buğdayı öğütür. Rüzgâr ne kadar güçlü olsa da bir değirmenci onun huyunu bilirse işi kolay biter.', 'The sails catch the wind, turn the shaft, the stone grinds the wheat. However strong the wind, if the miller knows its habits the work is easy.']],
      [['Rüzgâr hiç esmezse ne yapıyorsun?', 'What do you do if the wind never blows?'], ['Oturur, çay içer, kendi kendime şarkı söylerim. Rüzgâr da meraklıdır, şarkıyı duyunca gelir. Bir keresinde bir kedi geldi, rüzgâr yerine o yetti.', 'I sit, drink tea and sing to myself. The wind is curious too, and comes when it hears the song. Once a cat came, and sufficed instead of wind.']],
      [['Bu değirmenler sizin için ne ifade ediyor?', 'What do these mills mean to you?'], ['Geçmişten bugüne uzanan bir el. Ekmeğin başlangıcı, ailemin hikâyesi. Taşı döndüren rüzgâr, hepimizi çalıştıran sevgiyle aynı.', 'A hand reaching from past to present. The beginning of bread, my family’s story. The wind that turns the stone is the same as the love that keeps us working.']],
    ],
    [['Değirmencinin Defteri', 'The Miller’s Page'], ['Rüzgârı arkana alınca atlayış uzar, karşıdan gelince kısalır. Hayatta da böyle: akışa uy, ama yönünü sen seç. Defterine yaz; Muğla’da denizle rüzgâr bir arada dans eder.', 'With the wind behind, your leap lengthens, from the front it shortens. Life is the same: follow the flow but choose your direction. Write it; in Muğla sea and wind dance together.']],
  ),
  'Ozan Korkut Dede': talk(
    ['Hoş geldin evlat! Gel otur, kopuzu elime alayım; dinleyene söz, dinlemeyene rüzgâr yeter.', 'Welcome, child! Come sit, I will take up the kopuz; for the listener words, for the one who does not listen the wind suffices.'],
    [
      [['Dede Korkut kimdir?', 'Who is Dede Korkut?'], ['Boylarda öğüt veren, hikâyeleri bilen bilge. “Söz ola kese savaşı” derdi; yani doğru söz kılıçtan keskin ama iyiliğe keser.', 'The wise one who gives counsel in the tales. He used to say that a word can cut off war; a true word is sharper than a sword but cuts toward good.']],
      [['Kopuzun teli koptu mu hiç?', 'Did the kopuz string ever snap?'], ['Bir keresinde düğünde koptu, ben de şarkıyı ağzımla çaldım! Düğün sahibi “bu daha güzel” dedi. Bazen kopan tel, ezgiyi sese çevirir.', 'Once at a wedding it snapped and I played the song with my mouth! The host said “this is better.” Sometimes a snapped string turns a tune into a voice.']],
      [['Bu hikâyeleri yaşatmak sizin için ne ifade ediyor?', 'What does keeping these tales alive mean to you?'], ['Bir ulusun hafızasını taşımak. Her hikâye bir ata sesi, her destan bir kök. Anlatmaya devam eden, ağacı sulayan gibidir.', 'Carrying a nation’s memory. Each tale an ancestor’s voice, each epic a root. One who keeps telling is like one who waters the tree.']],
    ],
    [['Ozanın Defteri', 'The Bard’s Page'], ['Söz doğru yerde söylenirse bir ömür taşır. Defterine yaz: dinleyen, anlatandan çok şey katar. Bayburt’ta rüzgâr, anlatılan her sözü bir dağdan ötekine ulaştırır.', 'A word spoken in the right place lasts a lifetime. Write it: the listener adds more than the teller. In Bayburt the wind carries every spoken word from one mountain to the next.']],
  ),
  'Salcı Rüstem': talk(
    ['Hoş geldin! Çoruh bugün sakin ama sakinlik aldatır; sal ancak bilene yol verir.', 'Welcome! The Çoruh is calm today but calm deceives; the raft yields only to one who knows.'],
    [
      [['Sal nasıl yapılır, nasıl yönlendirilir?', 'How is a raft built, how is it steered?'], ['Kütükler bir araya bağlanır, kürek ve ip ile yönlendirilir. Nehir yönü seçer, ben sadece kayarken küçük düzeltmeler yaparım.', 'Logs are lashed together, steered by oar and rope. The river chooses the direction, I only make small corrections while gliding.']],
      [['Hiç suya düştüğün oldu mu?', 'Ever fall in the water?'], ['Her gün! Salcı düşmezse salcı olmaz. Ama düşünce “hoş geldin” diyerek çıkıyorum, nehir ders veriyor, ben ödevimi yapıyorum.', 'Every day! A raftsman who never falls is no raftsman. But I climb out saying “welcome back”, the river gives lessons, I do my homework.']],
      [['Çoruh sizin için ne ifade ediyor?', 'What does the Çoruh mean to you?'], ['Hayat arkadaşım. Hırçın ama adil; ona saygı gösterene yol verir. Yola çıkan herkes ondan bir şey öğrenir: sabır ve alçakgönüllülük.', 'My life companion. Fierce but fair; it yields to whoever respects it. Everyone who sets out learns something from it: patience and humility.']],
    ],
    [['Salcının Defteri', 'The Raftsman’s Page'], ['Rüzgâra eğilen düşmez; eğilmek yenilmek değil, hesap yapmaktır. Defterine yaz: karşı çıkmak bazen akılsızlık, bazen cesaret; farkı bilmek ustalıktır. Bayburt’ta herkes nehri sever ama kimse ona güvenmez.', 'One who leans into the wind does not fall; leaning is not defeat but calculation. Write it: resisting is sometimes folly, sometimes courage; knowing the difference is mastery. In Bayburt everyone loves the river but no one trusts it blindly.']],
  ),
}
