import type { CityKey } from './types'

/**
 * Boss'ların lafları: arenada konuşma balonunda görünür (çizimi render.ts, drawBossHD).
 *   wake  uyanınca · tired yorulunca (üstüne basılacak an) · ouch üstüne basılınca
 * Her satır [Türkçe, İngilizce]; kısa (en çok ~28 harf), şehre özgü ve komik. Nasıl yenileceğini tabela (taunt) söyler.
 */
export const BOSS_LINES: Record<CityKey, { wake: [string, string]; tired: [string, string]; ouch: [string, string] }> = {
  istanbul: { wake: ['Simit benim!', 'The simit is mine!'], tired: ['Gagam sıkıştı!', 'My beak is stuck!'], ouch: ['Gak! Simidim!', 'Squawk! My simit!'] },
  edirne: { wake: ['Güm güm güm!', 'Boom boom boom!'], tired: ['Tokmağım nerede?', 'Where is my mallet?'], ouch: ['Derim gerildi!', 'My skin is too tight!'] },
  kocaeli: { wake: ['Tel tel dağıtırım!', 'I will pull you apart!'], tired: ['Başım döndü…', 'I am dizzy…'], ouch: ['Dağılıyorum!', 'I am unravelling!'] },
  bursa: { wake: ['Hay hak! Perde benim!', 'Ha! The screen is mine!'], tired: ['Işığı kim yaktı?', 'Who lit the lamp?'], ouch: ['Yıktın perdeyi!', 'You wrecked the screen!'] },
  canakkale: { wake: ['İçimde kimse yok. Yemin.', 'Nobody inside. I swear.'], tired: ['Tekerim çıktı!', 'I lost a wheel!'], ouch: ['Hediyeydim ben!', 'I was a gift!'] },
  izmir: { wake: ['Sekiz kolum var, bir sen.', 'Eight arms, one of you.'], tired: ['Kollarım dolandı…', 'My arms are tangled…'], ouch: ['Mürekkebim!', 'My ink!'] },
  antalya: { wake: ['Sahne benim!', 'The stage is mine!'], tired: ['Repliğimi unuttum…', 'I forgot my line…'], ouch: ['Alkış yok mu?', 'No applause?'] },
  ankara: { wake: ['Sıra numaranız?', 'Your queue number?'], tired: ['Mesai bitti…', 'Office hours are over…'], ouch: ['Dilekçeyle gel!', 'Put it in writing!'] },
  konya: { wake: ['Dön baba dönelim!', 'Round and round we go!'], tired: ['Dünya dönüyor…', 'The world is spinning…'], ouch: ['İpim koptu!', 'My string snapped!'] },
  nevsehir: { wake: ['Rezervasyonun var mı?', 'Got a reservation?'], tired: ['Havam kaçtı…', 'I am deflated…'], ouch: ['Sepetime basma!', 'Not the basket!'] },
  adana: { wake: ['Acısız mı? Yok öyle!', 'Mild? No such thing!'], tired: ['Su! Su!', 'Water! Water!'], ouch: ['Yandım anam!', 'I am on fire!'] },
  gaziantep: { wake: ['Fıstık gibiyim!', 'Fresh as a pistachio!'], tired: ['Çuvalım delinmiş…', 'My sack has a hole…'], ouch: ['Fıstıklarım!', 'My pistachios!'] },
  sanliurfa: { wake: ['On iki bin yıldır uyuyordum!', 'I slept twelve thousand years!'], tired: ['Belim tutuldu…', 'My back gave out…'], ouch: ['Taş kafalı deme!', 'Do not call me blockhead!'] },
  diyarbakir: { wake: ['Kestirmeden gelme!', 'No shortcuts!'], tired: ['Çatladım…', 'I have cracked…'], ouch: ['Çekirdeklerim!', 'My seeds!'] },
  mardin: { wake: ['Sır tutar mısın?', 'Can you keep a secret?'], tired: ['Tacım kaydı…', 'My crown slipped…'], ouch: ['Mücevherim!', 'My jewel!'] },
  malatya: { wake: ['Çekirdekten yetişmeyim!', 'Raised from the stone!'], tired: ['Kurudum…', 'I am all dried out…'], ouch: ['Sapıma dokunma!', 'Hands off my stem!'] },
  corum: { wake: ['Sıcak leblebi geliyor!', 'Hot chickpeas coming!'], tired: ['Soğudum…', 'I have gone cold…'], ouch: ['Tavam ezildi!', 'You dented me!'] },
  sinop: { wake: ['Gölge etme!', 'Out of my sun!'], tired: ['Fenerim söndü…', 'My lantern went out…'], ouch: ['Başka ihsan istemem!', 'That is all I ask!'] },
  ordu: { wake: ['Bu fındık benim!', 'This hazelnut is mine!'], tired: ['Kabuk çok sert…', 'The shell is too hard…'], ouch: ['Kırma beni!', 'Do not crack me!'] },
  trabzon: { wake: ['Ha uşağum, gel bakayım!', 'Come here, lad!'], tired: ['Karaya vurdum da!', 'I am beached!'], ouch: ['Tacım! Tacım!', 'My crown! My crown!'] },
  sivas: { wake: ['Üşüdün mü evlat?', 'Feeling cold, child?'], tired: ['Belim buz kesti…', 'My back has frozen…'], ouch: ['Sakalım!', 'My beard!'] },
  van: { wake: ['Kahvaltı hazır mı?', 'Is breakfast ready?'], tired: ['Karaya vurdum…', 'I am beached…'], ouch: ['Fotoğraf çekme!', 'No photos!'] },
  kayseri: { wake: ['Kırk kişi bir kaşıktayız!', 'Forty of us on one spoon!'], tired: ['Yoğurdum bitti…', 'Out of yogurt…'], ouch: ['Bohçam açıldı!', 'My wrapping came undone!'] },
  hatay: { wake: ['Sıcak sıcak geliyorum!', 'Coming in hot!'], tired: ['Soğudum…', 'I have cooled down…'], ouch: ['Peynirim uzadı!', 'My cheese stretched!'] },
  eskisehir: { wake: ['Suyum kaynıyor!', 'My filling is boiling!'], tired: ['Sönüyorum…', 'Going soggy…'], ouch: ['Hamurum yırtıldı!', 'My dough tore!'] },
  erzurum: { wake: ['Çığ geliyoor!', 'Avalaaanche!'], tired: ['Eriyorum…', 'I am melting…'], ouch: ['Kıtlama şekerim!', 'My sugar cube!'] },
  ardahan: { wake: ['Tısss!', 'Hisss!'], tired: ['Tüylerim döküldü…', 'I am losing feathers…'], ouch: ['Vak!', 'Honk!'] },
  amasya: { wake: ['Dağı ben deldim!', 'I split the mountain!'], tired: ['Ucum köreldi…', 'My tip has gone blunt…'], ouch: ['Sapım çatladı!', 'My handle cracked!'] },
  mugla: { wake: ['Poyraz geliyor!', 'Here comes the north wind!'], tired: ['Rüzgârım kesildi…', 'I am out of wind…'], ouch: ['Kanadım büküldü!', 'You bent my sail!'] },
  bayburt: { wake: ['Gözüm üstünde!', 'I have my eye on you!'], tired: ['Gözüm döndü…', 'My eye is spinning…'], ouch: ['Gözüme basma!', 'Not the eye!'] },
}
