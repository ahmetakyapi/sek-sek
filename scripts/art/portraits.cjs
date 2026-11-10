/**
 * Portreler: game/portraitDraw.ts'in vektör büstlerini dosyaya basar.
 *   public/portreler/<kılık>.png  384x456  (skor kartpostalı; Portrait bileşeninde tuval çizilene dek görünen ilk kare)
 * portraitDraw.ts ya da heroDraw.ts LOOKS değişince yeniden üret.
 *
 *   node scripts/art/portraits.cjs                 dosyaları üretir
 *   node scripts/art/portraits.cjs --foy [çıktı]   yalnız föy: bütün kılıklar büyük, küçük, yüz kırpımı, göz kırpma ve atkı renkleri
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..', '..')
const sheet = process.argv.indexOf('--foy')
const out = sheet >= 0 ? process.argv[sheet + 1] || '/tmp/seksek-portreler.png' : null
const W = 384
const H = 456

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-portre-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(entry, `export { drawPortrait } from ${JSON.stringify(path.join(root, 'game/portraitDraw'))}\nexport { LOOKS } from ${JSON.stringify(path.join(root, 'game/heroDraw'))}\n`)
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><body style="margin:0;background:#2a2438"><canvas id="c"></canvas><script src="s.js"></script><script>
const looks = Object.keys(S.LOOKS)
window.one = (look) => {
  const cv = document.createElement('canvas'); cv.width = ${W}; cv.height = ${H}
  S.drawPortrait(cv.getContext('2d'), look, ${W}, ${H}, 0, { still: true })
  return cv.toDataURL('image/png')
}
window.sheet = () => {
  const bw = 220, bh = Math.round(bw * 76 / 64), sw = 40, sh = Math.round(sw * 76 / 64), pad = 16
  const cw = bw + pad, W = looks.length * cw + pad, H = pad + 20 + bh + pad + 76 + pad + 2 * (110 + pad)
  const cv = document.getElementById('c'); cv.width = W; cv.height = H
  const c = cv.getContext('2d'); c.fillStyle = '#2a2438'; c.fillRect(0, 0, W, H)
  const at = (x, y, w, h, f) => { c.save(); c.translate(x, y); f(w, h); c.restore(); c.strokeStyle = '#d9a441'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, w + 2, h + 2) }
  looks.forEach((k, i) => {
    const x = pad + i * cw
    c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(k, x, pad + 10)
    at(x, pad + 20, bw, bh, (w, h) => S.drawPortrait(c, k, w, h, 0, { still: true }))
    const y2 = pad + 20 + bh + pad
    at(x, y2, sw, sh, (w, h) => S.drawPortrait(c, k, w, h, 0, { still: true }))
    at(x + sw + 12, y2, 38, 38, (w, h) => S.drawPortrait(c, k, w, h, 0, { still: true, face: true }))
    at(x + sw + 62, y2, 64, 76, (w, h) => S.drawPortrait(c, k, w, h, 0, { still: true }))
    // göz kırpma karesi ve başka bir an (nefes + salınım)
    const y3 = y2 + 76 + pad
    at(x, y3, 92, 110, (w, h) => S.drawPortrait(c, k, w, h, 0.95, {}))
    at(x + 104, y3, 92, 110, (w, h) => S.drawPortrait(c, k, w, h, 2.4, {}))
  })
  // atkı renkleri: iki kahraman
  const scarves = [['#f2b632', '#c08a24'], ['#2e8fd0', '#1e68a0'], ['#6a9a3e', '#4a7228'], ['#b04a9a', '#7e2e70'], ['#2ab8a8', '#1a8a7e'], ['#33407e', '#222c5a'], ['#f4f8ff', '#4ab0e8']]
  const y4 = pad + 20 + bh + pad + 76 + pad + 110 + pad
  scarves.forEach(([a, b], i) => {
    at(pad + i * 208, y4, 92, 110, (w, h) => S.drawPortrait(c, 'uktun', w, h, 0, { still: true, scarf: a, scarfS: b }))
    at(pad + i * 208 + 100, y4, 92, 110, (w, h) => S.drawPortrait(c, 'memo', w, h, 0, { still: true, scarf: a, scarfS: b }))
  })
}
</script></body>`)
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1920, height: 900 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  if (out) {
    await pg.evaluate(() => window.sheet())
    await (await pg.$('canvas')).screenshot({ path: out })
    console.log(out)
  } else {
    const target = path.join(root, 'public', 'portreler')
    fs.mkdirSync(target, { recursive: true })
    const looks = await pg.evaluate(() => Object.keys(S.LOOKS))
    for (const k of looks) {
      const data = await pg.evaluate((look) => window.one(look), k)
      fs.writeFileSync(path.join(target, `${k}.png`), Buffer.from(data.split(',')[1], 'base64'))
      // düz renkli çizim: 256 renkli palet göze aynı görünür, dosya beşte birine iner
      execFileSync('python3', ['-c', `from PIL import Image; p='public/portreler/${k}.png'; Image.open(p).convert('RGB').quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(p, optimize=True)`], { cwd: root })
      console.log('ok', k)
    }
  }
  await b.close()
})()
