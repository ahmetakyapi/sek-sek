/**
 * README görselleri: oyunun kendisinden alınır, elle ekran görüntüsü yok. Görünüm değişince yeniden üret.
 *   npm run dev -- -p 3100      (ayrı uçbirimde)
 *   node scripts/art/readme.cjs [ad ...]     ad: title · intro · complete · about · mobile · mechanics · cities · hammers
 * Çıktı: docs/img/*.png ve hammers.gif. Skor tablosu örnek veriyle doldurulur (ağ isteği yakalanır).
 */
const { chromium, devices } = require('playwright')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const out = (f) => path.join(root, 'docs', 'img', f)
const BASE = 'http://localhost:3100'
const only = process.argv.slice(2)
const want = (n) => !only.length || only.includes(n)

const CITIES = ['istanbul', 'edirne', 'kocaeli', 'bursa', 'canakkale', 'izmir', 'antalya', 'ankara', 'konya']
const best = {}
CITIES.forEach((id, i) => (best[id] = { timeMs: 82000 + i * 3100, deaths: i % 3, items: [true, i % 2 === 0, i < 4] }))
const some = (n) => Object.fromEntries(CITIES.slice(0, n).map((id) => [id, true]))
const SAVE = { character: 'uktun', skippedName: true, seenStory: true, mapVersion: 999, migrated: true, accountVersion: 2, sfx: false, music: false, keyHints: true, unlocked: 99, best, stamps: some(4), charms: some(5), bosses: some(6), scarf: 'al', daily: { last: '', count: 4 }, weekly: { last: '', count: 1 }, rush: null, timesReset: true }
const SCORES = ['Elif', 'Baran', 'Deniz', 'Zeynep', 'Kerem', 'Asya', 'Mert', 'Defne'].map((name, i) => ({ name, timeMs: 71500 + i * 2900, deaths: i % 4, items: 3 - (i % 3), cities: 25 - i * 2 }))

async function open(b, { phone = false, lang = 'tr', city = '', save = {}, height = 720 } = {}) {
  const ctx = await b.newContext(phone ? devices['iPhone 13 landscape'] : { viewport: { width: 1280, height }, deviceScaleFactor: 1 })
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => console.log('SAYFA HATASI:', e.message))
  await pg.route('**/api/scores**', (r) => (r.request().method() === 'GET' ? r.fulfill({ json: { scores: SCORES } }) : r.fulfill({ json: { ok: true, improved: true, rank: 3 } })))
  await pg.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), { ...SAVE, lang, ...save })
  await pg.goto(`${BASE}/?debug${city ? `&sehir=${city}` : ''}`)
  // geliştirme sunucusunun köşe rozeti görüntüye girmesin
  await pg.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
  await pg.waitForTimeout(3500)
  pg.tap_ = (l) => (phone ? l.tap() : l.click())
  return pg
}

/** Bölümü açar, oyuncuyu (karo) koyar. where: [x, y] · 'npc:n' · 'boss' · 'arrival:+n' */
async function play(b, city, where, opt = {}) {
  const pg = await open(b, { ...opt, city })
  await pg.tap_(pg.getByRole('button', { name: /Devam|Başla|Yolculu|Continue|Start/ }).first())
  await pg.waitForTimeout(800)
  if (opt.intro) return pg
  await pg.tap_(pg.getByRole('button', { name: /▶/ }))
  await pg.waitForTimeout(1100)
  await pg.evaluate((where) => {
    const w = window.__mk.world()
    const p = w.player
    const put = (x, y) => { p.x = x; p.y = y; w.spawn = { x, y } }
    if (Array.isArray(where)) put(where[0] * 16, where[1] * 16 - 14)
    else if (where.startsWith('npc')) { const n = w.npcs[Number(where.split(':')[1])]; put(n.x - 20, n.y + 2) }
    else if (where.startsWith('arrival')) put(w.arrival.x + Number(where.split(':')[1] || 0) * 16, w.arrival.y)
    else if (where === 'boss') { const f = [...w.checkpoints].sort((a, c) => c.x - a.x)[0]; put(f.x + 60, f.y + f.h - p.h) }
  }, where)
  await pg.waitForTimeout(opt.wait ?? 1500)
  return pg
}

const shot = async (pg, f) => { await pg.screenshot({ path: out(f) }); console.log('ok', f); await pg.context().close() }

