/**
 * Yaratık föyü: düşmanlar, dost hayvanlar, hatıralar ve ortak nesneler (game/enemyDraw.ts) tek PNG'de.
 * Üstte büyük çizim (ayrıntıya bakmak için), her hücrenin köşesinde oyundaki boyutu (telefon: 3x, masaüstü: 4x).
 *
 *   node scripts/art/creatures.cjs [çıktı.png]        (varsayılan /tmp/seksek-yaratiklar.png)
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')

const root = path.join(__dirname, '..', '..')
const out = process.argv[2] || '/tmp/seksek-yaratiklar.png'

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-yaratik-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(
    entry,
    `export { drawEnemy, drawFriend, drawKeepsake, drawThing } from ${JSON.stringify(path.join(root, 'game/enemyDraw'))}\nexport { CREATURE_NAMES, CITY } from ${JSON.stringify(path.join(root, 'game/art'))}\nexport { LEVELS } from ${JSON.stringify(path.join(root, 'game/levels'))}\n`,
  )
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><body style="margin:0;background:#4a3550"><canvas id="c"></canvas><script src="s.js"></script><script>
const KIND = { frog: 'hopper', hare: 'hopper', ram: 'charger', bat: 'bat', hedgehog: 'spiky', magpie: 'magpie', gull: 'fly', pigeon: 'fly', raven: 'fly', wasp: 'fly', bee: 'fly', mosquito: 'fly' }
const BOX = { charger: [14, 12], fly: [12, 8], bat: [12, 8], spiky: [12, 9], magpie: [12, 9] }
const friendSet = new Set(Object.values(S.CITY).map((s) => s.animal))
const species = Object.keys(S.CREATURE_NAMES).filter((k) => !friendSet.has(k)).concat(['???'])
const friends = [...new Set(Object.values(S.CITY).map((s) => s.animal))].concat(['???'])
const cities = Object.keys(S.CITY)
const itemName = {}; for (const l of S.LEVELS) itemName[l.id ?? l.city] = l.item
const BIG = 9, cols = 5, cw = 366, W = cols * cw
const eRows = Math.ceil(species.length / cols), eh = 250
const fRows = Math.ceil(friends.length / 5), fh = 260
const kRows = Math.ceil(cities.length / 9), kh = 190
const H = 40 + eRows * eh + 40 + fRows * fh + 40 + kRows * kh + 40 + 200
const cv = document.getElementById('c'); cv.width = W; cv.height = H
const c = cv.getContext('2d')
// zemin renkleri: açık gök, koyu mağara, kum; hale ve dış hat hepsinde okunmalı
const BG = ['#8fc4e8', '#3a3048', '#d8b888']
const label = (t, x, y, col = '#fff', f = 13) => { c.fillStyle = col; c.font = '600 ' + f + 'px sans-serif'; c.textAlign = 'center'; c.fillText(t, x, y) }
const head = (t, y) => { c.fillStyle = '#2e2236'; c.fillRect(0, y, W, 34); c.fillStyle = '#ffd86a'; c.font = '700 17px sans-serif'; c.textAlign = 'left'; c.fillText(t, 12, y + 23) }
const floor = (x, y, w) => { c.fillStyle = 'rgba(40,30,50,0.55)'; c.fillRect(x - w / 2, y, w, 3) }
let y0 = 0
head('DÜŞMANLAR  ·  devriye / işaret-saldırı / sersem   ·   alt sıra: oyundaki boy (3x telefon, 4x masaüstü)', y0); y0 += 40
species.forEach((sp, i) => {
  const x0 = (i % cols) * cw, yy = y0 + Math.floor(i / cols) * eh
  c.fillStyle = BG[i % 3]; c.fillRect(x0 + 2, yy + 2, cw - 4, eh - 4)
  const kind = KIND[sp] || 'ground'
  const [w, h] = BOX[kind] || [12, 10]
  const states = kind === 'charger' || kind === 'magpie' ? ['idle', 'windup', 'charge', 'stun'] : kind === 'hopper' ? ['idle', 'windup', 'air'] : ['idle', 'idle2']
  const n = states.length, step = (cw - 20) / n
  const big = n > 3 ? 6 : n > 2 ? 8 : BIG
  states.forEach((st, k) => {
    const x = x0 + 10 + step * (k + 0.5), y = yy + 150
    floor(x, y, step - 8)
    // kutu: gövdenin çarpışma alanı
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([3, 3]); c.strokeRect(x - (w * big) / 2, y - h * big, w * big, h * big); c.setLineDash([])
    const e = { kind, state: st === 'idle2' ? 'idle' : st, w, h, phase: st === 'idle2' ? 0.21 : 0.08, timer: 0.3 }
    S.drawEnemy(c, sp, e, x, y, big, 1, st === 'idle2' ? 0.52 : 0.3)
    label(st === 'idle2' ? 'idle (2)' : st, x, yy + 172, i % 3 === 1 ? '#ddd' : '#2a2030', 11)
    // oyundaki boy
    const sx = x - 22, sy = yy + 232
    S.drawEnemy(c, sp, e, sx, sy, 3, -1, 0.3); S.drawEnemy(c, sp, e, sx + 44, sy, 4, 1, 0.3)
  })
  label((S.CREATURE_NAMES[sp] || 'bilinmeyen') + '  (' + sp + ' · ' + kind + ')', x0 + cw / 2, yy + 20, i % 3 === 1 ? '#fff' : '#1e1626', 14)
})
y0 += eRows * eh
head('DOST HAYVANLAR  ·  normal / sevilmiş (happy)', y0); y0 += 40
const fw = W / 5
friends.forEach((an, i) => {
  const x0 = (i % 5) * fw, yy = y0 + Math.floor(i / 5) * fh
  c.fillStyle = BG[(i + 1) % 3]; c.fillRect(x0 + 2, yy + 2, fw - 4, fh - 4)
  ;[false, true].forEach((hp, k) => {
    const x = x0 + fw * (0.27 + k * 0.46), y = yy + 200
    floor(x, y, fw * 0.4)
    S.drawFriend(c, an, x, y, 8, 0.35 + k * 0.1, hp)
    S.drawFriend(c, an, x - 50, yy + 250, 3, 0.35, hp); S.drawFriend(c, an, x + 30, yy + 250, 4, 0.35, hp)
  })
  label((S.CREATURE_NAMES[an] || (an === 'angoraCat' ? 'Ankara Kedisi (seçenek)' : 'bilinmeyen')) + '  (' + an + ')', x0 + fw / 2, yy + 20, (i + 1) % 3 === 1 ? '#fff' : '#1e1626', 14)
})
y0 += fRows * fh
head('HATIRALAR  ·  büyük / oyundaki boy / alınmış (taken)', y0); y0 += 40
const kw = W / 9
cities.forEach((id, i) => {
  const x0 = (i % 9) * kw, yy = y0 + Math.floor(i / 9) * kh
  c.fillStyle = BG[i % 3]; c.fillRect(x0 + 2, yy + 2, kw - 4, kh - 4)
  S.drawKeepsake(c, id, x0 + kw / 2, yy + 92, 10, 0.2)
  S.drawKeepsake(c, id, x0 + kw * 0.2, yy + 168, 3, 0.5); S.drawKeepsake(c, id, x0 + kw * 0.5, yy + 168, 4, 0.5); S.drawKeepsake(c, id, x0 + kw * 0.8, yy + 168, 4, 0.5, { taken: true })
  label(id + ' · ' + (itemName[id] || '?'), x0 + kw / 2, yy + 20, i % 3 === 1 ? '#fff' : '#1e1626', 13)
})
y0 += kRows * kh
head('ORTAK NESNELER', y0); y0 += 40
const things = [['key', {}, 'anahtar'], ['stamp', { accent: '#e8794a' }, 'pul'], ['stamp', { accent: '#2f9a94' }, 'pul (vurgu)'], ['crystal', { active: true }, 'dash halkası'], ['crystal', { active: true, ready: false }, 'halka (dash varken)'], ['crystal', { active: false, charge: 0.6 }, 'halka (doluyor)'], ['charm', {}, 'nazar'], ['spring', { squash: 0, accent: '#e8794a' }, 'yay'], ['spring', { squash: 1, accent: '#e8794a' }, 'yay (basık)'], ['spring', { squash: 0, crate: true }, 'kasa (Malatya)'], ['spring', { squash: 1, crate: true }, 'kasa (basık)']]
const tw = W / things.length
things.forEach(([k, o, n], i) => {
  const x0 = i * tw
  c.fillStyle = BG[i % 3]; c.fillRect(x0 + 2, y0 + 2, tw - 4, 196)
  S.drawThing(c, k, x0 + tw / 2, y0 + 100, 9, 0.3, o)
  S.drawThing(c, k, x0 + tw * 0.3, y0 + 176, 3, 0.3, o); S.drawThing(c, k, x0 + tw * 0.7, y0 + 176, 4, 0.3, o)
  label(n, x0 + tw / 2, y0 + 20, i % 3 === 1 ? '#fff' : '#1e1626', 13)
})
</script></body>`,
  )
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1840, height: 900 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  await pg.waitForTimeout(300)
  await (await pg.$('canvas')).screenshot({ path: out })
  await b.close()
  console.log(out)
})()
