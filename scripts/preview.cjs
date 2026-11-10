/**
 * Oyun içi önizleme: bir şehri açar, istenen yere gider, ekran görüntüsü alır. Görsel bir değişiklikten
 * sonra "nasıl duruyor" sorusunun cevabı budur; ajanlar da kendi işine bununla bakar.
 *
 *   npm run dev -- -p 3100            (ayrı uçbirimde)
 *   node scripts/preview.cjs <şehir> [yer] [çıktı.png] [seçenekler]
 *
 * yer:  start (varsayılan) · arrival (meydan yolunun başı) · arrival:+20 (varıştan 20 karo ileri)
 *       boss (arena, boss uyanmış) · x,y (karo koordinatı) · npc:2 (üçüncü kişinin yanı, diyalog açık)
 * seçenekler: --telefon (iPhone yatay) · --dikey (telefon dikey) · --memo · --en · --bekle=ms · --port=3100
 */
const { chromium, devices } = require('playwright')

const args = process.argv.slice(2)
const flags = args.filter((a) => a.startsWith('--'))
const [city = 'istanbul', where = 'start', out = `/tmp/seksek-${city}.png`] = args.filter((a) => !a.startsWith('--'))
const has = (f) => flags.includes(`--${f}`)
const val = (f, d) => (flags.find((x) => x.startsWith(`--${f}=`)) || `=${d}`).split('=')[1]
const port = val('port', '3100')

;(async () => {
  const b = await chromium.launch()
  const opt = has('telefon') ? devices['iPhone 13 landscape'] : has('dikey') ? devices['iPhone 13'] : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }
  const ctx = await b.newContext(opt)
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => console.log('SAYFA HATASI:', e.message))
  const save = { character: has('memo') ? 'memo' : 'uktun', skippedName: true, seenStory: true, mapVersion: 999, migrated: true, accountVersion: 2, sfx: false, music: false, keyHints: false, unlocked: 99, lang: has('en') ? 'en' : 'tr' }
  await pg.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), save)
  await pg.goto(`http://localhost:${port}/?debug&sehir=${city}`)
  await pg.waitForTimeout(3000)
  const tap = (l) => (opt.hasTouch ? l.tap() : l.click())
  await tap(pg.getByRole('button', { name: /Devam|Başla|Yolculu|Continue|Start/ }).first())
  await pg.waitForTimeout(700)
  await tap(pg.getByRole('button', { name: /▶/ }))
  await pg.waitForTimeout(1200)
  // ?debug ile window.__mk.world() oyunun dünyasını verir
  await pg.evaluate((where) => {
    const w = window.__mk.world()
    const p = w.player
    const put = (x, y) => { p.x = x; p.y = y; w.spawn = { x, y } }
    if (where.startsWith('arrival')) put(w.arrival.x + Number(where.split(':')[1] || 0) * 16, w.arrival.y)
    else if (where === 'boss') put(w.boss.min + 40, w.boss.floor - 14)
    else if (where.startsWith('npc')) { const n = w.npcs[Number(where.split(':')[1] || 0)]; put(n.x - 20, n.y + 2) }
    else if (where.includes(',')) { const [x, y] = where.split(',').map(Number); put(x * 16, y * 16 - 14) }
  }, where)
  await pg.waitForTimeout(Number(val('bekle', where === 'boss' ? 4200 : 1500)))
  await pg.screenshot({ path: out })
  console.log(out)
  await b.close()
})()
