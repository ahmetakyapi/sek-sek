import type { CityKey } from './types'

/** Bayrak anları: her bayrakta şehrin kısa bir sesi ya da sözü (sırayla). [Türkçe, İngilizce] */
export const FLAG_MOMENTS: Record<CityKey, [string, string][]> = {
  istanbul: [
    ['Simiiit! Taze simit!', 'Simiiit! Fresh simit!'],
    ['Vapur düdüğü: Kadıköy’e son sefer!', 'Ferry horn: last boat to Kadıköy!'],
    ['Martılar simit kapma peşinde.', 'Gulls are after your simit.'],
    ['Boğaz’da çay, karşıda Kız Kulesi.', 'Tea by the Bosphorus, Maiden’s Tower ahead.'],
  ],
  canakkale: [
    ['Feribot düdüğü: Eceabat’a kalkıyoruz!', 'Ferry horn: leaving for Eceabat!'],
    ['Peynir helvası fırından yeni çıktı.', 'Cheese halva, fresh out of the oven.'],
    ['Boğaz’da rüzgâr, kordonda çay.', 'Wind on the strait, tea on the promenade.'],
    ['Saat Kulesi beşi vurdu.', 'The Clock Tower strikes five.'],
  ],
  sinop: [
    ['Balıkçılar ağ topluyor.', 'The fishermen haul in their nets.'],
    ['Mantının üstüne ceviz serpildi.', 'Walnuts sprinkled on the mantı.'],
    ['Fener uzaktan göz kırpıyor.', 'The lighthouse winks from afar.'],
    ['Diyojen: “Gölge etme, başka ihsan istemem.”', 'Diogenes: “Stand out of my light.”'],
  ],
  diyarbakir: [
    ['Surların üstünde gün batıyor.', 'The sun sets over the city walls.'],
    ['Karpuz çatladı: kıpkırmızı!', 'The watermelon cracks open: bright red!'],
    ['Dengbêj bir kılam tutturdu.', 'A dengbêj begins a song.'],
    ['Hasan Paşa Hanı’nda kahvaltı kuruldu.', 'Breakfast is laid at Hasan Pasha Inn.'],
  ],
  kocaeli: [
    ['Pişmaniye tel tel çekiliyor.', 'Pişmaniye pulled thread by thread.'],
    ['Körfezde gemiler yan yana.', 'Ships side by side in the gulf.'],
    ['Kartepe’den kar kokusu geliyor.', 'Snow on the breeze from Kartepe.'],
    ['Saat kulesi yolu gösteriyor.', 'The clock tower shows the way.'],
  ],
  izmir: [
    ['Boyoz sıcak, yumurta haşlanmış!', 'Hot boyoz, boiled eggs!'],
    ['Kordon’da imbat esiyor.', 'The sea breeze sweeps the Kordon.'],
    ['Asansör’den körfez manzarası.', 'The gulf from the old Elevator.'],
    ['Simit değil, gevrek!', 'Not simit here, it’s gevrek!'],
  ],
  ankara: [
    ['Ankara’nın taşına bak…', 'Look at the stones of Ankara…'],
    ['Kızılay’da buluşalım.', 'Meet me at Kızılay.'],
    ['Kale’den bütün şehir görünüyor.', 'The whole city from the Citadel.'],
    ['Pekmezli Ankara simidi elinde.', 'A molasses Ankara simit in hand.'],
  ],
  konya: [
    ['Ney üflüyor, sema başladı.', 'The ney sighs, the whirling begins.'],
    ['Etli ekmek fırından yeni çıktı.', 'Etli ekmek fresh from the oven.'],
    ['Sille’den Konya ovası.', 'The Konya plain from Sille.'],
    ['Bir dönüş daha, bir nefes daha.', 'One more turn, one more breath.'],
  ],
  nevsehir: [
    ['Balonlar şafakta havalandı.', 'Balloons rise at dawn.'],
    ['Peri bacaları gün doğumunu bekliyor.', 'Fairy chimneys wait for sunrise.'],
    ['Yer altı şehrinde serin bir mola.', 'A cool rest in the underground city.'],
    ['Avanos çömleği çarkta dönüyor.', 'Avanos clay spins on the wheel.'],
  ],
  adana: [
    ['Kebap közde, şalgam soğuk!', 'Kebab on the coals, şalgam ice cold!'],
    ['Seyhan kıyısında akşam serinliği.', 'Evening cool on the Seyhan.'],
    ['Taş Köprü asırlardır ayakta.', 'The Stone Bridge has stood for ages.'],
    ['Adana’nın sıcağı, Adana’nın gönlü.', 'Adana’s heat, Adana’s heart.'],
  ],
  gaziantep: [
    ['Bakır dövülüyor: tak, tak, tak!', 'Copper hammered: tak, tak, tak!'],
    ['Baklava tepsisi fırından çıktı.', 'A tray of baklava from the oven.'],
    ['Zeugma’nın Çingene Kızı bakıyor.', 'Zeugma’s Gypsy Girl is watching.'],
    ['Fıstık kavruluyor, çarşı kokuyor.', 'Pistachios roasting, the bazaar smells.'],
  ],
  mardin: [
    ['Taş evlerin arasında bir rüzgâr.', 'A breeze between the stone houses.'],
    ['Telkari ustası ince işliyor.', 'The filigree master at fine work.'],
    ['Mezopotamya ovası ayaklarının altında.', 'Mesopotamia spread below you.'],
    ['Mırra fincanda, acı ve sıcak.', 'Mırra in the cup, bitter and hot.'],
  ],
  malatya: [
    ['Kayısılar damda kuruyor.', 'Apricots drying on the rooftops.'],
    ['Malatya’nın kayısısı bal gibi.', 'Malatya apricots, sweet as honey.'],
    ['Arslantepe’de binlerce yıllık izler.', 'Thousands of years at Arslantepe.'],
    ['Kayısı ağaçları çiçekte.', 'Apricot trees in bloom.'],
  ],
  corum: [
    ['Leblebi kavruluyor, çıtır çıtır!', 'Leblebi roasting, crunch crunch!'],
    ['Hitit güneşi yolunu aydınlatsın.', 'May the Hittite sun light your way.'],
    ['Saat kulesi tam vaktinde çaldı.', 'The clock tower rang right on time.'],
    ['Hattuşa’nın kapısından geçtin.', 'You passed through Hattusa’s gate.'],
  ],
  ordu: [
    ['Fındık harmanı başladı!', 'The hazelnut harvest has begun!'],
    ['Boztepe’den Karadeniz masmavi.', 'The Black Sea, deep blue from Boztepe.'],
    ['Teleferik bulutlara çıkıyor.', 'The cable car climbs into the clouds.'],
    ['Fındık dalında, yaprak yeşil.', 'Hazelnuts on the branch, leaves green.'],
  ],
  trabzon: [
    ['Horon başladı, kemençe çalıyor!', 'The horon begins, the kemençe plays!'],
    ['Taşacak bu deniz, bekle!', 'This sea will overflow, just wait!'],
    ['Hamsiköy sütlacı fırından.', 'Hamsiköy rice pudding from the oven.'],
    ['Uzungöl’de sis dağılıyor.', 'Mist lifting over Uzungöl.'],
  ],
  sivas: [
    ['Divriği’nin taşında dantel işi.', 'Lace carved in Divriği stone.'],
    ['Sivas köftesi ocakta.', 'Sivas köfte on the stove.'],
    ['Kangal yolu gözetliyor.', 'A Kangal dog watches the road.'],
    ['Gök Medrese’nin çinileri parlıyor.', 'The Gök Medrese tiles shine.'],
  ],
  ardahan: [
    ['Çıldır Gölü buz tuttu.', 'Lake Çıldır has frozen over.'],
    ['Atlı kızak buzun üstünde.', 'A horse sleigh across the ice.'],
    ['Kaz eti ocakta, kış uzun.', 'Goose on the stove, the winter is long.'],
    ['Yaylada çiçek balı.', 'Wildflower honey from the highlands.'],
  ],
  bayburt: [
    ['Dede Korkut’un ozanı türkü söylüyor.', 'Dede Korkut’s bard sings a folk song.'],
    ['Bayburt Kalesi rüzgârı karşılıyor.', 'Bayburt Castle meets the wind.'],
    ['Çoruh vadide kıvrılıyor.', 'The Çoruh winds through the valley.'],
    ['Baksı’da sanat dağın başında.', 'At Baksı, art sits on the mountaintop.'],
  ],
}
