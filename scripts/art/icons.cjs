/**
 * Logo amblemi, favicon, uygulama ikonları ve paylaşım görseli: scripts/art/emblem.ts'in vektör çizimini dosyaya basar.
 *   app/icon.png              512  yuvarlak köşeli amblem (saydam köşe)
 *   app/apple-icon.png        180  dolu kare (köşeyi iOS yuvarlar)
 *   app/favicon.ico           16, 32, 48  sekme işareti: cepheden yüz + kırmızı atkı + güneş (16 piksel ızgarası, 32 ve 48 vektör)
 *   public/logo-emblem.png    256  arayüzde "Sek-Sek" yazısının yanındaki amblem
 *   public/icon-192.png       192  PWA ana ekran ikonu (yuvarlak köşeli amblem)
 *   public/icon-maskable.png  512  PWA maskable: içerik ortadaki %80'de
 *   app/opengraph-image.png, app/twitter-image.png  1200x630 (yalnız --og; yazı tipi için dev sunucusu 3100'de açık olmalı)
 *
 *   node scripts/art/icons.cjs                 ikon dosyalarını üretir
 *   node scripts/art/icons.cjs --og            ikonlar + paylaşım görseli
 *   node scripts/art/icons.cjs --foy [çıktı]   yalnız föy: bütün boyutlar, açık ve koyu sekme, iOS maskesi, maskable güvenli alan
 */
