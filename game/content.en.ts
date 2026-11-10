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
      'The Sümela cliff: cracked stones crumble, press against the wall to climb. The key is in front of the monastery.',
      'The wedding square: the koçari line stomps slowly and stays up longer. Time it to reach the table.',
      'Uzungöl: hop from boat to boat and watch out for the gulls.',
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
      "The Bosphorus is cold, don't fall in! Stomp on the gulls to chase them off.",
      'Touch the flag: if you fall, you pick up from here. You can jump up through thin platforms and land on top.',
      'The pier: ride the moving platform across the water.',
      'DASH (Space / X): burst forward once in mid-air. It recharges when you land. Jump, then dash!',
      'A blue crystal recharges your dash in mid-air: dash, touch the crystal, dash again!',
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
      'The gulf ferry: ride the moving pier, and watch out for gulls.',
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
      'The key is up high: jump, dash, touch the blue crystal, dash again.',
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
      'Karatay Madrasa: grab the key and open the door. On the bridge to the roof, you may spot a cracked wall.',
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
    note: 'Get up early: the sky fills with balloons. We used to call the fairy chimneys "stones with hats". And remember, there is a whole city under the earth too.',
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
      'Wild boars roam the slopes: jump on them or dash past. The gaps on the shore are wide: jump, then dash at the top of your jump.',
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
      'Gök Madrasa puzzle: there are two plates. Think about which to press, and when.',
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
      'Ride the platform that glides like a horse-drawn sleigh. The key is on an ice floe, and the crystal will get you there.',
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

  bayburt: {
    nickname: 'Uktun',
    subtitle: 'Castle and Storm',
    item: 'Kopuz',
    intro: 'From the banks of the Çoruh to Bayburt Castle. The wind blows from the west and pushes you back. You have learned everything, now put it to use.',
    note: 'The end of the road is where I began. Look down at the Çoruh from the castle tower, and remember me.',
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
        text: 'The wind always blows from the west here. Your grandfather used to play on these towers, I remember. Go on, the last page is waiting for you.',
      },
    ],
    quips: [
      'The wind is a joker.',
      'Say hello to the Çoruh.',
      'The castle has been patient for centuries.',
      'Dede Korkut will tell this one too.',
    ],
  },
}

export const STORY_EN: { title: string; text: string }[] = [
  {
    title: 'The Notebook in the Attic',
    text: '{name} was clearing out Grandpa Yusuf’s old house when a dusty notebook turned up in the attic. On its cover, in faded letters, was a single word: Memleket, “homeland”.',
  },
  {
    title: 'The Unfinished Pages',
    text: 'Each page was given to a city: İstanbul, Kocaeli, İzmir, Ankara, Konya, Nevşehir, Adana, Gaziantep, Mardin, Malatya, Çorum, Ordu, Trabzon, Sivas, Ardahan, Bayburt. Every page had a short note from Grandpa and three empty boxes. Three keepsakes from every city… The journey had been left unfinished.',
  },
  {
    title: 'The Last Line',
    text: 'The last page held just one sentence: “The end of the road is where I began.” {name} packed a backpack and wrapped the red scarf around their neck. The notebook would be finished.',
  },
]

export const ENDING_EN: { title: string; text: string } = {
  title: 'The Notebook Is Complete',
  text: '{name} opened the last page of the notebook on the tower of Bayburt Castle. Grandpa Yusuf was born here and heard his first kopuz on the banks of the Çoruh. Nineteen cities lie behind. The road has ended, but the homeland never does: the next cities are on their way.',
}

export const CHARACTERS_EN: Record<'uktun' | 'memo', { role: string; bio: string }> = {
  uktun: {
    role: 'Mapmaker',
    bio: 'From Istanbul, 26 years old. She grew up on the Kadıköy ferries and knows maps by heart, but no road ever intrigued her as much as her grandfather’s notebook. She lets her long hair fly in the wind and always finds the way herself.',
  },
  memo: {
    role: 'Phone Repairer',
    bio: 'From Diyarbakır, 28 years old. He has a little phone shop at the foot of the city walls and can spot a cracked screen at a glance. In his pocket: his grandfather’s notebook and an old phone where he logs every city.',
  },
}

export const CREATURE_NAMES_EN: Record<string, string> = {
  gull: 'Gull', bee: 'Bee', raven: 'Raven', magpie: 'Magpie', mosquito: 'Mosquito', frog: 'Frog', hare: 'Hare', ram: 'Ram', bat: 'Bat',
  hedgehog: 'Hedgehog', boar: 'Wild Boar', crab: 'Crab', pigeon: 'Pigeon', goat: 'Goat', scorpion: 'Scorpion', wolf: 'Wolf',
  snake: 'Snake', lizard: 'Lizard', rat: 'Rat', wasp: 'Wasp',
  cat: 'Street Cat', flamingo: 'Flamingo', angora: 'Angora Goat', vanCat: 'Van Cat', lion: 'Hittite Lion', cow: 'Cow', kangal: 'Kangal', horse: 'Horse', partridge: 'Partridge',
}
