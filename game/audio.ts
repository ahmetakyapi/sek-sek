import type { CityKey } from './types'

/** Tamamen sentezlenmiş ses: harici dosya yok. */
const SCALES: Record<CityKey, { root: number; steps: number[]; meter: number[]; tempo: number }> = {
  // Hicaz (Re)
  istanbul: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 2, 2], tempo: 0.22 },
  // Nihavend'e yakın
  kocaeli: { root: 60, steps: [0, 2, 3, 5, 7, 8, 11, 12], meter: [2, 2, 2, 2], tempo: 0.2 },
  // Rast, zeybek usulü 9/8
  izmir: { root: 60, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.19 },
  // Kürdi, Ankara havası
  ankara: { root: 62, steps: [0, 1, 3, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.16 },
  // Hicaz, Çukurova türküsü havası
  adana: { root: 62, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [2, 2, 3], tempo: 0.17 },
  // Hicaz (La)
  mardin: { root: 57, steps: [0, 1, 4, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.2 },
  // Uşşak'a yakın (Re)
  malatya: { root: 62, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [2, 2, 2, 3], tempo: 0.15 },
  // Rast'a yakın (Sol)
  corum: { root: 55, steps: [0, 2, 4, 5, 7, 9, 10, 12], meter: [2, 2, 2, 2], tempo: 0.21 },
  // Karadeniz horonu, 7/8
  ordu: { root: 62, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 3], tempo: 0.13 },
  // Hüseyni'ye yakın (La)
  sivas: { root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12], meter: [2, 2, 2, 3], tempo: 0.16 },
  // Kafkas havası, Uşşak'a yakın
  ardahan: { root: 57, steps: [0, 2, 3, 5, 7, 8, 10, 12], meter: [3, 3, 2], tempo: 0.15 },
  // Saba'ya yakın (Re)
  bayburt: { root: 50, steps: [0, 2, 3, 4, 7, 8, 10, 12], meter: [3, 2, 2], tempo: 0.19 },
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export class Sound {
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private timer: number | null = null
  private nextTime = 0
  private stepIdx = 0
  private note = 3
  private city: CityKey = 'istanbul'
  sfxOn = true
  musicOn = true

  /** Kullanıcı etkileşiminden sonra çağrılmalı (mobil kilit) */
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ac = new AC()
      this.master = this.ac.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ac.destination)
      this.musicGain = this.ac.createGain()
      this.musicGain.gain.value = 0.22
      this.musicGain.connect(this.master)
    }
    if (this.ac.state === 'suspended') void this.ac.resume()
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, dest?: AudioNode, at?: number) {
    if (!this.ac || !this.master) return
    const t = at ?? this.ac.currentTime
    const o = this.ac.createOscillator()
    const g = this.ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(dest ?? this.master)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  private noise(dur: number, vol: number, freq: number, dest?: AudioNode, at?: number) {
    if (!this.ac || !this.master) return
    const t = at ?? this.ac.currentTime
    const len = Math.floor(this.ac.sampleRate * dur)
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ac.createBufferSource()
    src.buffer = buf
    const f = this.ac.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = freq
    const g = this.ac.createGain()
    g.gain.value = vol
    src.connect(f)
    f.connect(g)
    g.connect(dest ?? this.master)
    src.start(t)
  }

  sfx(name: string) {
    if (!this.sfxOn || !this.ac) return
    switch (name) {
      case 'jump':
        return this.tone(330, 0.12, 'square', 0.08, 220)
      case 'walljump':
        return this.tone(392, 0.12, 'square', 0.08, 260)
      case 'dash':
        this.noise(0.18, 0.25, 1800)
        return this.tone(600, 0.14, 'sawtooth', 0.05, -300)
      case 'land':
        return this.noise(0.05, 0.12, 400)
      case 'death':
        this.noise(0.35, 0.3, 300)
        return this.tone(220, 0.4, 'square', 0.1, -170)
      case 'collect':
        this.tone(784, 0.1, 'triangle', 0.14)
        setTimeout(() => this.tone(1046, 0.18, 'triangle', 0.14), 80)
        return
      case 'checkpoint':
        this.tone(523, 0.12, 'triangle', 0.12)
        setTimeout(() => this.tone(659, 0.12, 'triangle', 0.12), 90)
        setTimeout(() => this.tone(784, 0.2, 'triangle', 0.12), 180)
        return
      case 'spring':
        return this.tone(200, 0.25, 'triangle', 0.14, 500)
      case 'stomp':
        this.noise(0.08, 0.2, 900)
        return this.tone(180, 0.1, 'square', 0.08, -80)
      case 'crumble':
        return this.noise(0.2, 0.15, 250)
      case 'shoot':
        return this.noise(0.06, 0.06, 2600)
      case 'complete':
        ;[523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.14), i * 110))
        return
      case 'crystal':
        this.tone(1046, 0.08, 'triangle', 0.12)
        setTimeout(() => this.tone(1568, 0.14, 'sine', 0.1), 50)
        return
      case 'key':
        ;[659, 880, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'triangle', 0.13), i * 70))
        return
      case 'stamp':
        ;[523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.13), i * 90))
        return
      case 'switch':
        this.noise(0.08, 0.2, 700)
        return this.tone(330, 0.1, 'square', 0.07, 120)
      case 'ui':
        return this.tone(660, 0.05, 'square', 0.04)
    }
  }

  setMusic(city: CityKey) {
    this.city = city
    this.stepIdx = 0
    this.note = 3
    this.startMusic()
  }

  startMusic() {
    if (!this.ac || this.timer !== null) return
    this.nextTime = this.ac.currentTime + 0.1
    this.timer = window.setInterval(() => this.schedule(), 60)
  }

  stopMusic() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  private schedule() {
    if (!this.ac || !this.musicGain) return
    const sc = SCALES[this.city]
    const beats = sc.meter.reduce((a, b) => a + b, 0)
    while (this.nextTime < this.ac.currentTime + 0.25) {
      const t = this.nextTime
      const pos = this.stepIdx % beats
      // vurgular (düm/tek) — aksak usuller için meter grupları
      let acc = 0
      let strong = false
      for (const g of sc.meter) {
        if (pos === acc) strong = true
        acc += g
      }
      if (this.musicOn) {
        if (pos === 0) this.tone(mtof(sc.root - 24), sc.tempo * 1.6, 'sine', 0.22, -20, this.musicGain, t)
        else if (strong) this.noise(0.05, 0.12, 2400, this.musicGain, t)
        // drone
        if (this.stepIdx % (beats * 2) === 0) {
          this.tone(mtof(sc.root - 12), sc.tempo * beats * 2, 'triangle', 0.05, 0, this.musicGain, t)
          this.tone(mtof(sc.root - 5), sc.tempo * beats * 2, 'sine', 0.035, 0, this.musicGain, t)
        }
        // saz benzeri melodi: ölçek içinde rastgele yürüyüş
        if (strong || Math.random() < 0.45) {
          const r = Math.random()
          this.note = Math.max(0, Math.min(sc.steps.length - 1, this.note + (r < 0.4 ? -1 : r < 0.8 ? 1 : r < 0.9 ? 2 : -2)))
          if (pos === 0 && Math.random() < 0.5) this.note = 0
          const m = sc.root + sc.steps[this.note]
          this.tone(mtof(m), sc.tempo * 1.8, 'triangle', 0.09, 0, this.musicGain, t)
          this.tone(mtof(m) * 2.005, sc.tempo * 0.6, 'sine', 0.02, 0, this.musicGain, t)
        }
      }
      this.nextTime += sc.tempo
      this.stepIdx++
    }
  }
}
