/**
 * "Menülerde sayfa kaymaz" kuralının kanıtı: her menü ekranı dört boyutta açılır, panelin ekran boyunu aşıp aşmadığı
 * ölçülür (Overlay kabında scrollHeight - clientHeight; uzun listeler panelin içinde kendi alanında kayar, o sayılmaz).
 *
 * Kullanım: geliştirme ya da üretim sunucusu açıkken  node scripts/audit-menus.cjs [--goster klasör]
 *   PORT=3000 (varsayılan), ONLY=<ad parçası> yalnız o ekranlar, SIZE=orta,dikey yalnız o boyutlar. --goster verilirse her hücrenin ekran görüntüsü klasöre yazılır.
 * Skor API'si yakalanır ve örnek satırlar döner (veritabanı gerekmez). Kayan hücre varsa çıkış kodu 1.
 */
const { chromium } = require('playwright')

const PORT = process.env.PORT || 3000
const shotDir = process.argv.includes('--goster') ? process.argv[process.argv.indexOf('--goster') + 1] : null
const SIZES = { masaustu: [1280, 720], genis: [1512, 860], orta: [1024, 640], dikey: [390, 664], yatay: [750, 342] }
/** Okuma sayfası olarak tasarlanan ekranlar (bilerek kayar) */
const TOLERANCE = 2

