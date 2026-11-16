/**
 * "Menülerde sayfa kaymaz" kuralının kanıtı: her menü ekranı dört boyutta açılır, panelin ekran boyunu aşıp aşmadığı
 * ölçülür (Overlay kabında scrollHeight - clientHeight; uzun listeler panelin içinde kendi alanında kayar, o sayılmaz).
 *
 * Kullanım: geliştirme ya da üretim sunucusu açıkken  node scripts/audit-menus.cjs [--goster klasör]
 *   PORT=3000 (varsayılan), ONLY=<ad parçası> yalnız o ekranlar. --goster verilirse her hücrenin ekran görüntüsü klasöre yazılır.
 * Skor API'si yakalanır ve örnek satırlar döner (veritabanı gerekmez). Kayan hücre varsa çıkış kodu 1.
 */
const { chromium } = require('playwright')

const PORT = process.env.PORT || 3000
const shotDir = process.argv.includes('--goster') ? process.argv[process.argv.indexOf('--goster') + 1] : null
const SIZES = { masaustu: [1280, 720], genis: [1512, 860], dikey: [390, 664], yatay: [750, 342] }
/** Okuma sayfası olarak tasarlanan ekranlar (bilerek kayar) */
const TOLERANCE = 2

const IDS = ['istanbul', 'edirne', 'kocaeli', 'bursa', 'eskisehir', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya', 'nevsehir', 'kayseri', 'adana', 'hatay']
const best = Object.fromEntries(IDS.map((id, i) => [id, { timeMs: 60000 + i * 7000, deaths: i % 4, items: [true, i % 2 === 0, i % 3 === 0] }]))
const SAVE = { character: 'uktun', seenStory: true, tutorial: false, unlocked: 16, best: { ...best, corum: { timeMs: 140000, deaths: 9, items: [true, true, true] } }, challenges: { 'corum-leblebi': 15200 }, ach: { firstCity: true }, stamps: { istanbul: true }, charms: { istanbul: true, bursa: true }, bosses: { istanbul: true, edirne: true, kocaeli: true, bursa: true }, skippedName: true, mapVersion: 8, migrated: true, accountVersion: 2, stats: { runs: 40, deaths: 120, jumps: 3000, dashes: 500, stomps: 40, playMs: 5400000 } }
/** bütün şehirlerin kimlikleri (oyunun kendisinden): final ve Ayna Yolu için hepsi bitmiş yolcu */
const LEVEL_IDS = JSON.parse(require('node:child_process').execSync(`npx tsx -e "import { LEVELS } from './game/levels'; console.log(JSON.stringify(LEVELS.map((l) => l.id)))"`, { encoding: 'utf8' }))
const ALL = { ...SAVE, unlocked: 99, best: Object.fromEntries(LEVEL_IDS.map((id, i) => [id, { timeMs: 60000 + i * 1000, deaths: 1, items: [true, true, true] }])), sawEnding: true }
const NEWS = { ...SAVE, best: { ...best, izmir: { ...best.izmir, v: 'eski' } }, seen: IDS.filter((id) => id !== 'kayseri') }

const FINISH = "eval:(()=>{const w=window.__mk.world();w.started=true;w.time=73.4;w.deaths=2;if(w.pickups[0])w.pickups[0].taken=true;w.complete=true;w.events.push({type:'complete'})})()"
/** ekran adı → [kayıt, adımlar]. Adım: düğme adı · tab:ad · key:Tuş · wait:ms · eval:js */
const SCREENS = {
  'ana-menu': [SAVE, []],
  'ana-menu-yeni': [null, []],
  'guncelleme-notu': [NEWS, []],
  sehirler: [SAVE, ['Şehirler']],
  defter: [SAVE, ['Defter']],
  karakter: [SAVE, ['Karakter']],
  modlar: [SAVE, ['Modlar']],
  'kural-sec': [SAVE, ['Modlar', 'Kural Seç']],
  'duello-kur': [SAVE, ['Modlar', 'Düello Kur']],
  'duello-sira': [SAVE, ['Modlar', 'Düello Kur', 'Sırayla', 'Düelloyu Başlat']],
  skorlar: [SAVE, ['Skorlar']],
  'skorlar-sehir': [SAVE, ['Skorlar', 'tab:Şehirler']],
  'skorlar-gunluk': [SAVE, ['Skorlar', 'tab:Günlük']],
  'skorlar-speedrun': [SAVE, ['Skorlar', 'tab:Speedrun']],
  'coop-kur': [SAVE, ['Modlar', 'Birlikte Oyna']],
  'sinir-bozucu': [SAVE, ['Modlar', 'Öfkeni Seç']],
  ayarlar: [SAVE, ['Ayarlar']],
  'ayarlar-tuslar': [SAVE, ['Ayarlar', 'opt:tab:Kontroller']],
  'foto-kipi': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:Escape', 'Fotoğraf Kipi', 'wait:300']],
  hesap: [SAVE, ['Giriş Yap']],
  'sehir-karti': [SAVE, ['Devam Et']],
  mola: [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', 'key:ArrowRight', 'wait:400', 'key:Escape']],
  'bolum-sonu': [SAVE, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:900']],
  'gunluk-sonu': [SAVE, ['Modlar', '▶ Oyna', 'wait:600', FINISH, 'wait:900']],
  mucadeleler: [SAVE, ['Modlar', 'Mücadele Seç']],
  'mucadele-sonu': [SAVE, ['Modlar', 'Mücadele Seç', '▶ Yeniden Koş', 'wait:600', FINISH, 'wait:900']],
  'defter-basarim': [SAVE, ['Defter', 'tab:Başarımlar']],
  'defter-album': [SAVE, ['Defter', 'tab:Albüm']],
  turnuva: [SAVE, ['Modlar', 'Turnuvaya Gir']],
  'turnuva-sonu': [SAVE, ['Modlar', 'Turnuvaya Gir', '▶ Koş', 'wait:600', FINISH, 'wait:900']],
  dukkan: [SAVE, ['Karakter', 'Kılık Dükkânı']],
  'ayna-yolu': [ALL, ['Modlar', '◐ Aynaya Geç']],
  // final ilk kez: Bayburt'u bitiren, finali henüz görmemiş yolcu (görmüş olan Bayburt'tan sonra Rize'ye geçer)
  final: [{ ...ALL, sawEnding: false }, ['Devam Et', 'wait:300', 'key:Enter', 'wait:600', FINISH, 'wait:1200', '▶ Defteri Kapat', 'wait:600'], '?sehir=bayburt'],
  'yaris-daveti': [SAVE, [], '?yaris=konya~ahmet'],
}

const rows = () => ['uzan', 'GökçeKuş', 'ahmet', 'esra', 'Deniz', 'Kaan', 'Elif Su', 'Mert', 'Zeynep', 'Baran', 'Ada'].map((name, i) => ({ name, timeMs: 52000 + i * 4300, deaths: i % 7, items: 3 - (i % 3), minDeaths: i % 5, maxItems: 3, plays: 1 + (i % 6), cities: 28 - i * 2, keeps: 84 - i * 6, stamps: 28 - i * 2, charms: 20 - i, bosses: 28 - i * 2, found: 132 - i * 9, rank: i + 1, total: 11, me: false }))

;(async () => {
  const browser = await chromium.launch()
  const bad = []
  for (const [size, [w, h]] of Object.entries(SIZES)) {
    for (const [name, [save, steps, query]] of Object.entries(SCREENS).filter(([n]) => !process.env.ONLY || n.includes(process.env.ONLY))) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 800 })
      if (save) await ctx.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), save)
      const page = await ctx.newPage()
      await page.route('**/api/scores**', (r) => (r.request().method() === 'POST' ? r.fulfill({ json: { ok: true, first: true, improved: true, better: { time: true, deaths: true, items: true }, bestMs: 73400, rank: 3, total: 11 } }) : r.fulfill({ json: { scores: rows(), total: 11 } })))
      await page.route('**/api/players/**', (r) => r.fulfill({ status: 401, json: {} }))
      let note = ''
      try {
        // ?debug güncelleme notunu susturur; notun kendisi ölçülürken parametresiz açılır
        await page.goto(`http://localhost:${PORT}/${name === 'guncelleme-notu' ? '' : `?debug${query ? `&${query.slice(1)}` : ''}`}`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        for (const st of steps) {
          if (st.startsWith('key:')) await page.keyboard.press(st.slice(4))
          else if (st.startsWith('wait:')) await page.waitForTimeout(Number(st.slice(5)))
          else if (st.startsWith('eval:')) await page.evaluate(st.slice(5))
          // opt: yalnız bazı boyutlarda olan adım (ör. geniş ekranda sekme yok, iki sütun yan yana): yoksa geçilir
          else if (st.startsWith('opt:')) {
            const s2 = st.slice(4)
            const loc = page.getByRole(s2.startsWith('tab:') ? 'tab' : 'button', { name: s2.replace(/^tab:/, '') }).first()
            if (await loc.isVisible()) await loc.click({ timeout: 4000 })
          } else await page.getByRole(st.startsWith('tab:') ? 'tab' : 'button', { name: st.replace(/^tab:/, '') }).first().click({ timeout: 4000 })
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
