/**
 * Doğa sesi yatağı (25 Kasım 2026, "düşük kortizol"): müziğin altında şehrin havasına göre rüzgâr, dalga, yağmur,
 * kuş cıvıltısı ve cırcır böceği. Hepsi WebAudio ile üretilir (kayıt yok): döngüye alınmış süzülmüş gürültü ve kısa
 * sinüs kaymaları. Çok kısıktır; müzik ses düzeyine bağlıdır (müzik kapalıysa susar). Şehre özgü beste yok kararı
 * (24 Kasım) değişmez: bu müzik değil, yerin sesidir.
 */
import type { CityStyle } from './art'

export interface Bed {
  wind: number
  water: number
  rain: number
  birds: number
  crickets: number
}

/** menülerde: hafif esinti ve uzakta birkaç kuş */
export const MENU_BED: Bed = { wind: 0.2, water: 0, rain: 0, birds: 0.35, crickets: 0 }

/** şehrin havasından ses yatağı (saf; tests/music.test.ts) */
export function bedOf(weather: CityStyle['weather']): Bed {
  switch (weather) {
    case 'gulls':
      return { wind: 0.25, water: 0.7, rain: 0, birds: 0.3, crickets: 0 }
    case 'dust':
      return { wind: 0.4, water: 0, rain: 0, birds: 0.25, crickets: 0.6 }
    case 'petals':
      return { wind: 0.15, water: 0.2, rain: 0, birds: 0.85, crickets: 0 }
    case 'leaves':
      return { wind: 0.3, water: 0.15, rain: 0, birds: 0.7, crickets: 0.1 }
    case 'snow':
      return { wind: 0.6, water: 0, rain: 0, birds: 0, crickets: 0 }
    case 'storm':
      return { wind: 1, water: 0, rain: 0, birds: 0, crickets: 0 }
    case 'rain':
      return { wind: 0.2, water: 0, rain: 0.8, birds: 0.12, crickets: 0 }
  }
}

/** yatağın genel düzeyi: müziğin altında, efektlerin çok altında */
const LEVEL = { wind: 0.05, water: 0.045, rain: 0.03 }

export class Ambience {
  private ac: AudioContext
  private out: GainNode
  private gains: { wind: GainNode; water: GainNode; rain: GainNode }
  private bed: Bed = MENU_BED
  private nextBird = 0
  private nextCricket = 0

  constructor(ac: AudioContext, dest: AudioNode) {
    this.ac = ac
    this.out = ac.createGain()
    this.out.connect(dest)
    const brown = this.loop('brown')
    const white = this.loop('white')
    const src = (buf: AudioBuffer) => {
      const s = ac.createBufferSource()
      s.buffer = buf
      s.loop = true
      s.start()
      return s
    }
    const lfo = (hz: number, depth: number, to: AudioParam) => {
      const o = ac.createOscillator()
      o.frequency.value = hz
      const g = ac.createGain()
      g.gain.value = depth
      o.connect(g)
      g.connect(to)
      o.start()
    }
    // rüzgâr: kahverengi gürültü, geniş bant süzgeç; gücü ve rengi çok yavaş dalgalanır (esinti)
    const wind = ac.createGain()
    wind.gain.value = 0
    const wf = ac.createBiquadFilter()
    wf.type = 'bandpass'
    wf.frequency.value = 380
    wf.Q.value = 0.45
    const wsw = ac.createGain()
    wsw.gain.value = 0.7
    lfo(0.055, 0.3, wsw.gain)
    lfo(0.08, 140, wf.frequency)
    src(brown).connect(wf)
    wf.connect(wsw)
    wsw.connect(wind)
    // dalga: beyaz gürültü, alçak geçiren; iki ayrı salınım kıyıya vuran dalga gibi kabarıp çekilir
    const water = ac.createGain()
    water.gain.value = 0
    const lf = ac.createBiquadFilter()
    lf.type = 'lowpass'
    lf.frequency.value = 520
    lf.Q.value = 0.3
    const swell = ac.createGain()
    swell.gain.value = 0.55
    lfo(0.11, 0.3, swell.gain)
    lfo(0.19, 0.15, swell.gain)
    lfo(0.11, 260, lf.frequency)
    src(white).connect(lf)
    lf.connect(swell)
    swell.connect(water)
    // yağmur: tiz bant, düzenli hışırtı
    const rain = ac.createGain()
    rain.gain.value = 0
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1700
    const rl = ac.createBiquadFilter()
    rl.type = 'lowpass'
    rl.frequency.value = 6500
    src(white).connect(hp)
    hp.connect(rl)
    rl.connect(rain)
    for (const g of [wind, water, rain]) g.connect(this.out)
    this.gains = { wind, water, rain }
  }

