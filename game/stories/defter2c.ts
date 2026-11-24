import { talk, type Talk } from './types'

/** İkinci defterin uzayan yolu: Balıkesir, Elazığ */
export const DEFTER2C: Record<string, Talk> = {
  'Höşmerimci Ekrem Usta': talk(
    ['Hoş geldin {rol}! Kazanı bırakamam, höşmerim dibini tutarsa küser. Bir kaşık tat, sonra konuşalım.', 'Welcome, {rol}! I cannot leave the pot; if the höşmerim catches on the bottom it sulks. Have a spoonful, then we talk.'],
    [
      [['Höşmerim neden bu kadar uzun karıştırılır?', 'Why is höşmerim stirred for so long?'], ['Peynir, irmik ve tereyağı birbirini tanısın diye. Kaşığı hep aynı yöne çeviririm; yön değiştiren tatlı, kararsız insan gibi topak topak olur.', 'So the cheese, semolina and butter get to know each other. I always turn the spoon the same way; a dessert that changes direction goes lumpy, like an undecided person.']],
      [['Kâseler kendi kendine mi uçtu?', 'Did the bowls fly off on their own?'], ['Ayvalık’ın taşı öğlen ısınır, sıcak hava yükselir; kâseleri pencereye koydum, gerisini rüzgâr halletti! Kuşlar da tatlıya meraklı, onlara da sor.', 'Ayvalık’s stone warms at noon and the hot air rises; I put the bowls on the windowsill and the wind did the rest! The birds have a sweet tooth too, ask them.']],
      [['Bu tarifi size kim öğretti?', 'Who taught you this recipe?'], ['Babamın kalfasından öğrendim; babam bana kaşığı tutmayı, kalfası sabretmeyi öğretti. Tarif kâğıtta değil, bilekte durur.', 'I learned it from my father’s journeyman; my father taught me to hold the spoon, his journeyman taught me patience. A recipe lives not on paper but in the wrist.']],
    ],
    [['Höşmerimcinin Defteri', 'The Höşmerim Maker’s Page'], ['Tatlıyı ateş değil sabır pişirir. Defterine yaz: aynı yöne, aynı hızla, bıkmadan. Balıkesir’de bir kâse höşmerim, bir öğleden sonranın emeğidir.', 'Patience, not fire, cooks a dessert. Write it: the same direction, the same pace, without tiring. In Balıkesir a bowl of höşmerim is an afternoon’s work.']],
  ),
  'Zeytinci Melahat Teyze': talk(
    ['Gel otur, gölge burada! Bu zeytinliği dedemin dedesi dikmiş; ağaçlar benden yaşlı, benden de sabırlı.', 'Come, sit, the shade is here! My grandfather’s grandfather planted this olive grove; the trees are older than me and more patient too.'],
    [
      [['Sıcak hava sahiden insanı taşır mı?', 'Can warm air really carry a person?'], ['Taşır! Taş güneşi içer, havaya verir, hava da göğe koşar. Kartal kanat çırpmaz, bu sütunlara biner. Sen de tüylerin uçuştuğu yere gir, gör.', 'It can! The stone drinks the sun and gives it to the air, and the air races to the sky. The eagle does not flap, it rides these columns. Step where the feathers drift and see.']],
      [['Zeytin mi daha yaşlı, sen mi?', 'Who is older, you or the olive?'], ['Bu ağaçların kimi beş yüz yaşında diyorlar, ben daha yetmişimdeyim; demek ki ben bu bahçenin bebeğiyim! Bebek de olsam hasatta herkesten önce kalkarım.', 'They say some of these trees are five hundred years old and I am only seventy; so I am the baby of this garden! Baby or not, at harvest I am up before everyone.']],
      [['Zeytin size ne öğretti?', 'What has the olive taught you?'], ['Acele etmemeyi. Zeytin bir yıl verir, bir yıl dinlenir; biz de onunla dinleniriz. Dinlenmeyi bilmeyen ağaç da insan da erken kurur.', 'Not to hurry. The olive gives one year and rests the next; we rest with it. A tree or a person who cannot rest withers early.']],
    ],
    [['Zeytincinin Defteri', 'The Olive Seller’s Page'], ['Kök derinse rüzgâr korkutmaz. Defterine yaz: yukarı uçmak istiyorsan önce aşağıda sağlam dur. Ayvalık’ta zeytin, sabrın sofraya gelmiş hâlidir.', 'With deep roots the wind holds no fear. Write it: if you want to fly up, first stand firm below. In Ayvalık the olive is patience brought to the table.']],
  ),
  'Orcikçi Necmi Usta': talk(
    ['Hoş geldin {rol}! Ellerim dut pekmezi, üstüm ceviz kabuğu; orcikçi böyle olur. Bir dilim kes, soğukta iyi gelir.', 'Welcome, {rol}! My hands are mulberry syrup, my clothes walnut shells; that is what an orcik maker looks like. Cut a slice, it does you good in the cold.'],
    [
      [['Orcik nasıl yapılır?', 'How is orcik made?'], ['Cevizi ipe dizer, kaynamış şıraya batırır, kurutur, yine batırırız. Her kat bir gün ister. Kat kat sabır, sonunda dişe tatlı bir zırh olur.', 'We string the walnuts, dip them in boiled grape must, dry them, then dip them again. Every layer takes a day. Layer upon layer of patience becomes, in the end, a sweet armour for the teeth.']],
      [['Orcikler sizden kaçtı mı yoksa?', 'Did the orcik run away from you?'], ['İpe dizili oldukları için kaçamazlar sanıyordum! Rüzgâr ipi kaptı; biri kaleye, biri minareye, biri de mağaraya gitti. Mağaradaki dondu herhalde, buz orcik olur.', 'I thought they could not run off, being on a string! The wind grabbed the string; one went to the castle, one to the minaret, one to the cave. The one in the cave must be frozen by now, ice orcik.']],
      [['Harput sizin için ne demek?', 'What does Harput mean to you?'], ['Kürsübaşında anlatılan hikâyeler demek. Kış gecesi mangal yanar, büyükler anlatır, çocuklar orcik yer. Ben o çocuklardan biriydim, şimdi anlatanlardanım.', 'It means the stories told by the fireside. On a winter night the brazier burns, the elders tell tales and the children eat orcik. I was one of those children; now I am one of the tellers.']],
    ],
    [['Orcikçinin Defteri', 'The Orcik Maker’s Page'], ['İyi şey bir günde olmaz, kat kat olur. Defterine yaz: bugün bir kat, yarın bir kat; sonunda sağlam bir tatlı. Elazığ’da kışı orcikle, sohbetle geçirirsin.', 'Good things are not made in a day, they are made layer by layer. Write it: a layer today, a layer tomorrow; in the end a sturdy sweet. In Elazığ you pass the winter with orcik and conversation.']],
  ),
  'Harputlu Lütfiye Nine': talk(
    ['Gel yavrum, nefeslen! Bu yokuşları ben her gün çıkarım; dizlerim gıcırdar ama Harput’un havası değer.', 'Come, dear, catch your breath! I climb these slopes every day; my knees creak, but the air of Harput is worth it.'],
    [
      [['Kalenin harcı sahiden sütle mi karılmış?', 'Was the castle’s mortar really mixed with milk?'], ['Öyle anlatırlar: su yokmuş, köylüler ineklerinin sütünü getirmiş. Doğru mu bilmem, ama bu taşların bin yıldır ayakta durması bir yerden güç almış olmalı.', 'So they say: there was no water and the villagers brought their cows’ milk. Whether it is true I cannot say, but these stones standing for a thousand years must draw strength from somewhere.']],
      [['Minare neden eğri, rüzgâr mı itti?', 'Why does the minaret lean, did the wind push it?'], ['Rüzgâr mı, zaman mı, yoksa ezanı dinlemek için mi eğildi, kim bilir! Ben de yaşlandıkça eğiliyorum; minareyle akranız artık.', 'The wind, time, or did it bend to listen to the call to prayer, who knows! I lean more as I grow older too; the minaret and I are the same age now.']],
      [['Harput’u size kim sevdirdi?', 'Who made you love Harput?'], ['Annem. Her akşam surlara çıkar, ovaya bakardık. Ova ışıklarla dolarken o, eskiden şehrin bu tepede olduğunu anlatırdı.', 'My mother. Every evening we climbed the walls and looked over the plain. As the plain filled with lights she would tell me the city used to be up here on this hill.']],
    ],
    [['Ninenin Defteri', 'Grandma’s Page'], ['Yüksekte duran şey kökünü unutmamalı. Defterine yaz: şehir ovaya indi ama gönlü tepede kaldı. Harput’ta her taş, bir annenin anlattığı hikâyedir.', 'What stands up high must not forget its roots. Write it: the city came down to the plain but its heart stayed on the hill. In Harput every stone is a story a mother once told.']],
  ),
}
