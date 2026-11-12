/**
 * Performans kanıtı (kalıcı kural, CLAUDE.md "Akıcılık"): üretim derlemesinde gerçek oynanış (koşu, zıplama, dash)
 * sırasında kare kaçıyor mu? Retina masaüstü (DPR 2) ve DPR 3 telefonda 8 sn oynar, kare aralıklarını ölçer.
 * İlk saniye (ısınma) sayılmaz. Karelerin %2'sinden fazlası 25 ms'yi aşar ya da p95 20 ms'yi geçerse FAIL.
 * Geliştirme sunucusu (React geliştirme modu) yavaştır ve yanıltır: üretim derlemesiyle koş.
 *
 *   npm run build && npx next start -p 3200      (ayrı uçbirimde)
 *   node scripts/verify-perf.cjs [şehir ...] [--port=3200]
 */
const { chromium, devices } = require('playwright')

const args = process.argv.slice(2)
const port = (args.find((a) => a.startsWith('--port=')) || '--port=3200').split('=')[1]
const cities = args.filter((a) => !a.startsWith('--'))
const list = cities.length ? cities : ['istanbul', 'kocaeli', 'van']
const SCREENS = [
  ['masaustu-retina', { viewport: { width: 1512, height: 860 }, deviceScaleFactor: 2 }],
  ['telefon-yatay-dpr3', { ...devices['iPhone 13 landscape'], deviceScaleFactor: 3 }],
]

;(async () => {
  const b = await chromium.launch()
  let fail = 0
  for (const city of list)
    for (const [name, opt] of SCREENS) {
      const ctx = await b.newContext(opt)
      const pg = await ctx.newPage()
      pg.on('pageerror', (e) => console.log('SAYFA HATASI:', e.message))
      const save = { character: 'uktun', skippedName: true, seenStory: true, tutorial: false, mapVersion: 999, migrated: true, accountVersion: 2, sfx: false, music: false, keyHints: true, unlocked: 99, lang: 'tr' }
      await pg.addInitScript((s) => {
        localStorage.setItem('seksek:v1', JSON.stringify(s))
        window.__gaps = []
        let last = 0
        const loop = (t) => {
          if (last) window.__gaps.push(t - last)
          last = t
          requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
      }, save)
      await pg.goto(`http://localhost:${port}/?debug&sehir=${city}`)
      await pg.waitForTimeout(3500)
      const tap = (l) => (opt.hasTouch ? l.tap() : l.click())
      await tap(pg.getByRole('button', { name: /Devam|Başla|Yolculu|Continue|Start/ }).first())
      await pg.waitForTimeout(700)
      await tap(pg.getByRole('button', { name: /▶/ }))
      await pg.waitForTimeout(1500)
      await pg.evaluate(() => {
        window.__mk.world().kill = () => {}
      })
      await pg.keyboard.down('ArrowRight')
      await pg.waitForTimeout(1000)
      await pg.evaluate(() => (window.__gaps = []))
      for (let i = 0; i < 16; i++) {
        await pg.keyboard.press(i % 3 === 0 ? 'KeyX' : 'ArrowUp')
        await pg.waitForTimeout(450)
      }
      await pg.keyboard.up('ArrowRight')
      const gaps = await pg.evaluate(() => window.__gaps)
      const g = gaps.slice().sort((x, y) => x - y)
      const over = g.filter((x) => x > 25).length
      const p95 = g[Math.floor(g.length * 0.95)]
      const px = await pg.evaluate(() => {
        const c = document.querySelector('canvas')
        return c ? c.width * c.height : 0
      })
      const ok = over / g.length <= 0.02 && p95 <= 20
      if (!ok) fail++
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${city.padEnd(10)} ${name.padEnd(19)} kare ${g.length} · 25 ms üstü ${over} · p95 ${p95.toFixed(1)} ms · en çok ${g[g.length - 1].toFixed(0)} ms · tuval ${(px / 1e6).toFixed(2)} Mpx`)
      await ctx.close()
    }
  await b.close()
  process.exit(fail ? 1 : 0)
})()