  /** dört saniyelik döngü tamponu (iki kanal ayrı: geniş stereo); kahverengi gürültü rüzgârın gövdesi */
  private loop(kind: 'white' | 'brown') {
    const ac = this.ac
    const len = ac.sampleRate * 4
    const buf = ac.createBuffer(2, len, ac.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      let b = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        if (kind === 'white') d[i] = w * 0.5
        else {
          b = (b + 0.02 * w) / 1.02
          d[i] = b * 3.5
        }
      }
      // döngü dikişi duyulmasın: baş ve son 50 ms birbirine karışır
      const fade = Math.floor(ac.sampleRate * 0.05)
      for (let i = 0; i < fade; i++) {
        const k = i / fade
        d[i] = d[i] * k + d[len - fade + i] * (1 - k)
      }
    }
    return buf
  }

  /** yeni yatak birkaç saniyede gelir (şehre girerken birden başlamaz) */
  set(bed: Bed) {
    this.bed = bed
    const t = this.ac.currentTime
    this.gains.wind.gain.setTargetAtTime(bed.wind * LEVEL.wind, t, 1.2)
    this.gains.water.gain.setTargetAtTime(bed.water * LEVEL.water, t, 1.2)
    this.gains.rain.gain.setTargetAtTime(bed.rain * LEVEL.rain, t, 1.2)
  }

  /** zamanlayıcıdan (~50 ms) çağrılır: kuş cümleleri ve cırcır böceği seyrek, rastgele aralıkla */
  tick() {
    const now = this.ac.currentTime
    if (this.bed.birds > 0 && now >= this.nextBird) {
      if (this.nextBird > 0) this.bird(now + 0.05)
      this.nextBird = now + (2.5 + Math.random() * 6) / this.bed.birds
    }
    if (this.bed.crickets > 0 && now >= this.nextCricket) {
      if (this.nextCricket > 0) this.cricket(now + 0.05)
      this.nextCricket = now + (0.9 + Math.random() * 2.2) / this.bed.crickets
    }
  }

  /** kuş: iki-altı cıvıltı; her biri hızlı perde kayması, yumuşak zarf, rastgele bir yanda */
  private bird(t: number) {
    const ac = this.ac
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null
    if (pan) {
      pan.pan.value = Math.random() * 1.6 - 0.8
      pan.connect(this.out)
    }
    const dest = pan ?? this.out
    const base = 2400 + Math.random() * 1600
    const n = 2 + Math.floor(Math.random() * 5)
    const up = Math.random() < 0.5
    for (let i = 0; i < n; i++) {
      const at = t + i * (0.09 + Math.random() * 0.05)
      const len = 0.05 + Math.random() * 0.07
      const f0 = base * (0.9 + Math.random() * 0.25)
      const o = ac.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(up ? f0 * 0.8 : f0 * 1.2, at)
      o.frequency.exponentialRampToValueAtTime(up ? f0 * 1.25 : f0 * 0.85, at + len)
      const g = ac.createGain()
      g.gain.setValueAtTime(0.0001, at)
      g.gain.exponentialRampToValueAtTime(0.012, at + len * 0.3)
      g.gain.exponentialRampToValueAtTime(0.0001, at + len)
      o.connect(g)
      g.connect(dest)
      o.start(at)
      o.stop(at + len + 0.02)
    }
  }

  /** cırcır böceği: 4,4 kHz'de üç-beş kısa titreşim */
  private cricket(t: number) {
    const ac = this.ac
    const n = 3 + Math.floor(Math.random() * 3)
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = 4300 + Math.random() * 300
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t)
    for (let i = 0; i < n; i++) {
      const at = t + i * 0.045
      g.gain.setValueAtTime(0.0001, at)
      g.gain.linearRampToValueAtTime(0.004, at + 0.01)
      g.gain.linearRampToValueAtTime(0.0001, at + 0.03)
    }
    o.connect(g)
    g.connect(this.out)
    o.start(t)
    o.stop(t + n * 0.045 + 0.05)
  }
}
