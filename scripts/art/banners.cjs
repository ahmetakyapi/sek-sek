/**
 * Şehir görselleri: oyunun kendi tuvalinden alınır (arayüz katmanı girmez).
 *   public/sehirler/<id>.webp  800x420  (şehir kartları, bölüm başlığı)
 *   assets/cities/<id>.png     720x590  (skor kartpostalı)
 * Önce `npm run dev -- -p 3100`, sonra: node scripts/art/banners.cjs [şehir ...] [--port=3100]
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..', '..')
const args = process.argv.slice(2)
const ids = args.filter((a) => !a.startsWith('--'))
const port = (args.find((a) => a.startsWith('--port=')) || '--port=3100').split('=')[1]
const save = { character: 'uktun', skippedName: true, seenStory: true, mapVersion: 99, migrated: true, accountVersion: 2, sfx: false, music: false, keyHints: false, unlocked: 99, touch: 'off' }

;(async () => {
  const all = ids.length ? ids : fs.readdirSync(path.join(root, 'game', 'finales')).map((f) => f.replace('.ts', '')).filter((f) => f !== 'index' && f !== 'types')
  const b = await chromium.launch()
  for (const id of all) {
    for (const [w, h, out] of [[800, 420, `public/sehirler/${id}.png`], [720, 590, `assets/cities/${id}.png`]]) {
      const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
      await pg.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), save)
      await pg.goto(`http://localhost:${port}/?debug&zengin&sehir=${id}`)
      await pg.waitForTimeout(2500)
      await pg.getByRole('button', { name: /Devam|Başla|Yolculu/ }).first().click()
      await pg.waitForTimeout(600)
      await pg.getByRole('button', { name: /^(▶ )?Başla$/ }).click()
      // oyuncu biraz ilerlesin: kadraja şehrin ilk tezgâhı ve insanı girsin
      await pg.keyboard.down('ArrowRight')
      await pg.waitForTimeout(1500)
      await pg.keyboard.up('ArrowRight')
      await pg.waitForTimeout(900)
      // konuşma baloncuğu kadraja girmesin (şehir insanının yanında durulduysa çıkar): kapat, bir kare bekle
      await pg.evaluate(() => (window.__mk.renderer().dialog = null))
      await pg.waitForTimeout(120)
      const data = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png'))
      fs.writeFileSync(path.join(root, out), Buffer.from(data.split(',')[1], 'base64'))
      await pg.close()
    }
    // kartlar webp olarak sunulur
    execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('public/sehirler/${id}.png').convert('RGB'); im.save('public/sehirler/${id}.webp', quality=86, method=6)`], { cwd: root })
    fs.unlinkSync(path.join(root, `public/sehirler/${id}.png`))
    // kartpostal sahnesi skor kartı fonksiyonuyla Vercel'e gider: 256 renkli paletli PNG (piksel sanatında gözle fark yok, ~5 kat küçük)
    const card = path.join(root, `assets/cities/${id}.png`)
    fs.writeFileSync(card, await require('sharp')(card).removeAlpha().png({ palette: true, quality: 95, effort: 10, compressionLevel: 9, dither: 0.6 }).toBuffer())
    console.log('ok', id)
  }
  await b.close()
})()
