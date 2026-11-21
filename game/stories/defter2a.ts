import { talk, type Talk } from './types'

/** İkinci defter, ilk yarı: Rize, Artvin, Kars, Bitlis, Ağrı, Giresun */
export const DEFTER2A: Record<string, Talk> = {
  'Çaycı Hamdi Amca': talk(
    ['Hoş geldun evlat! Çay kaynayan suyla değil, dinlenmiş suyla demlenir; sen de yorgunsan otur dinlen.', 'Welcome, child! Tea is brewed not with boiling water but with rested water; if you are tired, sit and rest.'],
    [
      [['Çay neden ince belli bardakta içilir?', 'Why is tea drunk from a slim-waisted glass?'], ['Rengi görünsün, sıcaklığı parmağa vursun diye. Tavşan kanı dediğimiz kızıllık ancak ince bardakta konuşur. Çay önce göze, sonra dile hitap eder.', 'So the colour shows and the heat touches the finger. The redness we call rabbit’s blood speaks only in a slim glass. Tea appeals first to the eye, then to the tongue.']],
      [['Kaç bardak içiyorsun bir günde?', 'How many glasses do you drink in a day?'], ['Saymak ayıp! Ama bir keresinde bardağı doldururken uyuyakalmışım, çay taşmış, bardak da sinirlenmiş. O günden beri ben saymıyorum, bardak sayıyor.', 'Counting is rude! But once I fell asleep while filling, the tea overflowed and the glass got cross. Since then I do not count, the glass does.']],
      [['Yağmurlu havada çay içmek neden bu kadar güzel?', 'Why is tea so lovely in rainy weather?'], ['Dışarısı ıslak olunca içerisi sıcak kıymet bulur. Rize’de yağmur bir düşman değil, bir hocadır; sabır ve şükür öğretir.', 'When outside is wet, the warmth within gains worth. In Rize rain is not an enemy but a teacher; it teaches patience and thanks.']],
    ],
    [['Çaycının Defteri', 'The Tea Maker’s Page'], ['Üç yaprak, yağmur ve zaman; çayın bütün sırrı bu. Defterine yaz: iyi bir şeyi beklemek, onu iki kere sevmektir. Rize’de çay bir içecek değil, bir buluşma bahanesidir.', 'Three leaves, rain and time; that is all of tea’s secret. Write it: to wait for a good thing is to love it twice. In Rize tea is not a drink but a pretext for meeting.']],
  ),
  'Çay Toplayıcısı Nazmiye Teyze': talk(
    ['Selam yavrum, küfem ağır ama kalbim hafif! Sen yamaçta dikkatli yürü, yağmur taşı kaygan eder.', 'Hello dear, my basket is heavy but my heart is light! Walk carefully on the slope, rain makes stones slippery.'],
    [
      [['Çay yaprağı nasıl toplanır?', 'How are tea leaves picked?'], ['İki yaprak bir tomurcuk; fazlası acı, azı tatsız. Parmak ucu bir hesapçıdır, gözü çabuk, eli hafif. İlk yıl hep fazla koparırdım, çay da bana küserdi.', 'Two leaves and a bud; more is bitter, less is tasteless. The fingertip is a reckoner, eye quick, hand light. My first year I always picked too much and the tea sulked.']],
      [['Sırtındaki küfe seni hiç yere devirmedi mi?', 'Has the basket on your back never knocked you over?'], ['Bir kere dereye uçtum, küfe önde ben arkada! Çay yaprakları suda yüzdü, ben de arkalarından “durun, durun” diye koştum.', 'Once I flew into the stream, basket in front, me behind! The tea leaves floated and I ran after them crying “stop, stop.”']],
      [['Yağmur dinmeyince yorulmuyor musun?', 'When the rain never stops, do you not tire?'], ['Yağmur bizim işçimiz; çayı o büyütür. Yorulmak, çalışanın hakkıdır. Akşam eve gelince çorba kaynıyorsa bütün yorgunluk unutulur.', 'The rain is our labourer; it grows the tea. Tiredness is a worker’s right. When I come home and soup is simmering, all weariness is forgotten.']],
    ],
    [['Teyzenin Defteri', 'The Teyze’s Page'], ['Zor iş, birlikte yapılınca yarıya iner. Yamaçta sırt sırta çalışırız. Defterine yaz: yoldaş, yükün yarısıdır. Rize’de herkes birbirinin küfesine bir yaprak koyar.', 'Hard work halves when done together. On the slope we work back to back. Write it: a companion is half the load. In Rize everyone puts a leaf into each other’s basket.']],
  ),
  'Arıcı İsmet Amca': talk(
    ['Gel evlat, yavaş ol; arılar hızlı hareketi sevmez. Burada insan da arı gibi uyumlu çalışmalı.', 'Come, child, slow down; bees dislike quick movement. Here people too must work in harmony, like bees.'],
    [
      [['Macahel balının sırrı nedir?', 'What is the secret of Macahel honey?'], ['Dağ çiçekleri, temiz hava ve el değmemiş yamaçlar. Arı en güzel çiçeği bulur, biz sadece kovanı yerinde tutarız. Bal, bir bölgenin yazılmış tadıdır.', 'Mountain flowers, clean air and untouched slopes. The bee finds the finest blossom, we only keep the hive in place. Honey is a region’s taste written down.']],
      [['Arılar seni hiç sokmuyor mu?', 'Do the bees never sting you?'], ['Sokuyor ama zarif sokuyor! Her sokuşta bir ders veriyorlar: “yavaş ol, nazik ol.” Kırk yıllık öğrenci hâlâ çalışıyor.', 'They sting, but elegantly! With each sting a lesson: “be slow, be gentle.” A forty-year pupil is still studying.']],
      [['Kovan nasıl bu kadar düzenli çalışıyor?', 'How does a hive work so orderly?'], ['Herkes görevini bilir, kimse kimsenin işini küçük görmez. Bir kovan, küçük bir ülke; ve en iyi hükümet, sessizliktir.', 'Everyone knows their duty, none belittles another’s work. A hive is a small nation; and the best government is silence.']],
    ],
    [['Arıcının Defteri', 'The Beekeeper’s Page'], ['Bal bir günde olmaz, bir yılda da; bir ömürde olur. Defterine yaz: küçük işler birleşince büyük tat verir. Artvin’de bir kovan, bir köyün yürek atışıdır.', 'Honey is not made in a day, nor a year; it is made in a lifetime. Write it: small deeds, joined, give great taste. In Artvin a hive is a village’s heartbeat.']],
  ),
  'Yaylacı Nazife Teyze': talk(
    ['Hoş geldin yavrum! Yayla havası ciğere iyi gelir, ama sen önce bir ayran iç; ben getirdim, soğuk.', 'Welcome dear! Highland air is good for the lungs, but first drink an ayran; I brought it, it is cold.'],
    [
      [['Yaylaya çıkış nasıl olur?', 'How does the move to the highlands go?'], ['Bütün aile, hayvanlar, çaydanlık, hatta kedi. Yola sabah çıkarız, akşama varırız. Dağda yol yoktur, ayak vardır; ayağını sevmeyen yaylacı olamaz.', 'The whole family, animals, kettle, even the cat. We set out in the morning, arrive at evening. In the mountains there is no road, only feet; one who does not love their feet cannot be a highlander.']],
      [['Karabaş gerçekten üç boğayı yendi mi?', 'Did Karabaş really beat three bulls?'], ['Hepsini yenmedi, ikisini yendi, üçüncüsü çekilmişti. Ama ben anlatırken hep üç oluyor. Anlatmak, bir tür tatlandırmadır.', 'He did not beat them all, he beat two, the third withdrew. But when I tell it, it is always three. Telling is a kind of sweetening.']],
      [['Yayla sizin için ne ifade ediyor?', 'What does the highland mean to you?'], ['Özgürlük. Bulut yanımda yürür, yıldız çadırıma bakar. Ovada insan telaşla yaşar, yaylada yaşadığını hisseder.', 'Freedom. Clouds walk beside me, stars peer into my tent. In the lowlands people live in haste, in the highlands they feel alive.']],
    ],
    [['Yaylacının Defteri', 'The Highlander’s Page'], ['Dağ, ona saygı gösterene yol açar. Defterine yaz: yükünü hafifletmek için bazen yükselmek gerek. Artvin’de bulut bile komşudur; kapıya uğrar, selam verir.', 'The mountain opens the road to whoever respects it. Write it: to lighten a load you sometimes must rise. In Artvin even clouds are neighbours; they call at the door and say hello.']],
  ),
  'Peynirci Adem Usta': talk(
    ['Hoş geldin evlat! Gravyer sabırla olgunlaşır; benim tezgâhımda zaman her tekerleğe biraz tat bırakır.', 'Welcome, child! Gruyère ripens with patience; at my stall time leaves a little flavour in every wheel.'],
    [
      [['Gravyer neden mağarada bekletilir?', 'Why is gruyère aged in a cave?'], ['Serin, sabit, sessiz bir yer ister. Tekerlek her gün çevrilir, tuzlanır, dinlenir. Peynir de insan gibi: sakin ortamda olgunlaşır.', 'It wants a cool, steady, quiet place. The wheel is turned daily, salted, rested. Cheese, like a person, ripens in a calm setting.']],
      [['Kar üstüne düşen peynir dilimini yersen ne olur?', 'What if I eat the cheese slice that fell on the snow?'], ['Soğuk peynir, soğuk dostluk; ama kar peyniri kötü etmez. Yalnız ayaklarını yaşlandırır, çünkü peşinden koşarsın.', 'Cold cheese, cold friendship; but snow does not spoil cheese. It only ages your feet, because you run after it.']],
      [['Kars’ın peyniri size ne ifade ediyor?', 'What does Kars’s cheese mean to you?'], ['Yaşamın kendisi. Sabah, süt; akşam, peynir; kışın, bir sofra. Bir peynirin ardında yüz inek ve yirmi çoban var; hepsine saygım var.', 'Life itself. Morning, milk; evening, cheese; winter, a table. Behind a cheese stand a hundred cows and twenty shepherds; I respect them all.']],
    ],
    [['Peynircinin Defteri', 'The Cheesemaker’s Page'], ['Sabrı mağaraya koy, sonra tadını beklet. Defterine yaz: ne kadar olgunlaşırsan o kadar tat verirsin. Kars’ta kış da bir ustadır; sabırlıya hep bir ödül bırakır.', 'Put patience in the cave, then let the taste wait. Write it: the more you ripen the more flavour you give. In Kars winter too is a master; it always leaves a reward for the patient.']],
  ),
  'Kayakçı Melek': talk(
    ['Selam! Karın sesini dinle: gıcırdarsa soğuk, fısıldarsa yumuşak. Sen hangi sesi bekliyorsun?', 'Hi! Listen to the snow: if it creaks it is cold, if it whispers it is soft. Which sound are you waiting for?'],
    [
      [['Sarıkamış’ta kayak neden bu kadar özel?', 'Why is skiing in Sarıkamış so special?'], ['Kar toz gibi hafif; ormanlar sessiz, dağ uzun. Kayarken bir şey olmak istemezsin, sadece kayarsın. Dünya bir şiir olur.', 'The snow is light as powder; the forests are quiet, the mountain long. Skiing, you do not wish to be anything, only to glide. The world becomes a poem.']],
      [['Hiç kafa üstü düştün mü?', 'Ever fall head first?'], ['Ah! Bir kere ağaca doğru kaydım, ağaç çekildi dedim ama çekilmedi. Bir de kardan adam yapılmış gibi görünüyordum; kayak hocam bunu fotoğrafladı.', 'Oh! Once I slid toward a tree, I told it to move but it did not. I looked like a snowman; my instructor photographed it.']],
      [['Kayak size ne öğretti?', 'What did skiing teach you?'], ['Denge ve sabır. Hızlanmadan önce yavaşlamayı, düşünce kalkmayı. Kayan, düşmeyi de öğrenmeli; düşmeyi bilen çabuk kalkar.', 'Balance and patience. To slow before speeding, to rise after falling. A skier must learn to fall too; one who knows how to fall rises fast.']],
    ],
    [['Kayakçının Defteri', 'The Skier’s Page'], ['Buzda fren yoktur, kenara gelmeden yavaşla. Defterine yaz: hızlı gitmek değil, doğru yerde yavaşlamak ustalık. Kars’ta kış bir engel değil, bir davettir.', 'There is no brake on ice, slow before the edge. Write it: not going fast but slowing at the right place is mastery. In Kars winter is not an obstacle but an invitation.']],
  ),
  'Büryancı Ferit Usta': talk(
    ['Hoş geldin evlat! Büryan kuyunun derinliğinde yavaş pişer; sen de aceleden uzak dur.', 'Welcome, child! Büryan cooks slowly in the depth of the pit; keep away from haste yourself.'],
    [
      [['Büryan nasıl pişer?', 'How does büryan cook?'], ['Kuzu, kuyuya asılır, odun ateşiyle saatlerce ağır ağır pişer. Et kemikten kendiliğinden ayrılır; lezzet, beklemenin ödülüdür.', 'The lamb hangs in the pit and cooks for hours over wood fire. The meat parts from the bone by itself; flavour is the reward of waiting.']],
      [['Rüzgâr tabağı kaleye uçurdu demişsin, gerçekten mi?', 'You said the wind blew a plate to the castle, really?'], ['Tabak uçmadı, ben kızdım da kaleye bakarak bağırdım! Bir de ondan sonra bir martı gördüm; kuş tabağı sandı, ben de kuşu.', 'The plate did not fly, I got angry and shouted at the castle! Then I saw a gull; the bird thought it a plate, and I thought it a plate thief.']],
      [['Bitlis’in mutfağı size ne anlatıyor?', 'What does Bitlis’s cuisine tell you?'], ['Soğuk dağların ısıttığı bir kültür. Sofra ağır, kapı geniş, kalp açık. Yemek, burada sevgiyi söylemenin yoludur.', 'A culture warmed by cold mountains. Heavy table, wide door, open heart. Here food is a way of saying love.']],
    ],
    [['Büryancının Defteri', 'The Büryan Cook’s Page'], ['Ağır ateşte pişen şey, ağırbaşlı olur. Defterine yaz: bir şeyi sevdiğin kadar beklemeyi de sev. Bitlis’te misafir, ev sahibinin en kıymetli tabağıdır.', 'What cooks on slow fire becomes dignified. Write it: love waiting as much as the thing you love. In Bitlis a guest is the host’s most precious dish.']],
  ),
  'Taş Ustası Celal Amca': talk(
    ['Hoş geldin evlat! Ahlat taşı yumuşak görünür ama zamana meydan okur; sen de ona dokun, tanış.', 'Welcome, child! Ahlat stone looks soft but defies time; touch it, make its acquaintance.'],
    [
      [['Ahlat taşı neden bu kadar işlenebilir?', 'Why is Ahlat stone so workable?'], ['Volkanik, gözenekli; ocaktan çıkarken yumuşaktır, havayla sertleşir. Selçuklu ustaları dantel gibi işlemiş, taş sanki kumaş.', 'Volcanic and porous; soft when quarried, hardening in air. Seljuk masters worked it like lace, as if the stone were cloth.']],
      [['Taşa kızınca ne yapıyorsun?', 'What do you do when you get cross with the stone?'], ['Çay içerim, geri dönerim; taş hâlâ orada, ben hâlâ kızgın. Sonra birbirimize bakıp gülümseriz, çünkü ikimiz de sabırlıyız.', 'I drink tea and come back; the stone is still there, I am still cross. Then we look at each other and smile, since we are both patient.']],
      [['Mezar taşlarının işlemesini anlatır mısınız?', 'Would you tell me about the carving on the tombstones?'], ['Her biri bir ağaç, bir yıldız, bir dua. Taşta yazı değil, saygı işlenmiş. Ahlat’ta ölüler bile süslü yaşar.', 'Each is a tree, a star, a prayer. Not writing but respect carved in stone. In Ahlat even the dead live adorned.']],
    ],
    [['Taşçının Defteri', 'The Stonemason’s Page'], ['Yumuşak taş, sert yıllara dayanır. Defterine yaz: sertlik değil, uyum dayanıklılık verir. Bitlis’te taştan taşa atlayan, ayağının altındakine güvenmeyi öğrenir.', 'Soft stone endures hard years. Write it: not hardness but harmony gives endurance. In Bitlis whoever leaps from stone to stone learns to trust what is underfoot.']],
  ),
  'Halıcı Zozan Teyze': talk(
    ['Selam yavrum, otur! Ilmeğin sesi sabrın sesidir; dinle, bir şey öğreneceksin.', 'Hello dear, sit! The sound of a knot is the sound of patience; listen, you will learn something.'],
    [
      [['Kilimdeki desenler ne anlatır?', 'What do the patterns in a kilim tell?'], ['Her desen bir niyet: kuş, göz, su, ana. Dokuyan kadın dilini dokur; deseni okuyan onu anlar. Kilim, sözsüz bir mektuptur.', 'Every pattern is an intention: bird, eye, water, mother. The weaving woman weaves her tongue; whoever reads the pattern understands. A kilim is a wordless letter.']],
      [['Kilim rüzgârla uçup damda bulunmuş, nasıl olur?', 'The kilim flew off and was found on a roof, how?'], ['Rüzgâr sanat sever; belki bir halıcıya selam vermek istedi. Ya da çatıda bir kedi koltuk aradı. Her ikisi de mümkün, sen karar ver.', 'The wind loves art; perhaps it wanted to greet a weaver. Or a cat on the roof wanted a seat. Both possible, you decide.']],
      [['Bu zanaatı kızlarınıza öğretiyor musunuz?', 'Do you teach this craft to your daughters?'], ['Evet; önce izlerler, sonra ilk ilmeği atarlar. İlk ilmek hep yanlıştır; ama onu çözmemek, yanlışlarla barışmayı öğretir.', 'Yes; first they watch, then tie the first knot. The first knot is always wrong; but leaving it teaches peace with mistakes.']],
    ],
    [['Halıcının Defteri', 'The Weaver’s Page'], ['Kilim bir günde değil, mevsimde dokunur. Defterine yaz: ilmek ilmek yapılan iş en sağlam. Ağrı’da rüzgâr ne kadar sert eserse eser, iyi dokunmuş bir kilim yerinden kalkmaz.', 'A kilim is woven not in a day but in a season. Write it: work done knot by knot is the strongest. In Ağrı, however hard the wind blows, a well-woven kilim does not budge.']],
  ),
  'Kavalcı Bedirhan Amca': talk(
    ['Hoş geldin yavrum! Sürüyü yamaca çıkarırken kaval çalarım; sen de sesi duyarsan dur ve dinle.', 'Welcome, dear! I play the kaval while taking the flock up the slope; if you hear it, stop and listen.'],
    [
      [['Kaval nasıl çalınır?', 'How is the kaval played?'], ['Uzun bir boru, yedi delik, bir de nefes. Sert üflersen çığlık atar, yumuşak üflersen şarkı söyler. Ses, nefesin ahlakıdır.', 'A long pipe, seven holes, one breath. Blow hard and it screams, soft and it sings. Sound is the morality of breath.']],
      [['Koyunlar müzik zevkini beğeniyor mu?', 'Do the sheep like your taste in music?'], ['En çok kuzular! Kaval başlayınca etrafıma toplanıyorlar. Büyük koçlar ise bazen bağırıyor, ama bence şarkıya eşlik ediyorlar.', 'Most of all the lambs! When the kaval starts they gather around me. The big rams sometimes bellow, but I think they are joining the song.']],
      [['Dağ sizin için ne ifade ediyor?', 'What does the mountain mean to you?'], ['Hem öğretmen hem baba. Sert eser ama doğru eser; ona saygı gösterene yol açar. Sürüyle yürürken dağı çiğnemem, onunla yürürüm.', 'Both teacher and father. It blows hard but truly; it opens the way to whoever respects it. Walking with the flock I do not trample the mountain, I walk with it.']],
    ],
    [['Kavalcının Defteri', 'The Piper’s Page'], ['Rüzgârın sert estiği yerde ses, daha uzağa gider. Defterine yaz: zor ortam, ince bir ruhu keskinleştirir. Ağrı’da dağın rüzgârı atlayışı da, ezgiyi de uzatır; hesaba kat.', 'Where the wind blows hard, sound travels farther. Write it: a hard setting sharpens a fine spirit. In Ağrı the mountain wind lengthens both leap and tune; take it into account.']],
  ),
  'Kirazcı Nesrin Abla': talk(
    ['Gel gel, bir tane at ağzına! Giresun’da kiraz dalında yenir, sepete girince tadı değişir, bil bakalım neden?', 'Come, pop one in your mouth! In Giresun cherries are eaten on the branch; in the basket the taste changes, guess why?'],
    [
      [['Kiraz neden bu kadar çabuk bozulur?', 'Why does cherry spoil so quickly?'], ['Nazlıdır, ince kabuklu ve su dolu. Dalında yaşar, elden ele gidince kırılır. Acele edersen ezersin, usul gidersen ödüllendirir.', 'It is dainty, thin-skinned and full of water. It lives on the branch and bruises passing hand to hand. Hurry and you crush it, go gently and it rewards you.']],
      [['Tabaklar rüzgârla savrulduysa niye üzülmüyorsun?', 'If the plates were blown off by the wind, why are you not upset?'], ['Üzülüyorum ama kiraz gibi kısa sürüyor! Hem rüzgâr benden çok isteksiz; kaleye bir tane bırakmış, sanki bana “hâlâ buradayım” diyor.', 'I am upset but it is short-lived like cherries! And the wind is shy; it left one at the castle, as if saying “I am still here.”']],
      [['Kiraz mevsimi size ne anlatıyor?', 'What does cherry season tell you?'], ['Kısa ama tatlı olanın değerini. Bir ay süren bir bayram; bahçeler kırmızı, köylüler gülümser. Kısalık, güzelliği artırır.', 'The worth of what is short but sweet. A month-long festival; orchards red, villagers smiling. Brevity increases beauty.']],
    ],
    [['Kirazcının Defteri', 'The Cherry Seller’s Page'], ['Güzel şeyler çabuk geçer, bu yüzden dikkatle yaşa. Defterine yaz: her mevsimin bir tadı var, onu zamanında ye. Giresun’da kiraz da, an da dalından yenir.', 'Beautiful things pass quickly, so live them carefully. Write it: every season has a taste, eat it in time. In Giresun both cherries and moments are eaten from the branch.']],
  ),
  'Fındıkçı Mustafa Dayı': talk(
    ['Selam yolcu! Yamaç dik, bahçe yüksek; dikkat et, fındık gibi küçük bir şey de insanı düşürebilir.', 'Hello, traveller! The slope is steep, the grove high; take care, even something small as a hazelnut can make you slip.'],
    [
      [['Dik yamaçta fındık nasıl toplanır?', 'How are hazelnuts picked on a steep slope?'], ['Duvardan duvara tutunarak; bir ayak taşta, bir el dalda. Kuşaklardır böyle toplarız. Toprak dik, ama insan yeter, sabır da cebimizde.', 'Holding from wall to wall; one foot on a stone, one hand on a branch. We have picked so for generations. The soil is steep, but people suffice, and patience is in our pocket.']],
      [['Taş duvarın bir yeri sahteymiş, doğru mu?', 'Is a part of the stone wall fake, is that so?'], ['Ben bir şey demedim, yalnız taşların da kendi sırları olduğunu söylerim. Aklı olan bir yolcu, duvara dokunur, dokunan bir şey bulur.', 'I said nothing, I only say stones too have secrets. A wise traveller touches the wall and finds something that touches back.']],
      [['Bu bahçeler kaç yıllık?', 'How old are these groves?'], ['Dedemin dedesi de burada toplardı. Her ağaç bir şahit, her duvar bir kuşak. Bahçe büyüklerin hatırasıdır.', 'My grandfather’s grandfather picked here too. Every tree a witness, every wall a generation. The grove is the memory of elders.']],
    ],
    [['Fındıkçının Defteri', 'The Hazelnut Grower’s Page'], ['Merak, küçük kapıları açar. Defterine yaz: bir yerde bir şey sana tuhaf geliyorsa dokun, bak. Giresun’da duvar bile bir sır saklar; yalnız bilene söyler.', 'Curiosity opens small doors. Write it: if something strikes you as odd, touch it, look. In Giresun even a wall hides a secret; it tells only those who know to ask.']],
  ),
}
