/**
 * Çizim föyü: oyundaki vektör çizimleri (kahramanlar, şehir insanları, patronlar) tek PNG'de gösterir.
 * heroDraw.ts ya da bossDraw.ts değişince önce buna bak; oyunu açmaya gerek kalmaz.
 *
 *   node scripts/art/sheet.cjs [çıktı.png]        (varsayılan /tmp/seksek-foy.png)
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')

const root = path.join(__dirname, '..', '..')
const out = process.argv[2] || '/tmp/seksek-foy.png'

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-foy-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(entry, `export { drawHero, gait, POSES, LOOKS } from ${JSON.stringify(path.join(root, 'game/heroDraw'))}\nexport { drawBoss } from ${JSON.stringify(path.join(root, 'game/bossDraw'))}\nexport { BOSSES, makeBoss } from ${JSON.stringify(path.join(root, 'game/boss'))}\n`)
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><body style="margin:0;background:#4a3550"><canvas id="c"></canvas><script src="s.js"></script><script>
const looks = Object.keys(S.LOOKS), bosses = Object.keys(S.BOSSES)
const cols = 8, cw = 230, W = cols * cw
const heroRows = 2, bossRows = Math.ceil(bosses.length / cols)
const H = 340 * heroRows + 60 + bossRows * 420
const cv = document.getElementById('c'); cv.width = W; cv.height = H
const c = cv.getContext('2d'); c.fillStyle = '#5a4660'; c.fillRect(0, 0, W, H)
const label = (t, x, y) => { c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText(t, x, y) }
const floor = (x, y) => { c.fillStyle = '#8a95a8'; c.fillRect(x - 90, y, 180, 5) }
// 1. sıra: bütün kılıklar bekleme pozunda · 2. sıra: iki kahramanın hareketleri
looks.forEach((k, i) => { const x = cw / 2 + i * cw, y = 300; floor(x, y); S.drawHero(c, k, S.POSES.idle, x, y, 260, false, 0.3, {}); label(k, x, 24) })
const moves = [['koşu', S.gait(0)], ['koşu', S.gait(0.25)], ['zıpla', S.POSES.jump], ['tepe', S.POSES.apex], ['düş', S.POSES.fall], ['in', S.POSES.land], ['atıl', S.POSES.dash], ['el salla', S.POSES.wave]]
moves.forEach(([n, p], i) => { const x = cw / 2 + i * cw, y = 640; floor(x, y); S.drawHero(c, i % 2 ? 'memo' : 'uktun', p, x, y, 260, false, 0.3, { moving: n === 'koşu' }); label(n, x, 364) })
// patronlar: üstte hareket hâli, altta yorgun
bosses.forEach((id, i) => {
  const x = cw / 2 + (i % cols) * cw, y0 = 340 * heroRows + 60 + Math.floor(i / cols) * 420
  label(S.BOSSES[id].name, x, y0 + 14)
  ;['move', 'tired'].forEach((state, k) => { const y = y0 + 200 + k * 200; floor(x, y); const b = S.makeBoss(S.BOSSES[id], 0, 0, 0, 100); b.state = state; b.hidden = false; b.dir = 1; S.drawBoss(c, id, b, x, y, 6, 0.3) })
})
</script></body>`)
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1840, height: 900 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  await pg.waitForTimeout(300)
  await (await pg.$('canvas')).screenshot({ path: out })
  await b.close()
  console.log(out)
})()
