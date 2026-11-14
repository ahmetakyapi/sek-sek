/**
 * Zemin föyü: şehirlerin zemin ve duvar kaplamasını (terrainDraw.ts) oyunu açmadan tek PNG'de gösterir ve
 * hücre başına çizim süresini ölçer. Kaplama değişince önce buna bak; süre eskisinin iki katını geçmesin.
 *
 *   node scripts/art/terrain.cjs [çıktı.png] [şehir ...] [--olc] [--kaynak=başka/terrainDraw.ts] [--olcek=3] [--yer=karo]
 *
 * --olc     yalnız süre ölçer (bölümün ilk 40 parçasındaki bütün hücreler, 5 turun en iyisi; her hücreden bir piksel
 *           okunur ki tarayıcı çizimi ertelemesin)
 * --kaynak  karşılaştırma için başka bir terrainDraw dosyası (ör. eski sürümün kopyası; game/ içinde durmalı)
 * --yer     kadrajın sol kenarı (karo); verilmezse başlangıç noktası
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')

const root = path.join(__dirname, '..', '..')
const args = process.argv.slice(2)
const flag = (f, d) => (args.find((a) => a.startsWith(`--${f}=`)) || `=${d}`).split('=')[1]
const plain = args.filter((a) => !a.startsWith('--'))
const out = plain.find((a) => a.endsWith('.png')) || '/tmp/seksek-zemin.png'
const picked = plain.filter((a) => !a.endsWith('.png'))
const cities = picked.length ? picked : ['istanbul', 'edirne', 'diyarbakir', 'nevsehir', 'erzurum', 'antalya', 'trabzon', 'malatya']
const src = path.resolve(flag('kaynak', path.join(root, 'game/terrainDraw.ts'))).replace(/\.ts$/, '')
const scale = Number(flag('olcek', 3))
const at = flag('yer', '')
const bench = args.includes('--olc')

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-zemin-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(entry, `export { TerrainHD } from ${JSON.stringify(src)}\nexport { LEVELS } from ${JSON.stringify(path.join(root, 'game/levels'))}\nexport { World } from ${JSON.stringify(path.join(root, 'game/sim'))}\nexport { CITY } from ${JSON.stringify(path.join(root, 'game/art'))}\n`)
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><body style="margin:0;background:#222"><canvas id="c"></canvas><script src="s.js"></script><script>
const cities = ${JSON.stringify(cities)}, sc = ${scale}, at = ${JSON.stringify(at)}
const PW = 960, PH = 480, cols = Math.min(2, cities.length)
const cv = document.getElementById('c'); cv.width = PW * cols; cv.height = PH * Math.ceil(cities.length / cols)
const c = cv.getContext('2d')
const world = (id) => new S.World(S.LEVELS.find((l) => l.id === id))
window.sheet = () => cities.forEach((id, n) => {
  const w = world(id), t = new S.TerrainHD(w, id, sc), s = S.CITY[id]
  const camX = at ? Number(at) * 16 : Math.max(0, w.player.x - 40), camY = w.player.y - PH / sc + 62
  c.save(); c.translate((n % cols) * PW, Math.floor(n / cols) * PH); c.beginPath(); c.rect(0, 0, PW, PH); c.clip()
  const g = c.createLinearGradient(0, 0, 0, PH); s.sky.forEach((k, i) => g.addColorStop(i / 2, k)); c.fillStyle = g; c.fillRect(0, 0, PW, PH)
  t.prime(camX, camY, PW, PH); t.draw(c, camX, camY, PW, PH)
  c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.fillText(id, 10, 20); c.restore()
})
window.bench = () => cities.map((id) => {
  const w = world(id); let best = Infinity, cells = 0
  for (let k = 0; k < 5; k++) {
    const t = new S.TerrainHD(w, id, sc); let n = 0
    const a = performance.now()
    for (let i = 0; i < 40 && i * 8 < w.cols; i++) for (let b = 0; b < t.bandCount; b++) { const cell = t.paintCell(i, b); if (cell) { cell.getContext('2d').getImageData(0, 0, 1, 1); n++ } }
    const ms = performance.now() - a
    if (ms < best) best = ms
    cells = n
  }
  return { id, cells, ms: +(best / cells).toFixed(3) }
})
</script></body>`)
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1920, height: 1000 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  if (bench) {
    const r = await pg.evaluate(() => window.bench())
    for (const x of r) console.log(`${x.id.padEnd(12)} ${String(x.cells).padStart(4)} hücre  ${x.ms.toFixed(3)} ms/hücre`)
    console.log(`ortalama ${(r.reduce((a, x) => a + x.ms, 0) / r.length).toFixed(3)} ms/hücre (ölçek ${scale})`)
  } else {
    await pg.evaluate(() => window.sheet())
    await (await pg.$('canvas')).screenshot({ path: out })
    console.log(out)
  }
  await b.close()
})()
