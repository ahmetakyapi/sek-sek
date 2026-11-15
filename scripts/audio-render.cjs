/**
 * Sesi dinlemeden kanıtla: oyunun ses motoru tarayıcıda çevrimdışı ses bağlamıyla (OfflineAudioContext, sahte saat)
 * çalınır; jenerik, iki şehir, boss dövüşü, molada boğukluk ve bütün efektler WAV olarak yazılır. Her parça için tepe,
 * RMS ve NaN ölçülür: sessiz kalan, NaN üreten ya da patlayan (tepe ≥ 0,98) parça FAIL. TEL=1 yalnız tel akordu için
 * tek notalar üretir. Kullanım: sunucu açıkken  PORT=3000 node scripts/audio-render.cjs [klasör]
 */
const { chromium } = require('playwright')
const fs = require('fs')
const dir = process.argv[2] || 'ses-ornek'
const PORT = process.env.PORT || 3000
fs.mkdirSync(dir, { recursive: true })
const SAVE = { character: 'uktun', seenStory: true, tutorial: false, unlocked: 3, best: {}, skippedName: true, mapVersion: 8, migrated: true, accountVersion: 2 }
// her parça: [ad, süre, kurulum (sayfada çalışır)]
const CLIPS = process.env.TEL ? [
  ['tel-saz-69', 2, `s.musicOn=false; s.pluckSfx(69, 0.8, 0.05, 'saz')`],
  ['tel-kanun-81', 2, `s.musicOn=false; s.pluckSfx(81, 0.8, 0.05, 'kanun')`],
  ['tel-saz-50', 2, `s.musicOn=false; s.pluckSfx(50, 0.8, 0.05, 'saz')`],
] : [
  ['jenerik', 24, `s.playTheme()`],
  ['istanbul', 50, `s.setMusic('istanbul')`],
  ['trabzon', 18, `s.setMusic('trabzon')`],
  ['erzurum-boss', 16, `s.setMusic('erzurum'); s.setIntense(true)`],
  ['mola-bogukluk', 8, `s.setMusic('konya'); setAt(3, () => s.duck(true))`],
  ['efektler', 16, `s.setMusic('izmir'); s.musicOn=false; const names=['jump','walljump','dash','land','collect','checkpoint','stomp','spring','death','crumble','charm','stamp','bossWake','bossSlam','bossHit','bossDown','complete']; names.forEach((n,i)=>setAt(0.5+i*0.9,()=>s.sfx(n)))`],
]
;(async () => {
  let bad = 0
  const b = await chromium.launch()
  for (const [name, sec, setup] of CLIPS) {
    const ctx = await b.newContext()
    await ctx.addInitScript((s) => localStorage.setItem('seksek:v1', JSON.stringify(s)), SAVE)
    await ctx.addInitScript((sec) => {
      let fake = 0
      window.__fakeTime = (t) => (fake = t)
      class Fake extends OfflineAudioContext {
        constructor() { super(2, Math.ceil(44100 * sec), 44100); Object.defineProperty(this, 'currentTime', { get: () => fake }); window.__off = this }
        resume() { return Promise.resolve() }
        suspend() { return Promise.resolve() }
      }
      window.AudioContext = Fake
    }, sec)
    const p = await ctx.newPage()
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
    await p.goto(`http://localhost:${PORT}/?debug`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(800)
    const res = await p.evaluate(async ({ setup, sec }) => {
      const s = window.__mk.sound()
      s.sfxOn = true
      s.musicOn = true
      s.unlock()
      // menü kendi temasını başlatmış olabilir: temiz başla
      const timers = []
      const setAt = (t, fn) => timers.push([t, fn])
      eval(setup)
      for (let t = 0; t < sec; t += 0.05) {
        window.__fakeTime(t)
        for (const [at, fn] of timers.filter(([at]) => at <= t && at > t - 0.05)) fn()
        s.schedule()
      }
      const buf = await window.__off.startRendering()
      const L = buf.getChannelData(0), R = buf.getChannelData(1)
      let peak = 0, sum = 0, nan = 0
      for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (Number.isNaN(L[i])) nan++; peak = Math.max(peak, v); sum += L[i] * L[i] }
      // 16 bit WAV
      const n = L.length, data = new DataView(new ArrayBuffer(44 + n * 4))
      const w = (o, str) => [...str].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)))
      w(0, 'RIFF'); data.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true)
      data.setUint32(24, 44100, true); data.setUint32(28, 44100 * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, n * 4, true)
      for (let i = 0; i < n; i++) { data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true) }
      let bin = ''; const u = new Uint8Array(data.buffer); for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000))
      return { peak, rms: Math.sqrt(sum / n), nan, wav: btoa(bin) }
    }, { setup, sec })
    fs.writeFileSync(`${dir}/${name}.wav`, Buffer.from(res.wav, 'base64'))
    const ok = !res.nan && res.peak < 0.98 && res.rms > 0.003
    if (!ok) bad++
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(14)} tepe ${res.peak.toFixed(3)}  rms ${res.rms.toFixed(4)}  nan ${res.nan}`)
    await ctx.close()
  }
  await b.close()
  console.log(bad ? `\n${bad} parça bozuk (sessiz, NaN ya da patlıyor)` : `\nBütün parçalar temiz: ${dir}/*.wav`)
  process.exit(bad ? 1 : 0)
})()
