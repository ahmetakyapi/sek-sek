/**
 * Aksesuar föyü: Kılık Dükkânı'nın her aksesuarı (game/accessories.ts) kendi yuvasında tek başına, ardından birkaç
 * kombin (baş + yüz + sırt); her satır iki kahramanda hareket hâlinde, portrede, telefon boyunda ve sekiz kılıkta.
 * heroDraw.ts ya da portraitDraw.ts'te aksesuar çizimi değişince buna bak.
 *
 *   node scripts/art/accessories.cjs [çıktı.png] [süzgeç]   (varsayılan /tmp/seksek-aksesuar.png)
 *
 * süzgeç: virgülle kimlikler; yalnız bunlardan birini taşıyan satırlar çizilir (ör. `lale,pelerin`).
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')

const root = path.join(__dirname, '..', '..')
const out = process.argv[2] || '/tmp/seksek-aksesuar.png'
const only = process.argv[3] ? process.argv[3].split(',') : null

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-aksesuar-'))
  const entry = path.join(dir, 'entry.ts')
  fs.writeFileSync(
    entry,
    `export { drawHero, gait, POSES, LOOKS } from ${JSON.stringify(path.join(root, 'game/heroDraw'))}\n` +
      `export { drawPortrait } from ${JSON.stringify(path.join(root, 'game/portraitDraw'))}\n` +
      `export { ACCESSORIES } from ${JSON.stringify(path.join(root, 'game/accessories'))}\n`,
  )
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'S', outfile: path.join(dir, 's.js'), logLevel: 'silent' })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><body style="margin:0;background:#4a3550"><canvas id="c"></canvas><script src="s.js"></script><script>
const none = { head: 'yok', face: 'yok', back: 'yok' }
const combos = [
  { head: 'kulaklik', face: 'gunes', back: 'pelerin' },
  { head: 'fes', face: 'kayak', back: 'saz' },
  { head: 'kulaklik', face: 'kayak', back: 'heybe' },
  { head: 'lale', face: 'gozluk', back: 'pelerin' },
  { head: 'bere', face: 'gunes', back: 'saz' },
  { head: 'hasir', face: 'kayak', back: 'pelerin' },
]
const only = ${JSON.stringify(only)}
const accs = [...S.ACCESSORIES.map((a) => ({ ...none, [a.slot]: a.id })), ...combos].filter((k) => !only || only.some((id) => Object.values(k).includes(id)))
const name = (k) => Object.values(k).filter((v) => v !== 'yok').join(' + ')
const looks = Object.keys(S.LOOKS)
const moves = [['uktun', 'bekle', S.POSES.idle, false], ['uktun', 'koş', S.gait(0.25), true], ['uktun', 'zıpla', S.POSES.jump, true], ['uktun', 'dash', S.POSES.dash, true], ['uktun', 'duvar', S.POSES.wall, false],
  ['memo', 'bekle', S.POSES.idle, false], ['memo', 'koş', S.gait(0), true], ['memo', 'düş', S.POSES.fall, true], ['memo', 'tepe', S.POSES.apex, true], ['memo', 'duvar', S.POSES.wall, false]]
const cw = 150, rowH = 230, portW = 150, portH = Math.round(portW * 76 / 64), small = 64
const W = 120 + moves.length * cw + 2 * (portW + 12) + 4 * 40 + 20
const lookRowH = 150
const H = accs.length * rowH + 40 + accs.length * lookRowH
const cv = document.getElementById('c'); cv.width = W; cv.height = H
const c = cv.getContext('2d'); c.fillStyle = '#5a4660'; c.fillRect(0, 0, W, H)
const label = (t, x, y, a = 'center') => { c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.textAlign = a; c.fillText(t, x, y) }
const floor = (x, y, w = 130) => { c.fillStyle = '#8a95a8'; c.fillRect(x - w / 2, y, w, 4) }
accs.forEach((acc, r) => {
  const y0 = r * rowH
  label(name(acc), 10, y0 + 20, 'left')
  moves.forEach(([who, n, p, mv], i) => {
    const x = 120 + cw / 2 + i * cw, y = y0 + 200
    floor(x, y)
    S.drawHero(c, who, p, x, y, 180, false, 0.3 + i * 0.37, { moving: mv, acc })
    if (r === 0) label(who + ' · ' + n, x, 16)
  })
  const px = 120 + moves.length * cw
  ;['uktun', 'memo'].forEach((who, k) => {
    c.save(); c.translate(px + k * (portW + 12), y0 + 24); S.drawPortrait(c, who, portW, portH, 0, { still: true, acc }); c.restore()
  })
  // telefon boyu: oyundaki gibi küçük (64 px), sağa ve sola bakan
  const sx = px + 2 * (portW + 12) + 20
  ;[['uktun', false], ['uktun', true], ['memo', false], ['memo', true]].forEach(([who, fl], k) => {
    const x = sx + k * 40, y = y0 + 200
    floor(x, y, 34)
    S.drawHero(c, who, k % 2 ? S.gait(0.5) : S.POSES.idle, x, y, small, fl, 0.3, { moving: k % 2 === 1, acc })
  })
  c.save(); c.translate(sx, y0 + 60); S.drawPortrait(c, 'uktun', 38, 38, 0, { still: true, face: true, acc }); c.restore()
  c.save(); c.translate(sx + 50, y0 + 60); S.drawPortrait(c, 'memo', 38, 38, 0, { still: true, face: true, acc }); c.restore()
})
// sekiz kılık: her aksesuarla bekleme pozunda
const ly0 = accs.length * rowH + 40
accs.forEach((acc, r) => {
  label(name(acc), 10, ly0 + r * lookRowH + 20, 'left')
  looks.forEach((k, i) => {
    const x = 120 + 60 + i * 130, y = ly0 + r * lookRowH + 135
    floor(x, y, 100)
    S.drawHero(c, k, S.POSES.idle, x, y, 120, false, 0.3, { acc })
    if (r === 0) label(k, x, ly0 - 8)
  })
  looks.forEach((k, i) => {
    c.save(); c.translate(120 + 8 * 130 + 20 + i * 62, ly0 + r * lookRowH + 50); S.drawPortrait(c, k, 56, 66, 0, { still: true, acc }); c.restore()
  })
})
</script></body>`,
  )
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1800, height: 900 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  await pg.waitForTimeout(300)
  await (await pg.$('canvas')).screenshot({ path: out })
  await b.close()
  console.log(out)
})()
