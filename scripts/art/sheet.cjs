/**
 * Çizim föyü: oyundaki vektör çizimleri (kahramanlar, şehir insanları, boss’lar) tek PNG'de gösterir.
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
  fs.writeFileSync(entry, `export { drawHero, gait, airPose, climbPose, swimStroke, POSES, LOOKS } from ${JSON.stringify(path.join(root, 'game/heroDraw'))}\nexport { drawBoss } from ${JSON.stringify(path.join(root, 'game/bossDraw'))}\nexport { BOSSES, makeBoss } from ${JSON.stringify(path.join(root, 'game/boss'))}\n`)
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><body style="margin:0;background:#4a3550"><canvas id="c"></canvas><script src="s.js"></script><script>
const looks = Object.keys(S.LOOKS), bosses = Object.keys(S.BOSSES)
const cols = 8, cw = 230, W = cols * cw
const heroRows = 4, bossRows = Math.ceil(bosses.length / cols)
const H = 340 * heroRows + 60 + bossRows * 420
const cv = document.getElementById('c'); cv.width = W; cv.height = H
const c = cv.getContext('2d'); c.fillStyle = '#5a4660'; c.fillRect(0, 0, W, H)
const label = (t, x, y) => { c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText(t, x, y) }
const floor = (x, y) => { c.fillStyle = '#8a95a8'; c.fillRect(x - 90, y, 180, 5) }
// 1. sıra: bütün kılıklar bekleme pozunda · 2. sıra: iki kahramanın hareketleri
looks.forEach((k, i) => { const x = cw / 2 + i * cw, y = 300; floor(x, y); S.drawHero(c, k, S.POSES.idle, x, y, 260, false, 0.3, {}); label(k, x, 24) })
const moves = [['koşu', S.gait(0), 1], ['koşu', S.gait(0.25), 1], ['yüksel', S.airPose(-260), 0.2], ['tepe', S.airPose(0), 0.6], ['düş', S.airPose(260, 0.1), 0.7], ['in', S.POSES.land, 0], ['fren', S.POSES.brake, 0.8], ['duvar', S.POSES.wall, 0.4],
  ['dash', S.POSES.dash, 1.4, 0.5], ['roket (yukarı)', S.POSES.rocket, 1.4], ['ayakla (aşağı)', S.POSES.stomp, 1], ['halat', S.climbPose(0.6), 0.2], ['yavaş koşu', S.gait(0.1, 0.45), 0.5], ['nitro', S.gait(0.1, 1.55), 1.2], ['el salla', S.POSES.wave, 0], ['kalkış', S.POSES.launch, 0.6],
  ['kulaç: süzül', S.swimStroke(0), 1.2, 1.16], ['kulaç: çek', S.swimStroke(0.3), 1.1, 1.16], ['kulaç: topla', S.swimStroke(0.5), 0.9, 1.16], ['kulaç: tekme', S.swimStroke(0.7), 1.3, 1.16],
  ['inişe uzan', S.POSES.preland, 0.8], ['duvardan sek', S.POSES.kick, 1], ['çapraz yukarı dash', S.POSES.dashUp, 1.4, 0.6], ['çapraz aşağı dash', S.POSES.dashDown, 1.4, -0.5]]
moves.forEach(([n, p, flow, rot], i) => {
  const x = cw / 2 + (i % cols) * cw, y = 640 + Math.floor(i / cols) * 340
  floor(x, y)
  c.save()
  if (rot) { c.translate(x, y - 130); c.rotate(rot); c.translate(-x, -(y - 130)) }
  S.drawHero(c, i % 2 ? 'memo' : 'uktun', p, x, y, 260, false, 0.3, { moving: flow > 0.5, flow })
  c.restore()
  label(n, x, y - 276)
})
// boss’lar: üstte hareket hâli, altta yorgun
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