const { chromium } = require('playwright')
const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..', '..')
const sheet = process.argv.indexOf('--foy')
const out = sheet >= 0 ? process.argv[sheet + 1] || '/tmp/seksek-ikonlar.png' : null
const og = process.argv.includes('--og')
/** küçük boyda keskin kenar için tuval bu kat büyük çizilir, sonra küçültülür */
const SS = 4

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-ikon-'))
  const bundle = path.join(dir, 's.js')
  await esbuild.build({ entryPoints: [path.join(__dirname, 'emblem.ts')], bundle: true, format: 'iife', globalName: 'S', outfile: bundle, logLevel: 'silent' })
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><body style="margin:0;background:#2a2438"><canvas id="c"></canvas><script src="s.js"></script><script>
const KINDS = {
  round: (c, n) => S.drawEmblem(c, n, { round: true }),
  square: (c, n) => S.drawEmblem(c, n),
  maskable: (c, n) => S.drawEmblem(c, n, { inset: 0.8 }),
  mark: (c, px) => S.drawMark(c, px / ${SS}, ${SS}),
}
// büyük çiz, kutu süzgeciyle küçült: 16 pikselde bile hat dağılmaz
window.make = (kind, n) => {
  const big = document.createElement('canvas'); big.width = big.height = n * ${SS}
  KINDS[kind](big.getContext('2d'), n * ${SS})
  const cv = document.createElement('canvas'); cv.width = cv.height = n
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  let src = big
  for (let m = n * ${SS} / 2; m >= n; m /= 2) {
    const half = document.createElement('canvas'); half.width = half.height = m
    const h = half.getContext('2d'); h.imageSmoothingQuality = 'high'; h.drawImage(src, 0, 0, m, m); src = half
  }
  c.drawImage(src, 0, 0)
  return cv
}
window.one = (kind, n) => window.make(kind, n).toDataURL('image/png')
window.sheet = () => {
  const W = 1500, H = 1010
  const cv = document.getElementById('c'); cv.width = W; cv.height = H
  const c = cv.getContext('2d'); c.fillStyle = '#2a2438'; c.fillRect(0, 0, W, H)
  const label = (t, x, y, col) => { c.fillStyle = col || '#fff'; c.font = '13px sans-serif'; c.fillText(t, x, y) }
  const put = (kind, n, x, y, zoom) => { const im = window.make(kind, n); c.imageSmoothingEnabled = !zoom; c.drawImage(im, x, y, n * (zoom || 1), n * (zoom || 1)); c.imageSmoothingEnabled = true }
  label('icon.png 512 (yuvarlak, saydam köşe)', 16, 20); put('round', 512, 16, 30)
  label('apple-icon 180 (dolu kare)', 548, 20); put('square', 180, 548, 30)
  label('iOS maskesiyle', 748, 20)
  c.save(); c.beginPath(); c.roundRect(748, 30, 180, 180, 40); c.clip(); put('square', 180, 748, 30); c.restore()
  label('maskable 192 + %80 güvenli daire', 948, 20); put('maskable', 192, 948, 30)
  c.strokeStyle = '#fff'; c.setLineDash([5, 5]); c.beginPath(); c.arc(948 + 96, 30 + 96, 96 * 0.8, 0, Math.PI * 2); c.stroke(); c.setLineDash([])
  label('daire maskesiyle', 1160, 20)
  c.save(); c.beginPath(); c.arc(1160 + 96, 30 + 96, 96, 0, Math.PI * 2); c.clip(); put('maskable', 192, 1160, 30); c.restore()
  // gerçek boylar: açık ve koyu sekme zemini
  const strip = (y, bg, fg, name) => {
    c.fillStyle = bg; c.fillRect(548, y, 936, 92)
    label(name, 556, y + 16, fg)
    let x = 556
    for (const [kind, n] of [['round', 64], ['round', 48], ['round', 32], ['round', 16], ['mark', 48], ['mark', 32], ['mark', 16]]) { put(kind, n, x, y + 24); label(kind + ' ' + n, x, y + 24 + n + 13 > y + 90 ? y + 88 : y + 24 + n + 13, fg); x += n + 62 }
    // sekme taklidi
    c.fillStyle = fg; c.font = '13px sans-serif'; put('mark', 16, 1250, y + 38); c.fillText('Sek-Sek · Şehir Şehir', 1274, y + 51)
    put('round', 16, 1250, y + 62); c.fillText('(amblem 16)', 1274, y + 75)
  }
  strip(232, '#f1f3f4', '#202124', 'açık sekme')
  strip(332, '#202124', '#e8eaed', 'koyu sekme')
  // 8 kat büyütülmüş 16 ve 32
  label('işaret 16 x8', 548, 446); put('mark', 16, 548, 454, 8)
  label('işaret 32 x8', 692, 446); put('mark', 32, 692, 454, 8)
  label('amblem 16 x8', 964, 446); put('round', 16, 964, 454, 8)
  label('amblem 32 x8', 1108, 446); put('round', 32, 1108, 454, 8)
  // uygulama ızgarası: başka ikonların arasında
  label('uygulama ızgarasında (60 px)', 16, 566)
  const others = ['#1da1f2', '#25d366', '#ff0000', '#f4ead8', '#111', '#ffcc00', '#7b61ff']
  c.fillStyle = '#3a5a8a'; c.fillRect(16, 576, 512, 100)
  others.forEach((col, i) => {
    const x = 32 + i * 70 + (i >= 3 ? 70 : 0)
    c.save(); c.beginPath(); c.roundRect(x, 596, 60, 60, 14); c.clip(); c.fillStyle = col; c.fillRect(x, 596, 60, 60); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x + 30, 626, 14, 0, 7); c.fill(); c.restore()
  })
  c.save(); c.beginPath(); c.roundRect(32 + 3 * 70, 596, 60, 60, 14); c.clip(); put('square', 60, 32 + 3 * 70, 596); c.restore()
  // arayüzdeki boylar
  label('arayüz: logo-emblem 56 ve 40, koyu panelde', 16, 700)
  c.fillStyle = '#1e1a29'; c.fillRect(16, 710, 512, 84)
  put('round', 56, 32, 724); put('round', 40, 110, 732)
  c.fillStyle = '#f4ead8'; c.font = '700 26px monospace'; c.fillText('Sek-Sek', 160, 762)
  // paylaşım sahnesi (yazısız), yarı boy
  label('paylaşım sahnesi (yazı icons.cjs --og ile dizilir)', 548, 720)
  c.save(); c.translate(548, 730); c.scale(0.44, 0.44); c.beginPath(); c.rect(0, 0, 1200, 630); c.clip(); S.drawShare(c, 1200, 630); c.restore()
}
</script></body>`)
  const b = await chromium.launch()
  const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } })
  pg.on('pageerror', (e) => console.log('HATA:', e.message))
  await pg.goto('file://' + path.join(dir, 'index.html'))
  if (out) {
    await pg.evaluate(() => window.sheet())
    await (await pg.$('canvas')).screenshot({ path: out })
    console.log(out)
    await b.close()
    return
  }
  const png = async (kind, n) => Buffer.from((await pg.evaluate(([k, s]) => window.one(k, s), [kind, n])).split(',')[1], 'base64')
  const files = [['app/icon.png', 'round', 512], ['app/apple-icon.png', 'square', 180], ['public/logo-emblem.png', 'round', 256], ['public/icon-192.png', 'round', 192], ['public/icon-maskable.png', 'maskable', 512]]
  for (const [f, kind, n] of files) {
    fs.writeFileSync(path.join(root, f), await png(kind, n))
    console.log('ok', f)
  }
  // dolu kare ikonlarda saydamlık kalmasın (iOS saydamı siyaha boyar)
  execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nfor p in sys.argv[1:]: Image.open(p).convert("RGB").save(p, optimize=True)', path.join(root, 'app/apple-icon.png'), path.join(root, 'public/icon-maskable.png')])
  // favicon: her boy ayrı çizilir (küçültülmüş tek resim değil), PIL tek .ico'da toplar
  const sizes = [16, 32, 48]
  const parts = []
  for (const n of sizes) {
    const p = path.join(dir, `fav-${n}.png`)
    fs.writeFileSync(p, await png('mark', n))
    parts.push(p)
  }
  execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nims=[Image.open(p).convert("RGBA") for p in sys.argv[2:]]\nims[-1].save(sys.argv[1], format="ICO", sizes=[i.size for i in ims], append_images=ims[:-1])', path.join(root, 'app/favicon.ico'), ...parts])
  console.log('ok app/favicon.ico', sizes.join(', '))

  if (og) {
    // yazı oyunun kendi yazı tipleriyle dizilsin diye sahne çalışan sitenin içinde kurulur
    const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
    await p.goto('http://localhost:3100/hakkinda')
    await p.waitForTimeout(800)
    await p.addScriptTag({ path: bundle })
    await p.evaluate(() => {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="position:fixed;inset:0;z-index:2147483647;width:1200px;height:630px;overflow:hidden;background:#3b2a58">
          <canvas id="og-scene" width="1200" height="630" style="position:absolute;inset:0"></canvas>
          <div style="position:absolute;left:68px;top:74px;width:560px">
            <canvas id="og-emblem" width="224" height="224" style="width:112px;height:112px;display:block"></canvas>
            <div class="font-display" style="margin-top:26px;font-size:124px;line-height:1;color:#f4ead8;text-shadow:0 7px 0 #22161f;white-space:nowrap">Sek-Sek</div>
            <div style="margin-top:26px;font-family:var(--font-mono);font-weight:600;font-size:23px;line-height:1.4;color:#f4ead8;white-space:nowrap">Gezgin’in yarım kalmış defterini tamamla.</div>
            <div style="display:inline-block;margin-top:24px;padding:9px 18px 10px;font-family:var(--font-mono);font-weight:700;font-size:25px;line-height:1;color:#22161f;background:#f2c14e;border:4px solid #22161f;border-radius:12px;box-shadow:0 5px 0 #22161f">25 şehir · 75 hatıra</div>
          </div>
        </div>`
      document.body.appendChild(el)
      S.drawShare(document.getElementById('og-scene').getContext('2d'), 1200, 630)
      S.drawEmblem(document.getElementById('og-emblem').getContext('2d'), 224, { round: true })
    })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(400)
    for (const f of ['app/opengraph-image.png', 'app/twitter-image.png']) {
      await p.screenshot({ path: path.join(root, f) })
      console.log('ok', f)
    }
  }
  await b.close()
})()
