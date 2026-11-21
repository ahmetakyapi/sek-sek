/**
 * Görünüm föyü: Mağaza'nın saç stilleri, renkleri, ten tonları, kıyafet renkleri ve desenleri, ifadeler, bekleme duruşları
 * ve koşu tarzları (game/looks.ts). Her yolcu için ayrı. heroDraw.ts / portraitDraw.ts / hairDraw.ts / stance.ts
 * değişince buna bak.
 *
 *   node scripts/art/looks.cjs [çıktı.png] [bölüm]   bölüm: sac | renk | ifade | durus | kosu | hepsi (varsayılan hepsi)
 *   NODE_PATH=/opt/node-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers (bu ortamda)
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')

const root = path.join(__dirname, '..', '..')
const out = process.argv[2] || '/tmp/seksek-gorunum.png'
const only = process.argv[3] || 'hepsi'

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-gorunum-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(
    entry,
    `export { drawHero, gaitInto, gait, POSES, newPose, airPose } from ${JSON.stringify(path.join(root, 'game/heroDraw'))}\n` +
      `export { drawPortrait } from ${JSON.stringify(path.join(root, 'game/portraitDraw'))}\n` +
      `export { idlePose, demoPose, newDemo } from ${JSON.stringify(path.join(root, 'game/stance'))}\n` +
      `export { LOOK_AXES, optionsFor, normalizeLook } from ${JSON.stringify(path.join(root, 'game/looks'))}\n`,
  )
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><body style="margin:0;background:#4a3550"><canvas id="c"></canvas><script src="s.js"></script><script>
const only = ${JSON.stringify(only)}
const sec = (n) => only === 'hepsi' || only === n
const heroes = ['uktun', 'memo']
const none = { head: 'yok', face: 'yok', back: 'yok' }
const withLook = (hero, o) => ({ ...none, look: S.normalizeLook(hero, o) })
const axis = (id) => S.LOOK_AXES.find((a) => a.id === id)
const cv = document.getElementById('c')
const W = 1700
let H = 0
const rows = []
const label = (c, t, x, y, a = 'left') => { c.fillStyle = '#fff'; c.font = '13px sans-serif'; c.textAlign = a; c.fillText(t, x, y) }
// satır: {h, draw(c, y)}
const add = (h, draw) => { rows.push({ y: H, h, draw }); H += h }
const cell = 118
const portraits = (c, hero, items, y, size = 84) => items.forEach(([name, acc], i) => {
  const x = 10 + i * (size + 8)
  c.save(); c.translate(x, y); S.drawPortrait(c, hero, size, Math.round(size * 76 / 64), 0, { still: true, acc }); c.restore()
  label(c, name, x + size / 2, y + size * 76 / 64 + 13, 'center')
})
const bodies = (c, hero, items, y, size = 130) => items.forEach(([name, acc, pose, mv], i) => {
  const x = 10 + size / 2 + i * (size * 0.92)
  c.fillStyle = '#8a95a8'; c.fillRect(x - 40, y + size, 80, 3)
  S.drawHero(c, hero, pose || S.POSES.idle, x, y + size, size, false, 0.3 + i * 0.4, { moving: !!mv, acc })
  label(c, name, x, y + size + 18, 'center')
})
if (sec('sac')) heroes.forEach((hero) => {
  const opts = S.LOOK_AXES[0].options.filter((o) => !o.for || o.for === hero)
  add(30, (c, y) => label(c, hero + ' · saç stilleri (gövde, koşu, portre)', 10, y + 20))
  add(170, (c, y) => bodies(c, hero, opts.map((o) => [o.id, withLook(hero, { hs: o.id })]), y + 4, 124))
  add(160, (c, y) => bodies(c, hero, opts.map((o) => [o.id, withLook(hero, { hs: o.id }), S.gait(0.3), true]), y + 4, 124))
  add(140, (c, y) => portraits(c, hero, opts.map((o) => [o.id, withLook(hero, { hs: o.id })]), y + 4, 92))
})
if (sec('renk')) heroes.forEach((hero) => {
  const ax = (id) => axis(id).options.filter((o) => !o.for || o.for === hero)
  const run = (title, id, bodyH = 0) => {
    add(22, (c, y) => label(c, hero + ' · ' + title, 10, y + 16))
    add(110, (c, y) => portraits(c, hero, ax(id).map((o) => [o.id, withLook(hero, { [id]: o.id })]), y + 2, 62))
  }
  run('saç rengi', 'hc'); run('ten tonu', 'sk'); run('kıyafet rengi', 'oc'); run('kıyafet deseni', 'op'); run('göz rengi', 'ey')
  add(160, (c, y) => bodies(c, hero, ax('op').map((o) => [o.id, withLook(hero, { op: o.id, oc: 'turkuaz' })]), y + 4, 124))
})
if (sec('ifade')) heroes.forEach((hero) => {
  const opts = axis('ex').options
  add(22, (c, y) => label(c, hero + ' · ifadeler', 10, y + 16))
  add(130, (c, y) => portraits(c, hero, opts.map((o) => [o.id, withLook(hero, { ex: o.id })]), y + 2, 92))
  add(150, (c, y) => bodies(c, hero, opts.map((o) => [o.id, withLook(hero, { ex: o.id })]), y + 2, 130))
})
if (sec('durus')) heroes.forEach((hero) => {
  const opts = axis('st').options
  add(22, (c, y) => label(c, hero + ' · duruşlar: hareketsiz (üst) ve canlı hareket anları (alt satırlar)', 10, y + 16))
  const idle = (st, idleT, t = 0.4) => S.idlePose(S.newPose(), st, idleT, t)
  add(160, (c, y) => bodies(c, hero, opts.map((o) => [o.id, none, idle(o.id, 0)]), y + 2, 124))
  ;[3.9, 4.6, 5.6, 10.1, 10.9, 12.6, 17.2, 18.4, 19.2].forEach((it, k) => add(150, (c, y) => bodies(c, hero, opts.map((o) => [o.id + ' ' + it, none, idle(o.id, it, 0.2 + it * 0.37)]), y + 2, 118)))
})
if (only === 'taban') heroes.forEach((hero) => {
  const idle = (st, idleT, t = 0.4) => S.idlePose(S.newPose(), st, idleT, t)
  add(270, (c, y) => bodies(c, hero, ['rahat', 'bel', 'bagli', 'cep'].map((st) => [st, none, idle(st, 0)]).concat([['esne', none, idle('esner', 4.9)], ['bak', none, idle('bakinir', 4.6)]]), y + 2, 230))
})
if (sec('kosu')) heroes.forEach((hero) => {
  const styles = axis('rs').options
  add(22, (c, y) => label(c, hero + ' · koşu tarzları (dört evre) ve zıplama, iniş', 10, y + 16))
  styles.forEach((o) => add(150, (c, y) => bodies(c, hero, [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((ph) => [o.id + ' ' + ph, none, S.gaitInto(S.newPose(), ph, 1, o.id), true]), y + 2, 118)))
  const d = S.newDemo()
  add(170, (c, y) => bodies(c, hero, [0.04, 0.12, 0.2, 0.32, 0.5, 0.68, 0.8, 0.86, 0.9, 0.95].map((u) => { S.demoPose(d, 'zipla', u * 1.7); const p = JSON.parse(JSON.stringify(d.pose)); return ['u' + u, none, p, true] }), y + 2, 118))
})
cv.width = W; cv.height = H + 10
const c = cv.getContext('2d'); c.fillStyle = '#5a4660'; c.fillRect(0, 0, W, H + 10)
rows.forEach((r) => r.draw(c, r.y))
</script></body>`,
  )
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1700, height: 900 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  pg.on('console', (m) => m.type() === 'error' && console.log('KONSOL:', m.text()))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  await pg.waitForTimeout(300)
  await (await pg.$('canvas')).screenshot({ path: out })
  await b.close()
  console.log(out)
})()