const IDS = ['istanbul', 'edirne', 'kocaeli', 'bursa', 'eskisehir', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir', 'kayseri', 'adana', 'hatay']
const best = Object.fromEntries(IDS.map((id, i) => [id, { timeMs: 60000 + i * 7000, deaths: i % 4, items: [true, i % 2 === 0, i % 3 === 0] }]))
const SAVE = { character: 'uktun', seenStory: true, tutorial: false, unlocked: 16, best: { ...best, corum: { timeMs: 140000, deaths: 9, items: [true, true, true] } }, challenges: { 'corum-leblebi-2': 15200 }, ach: { firstCity: true }, stamps: { istanbul: true }, charms: { istanbul: true, bursa: true }, bosses: { istanbul: true, edirne: true, kocaeli: true, bursa: true }, skippedName: true, mapVersion: 8, migrated: true, accountVersion: 2, stats: { runs: 40, deaths: 120, jumps: 3000, dashes: 500, stomps: 40, playMs: 5400000 } }
/** bütün şehirlerin kimlikleri (oyunun kendisinden): final ve Ayna Yolu için hepsi bitmiş yolcu */
const LEVEL_IDS = JSON.parse(require('node:child_process').execSync(`npx tsx -e "import { LEVELS } from './game/levels'; console.log(JSON.stringify(LEVELS.map((l) => l.id)))"`, { encoding: 'utf8' }))
const ALL = { ...SAVE, unlocked: 99, best: Object.fromEntries(LEVEL_IDS.map((id, i) => [id, { timeMs: 60000 + i * 1000, deaths: 1, items: [true, true, true] }])), sawEnding: true }
const STORY = { ...SAVE, story: { 'Simitçi Hasan Amca': 31, 'İskele Görevlisi Selin': 19, 'Cazgır Şaban Dayı': 17, 'Sabuncu Müzeyyen Hanım': 23, 'Kozacı Feride Teyze': 31, 'Hayalî Sabri Usta': 16 } }
/** oyuncuyu ilk şehir insanının yanına götür */
const TO_NPC = "eval:(()=>{const w=window.__mk.world();const n=w.npcs[0];w.player.x=n.x+2;w.player.y=n.y+16-w.player.h;w.player.vx=0;w.player.vy=0})()"
const NEWS = { ...SAVE, best: { ...best, izmir: { ...best.izmir, v: 'eski' } }, seen: IDS.filter((id) => id !== 'kayseri') }

const FINISH = "eval:(()=>{const w=window.__mk.world();w.started=true;w.time=73.4;w.deaths=2;if(w.pickups[0])w.pickups[0].taken=true;w.complete=true;w.events.push({type:'complete'})})()"
/** ekran adı → [kayıt, adımlar]. Adım: düğme adı · tab:ad · key:Tuş · wait:ms · eval:js */
const SCREENS = {
  'ana-menu': [SAVE, []],
  'ana-menu-yeni': [null, []],
  // dolu kayıt, giriş yapmış yolcu, İngilizce: uzun etiketler ve büyük sayılarla alt şerit taşmasın
  'ana-menu-en': [{ ...ALL, stamps: Object.fromEntries(LEVEL_IDS.map((id) => [id, true])), charms: Object.fromEntries(LEVEL_IDS.map((id) => [id, true])), lang: 'en', player: { id: 'x', name: 'ahmet', token: 't' } }, []],
  'guncelleme-notu': [NEWS, []],
  sehirler: [SAVE, ['Şehirler']],
  defter: [SAVE, ['Defter']],
  'defter-profil-yeni': [null, ['Defter']],
  'defter-profil-tam': [ALL, ['Defter']],
  'defter-sehirler': [SAVE, ['Defter', 'tab:Şehirler']],
  karakter: [SAVE, ['Karakter']],
  modlar: [SAVE, ['Modlar']],
  'modlar-yeni-oyuncu': [null, ['Modlar']],
  'modlar-ara': [SAVE, ['Modlar', 'key:/', 'type:kangal']],
  'modlar-ara-yok': [SAVE, ['Modlar', 'key:/', 'type:zzzz']],
  'modlar-suzgec': [SAVE, ['Modlar', 'Birlikte']],
  'modlar-nasil': [SAVE, ['Modlar', 'Mücadeleler', 'wait:300']],
  'kural-sec': [SAVE, ['Modlar', 'Kurallı Koşu']],
  'duello-kur': [SAVE, ['Modlar', 'Düello']],
  'duello-sira': [SAVE, ['Modlar', 'Düello', 'Sırayla', 'Düelloyu Başlat']],
  // Yan Yana dokunmatikte kapalıdır: açık olduğu boyutlarda seçilir
  'duello-yan': [SAVE, ['Modlar', 'Düello', "eval:[...document.querySelectorAll('button:not([disabled])')].find((b) => /Yan Yana/.test(b.textContent))?.click()"]],
  skorlar: [SAVE, ['Skorlar']],
  'skorlar-sehir': [SAVE, ['Skorlar', 'tab:Şehirler']],
  // girişli yolcu: "Senin Sıran" şeridi, arkadaşlar sekmesi, yolcu araması
  'skorlar-ben': [{ ...SAVE, player: { id: '00000000-0000-4000-8000-000000000001', name: 'Deniz', token: 'x'.repeat(40) }, friends: ['ahmet', 'esra'] }, ['Skorlar', 'tab:Şehirler']],
  'skorlar-arkadaslar': [{ ...SAVE, player: { id: '00000000-0000-4000-8000-000000000001', name: 'Deniz', token: 'x'.repeat(40) }, friends: ['ahmet', 'esra'] }, ['Skorlar', 'tab:Arkadaşlar']],
  'skorlar-arkadas-yok': [{ ...SAVE, friends: [] }, ['Skorlar', 'tab:Arkadaşlar']],
  'skorlar-ara': [SAVE, ['Skorlar', 'tab:Şehirler', "eval:document.querySelector('.sb-search input').focus()", 'type:Del', 'wait:600']],
  // yolcu ayrıntısı: satıra basınca açılan çekmece (profil örnek veriyle)
  'skorlar-yolcu': [{ ...SAVE, player: { id: '00000000-0000-4000-8000-000000000001', name: 'Deniz', token: 'x'.repeat(40) }, friends: ['ahmet'] }, ['Skorlar', 'tab:Şehirler', "eval:document.querySelectorAll('.sb-click')[3]?.click()", 'wait:600']],
  'skorlar-gunluk': [SAVE, ['Skorlar', 'tab:Günlük']],
  'skorlar-speedrun': [SAVE, ['Skorlar', 'tab:Speedrun']],
  'skorlar-modlar': [SAVE, ['Skorlar', 'tab:Modlar']],
  'skorlar-boss-rush': [SAVE, ['Skorlar', 'tab:Modlar', 'Boss Rush']],
  'coop-kur': [SAVE, ['Modlar', 'Co-op']],
  'coop-boss': [SAVE, ['Modlar', 'Co-op', 'tab:Boss Kapışması']],
  'coop-parkur': [SAVE, ['Modlar', 'Co-op', 'tab:Parkur']],
  kovalamaca: [SAVE, ['Modlar', 'Kovalamaca']],
  'gezgin-turu': [SAVE, ['Modlar', 'Gezgin Turu']],
  'sakin-gezi': [SAVE, ['Modlar', 'Sakin Gezi']],
  'hikaye-kur': [STORY, ['Modlar', 'Hikâye Gezisi']],
  'hikaye-konus': [STORY, ['Modlar', 'Hikâye Gezisi', '▶ Geziye Başla', 'wait:900', TO_NPC, 'wait:500', 'key:e', 'wait:2600']],
  'hikaye-tanisma': [null, ['Modlar', 'Hikâye Gezisi', '▶ Geziye Başla', 'wait:900', TO_NPC, 'wait:500', 'key:e', 'wait:2600', 'key:1', 'wait:2800']],
  'hikaye-defter': [STORY, ['Defter', 'tab:Tanıştık']],
  'hikaye-defter-bos': [null, ['Defter', 'tab:Tanıştık']],
  'sinir-bozucu': [SAVE, ['Modlar', 'Sinir Bozucu']],
  // Çark-ı Felek: çark, çevrilmiş sonuç (dönüş biter), çarkın koşusu bitince bölüm sonu
  cark: [SAVE, ['Modlar', 'Çark-ı Felek']],
  'cark-sonuc': [SAVE, ['Modlar', 'Çark-ı Felek', '↻ Çarkı Çevir', 'wait:3000']],
  'cark-bitis': [SAVE, ['Modlar', 'Çark-ı Felek', '↻ Çarkı Çevir', 'wait:3000', '▶ Koşuya Başla', 'wait:600', FINISH, 'wait:900']],
  // Defter Bilmecesi: giriş, yanıtlanmış soru (bilgi kartı açık), kilitli (üç şehir)
  bilmece: [SAVE, ['Modlar', 'Defter Bilmecesi']],
  'bilmece-soru': [SAVE, ['Modlar', 'Defter Bilmecesi', '▶ Başla', 'wait:300', 'key:1', 'wait:500']],
  'bilmece-en': [{ ...SAVE, lang: 'en' }, ['Modes', 'Notebook Quiz', '▶ Start', 'wait:300', 'key:2', 'wait:500']],
  ayarlar: [SAVE, ['Ayarlar']],
  'ayarlar-renk-korlugu': [{ ...SAVE, colorBlind: 'kirmizi-yesil' }, ['Ayarlar']],
  'ayarlar-tuslar': [SAVE, ['Ayarlar', 'opt:tab:Kontroller']],
  'foto-kipi': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:Escape', 'Fotoğraf Kipi', 'wait:300']],
  hesap: [SAVE, ['Giriş Yap']],
  'sehir-karti': [SAVE, ['Devam Et']],
  // şehir kartının skor paneli: liste, açılmış satır (oyuncu girişli: kendi satırı vurgulu, arkadaş yıldızı)
  'sehir-skorlar': [SAVE, ['Devam Et', 'wait:300', "eval:[...document.querySelectorAll('button')].find((b) => b.textContent.includes('🏆') && b.offsetParent)?.click()", 'wait:400']],
  'sehir-skorlar-detay': [{ ...SAVE, player: { id: '00000000-0000-4000-8000-000000000001', name: 'Deniz', token: 'x'.repeat(40) }, friends: ['ahmet'] }, ['Devam Et', 'wait:300', "eval:[...document.querySelectorAll('button')].find((b) => b.textContent.includes('🏆') && b.offsetParent)?.click()", 'wait:400', "eval:document.querySelectorAll('[data-row]')[4]?.click()", 'wait:300']],
  mola: [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape']],
  'mola-onay': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape', 'wait:300', 'key:m', 'wait:200']],
  'mola-sayim': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape', 'wait:300', 'key:Escape', 'wait:350']],
  'mola-mod': [SAVE, ['Modlar', '▶ Oyna', 'wait:600', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape', 'wait:300']],
  'mola-tuslar': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape', 'wait:300', 'opt:⚙ Ayarlar', 'Tuşları Değiştir']],
  'bolum-sonu': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:900']],
  // girişli yolcu (skor gönderildi, sıra yazısı) ve Paylaş sekmesi (kartpostal + düğmeler)
  'bolum-sonu-giris': [{ ...SAVE, player: { id: '00000000-0000-4000-8000-000000000001', name: 'Deniz', token: 'x'.repeat(40) } }, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:1600']],
  'bolum-sonu-paylas': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:900', 'tab:Paylaş']],
  'gunluk-sonu': [SAVE, ['Modlar', '▶ Oyna', 'wait:600', FINISH, 'wait:900']],
  mucadeleler: [SAVE, ['Modlar', 'Mücadeleler']],
  'mucadele-sonu': [SAVE, ['Modlar', 'Mücadeleler', '▶ Yeniden Oyna', 'wait:600', FINISH, 'wait:900']],
  'defter-basarim': [SAVE, ['Defter', 'tab:Başarımlar']],
  'defter-album': [SAVE, ['Defter', 'tab:Albüm']],
  turnuva: [SAVE, ['Modlar', 'Turnuvaya Gir']],
  'turnuva-sonu': [SAVE, ['Modlar', 'Turnuvaya Gir', '▶ Oyna', 'wait:600', FINISH, 'wait:900']],
  dukkan: [SAVE, ['Karakter', 'Mağaza']],
  'dukkan-sac': [SAVE, ['Karakter', 'Mağaza', 'tab:Saç']],
  'dukkan-ten': [SAVE, ['Karakter', 'Mağaza', 'tab:Ten ve Göz']],
  'dukkan-kiyafet': [SAVE, ['Karakter', 'Mağaza', 'tab:Kıyafet']],
  'dukkan-ifade': [SAVE, ['Karakter', 'Mağaza', 'tab:İfade']],
  'dukkan-durus': [SAVE, ['Karakter', 'Mağaza', 'tab:Duruş']],
  'dukkan-atki': [SAVE, ['Karakter', 'Mağaza', 'tab:Atkı']],
  'ayna-yolu': [ALL, ['Modlar', 'Ayna Yolu']],
  mucadeleler: [ALL, ['Modlar', 'Mücadeleler']],
  'ofke-parkurlari': [ALL, ['Modlar', 'Parkurlar']],
  // final ilk kez: Bayburt'u bitiren, finali henüz görmemiş yolcu (görmüş olan Bayburt'tan sonra Rize'ye geçer)
  final: [{ ...ALL, sawEnding: false }, ['Şehrinde Oyna', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:1200', '▶ Defteri Kapat', 'wait:600'], '?sehir=bayburt'],
  'yaris-daveti': [SAVE, [], '?yaris=konya~ahmet'],
}

/** yolcu ayrıntısının örnek profili (GET /api/players/profile) */
const PROFILE = (name) => ({ name, since: '2026-09-14T10:00:00.000Z', hero: 'memo', kit: { head: 'yok', face: 'yok', back: 'yok' }, scarf: 'erguvan', title: 'Yolcu', cities: Object.fromEntries(LEVEL_IDS.slice(0, 31).map((id, i) => [id, { id, timeMs: 60000 + i * 1300, deaths: i % 4, items: 3 - (i % 3), plays: 2, rank: 1 + ((i * 7) % 30), medal: ['altin', 'gumus', 'bronz', null][i % 4], full: i % 4 === 0, stamp: true, charm: i % 2 === 0, boss: true }])), earned: ['firstCity'], pins: ['firstCity'], totals: { keeps: 70, stamps: 31, charms: 16, bosses: 31, golds: 8, seals: 2 }, trioDays: 3, streak: 2, podium: {}, recent: [], runs: 90, playMs: 9000000 })
const rows = () => ['uzan', 'GökçeKuş', 'ahmet', 'esra', 'Deniz', 'Kaan', 'Elif Su', 'Mert', 'Zeynep', 'Baran', 'Ada'].map((name, i) => ({ name, timeMs: 52000 + i * 4300, deaths: i % 7, items: 3 - (i % 3), minDeaths: i % 5, maxItems: 3, plays: 1 + (i % 6), cities: 28 - i * 2, keeps: 84 - i * 6, stamps: 28 - i * 2, charms: 20 - i, bosses: 28 - i * 2, found: 132 - i * 9, rank: i + 1, total: 11, me: name === 'Deniz', hero: i % 2 ? 'memo' : 'uktun' }))

;(async () => {
  const browser = await chromium.launch()
  const bad = []
  // SIZE=orta,dikey: yalnız bu boyutlar (uzun koşuyu bölmek için)
  for (const [size, [w, h]] of Object.entries(SIZES).filter(([n]) => !process.env.SIZE || process.env.SIZE.split(',').includes(n))) {
    for (const [name, [save, steps, query]] of Object.entries(SCREENS).filter(([n]) => !process.env.ONLY || n.includes(process.env.ONLY))) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 800 })
      // her modun "nasıl oynanır" kartı görülmüş sayılır (yalnız kartın kendi ekranı hariç): menü adımları kartta takılmasın
      if (name !== 'modlar-nasil') await ctx.addInitScript(() => localStorage.setItem('seksek:modeIntro', JSON.stringify(['rules', 'challenges', 'mirror', 'tour', 'rush', 'marathon', 'chase', 'rage', 'duel', 'coop', 'gezgin', 'calm', 'story', 'cark', 'quiz'])))
      if (save) await ctx.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), save)
      const page = await ctx.newPage()
      await page.route('**/api/scores**', (r) => (r.request().method() === 'POST' ? r.fulfill({ json: { ok: true, first: true, improved: true, better: { time: true, deaths: true, items: true }, bestMs: 73400, rank: 3, total: 11 } }) : r.fulfill({ json: { scores: rows(), total: 11 } })))
      await page.route('**/api/players/**', (r) => r.fulfill({ status: 401, json: {} }))
      await page.route('**/api/players/profile**', (r) => r.fulfill({ json: { profile: PROFILE(new URL(r.request().url()).searchParams.get('name') || 'x') } }))
      let note = ''
      try {
        // ?debug güncelleme notunu susturur; notun kendisi ölçülürken parametresiz açılır
        await page.goto(`http://localhost:${PORT}/${name === 'guncelleme-notu' ? '' : `?debug${query ? `&${query.slice(1)}` : ''}`}`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        for (const st of steps) {
          if (st.startsWith('key:')) await page.keyboard.press(st.slice(4))
          else if (st.startsWith('type:')) await page.keyboard.type(st.slice(5))
          else if (st.startsWith('wait:')) await page.waitForTimeout(Number(st.slice(5)))
          else if (st.startsWith('eval:')) await page.evaluate(st.slice(5))
          // opt: yalnız bazı boyutlarda olan adım (ör. geniş ekranda sekme yok, iki sütun yan yana): yoksa geçilir
          else if (st.startsWith('opt:')) {
            const s2 = st.slice(4)
            const loc = page.getByRole(s2.startsWith('tab:') ? 'tab' : 'button', { name: s2.replace(/^tab:/, '').replace(/^[^\p{L}\p{N}]+\s/u, '') }).first()
            if (await loc.isVisible()) await loc.click({ timeout: 4000 })
          } else await page.getByRole(st.startsWith('tab:') ? 'tab' : 'button', { name: st.replace(/^tab:/, '').replace(/^[^\p{L}\p{N}]+\s/u, '') }).first().click({ timeout: 4000 })
          await page.waitForTimeout(350)
        }
        await page.waitForTimeout(400)
      } catch (e) {
        note = ` (adım tamamlanamadı: ${String(e.message).split('\n')[0].slice(0, 60)})`
      }
      // sayfa düzeyinde kayma: Overlay kabı ya da gövde
      const over = await page.evaluate(() => {
        const els = [...document.querySelectorAll('.overlay-scroll.absolute, [role="dialog"]')]
        const o = Math.max(0, ...els.map((e) => e.scrollHeight - e.clientHeight), document.documentElement.scrollWidth - window.innerWidth)
        return o
      })
      // panelin kenarından yatayda taşan öğe (rozet, dil düğmesi, uzun yazı): kayan ya da kırpan bir kabın içindekiler sayılmaz
      const spill = await page.evaluate(() => {
        const bad = []
        for (const panel of document.querySelectorAll('.pixel-panel')) {
          const pr = panel.getBoundingClientRect()
          if (!pr.width) continue
          for (const el of panel.querySelectorAll('button, a, input, select, .mode-badge, h1, h2, h3, p')) {
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height) continue
            let clipped = false
            for (let a = el.parentElement; a && a !== panel; a = a.parentElement) {
              const cs = getComputedStyle(a)
              if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { clipped = true; break }
            }
            if (clipped) continue
            if (r.right > pr.right + 2 || r.left < pr.left - 2) bad.push((el.textContent || el.tagName).trim().slice(0, 24))
          }
        }
        // panel ve yanına iliştirilen fotoğraf ekranın yan kenarından taşmaz
        for (const el of document.querySelectorAll('.pixel-panel, .polaroid')) {
          const r = el.getBoundingClientRect()
          if (r.width && getComputedStyle(el).visibility !== 'hidden' && (r.left < -2 || r.right > innerWidth + 2)) bad.push(`ekrandan: ${el.className.split(' ')[0]}`)
        }
        return bad
      })
      if (spill.length) note += ` (panelden taşan: ${spill.slice(0, 3).join(' | ')})`
      if (shotDir) await page.screenshot({ path: `${shotDir}/${name}-${size}.png` })
      const ok = over <= TOLERANCE && !note
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(16)} ${size.padEnd(9)} taşma:${over}px${note}`)
      if (!ok) bad.push(`${name}/${size}`)
      await ctx.close()
    }
  }
  await browser.close()
  console.log(bad.length ? `\n${bad.length} hücre kayıyor: ${bad.join(', ')}` : '\nBütün menüler tek bakışta sığıyor.')
  process.exit(bad.length ? 1 : 0)
})()
