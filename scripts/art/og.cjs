// Paylaşım görseli: icons.py --og-scene arka planının üstüne oyunun yazı tipleriyle başlık dizer.
// Kullanım: npm run build && npx next start -p 3100 &  sonra  node scripts/art/og.cjs <sahne.png>
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '../..')
const scene = fs.readFileSync(process.argv[2]).toString('base64')
const emblem = fs.readFileSync(path.join(root, 'app/apple-icon.png')).toString('base64')

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.goto('http://localhost:3100/hakkinda')
  await p.waitForTimeout(800)
  await p.evaluate(({ scene, emblem }) => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="position:fixed;inset:0;z-index:2147483647;width:1200px;height:630px;background:url(data:image/png;base64,${scene}) 0 0/1200px 630px;image-rendering:pixelated">
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(18,15,26,.88) 0%,rgba(18,15,26,.6) 42%,rgba(18,15,26,0) 62%)"></div>
        <div style="position:absolute;left:72px;top:84px;width:620px">
          <img src="data:image/png;base64,${emblem}" width="120" height="120" style="border-radius:28px;image-rendering:pixelated;box-shadow:0 6px 0 #120f1a">
          <div class="font-display" style="margin-top:28px;font-size:112px;line-height:1;color:#f4ead8;text-shadow:0 7px 0 #120f1a">Sek-Sek</div>
          <div class="font-display" style="margin-top:18px;font-size:34px;color:#f2c14e;text-shadow:0 3px 0 #120f1a">Şehir Şehir Anadolu</div>
          <div style="margin-top:20px;font-family:var(--font-mono);font-size:22px;line-height:1.55;color:rgba(244,234,216,.9);white-space:nowrap">İstanbul’dan Bayburt’a 16 şehir, 48 hatıra.<br>Simitçiden kale burcuna bir yolculuk.</div>
        </div>
      </div>`
    document.body.appendChild(el)
  }, { scene, emblem })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  for (const f of ['app/opengraph-image.png', 'app/twitter-image.png']) await p.screenshot({ path: path.join(root, f) })
  await b.close()
})()
