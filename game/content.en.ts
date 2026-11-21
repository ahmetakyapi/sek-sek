// English text content for Sek-Sek. Mirrors game/levels.ts (final hints, after
// extensions), game/story.ts, game/characters.ts and CREATURE_NAMES in game/art.ts.

export interface LevelEn {
  subtitle: string
  item: string
  intro: string
  note: string
  nickname?: string
  facts: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }]
  secret: { title: string; text: string }
  hints: string[]
  npcs: { name: string; text: string }[]
  quips: string[]
}

export const LEVELS_EN: Record<string, LevelEn> = {
  edirne: {
    subtitle: 'Selimiye and Kırkpınar',
    item: 'Fruit Soap',
    intro: 'From the old station at Karaağaç to the Meriç Bridge, from the bazaar to the courtyard of Selimiye. The border city of Thrace, once the Ottoman capital.',
    note: 'Call it crossing the border. Take a long look at the dome of Selimiye, then go down to the wrestling field. Do not run when the drum starts: no bout begins before the warm-up ends.',
    facts: [
      { title: 'Selimiye Mosque', text: 'Selimiye, which the architect Sinan called his masterpiece, was completed in 1575. It has been a UNESCO World Heritage Site since 2011.' },
      { title: 'Kırkpınar', text: 'The Kırkpınar oil wrestling festival has been held in Edirne for centuries. The champion keeps the golden belt for a year.' },
      { title: 'Meriç Bridge', text: 'The Meriç Bridge was completed in 1847. Its twelve arches join the city to Karaağaç.' },
    ],
    secret: { title: 'Karaağaç Station', text: 'The old station at Karaağaç was designed by the architect Kemaleddin. Today it belongs to Trakya University, and the Lausanne Monument stands in its garden.' },
    hints: [
      'Welcome to Edirne! Set out from the old station: walk with ← →, jump the gaps.',
      'The Meriç Bridge: the arches stand apart. A short step, a single jump.',
      'The bazaar: the awnings make a road. Look for a step to reach the high shelf.',
      'The courtyard of Selimiye: climb the rim stone and cross the fountain along the arcade eaves. The square gate is ahead.',
    ],
    npcs: [
      { name: 'Uncle Şaban the Announcer', text: 'The announcer calls each wrestler to the field with a prayer, child: “Do not grieve when you are beneath, do not gloat when you are on top!” The Kırkpınar drum is in a foul mood today, so watch your step.' },
      { name: 'Müzeyyen the Soap Maker', text: 'Fruit soap is for smelling, not for eating! It used to go into dowry chests. Three of mine rolled out of the basket; keep them if you find them, and your bag will smell lovely.' },
      { name: 'Tuncay the Liver Cook', text: 'Pan-fried liver is cut leaf-thin and goes in and out of the hot oil in a blink. Dried hot peppers on the side. Stop by the bazaar after the bridge and eat it hot.' },
    ],
    quips: ['Do not grieve when you are beneath!', 'That is no way to warm up.', 'The Meriç is cool.', 'Your wrestling breeches got wet.'],
  },
  bursa: {
    subtitle: 'Green Bursa',
    item: 'Candied Chestnut',
    intro: 'From the stone lanes of Cumalıkızık to Koza Han, from the Grand Mosque to the Uludağ cable car. The first Ottoman capital, city of silk and shadow.',
    note: 'A shadow screen has been set up at the foot of Uludağ. They say Karagöz’s shadow has run away from it; if you see it, do not be afraid. It gets confused when the light comes on.',
    facts: [
      { title: 'The Grand Mosque', text: 'The Grand Mosque of Bursa was completed in 1399. It is known for its twenty domes and the fountain inside.' },
      { title: 'Koza Han', text: 'Koza Han was built in 1491. For centuries it was the heart of the silk cocoon trade; people still drink tea in its courtyard.' },
      { title: 'Cumalıkızık', text: 'Cumalıkızık is an Ottoman village about seven hundred years old. It joined the UNESCO World Heritage List with Bursa in 2014.' },
    ],
    secret: { title: 'Karagöz and Hacivat', text: 'Legend says Karagöz and Hacivat were two friends who worked on the building of a mosque in Bursa. Their banter passed from mouth to mouth and at last onto the shadow screen.' },
    hints: [
      'Welcome to Bursa! The lane in Cumalıkızık is narrow: jump from bay window to bay window.',
      'Koza Han: the bales make steps, and the springy bale tosses you up to the arcade. Cross over the roof of the little mosque in the courtyard.',
      'The cable car: ride the cabin and step off on the far side. Do not jump before it arrives.',
      'In front of the Grand Mosque: hop from rim to rim of the fountain. Is its stone solid all the way round? The square gate is ahead.',
    ],
    npcs: [
      { name: 'Sabri the Shadow Master', text: 'The one who plays Karagöz is called a hayalî. The screen comes alive with camel-hide figures and a single lamp behind. Turn the lamp and the shadows change places; remember that.' },
      { name: 'Auntie Feride of the Cocoons', text: 'Silk has been sold at Koza Han for five hundred years. One cocoon gives more than a thousand metres of thread, imagine! Have you seen my candied chestnuts? All three were left on the road.' },
      { name: 'Kenan the Cable Car Hand', text: 'The cable car takes you up to the clouds. Snow above, green below; that is why they call it Green Bursa. Do not jump before the cabin comes. Wait.' },
    ],
    quips: ['The curtain song has been sung.', 'Hacivat would have said “My, my!”', 'You rolled down Uludağ.', 'You popped like a chestnut.'],
  },
  antalya: {
    subtitle: 'Cliffs and Waterfall',
    item: 'Orange',
    intro: 'From the narrow lanes of Kaleiçi to Hadrian’s Gate, from the cliffs to where the Düden falls into the sea. At the foot of the Taurus, on the shore of the Mediterranean.',
    note: 'The sun shines here three hundred days a year. Do not go too near the cliff edge; wet stone is slippery. They say a mask at Aspendos has been waiting two thousand years for applause.',
    facts: [
      { title: 'Hadrian’s Gate', text: 'The three-arched Hadrian’s Gate was built in honour of the Roman Emperor Hadrian’s visit in AD 130.' },
      { title: 'The Fluted Minaret', text: 'The Fluted Minaret was built by the Seljuks in the 13th century. Its brick shaft with eight flutes is the symbol of the city.' },
      { title: 'Düden Waterfall', text: 'The Lower Düden Waterfall drops from cliffs about forty metres high straight into the Mediterranean.' },
    ],
    secret: { title: 'Aspendos', text: 'The theatre of Aspendos was built in the 2nd century AD by the architect Zenon. Its stage has survived so well that concerts are still held there.' },
    hints: [
      'Welcome to Antalya! Cross from roof to roof in Kaleiçi; the lane is narrow, the jump short.',
      'Hadrian’s Gate: bounce off the wall to get on top of the arch.',
      'The cliffs: the gap is wide. Jump, then dash at the top.',
      'You are near the Düden: shining stone is wet and your feet will slide. Stop early.',
    ],
    npcs: [
      { name: 'Uncle Dursun the Orange Seller', text: 'A good orange is heavy, with thin peel. When the trees blossom the whole city smells of it. Three of mine rolled out of the crate; peel and eat them if you find them.' },
      { name: 'Sevim the Kaleiçi Guide', text: 'Hadrian’s Gate has three arches; the emperor came here in AD 130. It is cool beneath them. One is a little different from the others, so do not pass without looking.' },
      { name: 'Derya the Diver', text: 'The foot of the cliffs is full of caves. Step on wet stone and your feet slide: if you want to stop, let go early; if you mean to jump, jump before the edge.' },
    ],
    quips: ['You went down the cliff by the shortcut.', 'Wet stone does not forgive.', 'You rolled like an orange.', 'The Mediterranean is warm.'],
  },
  sanliurfa: {
    subtitle: 'Balıklıgöl and Göbeklitepe',
    item: 'Isot Pepper',
    intro: 'From the shore of Balıklıgöl to the castle, from the beehive houses of Harran to the standing stones of Göbeklitepe. They call this the zero point of history.',
    note: 'Feed the fish at Balıklıgöl but do not touch them. The stones of Göbeklitepe have stood for twelve thousand years; they say one got bored and started walking.',
    facts: [
      { title: 'Göbeklitepe', text: 'The standing stones of Göbeklitepe were raised about twelve thousand years ago. The site joined the UNESCO World Heritage List in 2018.' },
      { title: 'Balıklıgöl', text: 'The carp of Balıklıgöl are held sacred and are never eaten. The pool lies in the courtyard of the Halilürrahman Mosque.' },
      { title: 'Harran Houses', text: 'The cone-domed mud-brick houses of Harran stay cool in summer and warm in winter. The domes are built without a frame, each brick course stepping in over the last.' },
    ],
    secret: { title: 'Sıra Gecesi', text: 'In Urfa a sıra gecesi is an evening when friends gather at each other’s homes in turn. They talk, sing folk songs and knead çiğ köfte.' },
    hints: [
      'Welcome to Şanlıurfa! The wet stones of Balıklıgöl are slippery; fall in and you return to the flag.',
      'The castle road: the steps are tall. Push the crate to the foot of the wall and climb on it; bounce off the wall to scale the tower.',
      'The Harran houses: jump from dome to dome. The top of a dome is narrow.',
      'Göbeklitepe: the stones stand far apart. Jump, then dash at the top. The first pit is safe, so try it there.',
    ],
    npcs: [
      { name: 'Uncle Bozan the Isot Seller', text: 'Isot dries in the sun by day and sweats in a sack by night; that is how it turns so dark. Three strings of mine blew away. Take them if you find them, they bring plenty to a meal.' },
      { name: 'Müslüm the Pool Keeper', text: 'These fish are held sacred; nobody touches them. Throw feed and the water seems to boil! The road up to the castle is steep; push the crate and it becomes a step.' },
      { name: 'Zeliha the Archaeologist', text: 'The stones of Göbeklitepe are older than pottery. They are carved with foxes, cranes and scorpions. Look the way the fox is looking.' },
    ],
    quips: ['That stung like isot.', 'The fish watched you.', 'It waited twelve thousand years; you could not wait.', 'Strong as mırra.'],
  },
  van: {
    subtitle: 'Lake and Castle',
    item: 'Herbed Cheese',
    intro: 'From the rock of Van Castle to the lakeshore, from the pier to Akdamar Island. The largest lake in Türkiye, and Tushpa, capital of the Urartians.',
    note: 'Breakfast in Van lasts till noon; do not rush. The lake is like a sea but nothing like the sea. Many have seen the monster; nobody has a photograph.',
    facts: [
      { title: 'Lake Van', text: 'Lake Van is the largest lake in Türkiye. Its water is salty and rich in soda, and it has no outlet.' },
      { title: 'Van Castle', text: 'Van Castle was founded by the Urartian king Sarduri I in the 9th century BC. The cuneiform inscriptions cut into the rock can still be read.' },
      { title: 'Akdamar Church', text: 'The church on Akdamar Island was built between 915 and 921. Its outer walls are covered in stone reliefs.' },
    ],
    secret: { title: 'The Pearl Mullet', text: 'The pearl mullet lives nowhere in the world but the Lake Van basin. In spring it enters the streams to spawn, leaping against the current.' },
    hints: [
      'Welcome to Van! Climb the castle rock: bounce from wall to wall.',
      'Along the walls: the battlements stand far apart. Jump, then dash at the top.',
      'The lakeshore: the boats rock with the waves. Watch your timing.',
      'Akdamar pier: the key is above, the door below. Climb to the top first.',
    ],
    npcs: [
      { name: 'Gülbahar the Breakfast Cook', text: 'Herbed cheese, murtuğa, kavut, cacık, honey, clotted cream… the table never ends. Three of my cheeses were left on the road; they are yours if you find them, but travel on a full stomach.' },
      { name: 'Sıddık the Boatman', text: 'The lake water is full of soda and lathers like soap. Only the pearl mullet lives in it. If you are crossing to Akdamar, count the waves: the third is always the big one.' },
      { name: 'Mirza the Shepherd', text: 'Urartian kings had words carved into the castle rock. At sunset some stones appear and others vanish; here night and day change places.' },
    ],
    quips: ['The lake is soda; you lathered up.', 'The pearl mullet jumps better than you.', 'The monster laughed.', 'Breakfast has gone cold.'],
  },
  erzurum: {
    subtitle: 'Land of the Dadaş',
    item: 'Oltu Stone',
    intro: 'From the Twin Minaret Madrasa to the Three Tombs, from the jereed field to the icy slope of Palandöken. The roof of Anatolia, winter itself.',
    note: 'Here winter is long, tea is strong and people are dadaş. Drink your tea kıtlama: hold the sugar between your teeth. Fresh snow has fallen on Palandöken, so mind the avalanche.',
    facts: [
      { title: 'The Twin Minaret Madrasa', text: 'The Twin Minaret Madrasa was built in the late 13th century. The fluted minarets beside its portal are decorated with turquoise tiles.' },
      { title: 'Palandöken', text: 'The summit of Palandöken rises above 3,000 metres. The 2011 Winter Universiade was held here.' },
      { title: 'Oltu Stone', text: 'Oltu stone is mined in the Oltu district of Erzurum. Glossy and black, it is used for prayer beads and jewellery.' },
    ],
    secret: { title: 'Jereed', text: 'Jereed is an old Turkish sport played on horseback. Riders throw blunt wooden javelins at one another; it is still played in Erzurum.' },
    hints: [
      'Welcome to Erzurum! Go through the portal into the courtyard; bounce from wall to wall between the two minarets and up to the roof.',
      'The Three Tombs: from cone to cone, jump and dash at the top. Grab the wall of the great tomb and hop your way up.',
      'The jereed field: the javelins come at a steady beat. Drop into the lane once one has passed, jump the next, and climb the ledge at the end.',
      'The slope of Palandöken: on ice you keep your speed. Jump at the edge, dash at the top, then grab the far wall and climb.',
    ],
    npcs: [
      { name: 'Abdurrahman the Oltu Stone Carver', text: 'Oltu stone comes out of the ground soft and hardens in the air; the more you work it, the more it shines. Three of my beads rolled off the bench. Pocket them if you find them, they bring luck.' },
      { name: 'Yavuz the Jereed Rider', text: 'Jereed is played on horseback: you throw the javelin, your rival ducks. It is the same on ice: set your speed early, for you cannot turn at the last moment.' },
      { name: 'Granny Dilber the Tea Seller', text: 'Come, dear, warm yourself. The madrasa has two minarets, both fluted, both tiled. The snow at the foot of the left one always melts early; nobody knows why.' },
    ],
    quips: ['Ice does not listen, dadaş.', 'You dropped your sugar cube.', 'Came like an avalanche, melted like snow.', 'Greetings from Palandöken.'],
  },
  eskisehir: {
    subtitle: 'On the Banks of the Porsuk',
    item: 'Meerschaum',
    intro: 'From the colourful houses of Odunpazarı to the gondolas on the Porsuk, from the fairy-tale castle in Sazova to the Kurşunlu Complex. A city of students and of tales.',
    note: 'Eskişehir is young and colourful: gondolas on the Porsuk, bay-windowed houses in Odunpazarı, çibörek on the table. Watching the sunset from the bridge is free.',
    facts: [
      { title: 'Odunpazarı', text: 'Odunpazarı is famous for its colourful Ottoman houses with jutting bay windows. In 2012 it was added to the UNESCO World Heritage Tentative List.' },
      { title: 'Meerschaum', text: 'Most of the world’s meerschaum is mined around Eskişehir. Pipes and ornaments are carved from this white, light and soft stone.' },
      { title: 'Çibörek', text: 'Çibörek is a juicy minced-meat pastry that came to Eskişehir with the Crimean Tatars.' },
    ],
    secret: { title: 'Nasreddin Hodja', text: 'Nasreddin Hodja is believed to have been born in the village of Hortu, in the Sivrihisar district of Eskişehir.' },
    hints: [
      'Welcome to Eskişehir! Jump onto the bay windows of Odunpazarı and cross from roof to roof.',
      'The Porsuk: the gondolas glide back and forth. Hop on when one comes alongside and step off at the far pier.',
      'Sazova Park: climb the fairy-tale castle’s tower by its steps, then leap from the pirate ship’s mast.',
      'The Kurşunlu Complex: cross over the domes and catch your breath in the courtyard.',
    ],
    npcs: [
      { name: 'Hüsnü the Meerschaum Carver', text: 'Meerschaum comes out of the ground soft and shines like ivory once it is carved. Three pieces slipped from my hands and rolled between the colourful houses.' },
      { name: 'Erkan the Gondolier', text: 'Gondolas on the Porsuk are slow, and whoever hurries ends up in the water. Hop on when the gondola pulls up, hop off at the far pier.' },
      { name: 'Auntie Saadet the Çibörek Cook', text: 'Çibörek is eaten hot, and the juice runs when you bite. Whoever climbs the castle’s highest tower finds something unexpected on the roof.' },
    ],
    quips: ['You fell off the gondola.', 'You ran like çibörek juice.', 'The Porsuk is cool, you are hot.', 'Nasreddin Hodja laughed.'],
  },
  kayseri: {
    subtitle: 'At the Foot of Erciyes',
    item: 'Mantı',
    intro: 'From the basalt walls of Kayseri Castle to the Covered Bazaar, from the Gevher Nesibe Hospital to the snowy slopes of Erciyes. The Seljuks’ city of stone.',
    note: 'In Kayseri the mantı is tiny, the pastırma thin, and words few and to the point. Snow never quite leaves Erciyes, even in summer; in the Covered Bazaar, bargaining is an art.',
    facts: [
      { title: 'Mount Erciyes', text: 'At 3,917 metres, Mount Erciyes is the highest mountain in Central Anatolia. It is an extinct volcano, and its ski resort lies right next to the city.' },
      { title: 'Gevher Nesibe', text: 'The Gevher Nesibe Hospital was built in 1206 by the Seljuk Sultan Kaykhusraw I in the name of his sister. It is one of Anatolia’s first medical schools.' },
      { title: 'Kayseri Mantı', text: 'Kayseri mantı are tiny dumplings. In the old days, fitting forty of them on one spoon was the mark of a master cook.' },
    ],
    secret: { title: 'Kültepe', text: 'The Assyrian trade tablets found at Kültepe (Kanesh), near Kayseri, are the oldest known written documents in Anatolia, dating back some 4,000 years.' },
    hints: [
      'Welcome to Kayseri! The castle’s basalt walls are tall: jump from tower to tower, and bounce from wall to wall in the narrow gaps.',
      'The Covered Bazaar: duck under the hanging pastırma and jump onto the awnings. From the domed roof you can see the road ahead.',
      'The courtyard of Gevher Nesibe: dash onto the arches. If one jump is not enough, grab the arch’s wall.',
      'The slopes of Erciyes: hop from rock to rock on the snowy hillside. The dash ring carries you over the valley.',
    ],
    npcs: [
      { name: 'Zekeriya the Pastırma Maker', text: 'We wrap the pastırma in spicy çemen, dry it in the wind and slice it thin. Three of my mantı parcels ran off the counter; tell me if you see them.' },
      { name: 'Auntie Hasret the Mantı Cook', text: 'Forty mantı should fit on one spoon, dear; that is how small Kayseri mantı are. One corner of the hospital courtyard always stays cool; lean on its wall and you will see a gap.' },
      { name: 'Ilgaz the Climber', text: 'Climbing Erciyes, you hop from rock to rock and never rush. At the top, all of Kayseri lies at your feet.' },
    ],
    quips: ['You folded like a mantı.', 'A mistake as thin as pastırma.', 'Erciyes is patient.', 'The bargaining is not over yet.'],
  },
  hatay: {
    subtitle: 'Crossroads of Civilisations',
    item: 'Künefe',
    intro: 'From the arches of the Long Bazaar to the rock of St. Peter’s Church, from the waterwheels of the Orontes to the falls of Harbiye. A crossroads of languages, faiths and flavours.',
    note: 'In Antakya the table is crowded and the conversation long. Künefe is eaten hot, soap is made from laurel, and the Orontes flows slowly.',
    facts: [
      { title: 'St. Peter’s Church', text: 'St. Peter’s Church in Antakya is a cave church carved into the rock, and is considered one of the oldest churches in Christianity.' },
      { title: 'The Hatay Mosaics', text: 'With its Roman-era mosaics, the Hatay Archaeology Museum holds one of the richest mosaic collections in the world.' },
      { title: 'Künefe', text: 'Künefe is made by baking unsalted cheese between layers of shredded pastry, served with hot syrup. It is Hatay’s signature dessert.' },
    ],
    secret: { title: 'City of Gastronomy', text: 'In 2017 Hatay joined the UNESCO Creative Cities Network in the field of gastronomy.' },
    hints: [
      'Welcome to Hatay! The arches of the Long Bazaar are low: climb onto an arch and cross from roof to roof.',
      'St. Peter’s rock is steep: jump onto the rock steps and bounce from wall to wall in the narrow crack.',
      'The Orontes: ride the waterwheel’s buckets and jump to the far bank as they rise.',
      'The falls of Harbiye: wet stones are slippery, so stop early. The path behind the waterfall stays dry.',
    ],
    npcs: [
      { name: 'Necdet the Künefe Master', text: 'Künefe is eaten hot, my child: the cheese stretches under the pastry and the syrup shines on top. Three slices slid off the tray; pick them up if you see them on the way.' },
      { name: 'Uncle Elias the Soap Maker', text: 'We boil laurel soap in the cauldron and dry it for months; its scent fills every corner of the Long Bazaar. Do not forget to look into the dark gap at the foot of the rock.' },
      { name: 'Auntie Zühre the Mosaic Maker', text: 'A mosaic is laid stone by stone; if one is missing, the whole picture is spoiled. Everything here is like that, neighbourliness too.' },
    ],
    quips: ['You flowed like syrup.', 'Get up before the künefe cools.', 'Even the Orontes is faster than you.', 'A stone is missing from the mosaic.'],
  },
  canakkale: {
    subtitle: 'The Strait and Troy',
    item: 'Clay Jug',
    intro: 'The Clock Tower on the promenade, the Mirrored Bazaar, the ferry across the strait and the walls of Kilitbahir. At the end of the road, the nine cities of Troy stacked one upon another.',
    note: 'Drink your tea on the promenade and count the ships passing through the strait. When you reach Troy, remember to look inside the horse; not every gift is what it seems.',
    facts: [
      { title: 'The Clock Tower', text: 'The Çanakkale Clock Tower was built in 1897. It has five storeys and is one of the symbols of the promenade.' },
      { title: 'Kilitbahir Castle', text: 'Kilitbahir Castle was built in the 15th century at the narrowest point of the strait. Its name means “lock of the sea”.' },
      { title: 'Çanakkale Ceramics', text: 'The city takes its name from pottery. Çanakkale ceramics have been made for centuries and are known for their horse-headed jugs.' },
    ],
    secret: { title: 'Troy', text: 'The site of Troy holds the layers of nine cities built one on top of another. It was added to the UNESCO World Heritage List in 1998.' },
    hints: [
      'Welcome to Çanakkale! Walk along the promenade and pass the Clock Tower.',
      'The Mirrored Bazaar: jump onto the awnings and hop from one to the next.',
      'The strait ferry: board when it reaches the pier, get off on the far shore.',
      'The walls of Kilitbahir: climb step by step. The key is in the bastion, the door below.',
    ],
    npcs: [
      { name: 'Halil the Tea Master', text: 'Tea on the promenade is brewed by the wind off the strait. Look at the Clock Tower: it has not hurried once since 1897, and neither should you.' },
      { name: 'Gülsüm the Potter', text: 'Çanakkale takes its name from the clay bowl, my child. Our horse-headed jugs are famous; I dropped three on the road, keep them if you find them.' },
      { name: 'Captain Yaşar of the Ferry', text: 'Twenty minutes between Europe and Asia. Do not jump before the ferry reaches the pier; the current of the strait is no joke.' },
    ],
    quips: ['The strait’s current is strong!', 'Do look a gift horse in the mouth.', 'The jug broke, but you are fine.', 'The wind never rests here.'],
  },
  diyarbakir: {
    subtitle: 'Basalt Walls',
    item: 'Watermelon',
    intro: 'Walls, bastions and gates of black basalt. From the Mountain Gate to Hasan Pasha Inn, from the Hevsel Gardens to the Ten-Eyed Bridge over the Tigris.',
    note: 'Walk on top of the walls and watch the Tigris from the Ten-Eyed Bridge. Say hello to the little phone shop at the foot of the Mountain Gate, too.',
    facts: [
      { title: 'The Walls of Diyarbakır', text: 'The walls of Diyarbakır are about 5.8 kilometres long. Together with the Hevsel Gardens they joined the UNESCO World Heritage List in 2015.' },
      { title: 'The Ten-Eyed Bridge', text: 'The Ten-Eyed Bridge over the Tigris was built in 1065. It is named after its ten arches.' },
      { title: 'The Four-Legged Minaret', text: 'The minaret of the Sheikh Mutahhar Mosque stands on four stone columns. It is built in bands of black basalt and pale stone.' },
    ],
    secret: { title: 'Diyarbakır Watermelon', text: 'Grown in the sandy banks of the Tigris, Diyarbakır watermelons become enormous; the largest compete each year at the watermelon festival.' },
    hints: [
      'Welcome to Diyarbakır! Enter by the Mountain Gate and take the wall steps up to the bastion.',
      'Jump from bastion to bastion: the wall top is narrow, mind the scorpions.',
      'Hasan Pasha Inn: jump up to the arcades of the courtyard. The key is upstairs.',
      'The Ten-Eyed Bridge: cross arch by arch, do not fall into the Tigris. The door is at the far end.',
    ],
    npcs: [
      { name: 'Baran the Phone Apprentice', text: 'My master Memo took to the road and left the shop to me! He could spot a cracked screen at a glance. Anyone who stops by the foot of the wall gets a glass of tea.' },
      { name: 'Seyda the Dengbêj', text: 'We tell our stories with no instrument, only the voice. These walls are thousands of years old; every bastion has its song. Listen, and the road grows shorter.' },
      { name: 'Auntie Hatun the Gardener', text: 'The soil of Hevsel is rich, and the sand of the Tigris makes giants of our watermelons. Three of my slices were left on the road; enjoy them if you find them, but do not tease the one in the square!' },
    ],
    quips: ['Basalt is hard!', 'You rolled like a watermelon.', 'The walls are watching you.', 'The Tigris is cool but deep.'],
  },
  sinop: {
    subtitle: 'The Northernmost Harbour',
    item: 'Model Ship',
    intro: 'From the castle walls to the fishing harbour, from the calm bay of Hamsilos to the İnceburun lighthouse. Here the Black Sea embraces a peninsula.',
    note: 'Reach the northernmost tip of Türkiye and stop at the foot of the lighthouse. Give Diogenes my regards; ask him for nothing, just do not block his sun.',
    facts: [
      { title: 'Sinop Castle', text: 'Sinop Castle dates back to the 7th century BC. Its walls cut across the narrowest part of the peninsula, between two seas.' },
      { title: 'İnceburun', text: 'İnceburun is the northernmost point of Türkiye. The lighthouse at its tip has guided ships since 1863.' },
      { title: 'Model Shipbuilding', text: 'Sinop is known for its handmade model ships. The craft is handed down in the city from one generation to the next.' },
    ],
    secret: { title: 'Diogenes', text: 'The philosopher Diogenes was born in Sinop in the late 5th century BC. Legend says he lived in a barrel and carried a lantern in daylight, looking for an honest person.' },
    hints: [
      'Welcome to Sinop! Climb onto the wall: there is a different sea on either side.',
      'The fishing harbour: cross from boat to boat. The waves rock them, so watch your timing.',
      'Hamsilos Bay: the gaps in the rocks are wide. Jump, then dash at the top.',
      'İnceburun lighthouse: climb inside the tower by bouncing from wall to wall. The key is at the top, the door below.',
    ],
    npcs: [
      { name: 'Rasim the Model Maker', text: 'I have built model ships for forty years; I sew the smallest sail with a needle. The wind carried off three of them. If you find them, do not bring them back, they are yours.' },
      { name: 'Nezahat the Mantı Cook', text: 'Sinop mantı is half yoghurt, half walnut; you eat both from one plate. The boats rock in the harbour, so it is best to cross on a full stomach!' },
      { name: 'Osman the Lighthouse Keeper', text: 'This light has burned since 1863. You are at the very north of Türkiye, child; beyond here is only the Black Sea. Climb up and look at the horizon.' },
    ],
    quips: ['The Black Sea does not joke.', 'Diogenes would have laughed.', 'The lighthouse saw you.', 'You slipped like an anchovy.'],
  },
  trabzon: {
    subtitle: 'Horon and Highlands',
    item: 'Rice Pudding',
    intro: 'The sound of the kemençe, horon dancers and rain that never stops. From the square to the tea terraces, from the Sümela cliff to Hamsiköy and on to Lake Uzungöl.',
    note: 'Once the kemençe starts, no feet stay still; join the horon, shoulder to shoulder. On the Maçka road stop at Hamsiköy and have them sprinkle hazelnuts on your rice pudding.',
    facts: [
      { title: 'Horon', text: 'Horon is the folk dance of the Black Sea. It is danced arm in arm, shoulder to shoulder, with fast, shimmying steps to the kemençe.' },
      { title: 'Sümela Monastery', text: 'Sümela Monastery is carved into a steep cliff in the Altındere Valley in Maçka. According to tradition it was founded in the 4th century.' },
      { title: 'Hamsiköy Rice Pudding', text: 'Made in Hamsiköy in Maçka, this rice pudding is browned in the oven, served with hazelnuts and registered as a geographical indication.' },
    ],
    secret: { title: 'Uzungöl', text: 'Uzungöl in Çaykara is a lake formed when a landslide from the mountain dammed the valley.' },
    hints: [
      'Welcome to Trabzon! Climb the tea terraces and listen to the kemençe player.',
      'The horon line: the dancers jump together. Stand on their joined hands and leap to the next terrace at the top.',
      'The Sümela cliff: cracked stones crumble. After the ledge, wall-jump up between the two rocks; arrows fly from the window, so wait for the rhythm. The key is in front of the monastery.',
      'The wedding square: the koçari line stomps slowly and stays up longer. Time it to reach the table.',
      'Uzungöl: hop from boat to boat and watch out for the Gökçekuş birds.',
    ],
    npcs: [
      { name: 'Uncle Cemal the Kemençe Player', text: 'The kemençe has only three strings but never runs out of things to say, my lad! Now let me play “Taşacak Bu Deniz” so the dancers jump; jump too when you are at the top.' },
      { name: 'Yusuf the Horon Dancer', text: 'In the horon we link arms and shimmy shoulder to shoulder. At weddings guests sometimes strike up a koçari too; we keep up with them all!' },
      { name: 'Sister Fadime the Pudding Maker', text: 'Welcome to the wedding table! Hamsiköy rice pudding is browned in the oven and topped with hazelnuts. They are dancing the koçari down there, join a line!' },
    ],
    quips: ['The horon never stops, neither should you!', 'Easy there, lad!', 'Even an anchovy does not slip like that.', 'Here the rain is not a guest, it lives here.'],
  },
  istanbul: {
    subtitle: 'On the Bosphorus',
    item: 'Simit',
    intro: 'A city of gulls, ferries and two continents. The first journey runs from the quay up the Galata slope, then down to the pier.',
    note: 'When you step off the ferry, buy a simit and share half with the gulls. From Galata you can take in two continents in a single breath.',
    facts: [
      {
        title: 'One City on Two Continents',
        text: 'Istanbul spreads across both shores of the Bosphorus: one side is Europe, the other Asia. The Bosphorus is a waterway of about 30 km linking the Black Sea to the Sea of Marmara.',
      },
      {
        title: 'Galata Tower',
        text: 'Galata Tower was built by the Genoese in 1348. For centuries it also served as a fire lookout tower.',
      },
      {
        title: 'Simit',
        text: 'Simit, a sesame-crusted bread ring, is a long-standing street food mentioned in 16th-century Ottoman records. It is dipped in grape molasses, coated in sesame and baked.',
      },
    ],
    secret: {
      title: "Maiden's Tower",
      text: "Maiden's Tower stands on a tiny islet at the mouth of the Bosphorus. For centuries it was used as a lighthouse and a watchtower.",
    },
    hints: [
      'Walk with ← →, jump with ↑ or JUMP. Hold it longer to jump higher.',
      "The Bosphorus is cold, don't fall in! Stomp on the Gökçekuş birds to chase them off.",
      'Touch the flag: if you fall, you pick up from here. You can jump up through thin platforms and land on top.',
      'The pier: ride the moving platform across the water.',
      'DASH (Space / X): burst forward once in mid-air. It recharges when you land. Jump, then dash!',
      'A dash ring recharges your dash in mid-air: dash, go through the ring, dash again!',
      "Step on the pressure plate to make the bridge to Maiden's Tower pier appear.",
    ],
    npcs: [
      {
        name: 'Uncle Hasan, Simit Seller',
        text: "Fresh simit, piping hot! Don't let the gulls snatch it, dear, they love it too.",
      },
      {
        name: 'Selin, Pier Attendant',
        text: 'The ferry just left, but the pier platform is still going back and forth. Time it right and jump!',
      },
    ],
    quips: [
      'The gulls saw that.',
      'The Bosphorus is chilly this time of year.',
      "Even a simit doesn't roll like that.",
      "The ferry won't wait, but the flag will.",
    ],
  },

  kocaeli: {
    subtitle: 'The Gulf and SEKA',
    item: 'Pişmaniye',
    intro: "The city on the gulf. From the shore to the roof of SEKA's old paper mill, then by raft to the Clock Tower.",
    note: "Watch the gulls on the gulf and pick up a box of pişmaniye. From SEKA's chimneys you can see Kartepe blanketed in snow.",
    facts: [
      {
        title: 'Pişmaniye',
        text: 'Pişmaniye is the symbol of İzmit. Sugar and flour are patiently pulled into strands as fine as a hair.',
      },
      {
        title: 'SEKA',
        text: "SEKA, Türkiye's first paper mill, opened in İzmit in 1936. Today SEKA Park and the Paper Museum stand in its place.",
      },
      {
        title: 'Kartepe',
        text: 'Kartepe is a ski resort overlooking the Gulf of İzmit. In winter the peaks are covered in snow while the sea shows below.',
      },
    ],
    secret: {
      title: 'Maşukiye',
      text: 'Maşukiye, on the slopes of Kartepe, is known for its waterfalls and its trout tables by the stream.',
    },
    hints: [
      'The factory stairs are one-way: jump up from below to reach the roof. You can stomp on the crabs.',
      "SEKA warehouse: find the key and the door opens. Don't step on the hedgehog, it's prickly!",
    ],
    npcs: [
      {
        name: 'Auntie Gülsüm, Pişmaniye Maker',
        text: 'Pişmaniye takes patience: we pull the sugar and flour over and over into fine threads. Take a box, it is a long road!',
      },
      {
        name: 'Kemal the Papermaker',
        text: "We made paper at SEKA for years. The factory is a park now, but the chimneys are still the city's symbol.",
      },
    ],
    quips: [
      'The gulls applauded.',
      'You came apart like pişmaniye.',
      'The gulf is chilly.',
      'The chimneys are watching you.',
    ],
  },

  izmir: {
    subtitle: 'Along the Kordon',
    item: 'Boyoz',
    intro: 'The pearl of the Aegean. Stroll along the Kordon, hop on the gulf ferry and ride the Historic Elevator up to Karataş.',
    note: 'Watch the sunset on the Kordon and greet the morning with a boyoz. From the elevator, the whole gulf sits in the palm of your hand.',
    facts: [
      {
        title: 'Clock Tower',
        text: 'The İzmir Clock Tower was built in Konak Square in 1901. Its clocks were a gift from the German Emperor Wilhelm II.',
      },
      {
        title: 'Historic Elevator',
        text: 'The Historic Elevator in Karataş was commissioned by Nesim Levi in 1907. It connects the two sides of a steep slope.',
      },
      {
        title: 'Boyoz',
        text: 'Boyoz is a pastry that came to İzmir with the Sephardic Jews. It is traditionally eaten with a hard-boiled egg.',
      },
    ],
    secret: {
      title: 'Ephesus',
      text: "The ancient city of Ephesus, in İzmir's Selçuk district, was added to the UNESCO World Heritage List in 2015.",
    },
    hints: [
      'Crabs roam the Kordon. Jump on them or dash past.',
      'The gulf ferry: ride the moving pier, and watch out for the Gökçekuş birds.',
      'Historic Elevator: ride the platform up to Karataş.',
      'Kemeraltı gate: step on the orange plate, the orange blocks vanish and the blue blocks appear.',
    ],
    npcs: [
      {
        name: 'Master Rıfat, Boyoz Baker',
        text: 'Boyoz is a breakfast thing: a boiled egg on the side and a glass of tea. Gevrek or simit? That is a whole other conversation!',
      },
      {
        name: 'Nesrin, Elevator Attendant',
        text: "We've been linking two neighbourhoods since 1907. Forget the stairs, hop on the platform, after you!",
      },
    ],
    quips: [
      'The crab had a sideways laugh.',
      "That's not how you stroll the Kordon.",
      'Up you get before the boyoz cools!',
      'The gulf is chilly tonight.',
    ],
  },

  ankara: {
    subtitle: 'Castle and Bay Windows',
    item: 'Mohair',
    intro: 'A capital in the middle of the steppe. From the bay-windowed houses of Hamamönü to the castle walls, then on to Atakule.',
    note: 'Look out from the castle tower: a great capital built in the middle of the steppe. Get lost among the bay-windowed houses.',
    facts: [
      {
        title: 'The Capital',
        text: "Ankara became Türkiye's capital on 13 October 1923.",
      },
      {
        title: 'Anıtkabir',
        text: "Anıtkabir, Atatürk's mausoleum, was completed in 1953. It rises on Rasattepe, in the heart of the city.",
      },
      {
        title: 'Mohair',
        text: 'The wool of the Angora goat is called tiftik, or mohair. For centuries this shiny, soft fibre was woven into the famous Ankara sof cloth.',
      },
    ],
    secret: {
      title: 'The Stones of Anıtkabir',
      text: 'Stones brought from different regions of Türkiye were used to build Anıtkabir; each colour represents a region.',
    },
    hints: [
      'The bay-window balconies are one-way: jump up from below to get on top. Cracked planks crumble!',
      'Castle walls: bounce between the two walls to climb. Watch out for pigeons.',
      'The key is up high: jump, dash, go through the dash ring, dash again.',
    ],
    npcs: [
      {
        name: 'Uncle Nihat, Nut Seller',
        text: "I've sold nuts at the foot of the castle for fifty years. Take a handful of leblebi and compare it when you get to Çorum!",
      },
      {
        name: 'Zeynep the Student',
        text: 'You can see the whole city from Atakule. A huge capital in the middle of the steppe, hard to believe, right?',
      },
    ],
    quips: [
      'The pigeons flapped their wings.',
      'Even the goat was surprised.',
      'The steppe wind shows no mercy.',
      'The castle has seen plenty of falls like that.',
    ],
  },

  konya: {
    subtitle: "Mevlâna's City",
    item: 'Dervish Cap',
    intro: "The Seljuk capital. From the steppe to Alaeddin Hill, from Karatay Madrasa to Mevlâna's turquoise dome.",
    note: 'In Konya they say, "Come, whoever you are, come again." Eat some etli ekmek, then watch the sema: everything that turns is bound to a centre.',
    facts: [
      {
        title: 'Seljuk Capital',
        text: 'In the 12th and 13th centuries, Konya was the capital of the Anatolian Seljuk State. Alaeddin Hill and its mosque date from that time.',
      },
      {
        title: 'Mevlâna',
        text: 'Mevlâna Celâleddin Rûmî died in Konya in 1273. His tomb, with its turquoise-tiled dome, is today the Mevlâna Museum.',
      },
      {
        title: 'Etli Ekmek',
        text: "Konya's famous etli ekmek is made by rolling dough thin and long, topping it with minced meat and baking it in a stone oven.",
      },
    ],
    secret: {
      title: 'Çatalhöyük',
      text: 'Çatalhöyük in Konya is a Neolithic settlement about 9,000 years old. It was added to the UNESCO World Heritage List in 2012.',
    },
    hints: [
      'Sema ring: turquoise trays turn around a centre. Hop on, and jump to the ledge when you reach the top.',
      'Alaeddin Hill: climb from ring to ring. As one goes down the other comes up, so wait for the rhythm.',
      'Karatay Madrasa: grab the key and open the door. Cross the bridge to the roof and you will see a dark doorway up there.',
      'Snakes bite: stomp on them or dash past. The last keepsake is up high, so watch the ring.',
    ],
    npcs: [
      {
        name: 'Nurten the Tile Master',
        text: "The tiles in Karatay's dome are laid out like stars. The key is up high and there are no stairs: watch how the ring turns.",
      },
      {
        name: 'Ali the Whirling Dervish',
        text: "In the sema, one hand faces the sky and the other the earth. The rings turn the same way; don't rush, let the rhythm carry you.",
      },
    ],
    quips: [
      'The ring turns, so turn with it.',
      'The steppe wind is patient.',
      'Up you get before the etli ekmek cools!',
      'The sema is a rhythm.',
    ],
  },

  nevsehir: {
    subtitle: 'Cappadocia',
    item: 'Clay Jug',
    intro: 'Fairy chimneys, hundreds of balloons in the sky and a city beneath the ground. From Göreme to Derinkuyu, from Avanos to Uçhisar.',
    note: 'Get up early: the sky fills with balloons. I call the fairy chimneys "stones with hats". And remember, there is a whole city under the earth too.',
    facts: [
      {
        title: 'Fairy Chimneys',
        text: 'Fairy chimneys form as wind and rain wear away soft tuff made of volcanic ash. The hard rock on top shields what lies beneath like a hat.',
      },
      {
        title: 'Derinkuyu',
        text: 'Derinkuyu Underground City descends many levels. Its passages could be sealed from inside with doors shaped like millstones that were rolled into place.',
      },
      {
        title: 'Avanos Pottery',
        text: 'In Avanos, pottery made from the red clay of the Kızılırmak has carried on for thousands of years.',
      },
    ],
    secret: {
      title: 'Land of Beautiful Horses',
      text: 'The name Cappadocia is said to come from Katpatuka, which means "land of beautiful horses" in Persian.',
    },
    hints: [
      'Balloon: climb into the basket and it rises. Step off and it slowly sinks back down. At the top, jump to the fairy chimney.',
      "The stones of the Kızılırmak bridge are cracked: don't stand still, run!",
      'Uçhisar: ride two balloons up to the castle. Watch out for pigeons.',
    ],
    npcs: [
      {
        name: 'Deniz the Balloon Pilot',
        text: 'Climb into the basket and the balloon rises; step off and it slowly sinks back. How long you stay up is up to you.',
      },
      {
        name: 'Elif, Underground Guide',
        text: 'Derinkuyu has homes, stables and cellars. The doors roll like millstones. I left the key in the tunnel on the left.',
      },
      {
        name: 'Master Hasan the Potter',
        text: "Avanos clay comes from the Kızılırmak. The bridge stones are cracked, so don't dawdle on them!",
      },
    ],
    quips: [
      'Even the balloon is patient.',
      'The fairy chimney smiled at you.',
      'Underground, even the echo is careful.',
      'Come back before the jug breaks.',
    ],
  },

  adana: {
    subtitle: 'Seyhan and Taşköprü',
    item: 'Cotton',
    intro: "The heart of Çukurova. Cross the Seyhan by the arches of Taşköprü, bounce off cotton bales and reach the minarets of Sabancı Mosque.",
    note: 'Gaze at the Seyhan from Taşköprü, then have a kebab with a glass of şalgam. Çukurova is famous for its heat and its mosquitoes, so be ready for both.',
    facts: [
      {
        title: 'Taşköprü',
        text: 'Taşköprü, the Stone Bridge over the Seyhan River, was built in the Roman era. It is considered one of the oldest bridges still standing.',
      },
      {
        title: 'Adana Kebab',
        text: 'Adana kebab is protected by a geographical indication. It is made with lamb minced by hand with a wide blade called a zırh.',
      },
      {
        title: 'Çukurova',
        text: "Çukurova is one of Türkiye's most fertile plains; cotton and citrus grow here. It is also the setting of Yaşar Kemal's novels.",
      },
    ],
    secret: {
      title: 'Varda Bridge',
      text: 'The Varda Bridge in Karaisalı was built in 1912 for the Baghdad Railway. Trains still cross it today.',
    },
    hints: [
      'A cotton bale is like a spring: land on it and it launches you. Watch out for mosquitoes!',
      'Dam gates: each time you step on a plate, the orange and blue stones swap places.',
    ],
    npcs: [
      {
        name: 'Master Halil, Kebab Maker',
        text: "Adana kebab is chopped with a zırh, and it's never mild! Don't forget the şalgam on the side, or it's only half a meal.",
      },
      {
        name: 'Sevgi the Boatwoman',
        text: 'The Seyhan is calm this season, but the raft still rocks. Time it right and jump into the middle.',
      },
    ],
    quips: [
      'Even the mosquito laughed.',
      'The Çukurova heat got to you.',
      'At least the Seyhan cooled you off.',
      'Up you get before the kebab cools!',
    ],
  },

  gaziantep: {
    subtitle: "Coppersmiths' Bazaar",
    item: 'Baklava',
    intro: "The clang of coppersmiths' hammers, pistachio orchards and the mosaics of Zeugma. From the castle gate to the bazaar, from the bazaar to the museum.",
    note: "The hammers in the coppersmiths' bazaar never fall silent; listen to the rhythm before you pass. Get the pistachio baklava, with light syrup.",
    facts: [
      {
        title: 'Antep Baklava',
        text: 'In 2013, Antep baklava became the first Turkish product to receive a geographical indication in the European Union.',
      },
      {
        title: 'Zeugma Mosaics',
        text: 'The Zeugma Mosaic Museum displays mosaics rescued from the ancient city on the banks of the Euphrates. The most famous is the "Gypsy Girl".',
      },
      {
        title: "Coppersmiths' Bazaar",
        text: 'Coppersmithing has gone on in Gaziantep for centuries. Craftsmen still hammer cauldrons, coffee pots and trays by hand.',
      },
    ],
    secret: {
      title: 'City of Gastronomy',
      text: 'In 2015, Gaziantep joined the UNESCO Creative Cities Network in the field of gastronomy.',
    },
    hints: [
      "Coppersmith's hammer: it shakes before it drops and its shadow turns red. Wait, then pass once it lifts.",
      'Pistachio orchard: the spring launches you into the trees. The key is on the highest branch, watch out for bees.',
      'Zeugma Museum: the buttons shift the walls and the bridge. The order matters.',
    ],
    npcs: [
      {
        name: 'Master Mehmet the Coppersmith',
        text: 'The hammer drops, waits, then slowly lifts. Stop when its shadow turns red, pass while it rises. Copper takes patience!',
      },
      {
        name: 'Zeynep, Museum Guide',
        text: "Zeugma's mosaics were rescued from the waters of the Euphrates. Two buttons, two walls: what you press and when really matters.",
      },
      {
        name: 'Şükrü the Castle Keeper',
        text: "Antep was given the title Gazi in 1921; this castle saw the city's resistance. Off you go, kiddo, this page of your notebook is done.",
      },
    ],
    quips: [
      "The hammer doesn't wait.",
      "The copper went red, don't you.",
      'Bees love baklava.',
      'Pistachio green suits you.',
    ],
  },

  mardin: {
    subtitle: 'Stone Terraces',
    item: 'Filigree',
    intro: 'Honey-coloured stone houses overlooking the Mesopotamian plain. Climb terrace by terrace and pass beneath the abbaras, the vaulted passages.',
    note: 'The stone houses turn honey-coloured in the evening sun. Sip a cup of mırra, the bitter local coffee, in the shade of the abbaras; you will get used to the bitterness.',
    facts: [
      {
        title: 'Honey-Coloured Stone',
        text: "Mardin's houses are built from the region's soft limestone. The stone is easy to carve, hardens as it meets the air and gives the city its honey colour.",
      },
      {
        title: 'Filigree',
        text: 'Telkari, or filigree, is a jewellery craft made by twisting and soldering fine silver wires. Midyat filigree is among the best-known examples of this art.',
      },
      {
        title: 'Kasımiye Madrasa',
        text: 'Kasımiye Madrasa was completed in the Akkoyunlu period, at the end of the 15th century. The water channel in its courtyard is likened to a journey symbolising a human life.',
      },
    ],
    secret: {
      title: 'Deyrulzafaran',
      text: 'For centuries, Deyrulzafaran Monastery was the seat of the Syriac Orthodox Patriarchate. Mardin is a city where Syriac, Arab, Kurdish and Turkish cultures live side by side.',
    },
    hints: [
      'Scorpions roam the terraces. Jump on them or dash into them.',
      'Cracked stones crumble when you step on them. Keep running!',
      'Wall climbing: press toward the wall and jump when you touch it. Bounce up to the opposite wall.',
      'Monastery cage: step on the plate to open the cage, then grab the key.',
    ],
    npcs: [
      {
        name: 'Master Cemil, Mırra Maker',
        text: "Mırra is bitter, you sip it slowly. Don't set the cup on the table, hand it back to me; otherwise, they say, you have to fill the cup with gold!",
      },
      {
        name: 'Meryem the Filigree Master',
        text: "This silver wire is finer than a hair. Impatient hands can't weave filigree, so don't rush on the walls either.",
      },
      {
        name: 'Gabriel the Cellar Keeper',
        text: "They say Deyrulzafaran's stones turn saffron-coloured in the sun, and that's where the name comes from. Find the cage plate, the key is inside.",
      },
    ],
    quips: [
      'Stones are patient, so be patient too.',
      "The terraces are waiting, don't rush.",
      'The scorpion laughed, I heard it.',
      'Catch your breath in the shade of the abbara.',
    ],
  },

  malatya: {
    nickname: 'Erik Diyarı',
    subtitle: 'Apricot Orchards',
    item: 'Apricot',
    intro: 'In June the branches turn orange. Bounce across apricot crates to cross the orchards and reach Aslantepe.',
    note: 'Come in June, when the branches turn orange. They spread the apricots on the rooftops to dry in the sun; take a handful and pop it in your pocket.',
    facts: [
      {
        title: 'Apricot Capital',
        text: "Türkiye is the world's largest producer of dried apricots, and most of that comes from Malatya. Malatya apricots carry a geographical indication.",
      },
      {
        title: 'Aslantepe Mound',
        text: 'Aslantepe Mound joined the UNESCO World Heritage List in 2021. Traces of one of the earliest known state structures were found there.',
      },
      {
        title: 'Battalgazi Great Mosque',
        text: "The Great Mosque in Battalgazi dates from the 13th-century Anatolian Seljuk period. Its brick and tile work make it one of the era's important monuments.",
      },
    ],
    secret: {
      title: 'Apricot Festival',
      text: 'Every summer Malatya holds an apricot festival, welcoming the harvest with celebrations.',
    },
    hints: [
      'An apricot crate is like a spring: land on it and it launches you.',
      'Bees sway in the air. Stomp on them or dash past. Dashing between crates carries you far.',
    ],
    npcs: [
      {
        name: 'Auntie Fadime, Apricot Grower',
        text: 'We dry them on the roof, sweetie, the sun makes them sweet. Take a handful, you will get hungry on the road!',
      },
      {
        name: 'Ali the Gardener',
        text: "Mind the crates! Jump on one and you'll fly to the other end of the orchard. And leave the bees alone.",
      },
    ],
    quips: [
      'One more apricot, the last one.',
      'The bees really liked you.',
      'The crate is springy, so be springy too.',
      'Even a dried apricot gets back up.',
    ],
  },

  corum: {
    nickname: 'Çorumçe',
    subtitle: 'Walls of Hattusa',
    item: 'Leblebi',
    intro: 'Hattusa, capital of the Hittites. Dodge the arrow traps, pass through the Yerkapı tunnel and reach the Lion Gate.',
    note: 'Leblebi is best eaten warm, and the stones of Hattusa are read with patience. Look up as you pass through the Lion Gate.',
    facts: [
      {
        title: 'Hattusa',
        text: 'Hattusa was the capital of the Hittite Empire and was added to the UNESCO World Heritage List in 1986. One of the entrances to the city is the Lion Gate.',
      },
      {
        title: 'Treaty of Kadesh',
        text: 'The Treaty of Kadesh, made between the Hittites and Egypt in the 13th century BC, is among the oldest known written peace treaties. Its Hittite copy is on clay tablets found at Hattusa.',
      },
      {
        title: 'Çorum Leblebi',
        text: 'Çorum is famous for its leblebi. Chickpeas are roasted and rested several times until they become leblebi; the process can take days.',
      },
    ],
    secret: {
      title: 'A Copy of Kadesh',
      text: 'A copy of the Treaty of Kadesh tablet is displayed in the United Nations building in New York.',
    },
    hints: [
      'Hittite arrow traps fire at regular intervals. Watch the rhythm and jump over the arrow.',
      'Yerkapı: a stone tunnel running under the walls. The ceiling is low, keep your jumps short!',
      'Alacahöyük: bounce between two walls to climb up to the key. When the ram spots you it flashes a warning, then charges.',
    ],
    npcs: [
      {
        name: 'Master Osman, Leblebi Roaster',
        text: 'Leblebi is roasted three times and rested three times. Haste invites trouble, so wait for the rhythm of the arrows the same way!',
      },
      {
        name: 'Defne the Archaeologist',
        text: 'These tablets are three thousand years old. I am still learning Hittite, but I was the first to find the word for "peace"!',
      },
    ],
    quips: [
      'The Hittite archers are still on duty.',
      'Leblebi gets roasted, you get seasoned.',
      'Three-thousand-year-old stone, one-second mistake.',
      'One more fall to carve on a tablet.',
    ],
  },

  ordu: {
    subtitle: 'Hazelnuts and Boztepe',
    item: 'Hazelnut',
    intro: 'The green slopes of the Black Sea. From the wavy shore to the hazelnut orchards, from the Boztepe cable car to Cape Jason.',
    note: "Look out over the Black Sea from Boztepe; the hazelnut orchards climb the slopes. It's never short of rain, so don't slip.",
    facts: [
      {
        title: 'Hazelnuts',
        text: "Türkiye is the world's largest hazelnut producer, and Ordu is the province that grows the most. Hazelnuts are picked in August and dried on the threshing floor.",
      },
      {
        title: 'Boztepe',
        text: 'Boztepe is a viewpoint looking down over the city and the Black Sea. You ride a cable car up from the shore.',
      },
      {
        title: 'Cape Jason',
        text: 'Cape Jason is a Black Sea headland linked to the legend of the Argonauts. A small, historic church stands at its tip.',
      },
    ],
    secret: {
      title: 'Jason Church',
      text: 'The little church on Cape Jason was built in the 19th century. It stands alone at the tip of the cape reaching into the sea.',
    },
    hints: [
      'Wild boars roam the slopes: jump on them or dash past. The wet rocks on the shore are slippery: slide down under the cliff, dash the moment you clear it, then wall-jump up between the two walls.',
      'Tree hollows hide secrets. Use the crate spring to reach the key and open the door.',
    ],
    npcs: [
      {
        name: 'Auntie Hatice, Hazelnut Grower',
        text: 'Hazelnuts are picked in August and dried on the threshing floor. Take a handful for energy; the wild boars love them as much as we do!',
      },
      {
        name: 'Murat, Cable Car Attendant',
        text: 'You get up to Boztepe by cable car. The cabins come and go, so time it right and jump from one to the next.',
      },
    ],
    quips: [
      'The Black Sea wave laughed.',
      'You cracked like a hazelnut shell.',
      'Did the boar run off, or did you?',
      "The cable car doesn't wait.",
    ],
  },

  sivas: {
    subtitle: 'Frozen Kızılırmak',
    item: 'Kangal Badge',
    intro: 'Snow, ice and Seljuk stonework. Keep your balance on the slippery ground and climb between the minarets.',
    note: "Kangals guard the flock, so stick to their path. Don't rush on the ice; the Kızılırmak begins here.",
    facts: [
      {
        title: 'Divriği Great Mosque',
        text: 'The Divriği Great Mosque and Hospital were among the first sites in Türkiye added to the UNESCO World Heritage List, in 1985. The carving on their stone portals is considered unique in the world.',
      },
      {
        title: 'Sivas Congress',
        text: 'The Sivas Congress met from 4 to 11 September 1919. It was one of the turning points of the National Struggle.',
      },
      {
        title: 'The Kangal Dog',
        text: "The Kangal shepherd dog takes its name from Sivas's Kangal district. It is a calm, powerful guardian that protects the flock from wolves.",
      },
    ],
    secret: {
      title: 'Gök Madrasa',
      text: 'The Gök Madrasa in Sivas was built in 1271. Its tiled facade is an important example of Seljuk architecture.',
    },
    hints: [
      'Ice is slippery! Press the opposite direction to stop.',
      'Twin Minaret Madrasa: bounce from wall to wall to climb between the minarets.',
      'Gök Madrasa puzzle: the orange wall and the orange steps come and go with the same plate. Go in, shut the door behind you, take the key; think again before you leave.',
    ],
    npcs: [
      {
        name: 'Mehmet the Shepherd and Karabaş',
        text: "This Kangal's name is Karabaş. He stands firm when he sees a wolf and wags his tail when he sees you. Don't run on the ice, you'll slide!",
      },
      {
        name: 'Zehra, Madrasa Keeper',
        text: 'The Twin Minaret has stood here since 1271. Climb between the minarets and you will see the city from above.',
      },
    ],
    quips: [
      'Karabaş shook his head.',
      'Ice is unforgiving.',
      "Even the Kızılırmak doesn't twist like that.",
      "The Kangal's watching. How embarrassing.",
    ],
  },

  ardahan: {
    subtitle: 'Frozen Çıldır',
    item: 'Sleigh Bell',
    intro: "One of Türkiye's coldest highlands. Cross frozen Lake Çıldır over cracking ice, leap from slippery ice floes and climb to Şeytan Castle.",
    note: 'In winter Lake Çıldır freezes and horse-drawn sleighs glide across it. The ice is thin, so keep running; the road to the castle is cold, but the view is beautiful.',
    facts: [
      {
        title: 'Lake Çıldır',
        text: 'Lake Çıldır freezes in winter. Horse-drawn sleighs glide over the ice, and people fish through holes cut into it.',
      },
      {
        title: 'The Silhouette at Damal',
        text: "Every year toward the end of June in Damal, the mountain's shadow forms a silhouette resembling Atatürk's face, and thousands of people come to watch.",
      },
      {
        title: 'Ardahan Castle',
        text: "Ardahan Castle rises on the bank of the Kura River. It is one of the city's best-known historic buildings.",
      },
    ],
    secret: {
      title: 'The Height of Çıldır',
      text: 'Lake Çıldır lies about 1960 metres above sea level and is one of the large lakes of Eastern Anatolia.',
    },
    hints: [
      'In Ardahan the wind pushes you back. Ice is slippery, press the opposite direction to stop.',
      'Frozen lake: cracked ice breaks when you step on it. Keep running and jump over the holes.',
      'Ride the platform that glides like a horse-drawn sleigh. The key is on an ice floe, and the dash ring will get you there.',
    ],
    npcs: [
      {
        name: 'Uncle Erdal the Sleigh Driver',
        text: "When the lake freezes we bring out the horse sleighs. If the ice cracks, don't you dare stop, run right across!",
      },
      {
        name: 'Nermin, Castle Keeper',
        text: "You climb up to Şeytan Castle between two rocks. Bounce from wall to wall, and don't let the wind carry you off.",
      },
    ],
    quips: [
      "The ice didn't hold this time.",
      'The wolves howled.',
      "Çıldır's water is ice cold.",
      "Even a sleigh doesn't slide like that.",
    ],
  },

  amasya: {
    subtitle: 'Both Banks of the Yeşilırmak',
    item: 'Apple',
    intro: 'From the bay windows of the riverside houses to the Royal Rock Tombs, from Ferhat’s water channel to the Sultan Bayezid II Complex. The city of princes, squeezed between the mountain and the river.',
    note: 'The Yeşilırmak splits the city in two: riverside houses on one bank, royal tombs carved into the rock on the other. Eat a misket apple straight from the branch, and at dusk watch the lights fall on the river.',
    facts: [
      { title: 'The Royal Rock Tombs', text: 'The monumental tombs on the slope of Mount Harşena were carved into the rock for the kings of Pontus in the Hellenistic period. They can be seen from almost anywhere in the city.' },
      { title: 'The Amasya Circular', text: 'Mustafa Kemal Pasha and his companions issued the Amasya Circular on 22 June 1919. It declared that the nation’s independence would be saved by the nation’s own resolve and determination.' },
      { title: 'City of Princes', text: 'Ottoman princes served as governors in Amasya to learn how to run the state. That is why it is called the “City of Princes”.' },
    ],
    secret: { title: 'Strabo', text: 'Strabo, the famous geographer of antiquity, was born in Amasya. He described his home city in his work “Geographica”.' },
    hints: [
      'Welcome to Amasya! The bay windows of the riverside houses are steps: hop from house to house, and climb the tallest roof too.',
      'The Royal Rock Tombs: climb the rock steps to the top. Where you cannot reach, jump at the wall and jump again when you touch it.',
      'Ferhat’s Water Channel: step on the plate and the blue bridge appears while the orange one lifts. The second plate brings the orange back.',
      'The Sultan Bayezid II Complex: cross the domes into the courtyard. The square gate is at the far end.',
    ],
    npcs: [
      { name: 'Auntie Bedriye the Apple Seller', text: 'A misket apple is small, but its scent fills the street, my dear; take a bite, it smells wonderful. Three rolled out of my basket, and one got as far as the rooftops. Pick them up if you see them.' },
      { name: 'Tolga the Guide', text: 'These tombs were carved into the rock for the kings of Pontus. They look small from below; stand beside one and you feel like an ant. Take a look at the dark opening on the right face of the big rock too. It is not empty.' },
      { name: 'Uncle Lütfü the Channel Keeper', text: 'You know Ferhat and Şirin: to win Şirin, Ferhat was to cut through the mountain and bring water to the city. The channel is still here. Step on the plates in order; that is how the water and the road both open.' },
    ],
    quips: ['The apple does not fall far from the tree.', 'Did the Yeşilırmak cool you off?', 'Ferhat cut through the mountain. You fell.', 'The kings are watching from above.'],
  },

  mugla: {
    subtitle: 'From Bodrum to Ölüdeniz',
    item: 'Sea Sponge',
    intro: 'From the bastions of Bodrum Castle to the windmills, from the rock tombs of Dalyan to İztuzu Beach, from Babadağ down to Ölüdeniz. Aegean blue, whitewash white, bougainvillea pink.',
    note: 'The Aegean meets the Mediterranean here. In Bodrum, climb to the castle between whitewashed houses; in Dalyan, give way to the turtles; from Babadağ, look down on Ölüdeniz. The meltem is always at your back.',
    facts: [
      { title: 'Bodrum Castle', text: 'Bodrum Castle was built by the Knights of St John in the 15th century. Today it is the Museum of Underwater Archaeology, displaying finds raised from ancient shipwrecks.' },
      { title: 'The Mausoleum at Halicarnassus', text: 'Built for King Mausolus, the Mausoleum at Halicarnassus was one of the Seven Wonders of the Ancient World. The word “mausoleum” comes from his name.' },
      { title: 'İztuzu Beach', text: 'İztuzu Beach in Dalyan is a nesting ground of the loggerhead sea turtle, Caretta caretta. The nests are protected.' },
    ],
    secret: { title: 'Herodotus', text: 'Herodotus, known as the “Father of History”, was born in ancient Halicarnassus, today’s Bodrum.' },
    hints: [
      'Welcome to Muğla! The meltem blows at your back. At Bodrum Castle, climb from the step onto the bastion and cross the plank to the next one.',
      'The windmills: board the platform as it comes close. On the stones the wind stretches your jump; let the arrow pass, then wall-jump up the mill.',
      'The Dalyan rock tombs: climb from the step to the top of the rock. The wet sand of İztuzu is slippery, so stop early.',
      'Babadağ: zigzag up the planks; jumping left the wind pushes you back, so go when the gust dies down. Wall-jump up the rock spire and dash from its top. The square gate is on the beach.',
    ],
    npcs: [
      { name: 'Captain Hayri the Sponge Diver', text: 'Divers used to hold their breath and bring Bodrum’s sponges up from the seabed. A good one is soft; it soaks up water and will not let go. Three went overboard with a wave; if you find them, put them in your notebook.' },
      { name: 'Auntie Naciye the Miller', text: 'These mills turn with the meltem and grind wheat into flour, my dear. Put the wind behind you and your jump grows longer; mind you do not overshoot the shore.' },
      { name: 'Ege the Volunteer', text: 'We light no lamps on İztuzu at night: the loggerheads lay their eggs in this sand, and the hatchlings find the sea by moonlight. Did you see the dark opening on the left face of the rock tomb? Something is hidden inside.' },
    ],
    quips: ['You soaked that up like a sponge.', 'The meltem blew a little too hard.', 'You forgot the parachute.', 'Even a turtle is more careful.'],
  },

  bayburt: {
    nickname: 'Uktun',
    subtitle: 'Castle and Storm',
    item: 'Kopuz',
    intro: 'From the banks of the Çoruh to Bayburt Castle. The wind blows from the west and pushes you back. You have learned everything, now put it to use.',
    note: 'The end of the road is where I began. Look down at the Çoruh from the castle tower, and wave to me too.',
    facts: [
      {
        title: 'The Least Populous Province',
        text: "Bayburt is Türkiye's least populous province. The city is built on both banks of the Çoruh River.",
      },
      {
        title: 'Dede Korkut',
        text: "Dede Korkut's grave is believed to be in the village of Masat in Bayburt. Every year the city holds a cultural festival in his name.",
      },
      {
        title: 'Baksı Museum',
        text: 'The Baksı Museum, founded in a village in Bayburt, won the Council of Europe Museum Prize in 2014.',
      },
    ],
    secret: {
      title: 'Cirit',
      text: 'The tradition of cirit lives on in Bayburt: riders on horseback compete by throwing wooden javelins at each other.',
    },
    hints: [
      'The wind is pushing you back. Over long gaps, jump and dash at the top of your jump.',
      'Baksı courtyard: step on the plate to make the blue steps appear. When the ram flashes a warning, step aside.',
    ],
    npcs: [
      {
        name: 'Dede Korkut the Bard',
        text: 'Tell your story like Dede Korkut, child: let the kopuz string be tight and every word find its place. Lean into the wind and walk on.',
      },
      {
        name: 'Rıza the Castle Keeper',
        text: 'The wind always blows from the west here. Another traveller with a notebook like yours came by once, I remember. Go on, the last page is waiting for you.',
      },
    ],
    quips: [
      'The wind is a joker.',
      'Say hello to the Çoruh.',
      'The castle has been patient for centuries.',
      'Dede Korkut will tell this one too.',
    ],
  },
  rize: {
    subtitle: 'From the Tea Gardens to the Highlands',
    item: 'Tea',
    intro: 'From the terraces of the tea gardens to the stone arch bridges of the Fırtına stream, from Zil Castle in the forest to the Ayder Highlands. Every shade of green, every sound of rain.',
    note: 'In Rize the rain is not a guest, it is the host. The slopes are tea gardens from top to bottom; the Fırtına stream foams beneath the stone bridges. Drink a deep-red tea from a tulip glass, then head up to the highlands.',
    facts: [
      { title: 'The Capital of Tea', text: 'Tea in Türkiye is grown in and around Rize. The first tea factory opened in Rize in 1947; today almost every slope is a tea garden.' },
      { title: 'Zil Castle', text: 'Zil Castle stands on a high crag in the forest of the Fırtına Valley and dates from the Middle Ages. On misty days it peeks out between the clouds.' },
      { title: 'Stone Arch Bridges', text: 'Single-arched stone bridges have stood over the Fırtına stream for centuries. The best known is the Şenyuva Bridge.' },
    ],
    secret: { title: 'The Tulum', text: 'In the Hemşin highlands the horon dance is played on the tulum, a bagpipe made of goatskin; its sound carries from valley to valley.' },
    hints: [
      'Welcome to Rize! The terraces of the tea gardens are steps: climb them row by row, and do not slip in the rain.',
      'The Fırtına stream: this water is deep but it will not drown you. Get in and press jump to swim a stroke; a stroke at the surface lifts you out.',
      'Stone arch bridges: jump onto the piers and cross over the arch. Then dive under the rock: stop stroking and sink to pass.',
      'From Zil Castle to the Ayder Highlands: climb from the crag to the pasture. The square gate is in front of the highland houses.',
    ],
    npcs: [
      { name: 'Uncle Hamdi the Tea Maker', text: 'Brewing tea takes patience, my child: not with boiling water, but water that has rested a little. In a tulip glass it should be deep red. Three leaves blew off the slope; one went all the way to the bottom of the stream.' },
      { name: 'Auntie Nazmiye the Tea Picker', text: 'I have been on the slope since morning with this basket on my back, dear; you pick only the two youngest leaves and a bud. The rain never stops here, but the tea grows with this very rain.' },
      { name: 'Bayram the Tulum Player', text: 'I fill up my tulum once and the whole valley gets up to dance the horon! Take a look under the bridge: there is a hollow on the dark side of the stream, and you can only get in by swimming.' },
    ],
    quips: ['The rain got you too.', 'Get up before the tea goes cold!', 'The Fırtına stream is no joke.', 'Brew another glass.'],
  },
  artvin: {
    subtitle: 'The Slopes of the Çoruh',
    item: 'Honeycomb',
    intro: 'From houses clinging to the slope to the village cable lines, from the valley of the wild Çoruh to the forests of Macahel and the Kafkasör pasture. Every road is uphill or downhill.',
    note: 'Flat ground is hard to find in Artvin: houses cling to the slopes and villages are linked by cable lines. Below, the Çoruh rushes wildly; above, bulls wrestle on the Kafkasör pasture. Do not leave without tasting Macahel honey.',
    facts: [
      { title: 'The Kafkasör Pasture', text: 'At the festival held every summer on the Kafkasör pasture, bulls wrestle one another. They push head to head; the bull that gives way leaves the ring.' },
      { title: 'Macahel', text: 'Camili-Macahel became a UNESCO Biosphere Reserve in 2005, the first in Türkiye. Its forests, bears and bees are protected.' },
      { title: 'The Wild Çoruh', text: 'The Çoruh is one of the fastest-flowing rivers in Türkiye. It runs through deep valleys and carries dams and rafting courses.' },
    ],
    secret: { title: 'The Caucasian Bee', text: 'The Caucasian honeybee of Macahel has a long tongue, so it can reach nectar deep inside flowers. Its bloodline is carefully protected.' },
    hints: [
      'Welcome to Artvin! The houses cling to the slope: hop from roof to roof; dash across the wide gap and bounce between the bay window and the wall.',
      'The village cable line: jump up under the wire and hang on. Move along hand over hand; jump or press down to drop straight down.',
      'The Çoruh valley: touch a hanging rope in mid-air to grab it. Climb up, and jump to let go.',
      'The Kafkasör pasture: wire to wire, rope to rope, up to the pasture. The square gate is in front of the wrestling ring.',
    ],
    npcs: [
      { name: 'Uncle İsmet the Beekeeper', text: 'The Macahel bee is a gentle bee, my child, but it knows its own hive. Three pieces of honeycomb rolled away; one ran off all the way to the far end of the wire.' },
      { name: 'Auntie Nazife from the Pasture', text: 'When summer comes we take the cows up to the pasture, dear. On Kafkasör the bulls wrestle; our Karabaş beat three bulls last year!' },
      { name: 'Doğan the Cable Man', text: 'Here there is a wire between villages instead of a road; we sit in a basket and the wire carries us. Stop at the very end of the rope and look down: something glints in a crack in the rock.' },
    ],
    quips: ['The slope beat you.', 'Hold the wire tight!', 'The Çoruh does not forgive.', 'Even the bull is more careful.'],
  },
  kars: {
    subtitle: 'From Ani to Sarıkamış',
    item: 'Gruyère',
    intro: 'From streets of stone buildings to Kars Castle, from the Scots pine forests of Sarıkamış to icy slopes and Ani, the city of a thousand and one churches. The white of snow, the grey of stone.',
    note: 'Winter is long in Kars, but its streets are warm. Climb to the castle between the stone buildings, ski through the snowy pines of Sarıkamış, and in the evening watch the sunset among the ruined churches of Ani. Take a slice of gruyère home.',
    facts: [
      { title: 'Ani', text: 'The archaeological site of Ani joined the UNESCO World Heritage List in 2016. In the Middle Ages it was a crowded capital, remembered as “the city of a thousand and one churches”.' },
      { title: 'The Stone Buildings', text: 'In the centre of Kars there are stone buildings in the Baltic style. Most were built in the late 19th and early 20th centuries.' },
      { title: 'Sarıkamış', text: 'Sarıkamış is known for its ski resort among Scots pine forests. The snow here is dry and powdery; skiers call it “crystal snow”.' },
    ],
    secret: { title: 'Gruyère', text: 'It is said that Swiss cheesemakers who came to the region in the 19th century taught how to make Kars gruyère. The great wheels ripen for months in cellars.' },
    hints: [
      'Welcome to Kars! The eaves of the stone buildings are steps: hop from eave to eave and stop before you slide in the snow.',
      'Kars Castle: touch the rope hanging from the wall in mid-air to grab it. Climb up and jump onto the bastion.',
      'The Sarıkamış slope: icy snow is slippery. Slow down early and stop before the edge.',
      'The ruins of Ani: cross over the broken walls, rope to rope. The square gate is in front of the cathedral.',
    ],
    npcs: [
      { name: 'Master Adem the Cheesemaker', text: 'Gruyère is a matter of patience, my child: we turn the wheel in the cellar for months and wait. I had cut three slices and they fell on the snow; one rolled all the way to the top of the castle!' },
      { name: 'Melek the Skier', text: 'The snow of Sarıkamış is like powder; it sings under your skis. On ice there are no brakes, though: slow down before you reach the edge.' },
      { name: 'Professor Leyla the Archaeologist', text: 'Every stone in Ani has a story. Climb onto the broken wall behind the cathedral; from up there you can see a hollow that nobody else notices.' },
    ],
    quips: ['The snow gave you a hug.', 'No brakes on ice!', 'Even the goose laughed.', 'Ani has waited a thousand years; no rush.'],
  },
  bitlis: {
    subtitle: 'The Castle in the Valley, the Lake in the Crater',
    item: 'Büryan',
    intro: 'From the stone houses on both banks of the stream to Bitlis Castle in the middle of the valley, from the carved gravestones of Ahlat to the crater lake of Mount Nemrut. A road born of stone, water and fire.',
    note: 'Bitlis is built in a narrow valley; the houses are stone and the streets run beside the stream. The castle stands on a rock in the middle of the city. At Ahlat look at the carvings on the gravestones, and at Tatvan go down to the lake in Nemrut’s crater.',
    facts: [
      { title: 'Nemrut Crater Lake', text: 'In the crater of Mount Nemrut near Tatvan lies one of the largest crater lakes in the world. There are both cold and hot springs inside the crater.' },
      { title: 'The Ahlat Gravestones', text: 'The Seljuk Meydan Cemetery of Ahlat is the largest Turkish-Islamic cemetery in Anatolia. Its gravestones are carved as finely as lace.' },
      { title: 'Bitlis Castle', text: 'Bitlis is built in a narrow valley. Bitlis Castle sits on a rock rising in the middle of the valley and looks down on the city.' },
    ],
    secret: { title: 'The Şerefname', text: 'The Şerefname, written by Şeref Khan, lord of Bitlis, at the end of the 16th century, is one of the most important works on the history of the region.' },
    hints: [
      'Welcome to Bitlis! Stone houses line both banks of the stream: hop from roof to roof and cross the bridge.',
      'Bitlis Castle: touch the rope hanging from the rock in mid-air to grab it. Climb with ↑↓ or jump and grab again, then cross to the next rope.',
      'The Ahlat gravestones: climb to the top of the tall stones and leap from stone to stone. The last gap is wide: jump, then dash in mid-air.',
      'Nemrut Crater Lake: the lake is deep, but you can swim it. Jump to stroke; a stroke at the surface lifts you out. The square gate is on the shore.',
    ],
    npcs: [
      { name: 'Master Ferit the Büryan Cook', text: 'We cook büryan in a pit, my child: the lamb hangs over a slow fire for hours until the meat falls off the bone by itself. I had three plates ready, and the wind blew one to the very top of the castle!' },
      { name: 'Uncle Celal the Stonemason', text: 'Ahlat stone is soft; you can carve it like lace with a chisel. But underfoot it is solid, so leap from stone to stone without fear.' },
      { name: 'Auntie Zübeyde of the Lake', text: 'Nemrut’s lake sits in the heart of the volcano, dear; one side is ice cold, the other warm. Near the bottom, in the shadow of the rock, something sparkles; only someone who dives will find it.' },
    ],
    quips: ['The valley is deep and you are quick.', 'You let go of the rope!', 'The crater swallowed you… luckily you can swim.', 'Get up before the büryan goes cold.'],
  },
  agri: {
    subtitle: 'From the Palace Gate to the Summit',
    item: 'Kilim',
    intro: 'From the streets of Doğubayazıt to the courtyards of İshak Pasha Palace, from the Meteor Crater to the snowy slopes of Mount Ağrı. The summit of the second notebook, the roof of Türkiye. From here the road runs west, down to the sea and the white steps.',
    note: 'The last page of the notebook was written in the mountain’s shadow. Pass through the gate of İshak Pasha Palace in Doğubayazıt, lean over the Meteor Crater, then climb Mount Ağrı. At the summit the wind is fierce and the view endless.',
    facts: [
      { title: 'Mount Ağrı', text: 'At 5,137 metres, Mount Ağrı is the highest mountain in Türkiye. Its summit is covered in snow and glacier all year round.' },
      { title: 'İshak Pasha Palace', text: 'İshak Pasha Palace in Doğubayazıt is thought to have been completed in 1784. It brings Ottoman, Seljuk and Persian architecture together.' },
      { title: 'The Meteor Crater', text: 'The Meteor Crater near Doğubayazıt is thought to have been made by a meteorite that fell at the end of the 19th century.' },
    ],
    secret: { title: 'Ahmed-i Hani', text: 'The tomb of the poet Ahmed-i Hani, who wrote the epic Mem and Zin, stands on the hillside right next to İshak Pasha Palace.' },
    hints: [
      'Welcome to Ağrı! Climb from the rooftops of Doğubayazıt toward the palace. The mountain wind blows in your face.',
      'İshak Pasha Palace: cross from courtyard to courtyard on ropes. Climb, jump, catch the next rope; dash from the last one to the terrace.',
      'The Meteor Crater: the pit is deep. Hang from the wire and cross over it, and do not look down.',
      'Mount Ağrı: stop early on the ice; the wind shortens your jumps. Dash off the rope over the crevasse, wall-jump up the chimney; the summit cable reaches the camp.',
    ],
    npcs: [
      { name: 'Auntie Zozan the Weaver', text: 'We weave a kilim knot by knot on the loom, dear; every pattern is a prayer, every colour a pasture flower. The wind took three of my kilims, and one landed on the palace roof!' },
      { name: 'Uncle Bedirhan the Shepherd', text: 'I play the kaval as I take the flock up the slope; the sheep know my tune. The mountain wind blows hard, my child, so count it in when you jump.' },
      { name: 'Rojda the Mountaineer', text: 'I have climbed to the summit ten times and seen a different face of the mountain each time. On the far side of the crater, below where the wire ends, there is a stone hollow; most climbers never notice it.' },
    ],
    quips: ['The mountain turned you back.', 'The wind won this time.', 'The summit is not going anywhere.', 'The corner of the kilim slipped.'],
  },
  giresun: {
    subtitle: 'The City That Named the Cherry',
    item: 'Cherry',
    intro: 'From the narrow lanes of Zeytinlik to Giresun Castle, down the slopes of the hazel groves to the Black Sea shore. Across the water a lone island; boats come and go.',
    note: 'Coming down from the mountain, the road turned back to the sea. In Giresun, climb to the castle between the old houses of Zeytinlik, come down through the hazel groves, look out at the island from the shore. Cherries smell different here.',
    facts: [
      { title: 'Kerasus', text: 'Giresun’s ancient name is Kerasus. Legend has it that the cherry spread to Europe from here, with saplings taken by the Roman general Lucullus.' },
      { title: 'Giresun Island', text: 'Giresun Island is known as the only island of the eastern Black Sea. Cormorants and gulls nest on its rocks.' },
      { title: 'The Aksu Festival', text: 'At the Aksu Festival, held every May, boats sail around the island and people throw stones into the water with a wish.' },
    ],
    secret: { title: 'The Round Hazelnut', text: 'The Giresun round hazelnut carries a geographical indication; its name, tombul, comes from its round, plump kernel.' },
    hints: [
      'Welcome to Giresun! Climb from the rooftops of Zeytinlik toward the castle.',
      'Giresun Castle: the towers are far apart. Run and jump; dash at the long ones.',
      'The hazel groves: the slope is steep, wall-jump from wall to wall. Grab the red canister: nitro speeds you up.',
      'The shore: the boats come and go. Jump when one comes alongside and cross on its back.',
    ],
    npcs: [
      { name: 'Nesrin the Cherry Seller', text: 'You eat cherries straight from the branch; once they go in the basket the taste changes! The wind scattered three of my plates: one landed on the castle tower, one at the top of the grove, one on the boatmen’s jetty.' },
      { name: 'Uncle Mustafa the Hazel Farmer', text: 'When we pick hazelnuts we cling from wall to wall on the slope; it is steep. Part of the stone wall at the very top of the grove is false: whoever walks into it finds a hidden corner.' },
      { name: 'Hızır the Boatman', text: 'At Aksu the boats circle the island and everyone whispers a wish to a stone and throws it in the water. The boats come and go; don’t get caught by the waves, board when one comes alongside.' },
    ],
    quips: ['The cherry stayed on the branch.', 'A Black Sea wave took you.', 'You rolled like a hazelnut.', 'You missed the boat.'],
  },
  tokat: {
    subtitle: 'Patterns From the Block',
    item: 'Printed Scarf',
    intro: 'From the inns of Sulusokak to Tokat Castle, from the print workshops to Zile Castle. The wooden blocks come down on the cloth and lift again; whoever gets the timing right gets through.',
    note: 'In Tokat everything is neat as if pressed from a block: the stone inns of Sulusokak, the printer’s wooden blocks, the castle’s steep stairs. When I reached Zile I remembered a Roman general’s three words.',
    facts: [
      { title: 'Zile Castle', text: 'In 47 BC Julius Caesar reported his victory at Zile (Zela) to Rome with the words “Veni, vidi, vici” (I came, I saw, I conquered).' },
      { title: 'Tokat Prints', text: 'Tokat printed scarves are pressed by hand with carved wooden blocks; a separate block is used for every colour in the pattern.' },
      { title: 'Ballıca Cave', text: 'Ballıca Cave in the Pazar district is known for its stalactites and stalagmites, formed drop by drop over millions of years.' },
    ],
    secret: { title: 'Taşhan', text: 'Taşhan (the Voyvoda Inn) in Sulusokak was built in the 17th century; handicrafts are sold today in the two-storey rooms around its courtyard.' },
    hints: [
      'Welcome to Tokat! Walk to the castle between the inns of Sulusokak.',
      'Tokat Castle: the rock is steep. Grab the rope, climb; at the top, wall-jump from wall to wall.',
      'The print workshop: the wooden blocks come down and lift again. Go when they lift, never stand under one coming down.',
      'Zile Castle: the gaps between the walls are long and spiked. Jump, dash, cling to the wall.',
    ],
    npcs: [
      { name: 'Hacer the Printer', text: 'Press the block in the dye, strike the cloth: the pattern sets once and never fades. I forgot three of my scarves; one on the inn’s roof, one at the top of the castle, one in the workshop’s loft.' },
      { name: 'Rıfat the Innkeeper', text: 'Caravans used to rest in the courtyard of Taşhan; now tea is brewing there. In the workshop, past the last block, jump at the ceiling: somewhere the gap between the beams is open, and it leads up to a hidden room.' },
      { name: 'Uncle Ali the Watchman', text: 'They say Caesar came here, saw and conquered. You have come to the castle too; to conquer it, mind the spikes on the walls first and jump early.' },
    ],
    quips: ['The block got you.', 'The pattern slipped.', 'You came, you saw, you fell.', 'The scarf got creased.'],
  },
  denizli: {
    subtitle: 'The White Steps of Pamukkale',
    item: 'Towel',
    intro: 'From the rooster square of the bazaar to the columns of Laodicea, from the wet travertines of Pamukkale to the theatre of Hierapolis. The last stop of the second notebook.',
    note: 'The last page of the notebook is white. In Denizli the roosters crow at dawn, the columns of Laodicea warm in the sun, warm water trickles down the steps of Pamukkale. The road ends here, on a snow-white slope.',
    facts: [
      { title: 'Pamukkale', text: 'The white travertines of Pamukkale are made of the deposits that calcium-rich hot water has left over thousands of years. Together with Hierapolis they were added to the UNESCO World Heritage List in 1988.' },
      { title: 'Hierapolis', text: 'The ancient city of Hierapolis has a theatre, a necropolis and the Antique Pool; people swim among fallen columns in the pool’s warm water.' },
      { title: 'The Denizli Rooster', text: 'The Denizli rooster is famous for its long, loud crow; it is the symbol of the city and its statues stand in the squares.' },
    ],
    secret: { title: 'Laodicea', text: 'Laodicea is the ancient city that was home to one of the seven churches named in the Bible; excavations have brought its colonnaded streets back to light.' },
    hints: [
      'Welcome to Denizli! Walk from the rooster square to the columns. The red canister is nitro: grab it and run.',
      'Laodicea: the tops of the columns are narrow. Jump, dash if you need to; the gaps between fallen columns are empty.',
      'The travertines of Pamukkale: the stone is wet and slippery. Stop early, jump from pool to pool; swim in the deep pool.',
      'The theatre of Hierapolis: the steps are tall. Wall-jump from wall to wall and dash to the top row.',
    ],
    npcs: [
      { name: 'Gülten the Towel Seller', text: 'Denizli towels are cotton, soft as anything! The wind snatched three from my drying line: one landed on the rooster’s head, one on top of a column, one by the edge of a travertine pool.' },
      { name: 'Uncle Cemal the Rooster Keeper', text: 'My rooster crows longer than any other and always wins the contests! Look at the foot of the columns in Laodicea: there is a cracked stone, and when it breaks the hidden room beneath shows.' },
      { name: 'Defne the Guide', text: 'You walk the travertine barefoot; the stone is wet and slippery, so stop early. The pools are shallow, but you can swim in the big pool below.' },
    ],
    quips: ['You slipped on the travertine.', 'The rooster laughed at you.', 'The towel got wet.', 'The column fell, and so did you.'],
  },
  mersin: {
    subtitle: 'Tide, Castle and Sinkhole',
    item: 'Cezerye',
    intro: 'From Mersin Harbour to Kızkalesi out at sea, from the Heaven and Hell sinkholes of Silifke to Cleopatra’s Gate in Tarsus. On this road the sea breathes in and out: watch the tide.',
    note: 'This page of the notebook is salty, its edges curled by the waves. In Mersin the sea comes and goes like a breath: the water rises and the beach disappears; it ebbs and the mouths of the caves open. Do not hurry on this road; listen to the sea.',
    facts: [
      { title: 'Kızkalesi', text: 'Kızkalesi, standing on an islet a few hundred metres off the shore, dates from the Middle Ages. Legend says a king built it to keep his daughter safe from a snake; the snake came all the same, hidden in a basket of grapes.' },
      { title: 'Heaven and Hell', text: 'You go down hundreds of steps into the Heaven sinkhole in Silifke; a small church stands at the mouth of the cave at its bottom. Nobody climbs down the sheer walls of the Hell sinkhole beside it: legend says Zeus imprisoned the monster Typhon there.' },
      { title: 'Tarsus', text: 'Tarsus is the city where Saint Paul was born. Cleopatra is said to have passed through Cleopatra’s Gate in 41 BC on her way to meet Mark Antony.' },
    ],
    secret: { title: 'Yumuktepe', text: 'At the Yumuktepe mound in the middle of the city, traces of nearly nine thousand years of settlement were found: under Mersin, villages and castles sleep layer upon layer.' },
    hints: [
      'Welcome to Mersin! Here the sea breathes: the water rises, then ebbs. Try it in the dip ahead: walk when it is low, swim when it is high.',
      'Harbour basin: when the water rises, swim and leap onto the floating pier. When it ebbs, walk along the bottom. The line of foam shows where the water is heading.',
      'Kızkalesi: at low tide walk through the sea cave under the castle; at high tide dive. Climb to the castle roof from the balcony at high tide.',
      'The Heaven and Hell sinkholes: go down into Heaven by the steps and wall-jump your way out. Jump over Hell!',
      'Tarsus: pass through Cleopatra’s Gate. The cliffs of the waterfall are high: wall-jump your way up.',
    ],
    npcs: [
      { name: 'Master Cevdet, Tantuni Maker', text: 'My griddle has sizzled for forty years, and no tantuni leaves it without lemon! I lost three slices of cezerye: one on the floating pier in the harbour, one on the roof of Kızkalesi, one at the bottom of the Heaven sinkhole.' },
      { name: 'Auntie Nazlı the Storyteller', text: 'The king had a castle built in the middle of the sea to keep his daughter safe from a snake. But the snake came hidden in a basket of grapes! Want to climb to the castle roof? When the water rises, swim and leap onto the balcony.' },
      { name: 'Emre the Guide', text: 'You go down into Heaven by hundreds of steps; nobody can reach the bottom of Hell. Take a look into the dark mouth under the steps: someone left a stamp in front of the old church.' },
      { name: 'Bülent the Tea Seller', text: 'They say Cleopatra passed through this gate; I pass through it every morning too, tray in hand! Wall-jump up the cliffs of the waterfall; Saint Paul’s Well is up there.' },
    ],
    quips: ['The sea took you back.', 'The snake giggled in its basket.', 'You missed the tide.', 'Your tantuni went cold.'],
    nickname: 'İçel',
  },
  karabuk: {
    subtitle: 'Mansion, Canyon and Steel',
    item: 'Saffron',
    intro: 'From the Safranbolu Bazaar to Tokatlı Canyon, from Bulak Mencilis Cave to the rolling mill of Karabük Iron and Steel. On this road there are rooftops, glass walkways and hammers: trust your timing.',
    note: 'This page of the notebook is saffron yellow, with a soot stain on the edge. In Karabük the timber rooftops of the bazaar, the glass walkway of the canyon and the hammers of the rolling mill all come together: the road wants haste, but it is walked with patience. Count the strikes, read the gates.',
    facts: [
      { title: 'Safranbolu', text: 'The timber mansions with overhanging upper floors and Cinci Han carry the old bazaar into the present. The town joined the UNESCO World Heritage List in 1994, and its name comes from the saffron grown here.' },
      { title: 'Tokatlı Canyon', text: 'Among the steep cliffs of Tokatlı Canyon near Safranbolu there are a walking path and glass viewing terraces. A stream runs far below.' },
      { title: 'Karabük Iron and Steel', text: 'Karabük Iron and Steel is Turkey’s first integrated iron and steel works and started production in 1939. The city of Karabük grew up around this factory.' },
    ],
    secret: { title: 'Saffron', text: 'Saffron is one of the most expensive spices in the world: a single kilo takes hundreds of thousands of flowers picked by hand, one by one. The colour and scent of Safranbolu delight come from it.' },
    hints: [
      'Welcome to the Safranbolu Bazaar! The rooftops of the overhanging mansions rise step by step: hop from roof to roof and climb onto the roof of Cinci Han.',
      'Tokatlı Canyon: the glass walkway is cracked stone, so do not stop, run! Hop the one-tile gaps; then wall-jump between the two walls.',
      'Bulak Mencilis Cave: stalactites hang from the ceiling. The pond is in two halves: dive under the rock curtain and take a breath in the middle. Look at the dark mouth on the right face of the rock.',
      'Karabük Iron and Steel: the hammers of the rolling mill drop. Stop between them, count the strikes, then run.',
      'The foundry pit: rhythm blocks appear in turn. A flashing block is about to vanish: hop from it to the next. Wait for the rail platform.',
    ],
    npcs: [
      { name: 'Master Haşim, Delight Maker', text: 'I flavour my delight with saffron, and I have the saffron brought from Davutobası! Three pinches of saffron are missing: one on the roof of Cinci Han, one on the wall shoulder of the canyon, one in the pit of the rolling mill.' },
      { name: 'Feyza the Guide', text: 'The glass walkway in Tokatlı is cracked stone and holds until you stop; run and hop the gaps. The two walls of the canyon are three tiles apart: bounce your way up and you reach the wall shoulder.' },
      { name: 'Auntie Sacide, Cave Warden', text: 'The lake of Bulak Mencilis is in two halves with a rock curtain in the middle; dive under it, your breath will last. On the far face of the rock beyond the lake you will see a dark mouth: someone left a stamp inside.' },
      { name: 'Master Mevlüt, Foundryman', text: 'Turkey’s first integrated iron and steel works opened here in 1939, my child; the hammers still fall in rhythm. So do the blocks over the foundry pit: do not trust the flashing, move one beat early.' },
    ],
    quips: ['The hammer flattened you.', 'The glass walkway cracked.', 'The block flickered, and you fell.', 'Your saffron delight went cold.'],
    nickname: 'Safranbolu',
  },
  aydin: {
    subtitle: 'The Columns of Ephesus',
    item: 'Fig',
    nickname: 'City of Figs',
    intro: 'From the Marble Way of Ephesus to the Library of Celsus, from the Great Theatre to the Temple of Apollo at Didyma, then down into the underground tunnel of Nysa. Whoever finds the order among the stones gets through.',
    note: 'This page of the notebook is dusted with marble, its edges stained with fig jam. In Aydın every stone has its place: column beside column, step after step. Do not rush on this road; look first, then step.',
    facts: [
      { title: 'Library of Celsus', text: 'The Library of Celsus at Ephesus was built in the early 2nd century in memory of the Roman governor Celsus; its two-storey columned facade still stands. The ancient city of Ephesus joined the UNESCO World Heritage List in 2015.' },
      { title: 'The Great Theatre', text: 'The Great Theatre of Ephesus held about 24,000 people. Its acoustics are said to be so good that a whisper on the stage reaches the top row.' },
      { title: 'Didyma', text: 'The Temple of Apollo at Didyma was one of the great oracle centres of antiquity. Among its ruins lies a huge relief of Medusa, her hair a nest of snakes.' },
    ],
    secret: { title: 'Temple of Artemis', text: 'The Temple of Artemis at Ephesus was one of the Seven Wonders of the Ancient World. It burned in 356 BC in the fire set by Herostratus; today a single re-erected column stands at Selçuk.' },
    hints: [
      'Welcome to Aydın! Walk the Marble Way; the facade of the Library of Celsus begins beyond the spiky gap.',
      'The Library of Celsus: the lower storey is solid stone, the upper one a one-way colonnade, so jump up from below; the keepsake is up there. The pit at the end is five tiles: jump, then dash in the air.',
      'The Great Theatre: the seats rise one tile at a time. At the top the rhythm blocks appear in two sets and vanish: jump to the other set while the blinking one is going.',
      'The Temple of Apollo at Didyma: leap and grab the rope on the face of the rock, then climb. Do not linger on the cracked stones; enter the columns under the arch and wall-jump up.',
      'The tunnel of Nysa: step on the plate on the left first and the door opens; the second plate opens the other door. In the wide chamber push the chest against the wall and climb onto it.',
    ],
    npcs: [
      { name: 'Sabiha the Fig Seller', text: 'Aydın figs ripen on the branch and taste like nothing else in the world! I strung three figs on a cord and the wind took them: one is on the colonnade above the Library of Celsus, one on top of the Great Theatre on the rhythm stones, one at the head of the rock you climb by rope at Didyma.' },
      { name: 'Reşat the Theatre Keeper', text: 'They say a whisper on the stage reaches the top row; I have been testing it for forty years and nobody has ever answered! Whoever hurries on the rhythm stones up there falls: jump from the blinking set to the other, just as it disappears.' },
      { name: 'Candan the Guide', text: 'The Medusa at Didyma has snakes for hair; do not stare at her, or you will turn to stone! Leap and grab the rope on the face of the rock. Cracked stones crumble when you step on them, so do not stand still; you enter the columns by the arch.' },
      { name: 'Hulusi the Excavation Foreman', text: 'The tunnel of Nysa has carried water under the city for centuries. Push the chest up against the wall and climb onto it; when you come down the far side you will see a dark gap: someone left a stamp inside.' },
    ],
    quips: ['The marble was slippery.', 'Medusa winked.', 'You lost count of the columns.', 'The applause died away.'],
  },
  zonguldak: {
    subtitle: 'The Bottom of the Sea, the Depth of the Mine',
    item: 'Miner’s Lamp',
    intro: 'From Kapuz Shore down to the sea floor, through the mine Uzun Mehmet opened to the underground lake of Gökgöl Cave, and on to Cehennemağzı in Ereğli. This road runs underground.',
    note: 'This page of the notebook is coal-black. In Zonguldak the sea breaks on the shore, a shift whistle sounds from the mine, drops patter in the cave lake. This time the road runs under the earth and along the bottom of the sea.',
    facts: [
      { title: 'Uzun Mehmet', text: 'In 1829 Uzun Mehmet found hard coal near Ereğli. Zonguldak is a mining city built on that black stone; its coal is called “black diamond”.' },
      { title: 'Gökgöl Cave', text: 'In Gökgöl Cave, just outside the city, stalactites and stalagmites grow drop by drop, and an underground stream runs through it.' },
      { title: 'Cehennemağzı', text: 'Legend holds the Cehennemağzı Caves in Ereğli to be the gate through which Heracles went down to the underworld.' },
    ],
    secret: { title: 'The Canary', text: 'Miners once carried a canary in a cage down the mine: when dangerous gas (firedamp) built up, the bird fell silent and everyone climbed back up.' },
    hints: [
      'Welcome to Zonguldak! Dive into the sea from Kapuz. The bubbles above your head are your breath: surface before they run out. Watch the gaps between the piranhas.',
      'Uzun Mehmet’s mine: carts run back and forth on the rails, ride on them. Cracked coal crumbles when you step on it, so do not linger.',
      'Gökgöl Cave: stalactites hang from the ceiling. Esoli patrols the underground lake: when it shudders, get out of its way, it cannot be stomped.',
      'Cehennemağzı: the gate Heracles went through. Wall-jump from wall to wall and dash your way up.',
    ],
    npcs: [
      { name: 'Fikret the Lampmaker', text: 'Every miner going down takes his lamp from me! I lost three: one fell to the sea floor at Kapuz, one onto the cart track in the gallery, one into Gökgöl’s underground lake.' },
      { name: 'Tülin the Diver', text: 'A shark called Esoli roams off Kapuz; when you see it shudder, get out of its way, it cannot be stomped. The bubbles above your head are your breath: surface before they run out.' },
      { name: 'Ekin, the Miner’s Grandchild', text: 'My grandfather carried a canary in a cage down the mine; if the bird went quiet, everyone went up. Break the cracked coal at the end of the gallery: the old cage is under it.' },
    ],
    quips: ['Covered in coal dust.', 'Esoli winked at you.', 'You ran out of breath.', 'The cart left, you stayed.'],
  },
}

