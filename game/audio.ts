import type { CityKey } from './types'
import { SCALES, cityTheme, titleTheme, type Inst, type NoteEvent, type Song } from './music'

/**
 * Tamamen sentezlenmiş ses: harici dosya yok. Müziğin notaları music.ts'te.
 *
 * Rahatlatıcı arka plan müziği (lo-fi): Rhodes benzeri elektrik piyano, sıcak alt bas, yumuşak bas davul, fırçalı kenar
 * vuruşu, kapalı zil; ezgide ney (alttan girer, nefesi duyulur) ve kanun (Karplus-Strong tel benzetimi, nota başına
 * önbellek). Tek adımlar hafif geç çalar (swing). Her çalgının stereoda yeri ve yankı payı var. Boss uyanınca ritim
 * sıklaşır ama sakin kalır; molada müzik süzgeçle boğuklaşır. Efektler müzikteki piyanoyla aynı tınıda, şehrin makamında.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** müziğin genel sesi (efektlerin altında kalır) */
const MUSIC_VOL = 0.42

/** çalgı başına stereo yeri (-1 sol, 1 sağ) ve yankıya giden pay */
const CHANNEL: Record<Inst, { pan: number; wet: number }> = {
  ney: { pan: 0.18, wet: 0.55 },
  kanun: { pan: 0.35, wet: 0.45 },
  pad: { pan: 0, wet: 0.5 },
  keys: { pan: -0.08, wet: 0.45 },
  sub: { pan: 0, wet: 0.03 },
  kick: { pan: 0, wet: 0.05 },
  rim: { pan: 0.15, wet: 0.25 },
  hat: { pan: 0.25, wet: 0.15 },
}