/** Görselleri başlıklı bir ızgarada birleştirir (tarayıcıda dizilir: yazı tipi ve kenar yumuşatma oyunla aynı aileden). */
async function grid(b, f, cells, { cols, w, h, plate = false }) {
  const pg = await b.newPage({ viewport: { width: cols * (w + 12) + 12, height: 100 }, deviceScaleFactor: 1 })
  const html = cells.map((c) => `<figure><img src="data:image/png;base64,${c.png.toString('base64')}" width="${w}" height="${h}"><figcaption>${plate && c.plate ? `<b>${c.plate}</b>` : ''}${c.label}</figcaption></figure>`).join('')
  await pg.setContent(`<style>body{margin:0;background:#120f1a;padding:12px 0 0 12px;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:12px}figure{margin:0;background:#241e36}img{display:block}figcaption{font:700 ${plate ? 17 : 19}px 'IBM Plex Mono','DejaVu Sans Mono',monospace;color:${plate ? '#f4ead8' : '#f2c14e'};padding:9px 10px 11px;display:flex;gap:10px;align-items:center}b{background:#f4ead8;color:#120f1a;font-size:13px;padding:1px 6px}</style>${html}`)
  await pg.screenshot({ path: out(f), fullPage: true })
  console.log('ok', f)
  await pg.close()
}

;(async () => {
  const b = await chromium.launch()
  if (want('title')) {
    await shot(await open(b, { save: { unlocked: 9 } }), 'title.png')
    await shot(await open(b, { lang: 'en', save: { unlocked: 9 } }), 'title-en.png')
  }
  if (want('intro')) await shot(await play(b, 'gaziantep', null, { intro: true, height: 900 }), 'intro.png')
  if (want('complete')) {
    const pg = await play(b, 'istanbul', [4, 19], { wait: 600 })
    await pg.evaluate(() => { const w = window.__mk.world(); w.pickups.forEach((p) => (p.taken = true)); w.time = 96.4; w.started = true; if (w.boss) { w.boss.state = 'down'; w.boss.hp = 0 } w.player.x = w.exit.x; w.player.y = w.exit.y })
    await pg.waitForTimeout(2600)
    await shot(pg, 'complete.png')
  }
  if (want('about')) {
    const pg = await open(b, { save: { unlocked: 9 } })
    await pg.getByRole('button', { name: /Oyun Hakkında/ }).click()
    await pg.waitForTimeout(1500)
    await shot(pg, 'about.png')
  }
  if (want('mobile')) await shot(await play(b, 'mardin', 'npc:1', { phone: true }), 'mobile-dialog.png')
  if (want('mechanics')) {
    const cells = []
    for (const [label, city, where, wait] of [
      ['Sema Halkası · Konya', 'konya', [13, 17]], ['Balon · Nevşehir', 'nevsehir', [10, 18]], ['Bakırcı Tokmağı · Gaziantep', 'gaziantep', [21, 19]],
      ['İtilen Sandık · Edirne', 'edirne', [258, 19]], ['Gece ile Gündüz Taşları · Van', 'van', 'arrival:12'], ['Boss · Ankara', 'ankara', 'boss', 4200],
    ]) {
      const pg = await play(b, city, where, { wait, save: { keyHints: false } })
      if (where === 'boss') {
        // boss yorgun: nasıl yenileceği (ok ve laf) karede görünsün
        await pg.evaluate(() => { const w = window.__mk.world(); const k = w.boss; k.state = 'tired'; k.timer = 2; k.hidden = false; k.y = k.floor - k.h; k.vx = 0; k.vy = 0; k.x = w.player.x + 46 })
        await pg.waitForTimeout(500)
      }
      cells.push({ label, png: await pg.screenshot() })
      await pg.context().close()
    }
    await grid(b, 'mechanics.png', cells, { cols: 3, w: 480, h: 270 })
  }
  if (want('cities')) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-readme-'))
    const meta = JSON.parse(execFileSync('npx', ['tsx', '-e', "import {LEVELS} from './game/levels'; console.log(JSON.stringify(LEVELS.map(l=>[l.id,l.name,String(l.plate).padStart(2,'0')])))"], { cwd: root }).toString())
    const cells = meta.map(([id, label, plate]) => {
      const png = path.join(tmp, `${id}.png`)
      execFileSync('python3', ['-c', `from PIL import Image; Image.open(${JSON.stringify(path.join(root, 'public/sehirler', id + '.webp'))}).convert('RGB').save(${JSON.stringify(png)})`])
      return { label, plate, png: fs.readFileSync(png) }
    })
    await grid(b, 'cities.png', cells, { cols: 5, w: 300, h: 158, plate: true })
  }
  if (want('hammers')) {
    const pg = await play(b, 'gaziantep', [42, 19], { wait: 800, save: { keyHints: false } })
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seksek-gif-'))
    for (let i = 0; i < 28; i++) { await pg.screenshot({ path: path.join(tmp, `${String(i).padStart(2, '0')}.png`) }); await pg.waitForTimeout(70) }
    await pg.context().close()
    execFileSync('python3', ['-c', `
import glob
from PIL import Image
fr=[Image.open(f).convert('RGB').resize((480,270), Image.LANCZOS).quantize(96) for f in sorted(glob.glob(${JSON.stringify(tmp)}+'/*.png'))]
fr[0].save(${JSON.stringify(out('hammers.gif'))}, save_all=True, append_images=fr[1:], duration=100, loop=0, optimize=True)`])
    console.log('ok hammers.gif')
  }
  await b.close()
})()
