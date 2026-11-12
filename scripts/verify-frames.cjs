/**
 * Kare akıcılığı: zemin parçaları kamera varmadan önce hazır mı? Yüksek çözünürlükte (3x) karakter dash
 * hızında (300 px/sn) 2400 px ileri ve geri taşınır; görünür olduğu karede tek seferde çizilmek zorunda kalan
 * zemin hücresi sayılır (syncBands). Sıfırdan büyükse o karede 120 Hz ekran kare kaçırır: dash kasar. FAIL verir.
 * Kare süreleri de raporlanır (başsız tarayıcıda ölçü kabadır, yalnız bilgi).
 *
 *   npm run dev -- -p 3100            (ayrı uçbirimde)
 *   node scripts/verify-frames.cjs [şehir ...] [--port=3100]
 */
const { chromium } = require('playwright')

const args = process.argv.slice(2)
const port = (args.find((a) => a.startsWith('--port=')) || '--port=3100').split('=')[1]
const cities = args.filter((a) => !a.startsWith('--'))
const list = cities.length ? cities : ['istanbul', 'kocaeli', 'nevsehir', 'van', 'erzurum']
const SCREENS = [
  ['telefon-yatay', { viewport: { width: 932, height: 430 }, deviceScaleFactor: 3 }],
  ['masaustu', { viewport: { width: 1512, height: 860 }, deviceScaleFactor: 2 }],
]

;(async () => {
  const b = await chromium.launch()
  let fail = 0
  for (const city of list)
    for (const [name, opt] of SCREENS) {
      const ctx = await b.newContext(opt)
      const pg = await ctx.newPage()
      pg.on('pageerror', (e) => console.log('SAYFA HATASI:', e.message))
      const save = { character: 'uktun', skippedName: true, seenStory: true, tutorial: true, mapVersion: 999, migrated: true, accountVersion: 2, sfx: false, music: false, keyHints: false, unlocked: 99, lang: 'tr' }
      await pg.addInitScript((s) => {
        localStorage.setItem('seksek:v1', JSON.stringify(s))
        const raf = window.requestAnimationFrame.bind(window)
        window.__ft = []
        window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); cb(t); window.__ft.push(performance.now() - a) })
      }, save)
      await pg.goto(`http://localhost:${port}/?debug&sehir=${city}`)
      await pg.waitForTimeout(3000)
      await pg.getByRole('button', { name: /Devam|Başla|Yolculu|Continue|Start/ }).first().click()
      await pg.waitForTimeout(700)
      await pg.getByRole('button', { name: /▶/ }).click()
      await pg.waitForTimeout(1500)
      // karakter dash hızında, gökte (çarpışmasız) bölüm boyunca taşınır; ölüm ve ışınlanma kapalı
      const r = await pg.evaluate(
        () =>
          new Promise((done) => {
            const w = window.__mk.world()
            w.kill = () => {}
            const p = w.player
            const x0 = p.x
            const end = Math.min(w.cols * 16 - 40, x0 + 2400)
            const s0 = window.__mk.stats().syncBands
            window.__ft = []
            let dir = 1
            let last = performance.now()
            const tick = (now) => {
              const dt = Math.min(0.05, (now - last) / 1000)
              last = now
              p.x += dir * 300 * dt
              p.y = 8
              p.vy = 0
              p.vx = dir * 300
              if (p.x > end) dir = -1
              if (dir < 0 && p.x < x0) return done({ sync: window.__mk.stats().syncBands - s0, ft: window.__ft })
              requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          }),
      )
      const ft = r.ft.slice().sort((x, y) => x - y)
      const q = (k) => ft[Math.min(ft.length - 1, Math.floor(ft.length * k))].toFixed(1)
      const ok = r.sync === 0
      if (!ok) fail++
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${city.padEnd(10)} ${name.padEnd(14)} hazır olmayan zemin hücresi: ${r.sync} · kare ms medyan ${q(0.5)} · p99 ${q(0.99)} · en çok ${ft[ft.length - 1].toFixed(1)} · 8 ms'yi aşan ${ft.filter((x) => x > 8.3).length}/${ft.length}`)
      await ctx.close()
    }
  await b.close()
  process.exit(fail ? 1 : 0)
})()