/** olayın kimliğinden sabit küçük sapma (0-1): insan eli gibi hafif oynak zaman ve güç, her döngüde aynı */
const wobble = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export class Sound {
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  /** molada müziği boğuklaştıran süzgeç */
  private muffle: BiquadFilterNode | null = null
  /** efektlerin yolu: alçak geçiren süzgeç (sert, bip gibi tiz harmonikler kesilir) */
  private sfxBus: BiquadFilterNode | null = null
  /** aynı efekt art arda tetiklenirse üst üste binmesin: son çalınış zamanı */
  private lastSfx = new Map<string, number>()
  private reverb: ConvolverNode | null = null
  private noiseBuf: AudioBuffer | null = null
  /** tel benzetimi önbelleği: nota → tampon */
  private plucks = new Map<number, AudioBuffer>()
  private timer: number | null = null
  private nextTime = 0
  private stepIdx = 0
  private city: CityKey = 'istanbul'
  /** çalan beste ve onun kendi ses yolu (geçişte eskisi kısılır, yenisi açılır) */
  private song: Song | null = null
  private songBus: GainNode | null = null
  /** bestenin çalgı kanalları (stereo yer + yankı payı); beste değişince yenilenir */
  private channels: Partial<Record<Inst, GainNode>> = {}
  /** kanalların yankı yolları: beste değişince kuyruk bitince kapanır */
  private sends: GainNode[] = []
  /** müzik açıkken bile sessiz kalan yüzde: molada kısılır */
  private ducked = false
  /** boss dövüşü: usule ek vuruşlar ve pes bas */
  private intense = false
  sfxOn = true
  private _musicOn = true
  private _musicVol = 1
  private _sfxVol = 1
  private sfxGain: GainNode | null = null

  /** Kullanıcı etkileşiminden sonra çağrılmalı (mobil kilit) */
  unlock() {
    if (!this.ac) {
      // iOS/Safari: oyun sesi "ortam" sesidir; telefon sessizdeyken susar, başka uygulamanın müziğini kesmez
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'ambient'
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ac = new AC()
      // ana çıkış: yumuşak sınırlayıcı (çok ses üst üste binince patlamasın)
      const limiter = this.ac.createDynamicsCompressor()
      limiter.threshold.value = -10
      limiter.knee.value = 8
      limiter.ratio.value = 6
      limiter.attack.value = 0.004
      limiter.release.value = 0.18
      limiter.connect(this.ac.destination)
      this.master = this.ac.createGain()
      this.master.gain.value = 0.55
      this.master.connect(limiter)
      this.sfxBus = this.ac.createBiquadFilter()
      this.sfxBus.type = 'lowpass'
      this.sfxBus.frequency.value = 3600
      this.sfxBus.Q.value = 0.7
      this.sfxGain = this.ac.createGain()
      this.sfxGain.gain.value = this._sfxVol
      this.sfxBus.connect(this.sfxGain)
      this.sfxGain.connect(this.master)
      // müzik: ses düzeyi → (molada) süzgeç → hafif sıkıştırma → ana çıkış; yankı da ses düzeyinden geçer
      const comp = this.ac.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      comp.connect(this.master)
      this.muffle = this.ac.createBiquadFilter()
      this.muffle.type = 'lowpass'
      this.muffle.frequency.value = 18000
      this.muffle.connect(comp)
      this.musicGain = this.ac.createGain()
      this.musicGain.gain.value = this._musicOn ? MUSIC_VOL * this._musicVol : 0
      this.musicGain.connect(this.muffle)
      this.reverb = this.ac.createConvolver()
      this.reverb.buffer = this.impulse(2.6)
      const wet = this.ac.createGain()
      wet.gain.value = 0.42
      this.reverb.connect(wet)
      wet.connect(this.musicGain)
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

  /** ayarlardaki ses düzeyleri (0-1) */
  setVolumes(sfx: number, music: number) {
    this._sfxVol = Math.max(0, Math.min(1, sfx))
    this._musicVol = Math.max(0, Math.min(1, music))
    if (this.ac && this.sfxGain) this.sfxGain.gain.setTargetAtTime(this._sfxVol, this.ac.currentTime, 0.05)
    this.applyMusicVol()
  }

  /** molada müzik kısılır ve boğuklaşır (bir oda ötede çalıyor gibi), durmaz */
  duck(on: boolean) {
    if (this.ducked === on) return
    this.ducked = on
    this.applyMusicVol()
    if (this.ac && this.muffle) this.muffle.frequency.setTargetAtTime(on ? 700 : 18000, this.ac.currentTime, on ? 0.12 : 0.3)
  }

  /** boss dövüşü başladı / bitti: müzik yoğunlaşır */
  setIntense(on: boolean) {
    this.intense = on
  }

  /** sekme arkadayken ses tamamen durur, dönünce kaldığı yerden sürer */
  setHidden(hidden: boolean) {
    if (!this.ac) return
    if (hidden) void this.ac.suspend()
    else void this.ac.resume()
  }

  private applyMusicVol() {
    if (!this.ac || !this.musicGain) return
    const v = !this._musicOn ? 0 : (this.ducked ? MUSIC_VOL * 0.45 : MUSIC_VOL) * this._musicVol
    this.musicGain.gain.setTargetAtTime(v, this.ac.currentTime, 0.12)
  }

  /** oda yankısı: iki kanal ayrı gürültü (geniş stereo), erken yansımalar, yumuşak kuyruk */
  private impulse(sec: number) {
    const ac = this.ac!
    const len = Math.floor(ac.sampleRate * sec)
    const buf = ac.createBuffer(2, len, ac.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      let lp = 0
      for (let i = 0; i < len; i++) {
        // kuyruk ilerledikçe tizler söner: tek kutuplu süzgeç katsayısı zamanla artar
        const k = 0.25 + 0.7 * (i / len)
        lp += (Math.random() * 2 - 1 - lp) * (1 - k)
        d[i] = lp * Math.pow(1 - i / len, 2.6)
      }
      // erken yansımalar: taş duvarlı bir avlu
      for (const [ms, a] of [
        [11, 0.5],
        [23, 0.35],
        [37, 0.25],
        [53, 0.18],
      ]) {
        const at = Math.floor(((ms + ch * 3) / 1000) * ac.sampleRate)
        if (at < len) d[at] += ch ? -a : a
      }
    }
    return buf
  }

  /* ── Efektler ─────────────────────────────────────────────── */

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, at?: number, dest?: AudioNode) {
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
    g.connect(dest ?? this.sfxBus ?? this.master)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  /** süzgeçli gürültü (önbellekteki tampondan): hışırtı, toz, gümleme */
  private noise(dur: number, vol: number, freq: number, at?: number, q = 1, type: BiquadFilterType = 'bandpass') {
    if (!this.ac || !this.master) return
    const t = at ?? this.ac.currentTime
    this.noiseBuf ??= this.whiteNoise()
    const src = this.ac.createBufferSource()
    src.buffer = this.noiseBuf
    const f = this.ac.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = this.ac.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.sfxBus ?? this.master)
    src.start(t, Math.random() * 0.5, dur + 0.05)
  }

  /** şehrin makamından derece → MIDI (efektler şehrin dizisinde çalar) */
  private scaleNote(d: number, oct = 1) {
    const sc = SCALES[this.city]
    return sc.root + 12 * oct + sc.steps[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)
  }

  /** müzikteki elektrik piyanoyla aynı tınıda kısa çan: efektler müzikle karışır, kulağı yormaz */
  private chime(midi: number, vol: number, at?: number, dur = 0.5) {
    if (!this.ac || !this.sfxBus) return
    const ac = this.ac
    const t = at ?? ac.currentTime
    const f = mtof(midi)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    g.connect(this.sfxBus)
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const b = ac.createOscillator()
    b.type = 'sine'
    b.frequency.value = f * 4.01
    const bg = ac.createGain()
    bg.gain.setValueAtTime(0.14, t)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.2, dur))
    o.connect(g)
    b.connect(bg)
    bg.connect(g)
    for (const x of [o, b]) {
      x.start(t)
      x.stop(t + dur + 0.05)
    }
  }

  /**
   * Oyun efektleri: müzikle uyumlu, yumuşak ve kısa (sinüs, üçgen, müzikteki piyanoyla aynı tınıda çan; kare ve testere
   * dalga yok: bip gibi, yapışkan tuş uyarısı gibi duyuluyordu). Notalar şehrin makamından, sık çalanlar (zıplama, iniş)
   * çok kısık ve perdesi biraz oynar; gürültü yalnız süzülmüş hava sesi olarak. Hepsi alçak geçiren süzgeçten geçer; aynı
   * efekt 60 ms içinde ikinci kez çalmaz; diziler ses saatine göre zamanlanır.
   */
  sfx(name: string) {
    if (!this.sfxOn || !this.ac) return
    const now = this.ac.currentTime
    if (now - (this.lastSfx.get(name) ?? -1) < 0.06) return
    this.lastSfx.set(name, now)
    const vary = 1 + (Math.random() - 0.5) * 0.05
    switch (name) {
      case 'jump':
        // yumuşak bir "hop": kısa, yukarı kayan sinüs
        return this.tone(330 * vary, 0.1, 'sine', 0.04, 140)
      case 'walljump':
        this.tone(392 * vary, 0.1, 'sine', 0.04, 150)
        return this.noise(0.05, 0.015, 1200, now, 0.7, 'lowpass')
      case 'dash':
        // süzülmüş hava: alçak geçiren hışırtı, sert değil
        this.noise(0.18, 0.05, 1100 * vary, now, 0.6, 'lowpass')
        return this.tone(520 * vary, 0.12, 'sine', 0.018, -180)
      case 'land':
        return this.tone(140 * vary, 0.07, 'sine', 0.035, -40)
      case 'death':
        // yumuşak, inen iki nota: ceza gibi değil, "olsun, yeniden"
        this.chime(this.scaleNote(4, 0), 0.07, now, 0.35)
        this.chime(this.scaleNote(2, 0), 0.07, now + 0.14, 0.5)
        return this.tone(110, 0.25, 'sine', 0.05, -30, now)
      case 'collect': {
        // hatıra: makamdan iki çan, ikincisi tiz
        this.chime(this.scaleNote(4, 1), 0.075, now, 0.6)
        return this.chime(this.scaleNote(7, 1), 0.06, now + 0.09, 0.8)
      }
      case 'checkpoint':
        // bayrak: makamdan yükselen yumuşak arpej
        ;[0, 2, 4, 7].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.055, now + i * 0.1, i === 3 ? 0.9 : 0.5))
        return
      case 'spring':
        return this.tone(220, 0.22, 'sine', 0.06, 330)
      case 'stomp':
        // ezme: tok, yumuşak bir "pop"
        this.tone(160, 0.1, 'sine', 0.06, -70)
        return this.chime(this.scaleNote(4, 1), 0.04, now + 0.02, 0.25)
      case 'crumble':
        return this.noise(0.22, 0.05, 420, now, 0.6, 'lowpass')
      case 'shoot':
        return this.noise(0.06, 0.03, 1800, now, 1.2)
      case 'complete': {
        // karar: makamda inen kısa cümle ve tonik
        ;[7, 5, 4, 2].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.06, now + i * 0.11, 0.5))
        return this.chime(this.scaleNote(0, 1), 0.075, now + 0.48, 1.4)
      }
      case 'pet':
        this.chime(this.scaleNote(4, 1), 0.045, now, 0.25)
        return this.chime(this.scaleNote(7, 1), 0.04, now + 0.07, 0.35)
      case 'crystal':
        return this.chime(this.scaleNote(7, 1), 0.05, now, 0.4)
      case 'key':
        ;[0, 4, 7].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.055, now + i * 0.08, 0.5))
        return
      case 'stamp':
        ;[0, 2, 4, 7, 9].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.05, now + i * 0.09, 0.6))
        return
      case 'charm':
        // nazar: cam gibi, tiz ama yumuşak
        ;[4, 7, 9, 11].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.045, now + i * 0.08, 0.7))
        return
      case 'warp':
        this.noise(0.3, 0.04, 900, now, 0.5, 'lowpass')
        return this.tone(330, 0.35, 'sine', 0.05, 330)
      case 'bossWake':
        // derin, yumuşak bir uğultu
        this.tone(73, 0.7, 'sine', 0.1, -10)
        return this.chime(this.scaleNote(0, 0), 0.05, now + 0.1, 0.9)
      case 'bossSlam':
        return this.tone(70, 0.22, 'sine', 0.1, -20)
      case 'bossHit':
        this.chime(this.scaleNote(4, 1), 0.06, now, 0.4)
        return this.chime(this.scaleNote(7, 1), 0.06, now + 0.07, 0.5)
      case 'bossDown':
        ;[0, 2, 4, 5, 7, 9].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.055, now + i * 0.09, 0.6))
        return this.chime(this.scaleNote(0, 2), 0.06, now + 0.6, 1.4)
      case 'switch':
        return this.chime(this.scaleNote(2, 1), 0.05, now, 0.3)
      case 'grab':
        return this.tone(196 * vary, 0.08, 'sine', 0.035, 30)
      case 'swim':
        return this.noise(0.14, 0.03, 650 * vary, now, 0.6, 'lowpass')
      case 'ui':
        return this.tone(560, 0.04, 'sine', 0.022)
    }
  }

  /* ── Müzik ────────────────────────────────────────────────── */

  /** oyun müziği: şehrin makamında besteli tema */
  setMusic(city: CityKey) {
    if (this.city !== city) this.intense = false
    this.city = city
    this.play(cityTheme(city))
  }

  /** jenerik: menülerde çalan tema (zaten çalıyorsa baştan başlamaz) */
  playTheme() {
    this.intense = false
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
    const sends = this.sends
    this.songBus = null
    this.channels = {}
    this.sends = []
    if (!bus || !this.ac) return
    bus.gain.setTargetAtTime(0, this.ac.currentTime, 0.25)
    for (const g of sends) g.gain.setTargetAtTime(0, this.ac.currentTime, 0.25)
    window.setTimeout(() => {
      bus.disconnect()
      for (const g of sends) g.disconnect()
    }, 1800)
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
    this.songBus = bus
    // tel notaları ilk çalındıkları anda üretilir (nota başına <1 ms): beste başında topluca üretmek zayıf telefonda
    // şehre girişte kare kaçırtır; çalma 0,3 sn önden zamanlandığı için gecikme duyulmaz
    this.stepIdx = 0
    this.nextTime = this.ac.currentTime + 0.12
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 50)
  }

  /** çalgının kanalı: stereo yer + kuru yol (beste yoluna) + yankı payı */
  private channel(inst: Inst): AudioNode {
    const ac = this.ac!
    let ch = this.channels[inst]
    if (!ch) {
      ch = ac.createGain()
      const { pan, wet } = CHANNEL[inst]
      const p = ac.createStereoPanner ? ac.createStereoPanner() : null
      if (p) {
        p.pan.value = pan
        ch.connect(p)
        p.connect(this.songBus!)
      } else ch.connect(this.songBus!)
      const send = ac.createGain()
      send.gain.value = wet
      ch.connect(send)
      send.connect(this.reverb!)
      this.sends.push(send)
      this.channels[inst] = ch
    }
    return ch
  }

  private schedule() {
    const song = this.song
    const bus = this.songBus
    if (!this.ac || !song || !bus) return
    // müzik kapalıyken nota üretilmez (sessiz de çalmaz); açılınca kaldığı ölçüden sürer
    if (!this._musicOn) {
      this.nextTime = this.ac.currentTime + 0.12
      return
    }
    while (this.nextTime < this.ac.currentTime + 0.3) {
      const i = this.stepIdx % song.length
      // lo-fi sallantısı: tek adımlar biraz geç çalar
      const t = this.nextTime + (i % 2 ? song.swing * song.step : 0)
      for (const e of song.byStep[i]) this.voice(e, t, song.step)
      if (this.intense && song.pulse.length) this.battle(i, this.nextTime, song)
      this.nextTime += song.step
      this.stepIdx++
    }
  }

  /** boss dövüşü katmanı: her grubun başında güçlü düm, aralarda sık ka, ölçü başında pes bas */
  private battle(step: number, t: number, song: Song) {
    const beats = song.pulse.reduce((a, b) => a + b, 0)
    const pos = step % beats
    let a = 0
    let groupStart = false
    for (const g of song.pulse) {
      if (pos === a) groupStart = true
      a += g
    }
    const at = (inst: Inst, vol: number, midi: number[] = [], dur = 1) => this.voice({ at: step, dur, inst, midi, vol }, t, song.step)
    // dövüşte ritim sıklaşır ama sakin kalır: her vuruşta yumuşak bas davul, aralarda zil, ölçü başında pes bas
    if (groupStart) at('kick', pos === 0 ? 0.2 : 0.13)
    at('hat', groupStart ? 0.03 : 0.02)
    if (pos === 0) at('sub', 0.1, [SCALES[this.city].root - 24 < 36 ? SCALES[this.city].root - 12 : SCALES[this.city].root - 24], 4)
  }

  /** bir notayı çalgısıyla çalar */
  private voice(e: NoteEvent, t0: number, step: number) {
    const ac = this.ac!
    const out = this.channel(e.inst)
    const dur = e.dur * step
    const drum = e.inst === 'kick' || e.inst === 'rim' || e.inst === 'hat'
    // insan eli: ezgide en çok 12 ms gecikme, güçte ±8 % (her döngüde aynı)
    const w = wobble(e.at * 31 + (e.midi[0] ?? 7))
    const t = t0 + (drum ? w * 0.004 : w * 0.012)
    const vol = e.vol * (0.92 + w * 0.16)
    switch (e.inst) {
      case 'ney': {
        // ney: notaya alttan kayarak girer, yavaş açılan vibrato, nefes sesi
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.setValueAtTime(f * 0.982, t)
        o.frequency.exponentialRampToValueAtTime(f, t + 0.07)
        const o2 = ac.createOscillator()
        o2.type = 'triangle'
        o2.frequency.setValueAtTime(f * 2 * 0.982, t)
        o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.07)
        const lfo = ac.createOscillator()
        lfo.frequency.value = 4.8 + w * 0.8
        const lg = ac.createGain()
        lg.gain.setValueAtTime(0, t)
        lg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(0.5, dur * 0.7))
        lfo.connect(lg)
        lg.connect(o.frequency)
        lg.connect(o2.frequency)
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = Math.min(5000, f * 5)
        const g = ac.createGain()
        const g2 = ac.createGain()
        g2.gain.value = 0.09
        const atk = Math.min(0.1, dur * 0.35)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + atk)
        g.gain.setValueAtTime(vol * 0.85, t + Math.max(atk, dur - 0.08))
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3)
        o.connect(g)
        o2.connect(g2)
        g2.connect(g)
        g.connect(lp)
        lp.connect(out)
        // nefes: girişte belirgin, nota boyunca hafif
        this.hit(t, Math.min(0.16, dur), vol * 0.35, Math.min(6000, f * 2.5), out, 0.8)
        if (dur > 0.4) this.hit(t + 0.1, dur - 0.1, vol * 0.08, Math.min(6000, f * 3), out, 0.6)
        for (const x of [o, o2, lfo]) {
          x.start(t)
          x.stop(t + dur + 0.35)
        }
        return
      }
      case 'kanun': {
        // kanun: önbellekteki Karplus-Strong tel tamponu, tırnakla çekilmiş kısa tını
        const src = ac.createBufferSource()
        src.buffer = this.pluck(e.midi[0])
        const g = ac.createGain()
        g.gain.setValueAtTime(vol * 1.3, t)
        g.gain.setValueAtTime(vol * 1.3, t + 0.6)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75)
        src.connect(g)
        g.connect(out)
        src.start(t)
        src.stop(t + 0.8)
        return
      }
      case 'pad': {
        // dem: hafif akortsuz üçgenler, yavaşça nefes alan süzgeç
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.setValueAtTime(700, t)
        lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5)
        lp.frequency.linearRampToValueAtTime(800, t + dur + 0.4)
        const g = ac.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol * 1.4, t + Math.min(0.6, dur * 0.4))
        g.gain.setValueAtTime(vol * 1.4, t + dur * 0.8)
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5)
        lp.connect(g)
        g.connect(out)
        for (const n of e.midi) {
          for (const det of [-9, 0, 9]) {
            const o = ac.createOscillator()
            o.type = 'triangle'
            o.frequency.value = mtof(n)
            o.detune.value = det
            const og = ac.createGain()
            og.gain.value = 1 / (e.midi.length * 3)
            o.connect(og)
            og.connect(lp)
            o.start(t)
            o.stop(t + dur + 0.55)
          }
        }
        return
      }
      case 'keys': {
        // elektrik piyano (Rhodes benzeri): sinüs gövde + çan gibi ikinci kısmi ses, yumuşak giriş, yavaş titreşim
        const g = ac.createGain()
        const ring = Math.max(0.6, dur * 1.1)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.012)
        g.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.35)
        g.gain.exponentialRampToValueAtTime(0.0001, t + ring + 0.4)
        const trem = ac.createOscillator()
        trem.frequency.value = 4.6
        const tg = ac.createGain()
        tg.gain.value = vol * 0.12
        trem.connect(tg)
        tg.connect(g.gain)
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 2400
        g.connect(lp)
        lp.connect(out)
        const nodes: OscillatorNode[] = [trem]
        for (const n of e.midi) {
          const f = mtof(n)
          const o = ac.createOscillator()
          o.type = 'sine'
          o.frequency.value = f
          const bell = ac.createOscillator()
          bell.type = 'sine'
          bell.frequency.value = f * 4.01
          const bg = ac.createGain()
          bg.gain.setValueAtTime(0.18, t)
          bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
          const og = ac.createGain()
          og.gain.value = 1 / Math.max(1, e.midi.length * 0.8)
          o.connect(og)
          bell.connect(bg)
          bg.connect(og)
          og.connect(g)
          nodes.push(o, bell)
        }
        for (const x of nodes) {
          x.start(t)
          x.stop(t + ring + 0.45)
        }
        return
      }
      case 'sub': {
        // sıcak alt bas: yuvarlak sinüs, kısa yumuşak giriş
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const h = ac.createOscillator()
        h.type = 'triangle'
        h.frequency.value = f * 2
        const hg = ac.createGain()
        hg.gain.value = 0.12
        const g = ac.createGain()
        const end = Math.max(0.3, dur)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.03)
        g.gain.setValueAtTime(vol, t + end * 0.6)
        g.gain.exponentialRampToValueAtTime(0.0001, t + end + 0.1)
        o.connect(g)
        h.connect(hg)
        hg.connect(g)
        g.connect(out)
        for (const x of [o, h]) {
          x.start(t)
          x.stop(t + end + 0.15)
        }
        return
      }
      case 'kick': {
        // yumuşak bas davul: perdesi hızla düşen sinüs, tıkırtısız
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.setValueAtTime(110, t)
        o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
        const g = ac.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.005)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
        o.connect(g)
        g.connect(out)
        o.start(t)
        o.stop(t + 0.32)
        return
      }
      case 'rim': {
        // fırçalı kenar vuruşu: kısa, boğuk gürültü + küçük gövde
        this.hit(t, 0.09, vol, 1800, out, 0.9)
        const o = ac.createOscillator()
        o.type = 'triangle'
        o.frequency.setValueAtTime(330, t)
        const g = ac.createGain()
        g.gain.setValueAtTime(vol * 0.35, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
        o.connect(g)
        g.connect(out)
        o.start(t)
        o.stop(t + 0.06)
        return
      }
      case 'hat': {
        // kapalı zil: çok kısa, yumuşatılmış tiz gürültü
        this.hit(t, 0.035, vol, 7000, out, 0.7)
        return
      }
    }
  }

  /**
   * Karplus-Strong tel benzetimi (kanun): gürültüyle başlayan, perde boyunda geciktirilip ortalanarak sönen dalga;
   * tırnakla çekilmiş, kısa ve tiz. Nota başına bir kez, ilk çalındığında üretilir.
   */
  private pluck(midi: number): AudioBuffer {
    const hit = this.plucks.get(midi)
    if (hit) return hit
    const ac = this.ac!
    const sr = ac.sampleRate
    const sec = 0.9
    const len = Math.floor(sr * sec)
    const buf = ac.createBuffer(1, len, sr)
    const d = buf.getChannelData(0)
    // döngü gecikmesi = tampon (N) + ortalama süzgeci (0,5) + kesirli tüm geçiren (frac): tam perde boyu
    const period = sr / mtof(midi)
    const n = Math.max(2, Math.floor(period - 0.6))
    const frac = period - 0.5 - n
    const c = (1 - frac) / (1 + frac)
    const ring = new Float32Array(n)
    // çekiş: süzülmüş gürültü (kanunda daha yumuşak, bağlamada tırnak gibi parlak)
    let lp = 0
    const bright = 0.6
    for (let i = 0; i < n; i++) {
      lp += (Math.random() * 2 - 1 - lp) * bright
      ring[i] = lp
    }
    // sönüm: tiz notalar daha çabuk söner; bağlamanın teli uzun tınlar
    const decay = 0.993
    const damp = Math.pow(decay, 440 / mtof(midi))
    let idx = 0
    let prev = 0
    let apIn = 0
    let apOut = 0
    for (let i = 0; i < len; i++) {
      const x = ring[idx]
      d[i] = x
      const avg = damp * 0.5 * (x + prev)
      const ap = c * avg + apIn - c * apOut
      apIn = avg
      apOut = ap
      ring[idx] = ap
      prev = x
      idx = (idx + 1) % n
    }
    // tepe 1'e çekilir, baştaki tıkırtı yumuşatılır
    let peak = 0
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]))
    const k = peak > 0 ? 0.9 / peak : 1
    for (let i = 0; i < len; i++) d[i] *= k * Math.min(1, i / 40)
    this.plucks.set(midi, buf)
    return buf
  }

  /** önceden üretilmiş gürültü tamponundan kısa vuruş (her vuruşta yeni tampon üretmez) */
  private hit(t: number, dur: number, vol: number, freq: number, out: AudioNode, q = 1.2) {
    const ac = this.ac!
    this.noiseBuf ??= this.whiteNoise()
    const src = ac.createBufferSource()
    src.buffer = this.noiseBuf
    const f = ac.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = freq
    f.Q.value = q
    const g = ac.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f)
    f.connect(g)
    g.connect(out)
    src.start(t, Math.random() * 0.5, dur + 0.02)
  }

  private whiteNoise() {
    const ac = this.ac!
    const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    return buf
  }
}
