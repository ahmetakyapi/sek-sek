import type { CityKey } from './types'
import { SCALES, cityTheme, titleTheme, type NoteEvent, type Song } from './music'

/** Tamamen sentezlenmiş ses: harici dosya yok. Müziğin notaları music.ts'te. */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** müziğin genel sesi (efektlerin altında kalır) */
const MUSIC_VOL = 0.3

export class Sound {
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private timer: number | null = null
  private nextTime = 0
  private stepIdx = 0
  private city: CityKey = 'istanbul'
  /** çalan beste ve onun kendi ses yolu (geçişte eskisi kısılır, yenisi açılır) */
  private song: Song | null = null
  private songBus: GainNode | null = null
  /** müzik açıkken bile sessiz kalan yüzde: molada kısılır */
  private ducked = false
  sfxOn = true
  private _musicOn = true

  /** Kullanıcı etkileşiminden sonra çağrılmalı (mobil kilit) */
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ac = new AC()
      this.master = this.ac.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ac.destination)
      // müzik: hafif sıkıştırma + kısa oda yankısı, sonra ana ses
      const comp = this.ac.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      comp.connect(this.master)
      this.musicGain = this.ac.createGain()
      this.musicGain.gain.value = this._musicOn ? MUSIC_VOL : 0
      this.musicGain.connect(comp)
      this.reverb = this.ac.createConvolver()
      this.reverb.buffer = this.impulse(2.2)
      const wet = this.ac.createGain()
      wet.gain.value = 0.32
      this.reverb.connect(wet)
      wet.connect(comp)
      // seçilmiş ama ses kilidi yüzünden bekleyen beste şimdi başlar
      if (this.song) this.play(this.song, true)
    }
    if (this.ac.state === 'suspended') void this.ac.resume()
  }

  get musicOn() {
    return this._musicOn
  }

  set musicOn(on: boolean) {
    this._musicOn = on
    this.applyMusicVol()
  }

  /** molada müzik kısılır ama durmaz */
  duck(on: boolean) {
    if (this.ducked === on) return
    this.ducked = on
    this.applyMusicVol()
  }

  /** sekme arkadayken ses tamamen durur, dönünce kaldığı yerden sürer */
  setHidden(hidden: boolean) {
    if (!this.ac) return
    if (hidden) void this.ac.suspend()
    else void this.ac.resume()
  }

  private applyMusicVol() {
    if (!this.ac || !this.musicGain) return
    const v = !this._musicOn ? 0 : this.ducked ? MUSIC_VOL * 0.35 : MUSIC_VOL
    this.musicGain.gain.setTargetAtTime(v, this.ac.currentTime, 0.12)
  }

  private impulse(sec: number) {
    const ac = this.ac!
    const len = Math.floor(ac.sampleRate * sec)
    const buf = ac.createBuffer(2, len, ac.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    return buf
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
      case 'checkpoint': {
        // şehrin makamından yükselen dört nota: bayrak göndere çıkarken
        const sc = SCALES[this.city]
        ;[0, 2, 4, 7].forEach((d, i) => setTimeout(() => this.tone(mtof(sc.root + 12 + sc.steps[d]), i === 3 ? 0.3 : 0.12, 'triangle', 0.12), i * 95))
        return
      }
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
      case 'pet':
        // küçük, sevimli iki nota
        this.tone(880, 0.07, 'sine', 0.08)
        setTimeout(() => this.tone(1175, 0.1, 'sine', 0.07), 70)
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
      case 'charm':
        ;[784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'sine', 0.12), i * 80))
        return
      case 'warp':
        this.noise(0.25, 0.15, 1200)
        return this.tone(392, 0.35, 'triangle', 0.1, 400)
      case 'bossWake':
        this.noise(0.3, 0.25, 220)
        return this.tone(110, 0.5, 'sawtooth', 0.09, -30)
      case 'bossSlam':
        this.noise(0.16, 0.28, 320)
        return this.tone(90, 0.16, 'square', 0.09, -40)
      case 'bossHit':
        this.noise(0.1, 0.25, 1000)
        this.tone(523, 0.1, 'square', 0.1)
        setTimeout(() => this.tone(784, 0.16, 'triangle', 0.12), 70)
        return
      case 'bossDown':
        ;[392, 523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.24, 'triangle', 0.14), i * 100))
        return
      case 'switch':
        this.noise(0.08, 0.2, 700)
        return this.tone(330, 0.1, 'square', 0.07, 120)
      case 'ui':
        return this.tone(660, 0.05, 'square', 0.04)
    }
  }

  /** oyun müziği: şehrin makamında besteli tema */
  setMusic(city: CityKey) {
    this.city = city
    this.play(cityTheme(city))
  }

  /** jenerik: menülerde çalan tema (zaten çalıyorsa baştan başlamaz) */
  playTheme() {
    if (this.song?.id === 'title') return
    this.play(titleTheme())
  }

  stopMusic() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.fadeOutBus()
    this.song = null
  }

  private fadeOutBus() {
    const bus = this.songBus
    this.songBus = null
    if (!bus || !this.ac) return
    bus.gain.setTargetAtTime(0, this.ac.currentTime, 0.25)
    window.setTimeout(() => bus.disconnect(), 1800)
  }

  private play(song: Song, force = false) {
    if (!force && this.song === song && this.timer !== null) return
    this.song = song
    if (!this.ac || !this.musicGain || !this.reverb) return
    this.fadeOutBus()
    const bus = this.ac.createGain()
    bus.gain.setValueAtTime(0.0001, this.ac.currentTime)
    bus.gain.exponentialRampToValueAtTime(1, this.ac.currentTime + 0.6)
    bus.connect(this.musicGain)
    const send = this.ac.createGain()
    send.gain.value = 1
    bus.connect(send)
    send.connect(this.reverb)
    this.songBus = bus
    this.stepIdx = 0
    this.nextTime = this.ac.currentTime + 0.12
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 50)
  }

  private schedule() {
    const song = this.song
    const bus = this.songBus
    if (!this.ac || !song || !bus) return
    while (this.nextTime < this.ac.currentTime + 0.3) {
      for (const e of song.byStep[this.stepIdx % song.length]) this.voice(e, this.nextTime, song.step, bus)
      this.nextTime += song.step
      this.stepIdx++
    }
  }

  /** bir notayı çalgısıyla çalar */
  private voice(e: NoteEvent, t: number, step: number, out: AudioNode) {
    const ac = this.ac!
    const dur = e.dur * step
    switch (e.inst) {
      case 'ney': {
        // ney: yumuşak giriş, hafif vibrato, nefes sesi
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const o2 = ac.createOscillator()
        o2.type = 'triangle'
        o2.frequency.value = f * 2
        const lfo = ac.createOscillator()
        lfo.frequency.value = 5.2
        const lg = ac.createGain()
        lg.gain.setValueAtTime(0, t)
        lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.4, dur * 0.6))
        lfo.connect(lg)
        lg.connect(o.frequency)
        lg.connect(o2.frequency)
        const g = ac.createGain()
        const g2 = ac.createGain()
        g2.gain.value = 0.12
        const atk = Math.min(0.09, dur * 0.3)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(e.vol, t + atk)
        g.gain.setValueAtTime(e.vol * 0.85, t + Math.max(atk, dur - 0.08))
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25)
        o.connect(g)
        o2.connect(g2)
        g2.connect(g)
        g.connect(out)
        this.breath(t, Math.min(0.12, dur), e.vol * 0.25, f * 2, out)
        for (const x of [o, o2, lfo]) {
          x.start(t)
          x.stop(t + dur + 0.3)
        }
        return
      }
      case 'saz':
      case 'arp': {
        // saz: tel çekilince parlak, hızla yumuşayan ton (süzgeç kapanır)
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        const o2 = ac.createOscillator()
        o2.type = 'square'
        o2.frequency.value = f * 1.003
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.Q.value = 2
        lp.frequency.setValueAtTime(e.inst === 'arp' ? 2200 : 3600, t)
        lp.frequency.exponentialRampToValueAtTime(e.inst === 'arp' ? 500 : 700, t + 0.22)
        const g = ac.createGain()
        const ring = e.inst === 'arp' ? 0.35 : Math.max(0.3, dur * 1.1)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(e.vol, t + 0.004)
        g.gain.exponentialRampToValueAtTime(e.vol * 0.35, t + 0.12)
        g.gain.exponentialRampToValueAtTime(0.0001, t + ring)
        const g2 = ac.createGain()
        g2.gain.value = 0.4
        o.connect(lp)
        o2.connect(g2)
        g2.connect(lp)
        lp.connect(g)
        g.connect(out)
        o.start(t)
        o2.start(t)
        o.stop(t + ring + 0.05)
        o2.stop(t + ring + 0.05)
        return
      }
      case 'bass': {
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'triangle'
        o.frequency.value = f
        const sub = ac.createOscillator()
        sub.type = 'sine'
        sub.frequency.value = f
        const g = ac.createGain()
        const end = Math.max(0.18, dur * 0.9)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(e.vol, t + 0.01)
        g.gain.exponentialRampToValueAtTime(e.vol * 0.5, t + end * 0.5)
        g.gain.exponentialRampToValueAtTime(0.0001, t + end)
        o.connect(g)
        sub.connect(g)
        g.connect(out)
        o.start(t)
        sub.start(t)
        o.stop(t + end + 0.05)
        sub.stop(t + end + 0.05)
        return
      }
      case 'pad': {
        // dem: hafif akortsuz iki testere, kapalı süzgeç, yavaş giriş çıkış
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 900
        const g = ac.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(e.vol, t + Math.min(0.5, dur * 0.4))
        g.gain.setValueAtTime(e.vol, t + dur * 0.8)
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4)
        lp.connect(g)
        g.connect(out)
        for (const n of e.midi) {
          for (const det of [-7, 7]) {
            const o = ac.createOscillator()
            o.type = 'sawtooth'
            o.frequency.value = mtof(n)
            o.detune.value = det
            const og = ac.createGain()
            og.gain.value = 1 / (e.midi.length * 2)
            o.connect(og)
            og.connect(lp)
            o.start(t)
            o.stop(t + dur + 0.45)
          }
        }
        return
      }
      case 'dum': {
        // darbuka düm: perdesi düşen pes vuruş
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.setValueAtTime(120, t)
        o.frequency.exponentialRampToValueAtTime(52, t + 0.16)
        const g = ac.createGain()
        g.gain.setValueAtTime(e.vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
        o.connect(g)
        g.connect(out)
        o.start(t)
        o.stop(t + 0.3)
        return
      }
      case 'tek':
      case 'ka': {
        // tek: kenardan parlak vuruş; ka: daha kısık ve kısa
        const tek = e.inst === 'tek'
        this.hit(t, tek ? 0.07 : 0.035, e.vol, tek ? 3200 : 5200, out)
        if (tek) {
          const o = ac.createOscillator()
          o.type = 'triangle'
          o.frequency.setValueAtTime(520, t)
          const g = ac.createGain()
          g.gain.setValueAtTime(e.vol * 0.5, t)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
          o.connect(g)
          g.connect(out)
          o.start(t)
          o.stop(t + 0.08)
        }
        return
      }
    }
  }

  /** önceden üretilmiş gürültü tamponundan kısa vuruş (her vuruşta yeni tampon üretmez) */
  private hit(t: number, dur: number, vol: number, freq: number, out: AudioNode) {
    const ac = this.ac!
    this.noiseBuf ??= this.whiteNoise()
    const src = ac.createBufferSource()
    src.buffer = this.noiseBuf
    const f = ac.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = freq
    f.Q.value = 1.2
    const g = ac.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f)
    f.connect(g)
    g.connect(out)
    src.start(t, Math.random() * 0.5, dur + 0.02)
  }

  private breath(t: number, dur: number, vol: number, freq: number, out: AudioNode) {
    this.hit(t, dur, vol, Math.min(6000, freq), out)
  }

  private whiteNoise() {
    const ac = this.ac!
    const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return buf
  }
}
