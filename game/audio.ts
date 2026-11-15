import type { CityKey } from './types'
import { SCALES, cityTheme, titleTheme, type Inst, type NoteEvent, type Song } from './music'

/**
 * Tamamen sentezlenmiş ses: harici dosya yok. Müziğin notaları music.ts'te.
 *
 * Tel çalgılar (bağlama, kanun) Karplus-Strong tel benzetimiyle bir kez üretilip nota başına önbelleğe alınır;
 * bağlamanın çift teli hafif akortsuz iki kopyayla çalar. Ney alttan kayarak girer, nefesi duyulur. Her çalgının
 * stereoda yeri ve kendi yankı payı var. Boss uyanınca usule ek vuruşlar girer; molada müzik süzgeçle boğuklaşır.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** müziğin genel sesi (efektlerin altında kalır) */
const MUSIC_VOL = 0.42

/** çalgı başına stereo yeri (-1 sol, 1 sağ) ve yankıya giden pay */
const CHANNEL: Record<Inst, { pan: number; wet: number }> = {
  ney: { pan: 0.18, wet: 0.55 },
  saz: { pan: -0.22, wet: 0.3 },
  kanun: { pan: 0.35, wet: 0.45 },
  arp: { pan: 0.3, wet: 0.4 },
  bass: { pan: 0, wet: 0.06 },
  pad: { pan: 0, wet: 0.5 },
  dum: { pan: -0.05, wet: 0.08 },
  tek: { pan: 0.12, wet: 0.12 },
  ka: { pan: 0.22, wet: 0.12 },
  zil: { pan: -0.3, wet: 0.5 },
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
  /** tel benzetimi önbelleği: "çalgı:nota" → tampon */
  private plucks = new Map<string, AudioBuffer>()
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

  /** tel çekişi efekt yolunda (toplama, bayrak, karar): oyunun kendi bağlaması */
  private pluckSfx(midi: number, vol: number, at?: number, kind: 'saz' | 'kanun' = 'kanun') {
    if (!this.ac || !this.sfxBus) return
    const t = at ?? this.ac.currentTime
    const src = this.ac.createBufferSource()
    src.buffer = this.pluck(kind, midi)
    const g = this.ac.createGain()
    g.gain.value = vol
    src.connect(g)
    g.connect(this.sfxBus)
    src.start(t)
  }

  /** şehrin makamından derece → MIDI (efektler şehrin dizisinde çalar) */
  private scaleNote(d: number, oct = 1) {
    const sc = SCALES[this.city]
    return sc.root + 12 * oct + sc.steps[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7)
  }

  /**
   * Oyun efektleri: yumuşak, yuvarlak sesler (sinüs, üçgen ve tel çekişi; kare ve testere dalga yok: bip gibi,
   * yapışkan tuş uyarısı gibi duyuluyordu). Hepsi alçak geçiren süzgeçten geçer; aynı efekt 60 ms içinde ikinci kez
   * çalmaz. Sık çalan efektlerin perdesi her seferinde biraz oynar (makine gibi tekrar etmesin); nota dizileri
   * setTimeout'la değil ses saatine göre zamanlanır.
   */
  sfx(name: string) {
    if (!this.sfxOn || !this.ac) return
    const now = this.ac.currentTime
    if (now - (this.lastSfx.get(name) ?? -1) < 0.06) return
    this.lastSfx.set(name, now)
    const vary = 1 + (Math.random() - 0.5) * 0.08
    switch (name) {
      case 'jump':
        // kısa, yukarı kalkan bir "hop": gövde + hafif hava
        this.tone(290 * vary, 0.14, 'sine', 0.08, 300)
        this.tone(580 * vary, 0.06, 'triangle', 0.018, 320)
        return this.noise(0.06, 0.025, 2400, now, 0.8)
      case 'walljump':
        this.tone(350 * vary, 0.13, 'sine', 0.075, 330)
        this.noise(0.05, 0.05, 900, now, 1.4)
        return this.tone(700 * vary, 0.05, 'triangle', 0.02, 260)
      case 'dash':
        // atkı rüzgârı: süzgeci kayan hışırtı + aşağı inen ton
        this.noise(0.22, 0.14, 1600 * vary, now, 0.9)
        this.noise(0.12, 0.06, 3200, now + 0.02, 2)
        return this.tone(540 * vary, 0.14, 'triangle', 0.028, -300)
      case 'land':
        this.noise(0.06, 0.09, 360 * vary, now, 0.9)
        return this.tone(110 * vary, 0.06, 'sine', 0.05, -30)
      case 'death':
        // yumuşak bir "puf": toz bulutu ve inen iki nota (ceza gibi değil)
        this.noise(0.35, 0.16, 500, now, 0.7)
        this.tone(330, 0.16, 'triangle', 0.08, -60, now)
        return this.tone(247, 0.4, 'triangle', 0.08, -110, now + 0.13)
      case 'collect': {
        // hatıra: şehrin dizisinde kanun teli, ardından parıltı
        const n = this.scaleNote(4, 1)
        this.pluckSfx(n, 0.55, now)
        this.pluckSfx(n + 12 - (SCALES[this.city].steps[4] - SCALES[this.city].steps[2]), 0.45, now + 0.08)
        return this.tone(mtof(n + 24), 0.25, 'sine', 0.03, 0, now + 0.12)
      }
      case 'checkpoint':
        // şehrin makamından yükselen dört tel: bayrak göndere çıkarken
        ;[0, 2, 4, 7].forEach((d, i) => this.pluckSfx(this.scaleNote(d, 0), i === 3 ? 0.6 : 0.45, now + i * 0.09, 'saz'))
        return
      case 'spring':
        this.tone(190, 0.28, 'triangle', 0.13, 520)
        return this.tone(380, 0.2, 'sine', 0.04, 700, now + 0.02)
      case 'stomp':
        // ezme: tok gümleme + küçük "pop"
        this.noise(0.08, 0.14, 700, now, 1)
        this.tone(180, 0.12, 'sine', 0.1, -100)
        return this.tone(660 * vary, 0.07, 'triangle', 0.04, 220, now + 0.03)
      case 'crumble':
        this.noise(0.25, 0.13, 260, now, 0.8)
        return this.noise(0.12, 0.06, 900, now + 0.08, 1.5)
      case 'shoot':
        this.noise(0.07, 0.06, 2600, now, 2)
        return this.tone(900, 0.06, 'triangle', 0.015, -400)
      case 'complete': {
        // karar: makamda inen kısa bir cümle ve tonikte tutulan tel
        const seq = [7, 5, 4, 2, 0]
        seq.forEach((d, i) => this.pluckSfx(this.scaleNote(d, 1), 0.5, now + i * 0.1, 'kanun'))
        this.pluckSfx(this.scaleNote(0, 0), 0.6, now + 0.52, 'saz')
        return this.tone(mtof(this.scaleNote(0, 1)), 0.9, 'sine', 0.05, 0, now + 0.52)
      }
      case 'pet':
        // küçük, sevimli iki nota
        this.tone(880, 0.07, 'sine', 0.08)
        return this.tone(1175, 0.1, 'sine', 0.07, 0, now + 0.07)
      case 'crystal':
        this.tone(1046, 0.08, 'triangle', 0.1)
        return this.tone(1568, 0.16, 'sine', 0.09, 0, now + 0.05)
      case 'key':
        ;[659, 880, 1175].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.11, 0, now + i * 0.07))
        return
      case 'stamp':
        ;[0, 2, 4, 7, 9].forEach((d, i) => this.pluckSfx(this.scaleNote(d, 1), 0.5, now + i * 0.085))
        return
      case 'charm':
        // nazar: cam çınlaması
        ;[784, 988, 1175, 1568].forEach((f, i) => {
          this.tone(f, 0.3, 'sine', 0.09, 0, now + i * 0.08)
          this.tone(f * 2.01, 0.2, 'sine', 0.02, 0, now + i * 0.08)
        })
        return
      case 'warp':
        this.noise(0.3, 0.13, 1200, now, 0.6)
        return this.tone(392, 0.38, 'triangle', 0.09, 420)
      case 'bossWake':
        // davul gibi derin gümbürtü ve yükselen uğultu
        this.noise(0.5, 0.2, 160, now, 0.7)
        this.tone(73, 0.7, 'sine', 0.16, -12)
        return this.tone(147, 0.6, 'triangle', 0.05, 30, now + 0.1)
      case 'bossSlam':
        this.noise(0.2, 0.22, 240, now, 0.8)
        return this.tone(70, 0.22, 'sine', 0.16, -25)
      case 'bossHit':
        this.noise(0.1, 0.16, 1100, now, 1)
        this.pluckSfx(this.scaleNote(4, 1), 0.5, now)
        return this.pluckSfx(this.scaleNote(7, 1), 0.55, now + 0.07)
      case 'bossDown':
        // zafer: makamda yükselen tel dizisi ve tonik
        ;[0, 2, 4, 5, 7, 9].forEach((d, i) => this.pluckSfx(this.scaleNote(d, 1), 0.5, now + i * 0.09, i % 2 ? 'kanun' : 'saz'))
        return this.tone(mtof(this.scaleNote(0, 1)), 1.2, 'sine', 0.06, 0, now + 0.55)
      case 'switch':
        this.noise(0.08, 0.13, 700, now, 1.2)
        return this.tone(330, 0.1, 'triangle', 0.07, 120)
      case 'ui':
        return this.tone(560, 0.05, 'sine', 0.03)
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
      for (const e of song.byStep[i]) this.voice(e, this.nextTime, song.step)
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
    if (groupStart) at('dum', pos === 0 ? 0.3 : 0.2)
    else at('ka', 0.06)
    // yarım adımda da ka: dövüşte usul iki kat sıklaşır
    this.voice({ at: step + 0.5, dur: 0.5, inst: 'ka', midi: [], vol: 0.035 }, t + song.step / 2, song.step)
    if (pos === 0) at('bass', 0.12, [SCALES[this.city].root - 24 < 36 ? SCALES[this.city].root - 12 : SCALES[this.city].root - 24], 2)
  }

  /** bir notayı çalgısıyla çalar */
  private voice(e: NoteEvent, t0: number, step: number) {
    const ac = this.ac!
    const out = this.channel(e.inst)
    const dur = e.dur * step
    const drum = e.inst === 'dum' || e.inst === 'tek' || e.inst === 'ka'
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
      case 'saz':
      case 'kanun':
      case 'arp': {
        // tel: önbellekteki Karplus-Strong tamponu; bağlamada çift tel (ikincisi hafif akortsuz ve geç)
        const kind = e.inst === 'saz' ? 'saz' : 'kanun'
        const buf = this.pluck(kind, e.midi[0])
        const ring = e.inst === 'saz' ? Math.max(0.35, dur * 1.2) : 0.6
        const g = ac.createGain()
        g.gain.setValueAtTime(vol * (kind === 'saz' ? 1.6 : 1.3), t)
        g.gain.setValueAtTime(vol * (kind === 'saz' ? 1.6 : 1.3), t + ring)
        g.gain.exponentialRampToValueAtTime(0.0001, t + ring + 0.15)
        g.connect(out)
        const strings = kind === 'saz' ? [0, 1] : [0]
        for (const s of strings) {
          const src = ac.createBufferSource()
          src.buffer = buf
          if (s) src.playbackRate.value = 1.0035
          const sg = ac.createGain()
          sg.gain.value = s ? 0.6 : 1
          src.connect(sg)
          sg.connect(g)
          src.start(t + s * 0.006)
          src.stop(t + ring + 0.2)
        }
        return
      }
      case 'bass': {
        // bas: yuvarlak alt ton + hafif tel çekişi (küçük hoparlörde de duyulsun diye ikinci harmonik)
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'triangle'
        o.frequency.value = f
        const sub = ac.createOscillator()
        sub.type = 'sine'
        sub.frequency.value = f
        const h2 = ac.createOscillator()
        h2.type = 'sine'
        h2.frequency.value = f * 2
        const hg = ac.createGain()
        hg.gain.value = 0.25
        const g = ac.createGain()
        const end = Math.max(0.2, dur * 0.9)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
        g.gain.exponentialRampToValueAtTime(vol * 0.55, t + end * 0.5)
        g.gain.exponentialRampToValueAtTime(0.0001, t + end)
        o.connect(g)
        sub.connect(g)
        h2.connect(hg)
        hg.connect(g)
        g.connect(out)
        for (const x of [o, sub, h2]) {
          x.start(t)
          x.stop(t + end + 0.05)
        }
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
      case 'dum': {
        // darbuka düm: perdesi düşen pes gövde + deri tokluğu
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.setValueAtTime(140, t)
        o.frequency.exponentialRampToValueAtTime(58, t + 0.14)
        const g = ac.createGain()
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
        o.connect(g)
        g.connect(out)
        o.start(t)
        o.stop(t + 0.34)
        this.hit(t, 0.03, vol * 0.25, 900, out, 1.5)
        return
      }
      case 'tek':
      case 'ka': {
        // tek: kenardan çınlayan parlak vuruş; ka: parmak ucuyla, kısık ve kısa
        const tek = e.inst === 'tek'
        this.hit(t, tek ? 0.08 : 0.035, vol, tek ? 3000 : 5200, out, tek ? 2.5 : 1.2)
        if (tek) {
          const o = ac.createOscillator()
          o.type = 'sine'
          o.frequency.setValueAtTime(660, t)
          o.frequency.exponentialRampToValueAtTime(600, t + 0.07)
          const g = ac.createGain()
          g.gain.setValueAtTime(vol * 0.45, t)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
          o.connect(g)
          g.connect(out)
          o.start(t)
          o.stop(t + 0.1)
        }
        return
      }
      case 'zil': {
        // parmak zili: uyumsuz kısmi seslerle uzun çınlama
        for (const [r, a] of [
          [1, 1],
          [2.76, 0.5],
          [5.4, 0.25],
        ]) {
          const o = ac.createOscillator()
          o.type = 'sine'
          o.frequency.value = 1700 * r
          const g = ac.createGain()
          g.gain.setValueAtTime(vol * a, t)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1 / r)
          o.connect(g)
          g.connect(out)
          o.start(t)
          o.stop(t + 1.2)
        }
        return
      }
    }
  }

  /**
   * Karplus-Strong tel benzetimi: gürültüyle başlayan, perde boyunda geciktirilip ortalanarak sönen dalga.
   * Bağlama: daha parlak çekiş ve uzun tını; kanun: tırnakla çekilmiş, kısa ve tiz. Nota başına bir kez üretilir.
   */
  private pluck(kind: 'saz' | 'kanun', midi: number): AudioBuffer {
    const key = `${kind}:${midi}`
    const hit = this.plucks.get(key)
    if (hit) return hit
    const ac = this.ac!
    const sr = ac.sampleRate
    const sec = kind === 'saz' ? 1.4 : 0.9
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
    const bright = kind === 'saz' ? 0.85 : 0.6
    for (let i = 0; i < n; i++) {
      lp += (Math.random() * 2 - 1 - lp) * bright
      ring[i] = lp
    }
    // sönüm: tiz notalar daha çabuk söner; bağlamanın teli uzun tınlar
    const decay = kind === 'saz' ? 0.9965 : 0.993
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
    this.plucks.set(key, buf)
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