export const STORY_EN: { title: string; text: string }[] = [
  {
    title: 'The Notebook at the Bookshop',
    text: '{name} found an old road notebook on the bottom shelf of a second-hand bookshop. On its cover, in faded letters, was a single word: Memleket, “homeland”. Even the bookseller could not say whose it had been; every page was signed the same way: the Traveller.',
  },
  {
    title: 'The Unfinished Pages',
    text: 'Each page was given to a city. Every page had a short note from the Traveller: what to eat, where to look from, whom to greet. Under the note were three empty boxes. Three keepsakes from every city… The Traveller had not filled them in; that was left to whoever found the notebook.',
  },
  {
    title: 'The Last Line',
    text: 'The last page held just one sentence: “The end of the road is where I began.” {name} packed a backpack and wrapped the red scarf around their neck. The notebook would be finished.',
  },
]

export const ENDING_EN: { title: string; text: string } = {
  title: 'The Notebook Is Complete',
  text: '{name} opened the last page of the notebook on the tower of Bayburt Castle. All three boxes are full. Who the Traveller was, and why the road began here, the notebook does not say; there is only a small note in the corner of the page: “Your turn.” The road has ended, but the homeland never does: the next cities are on their way.',
}

export const CHARACTERS_EN: Record<'uktun' | 'memo', { role: string; bio: string }> = {
  uktun: {
    role: 'Mapmaker',
    bio: 'From Istanbul, 26 years old. She grew up on the Kadıköy ferries and knows maps by heart, but no road ever intrigued her as much as the notebook she found at that bookshop. She lets her long hair fly in the wind and always finds the way herself.',
  },
  memo: {
    role: 'Phone Repairer',
    bio: 'From Diyarbakır, 28 years old. He has a little phone shop at the foot of the city walls and can spot a cracked screen at a glance. In his pocket: the Traveller’s notebook and an old phone where he logs every city.',
  },
}

export const CREATURE_NAMES_EN: Record<string, string> = {
  shark: 'Esoli', piranha: 'Piranha',
  gull: 'Gökçekuş', bee: 'Bee', raven: 'Raven', magpie: 'Magpie', mosquito: 'Mosquito', frog: 'Frog', hare: 'Hare', ram: 'Ram', bat: 'Bat',
  hedgehog: 'Hedgehog', boar: 'Wild Boar', crab: 'Crab', pigeon: 'Pigeon', goat: 'Goat', scorpion: 'Scorpion', wolf: 'Gökçekurt',
  snake: 'Snake', lizard: 'Lizard', rat: 'Rat', wasp: 'Wasp',
  cat: 'Street Cat', flamingo: 'Flamingo', angora: 'Angora Goat', vanCat: 'Van Cat', lion: 'Hittite Lion', cow: 'Cow', kangal: 'Kangal', horse: 'Horse', partridge: 'Partridge', turtle: 'Loggerhead Turtle',
}
