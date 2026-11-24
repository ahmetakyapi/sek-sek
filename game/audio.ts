import type { CityKey } from './types'
import { SCALES, titleTheme, type Inst, type NoteEvent, type Song } from './music'

/**
 * Tamamen sentezlenmiş ses: harici dosya yok. Müziğin notaları music.ts'te.
 *
 * Rahatlatıcı arka plan müziği (lo-fi): Rhodes benzeri elektrik piyano, sıcak alt bas, yumuşak bas davul, fırçalı kenar
 * vuruşu, kapalı zil; ezgide ney (alttan girer, nefesi duyulur) ve kanun (Karplus-Strong tel benzetimi, nota başına
 * önbellek; uzun notada tremolo). Tek adımlar hafif geç çalar (swing). Her çalgının stereoda yeri, oda yankısı payı ve
 * tempoya bağlı sağ-sol sekişen yankı (noktalı sekizlik) payı var. Oyunun her yerinde tek beste çalar (jenerik, music.ts):
 * menüden şehre geçişte kesilmez, baştan da başlamaz. Boss uyanınca altta sakin bir dövüş katmanı (bestenin ölçü
 * köküne basan yumuşak davul ve tokmak, on altılık zil, kökte pedal bas, kanunda 3+3+2 ostinato) birkaç saniyede kabarır,
 * bitince söner; molada müzik süzgeçle boğuklaşır. Müzik yolu: ton (çamur kesilir, varlık açılır) → bant doygunluğu →
 * yapıştırıcı sıkıştırma → kendi tepe sınırlayıcısı → efekt çalınca ~3 dB eğilen yan zincir. Döngünün tek turlarında
 * ezgi başka çalgıda gelir (`pass`). Efektler müzikteki piyanoyla aynı tınıda, şehrin makamında.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** müziğin genel sesi (efektlerin altında kalır); yapıştırıcı sıkıştırmadan sonraki telafi kazancı ayrı */
const MUSIC_VOL = 0.36
const MUSIC_MAKEUP = 0.85

/** efekt çalarken müziğin eğildiği kazanç (yan zincir, ~-3 dB) */
const SFX_DUCK = 0.7

/** bant doygunluğu eğrisi: küçük seste doğrusal, büyükte yumuşakça doyar (tanh); sert kırpma yok */
function tapeCurve() {
  const n = 1024
  const c = new Float32Array(n)
  const k = 1.6
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    // hafif bakışımsızlık (+0,04): çift harmonik, sıcaklık; ortası sıfırda kalsın diye kaydırma geri alınır
    c[i] = (Math.tanh(k * (x + 0.04)) - Math.tanh(k * 0.04)) / Math.tanh(k)
  }
  return c
}

/** müzik açıkken tiz kesimi: ney nefesi ve kanun tırnağı kulağı yormasın (molada 700 Hz'e iner) */
const MUFFLE_OPEN = 9500

/**
 * Çalgı başına düzeltme: bestedeki ses payları (music.ts) olduğu gibi kalır, karışım burada dengelenir. Ölçüm (audio-render +
 * audio-render-analiz.py): bas, ezgiden çok baskındı (güç %65-75'i 120 Hz altında); alt bas kısılıp ezgi çalgıları öne alındı,
 * küçük hoparlörde duyulmayan alt notalar ikinci harmonikle taşınır. İkinci ölçüm (24 Kasım 2026, çalgı başına tek tek):
 * piyano tek başına karışımın tepesini belirliyor (tepe/RMS 21 dB), kanun (-49 LUFS), dem (-43), kenar vuruşu (-53) ve zil
 * (-62) neredeyse duyulmuyordu: ritim ve doku kayboluyor, müzik sönük ve tekdüze geliyordu. Piyano kısıldı, onlar açıldı.
 */
const TRIM: Record<Inst, number> = { ney: 1.2, kanun: 3.2, keys: 1.2, pad: 3.4, sub: 0.6, kick: 1.15, rim: 2.6, hat: 4.2, tom: 1.2 }

/** efektlerin müziğe göre payı: kısa ve seyrek oldukları için müzikten birkaç dB yukarıda durur */
const SFX_TRIM = 2

/** Rhodes benzeri (piyano, çan) ve ney için armonik dizi (sinüs paylarının genliği); bir kez kurulur */
const WAVES: Record<'rhodes' | 'ney' | 'voice', number[]> = {
  rhodes: [0, 1, 0.36, 0.12, 0.08, 0.04, 0.025, 0.012],
  ney: [0, 1, 0.2, 0.11, 0.045, 0.02],
  // "a" ünlüsü (tiz kadın sesi, temel ~600 Hz): ikinci ve üçüncü harmonik birinci ve ikinci formanta (~850, ~1300 Hz) düşer
  voice: [0, 0.55, 1, 0.62, 0.34, 0.22, 0.14, 0.08, 0.05],
}

/** çalgı başına stereo yeri (-1 sol, 1 sağ) ve yankıya giden pay */
const CHANNEL: Record<Inst, { pan: number; wet: number; echo: number }> = {
  ney: { pan: 0.18, wet: 0.5, echo: 0.22 },
  kanun: { pan: 0.35, wet: 0.42, echo: 0.2 },
  pad: { pan: 0, wet: 0.5, echo: 0 },
  keys: { pan: -0.12, wet: 0.42, echo: 0.07 },
  sub: { pan: 0, wet: 0.03, echo: 0 },
  kick: { pan: 0, wet: 0.05, echo: 0 },
  rim: { pan: 0.15, wet: 0.25, echo: 0.05 },
  hat: { pan: 0.25, wet: 0.15, echo: 0 },
  tom: { pan: -0.1, wet: 0.2, echo: 0 },
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
  /** efekt çalarken müziği hafifçe eğen kazanç (yan zincir) ve zamanlanmış efektlerin bittiği an (ses saati) */
  private sfxDuck: GainNode | null = null
  private sfxEnd = 0
  private sfxDucked = false
  /** molada müziği boğuklaştıran süzgeç */
  private muffle: BiquadFilterNode | null = null
  /** efektlerin yolu: alçak geçiren süzgeç (sert, bip gibi tiz harmonikler kesilir) */
  private sfxBus: BiquadFilterNode | null = null
  /** aynı efekt art arda tetiklenirse üst üste binmesin: son çalınış zamanı */
  private lastSfx = new Map<string, number>()
  private reverb: ConvolverNode | null = null
  /** efektlerin kısa odası */
  private sfxVerb: ConvolverNode | null = null
  private waves: Partial<Record<'rhodes' | 'ney' | 'voice', PeriodicWave>> = {}
  /** sekişen yankı: girişi ve iki gecikmesi (sağ-sol); süresi bestenin temposuna göre */
  private echoIn: GainNode | null = null
  private echoTaps: DelayNode[] = []
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
  /** dövüş katmanının gücü (0-1): birden girmez, birkaç saniyede kabarır ve söner */
  private heat = 0
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
      // ana çıkış: yumuşak sınırlayıcı (çok ses üst üste binince patlamasın). Eşiği efektlerin bugünkü sesini belirler
      // (sıkıştırıcının kendi telafi kazancı eşiğe bağlı): değiştirme; müziğin tepesi kendi sınırlayıcısında tutulur
      const limiter = this.ac.createDynamicsCompressor()
      limiter.threshold.value = -6
      limiter.knee.value = 4
      limiter.ratio.value = 14
      limiter.attack.value = 0.003
      limiter.release.value = 0.14
      limiter.connect(this.ac.destination)
      // 30 Hz altı yüksek geçiren: duyulmayan, yalnız hoparlörü yoran uğultu kesilir
      const hp = this.ac.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 30
      hp.Q.value = 0.5
      hp.connect(limiter)
      this.master = this.ac.createGain()
      this.master.gain.value = 0.85
      this.master.connect(hp)
      this.sfxBus = this.ac.createBiquadFilter()
      this.sfxBus.type = 'lowpass'
      this.sfxBus.frequency.value = 3600
      this.sfxBus.Q.value = 0.7
      this.sfxGain = this.ac.createGain()
      this.sfxGain.gain.value = this._sfxVol * SFX_TRIM
      this.sfxBus.connect(this.sfxGain)
      this.sfxGain.connect(this.master)
      // efektlere kısa oda: kuru "tık" yerine müzikle aynı havada kalan yumuşak kuyruk
      this.sfxVerb = this.ac.createConvolver()
      this.sfxVerb.buffer = this.impulse(0.7)
      const sv = this.ac.createGain()
      sv.gain.value = 0.2
      this.sfxBus.connect(sv)
      sv.connect(this.sfxVerb)
      this.sfxVerb.connect(this.sfxGain)
      // müzik: ses düzeyi → (molada) süzgeç → ton (çamur kesilir, varlık açılır) → bant doygunluğu → yapıştırıcı
      // sıkıştırma → müziğin kendi tepe sınırlayıcısı → efekt çalınca hafifçe eğilen kazanç → ana çıkış. Müzik ana
      // sınırlayıcıya kendi başına dayanmaz: efektler hep üstte, pompalanmadan duyulur. Yankı da ses düzeyinden geçer.
      this.sfxDuck = this.ac.createGain()
      this.sfxDuck.connect(this.master)
      const peak = this.ac.createDynamicsCompressor()
      peak.threshold.value = -9
      peak.knee.value = 3
      peak.ratio.value = 20
      peak.attack.value = 0.002
      peak.release.value = 0.12
      peak.connect(this.sfxDuck)
      const comp = this.ac.createDynamicsCompressor()
      comp.threshold.value = -26
      comp.knee.value = 10
      comp.ratio.value = 3
      comp.attack.value = 0.008
      comp.release.value = 0.25
      const makeup = this.ac.createGain()
      makeup.gain.value = MUSIC_MAKEUP
      comp.connect(makeup)
      makeup.connect(peak)
      // bant doygunluğu: yumuşak tanh eğrisi, vuruşların sivri tepesini yuvarlar, alt-ortaya sıcak çift harmonik katar
      const tape = this.ac.createWaveShaper()
      tape.curve = tapeCurve()
      // aşırı örnekleme yok: müzik eğrinin neredeyse doğrusal bölgesinde (tepe ~-9 dB), katılan harmonik az ve
      // katlanma duyulmaz; '2x' ses iş parçacığında her örnekte iki kat süzgeç işi demekti (zayıf telefonda boşa yük)
      tape.oversample = 'none'
      tape.connect(comp)
      // ton: 280 Hz çevresindeki çamur biraz kısılır (bas, dem ve piyano üst üste binince bulanıyordu), 3,2 kHz üstü
      // hafif açılır (ney nefesi, kanun teli, zil: "sönük" duyuluyordu); sert tiz yine muffle süzgecinde kesilir
      const mud = this.ac.createBiquadFilter()
      mud.type = 'peaking'
      mud.frequency.value = 280
      mud.Q.value = 0.9
      mud.gain.value = -3.5
      const air = this.ac.createBiquadFilter()
      air.type = 'highshelf'
      air.frequency.value = 2500
      air.gain.value = 4.5
      mud.connect(air)
      air.connect(tape)
      this.muffle = this.ac.createBiquadFilter()
      this.muffle.type = 'lowpass'
      this.muffle.Q.value = 0.5
      this.muffle.frequency.value = MUFFLE_OPEN
      this.muffle.connect(mud)
      this.musicGain = this.ac.createGain()
      this.musicGain.gain.value = this._musicOn ? MUSIC_VOL * this._musicVol : 0
      this.musicGain.connect(this.muffle)
      this.reverb = this.ac.createConvolver()
      this.reverb.buffer = this.impulse(2.6)
      const wet = this.ac.createGain()
      wet.gain.value = 0.42
      // yankının dönüşünde pesler kesilir: bas ve demin kuyruğu alt-ortayı bulandırmasın, oda yalnız ezgiyi sarsın
      const wetHp = this.ac.createBiquadFilter()
      wetHp.type = 'highpass'
      wetHp.frequency.value = 220
      wetHp.Q.value = 0.6
      this.reverb.connect(wetHp)
      wetHp.connect(wet)
      wet.connect(this.musicGain)
      // sağ-sol sekişen yankı: sol gecikme → sağ gecikme → sola geri; her dönüşte tizler biraz söner
      this.echoIn = this.ac.createGain()
      const dl = this.ac.createDelay(2)
      const dr = this.ac.createDelay(2)
      const out = this.ac.createGain()
      out.gain.value = 0.5
      for (const [d, pan, to] of [
        [dl, -0.7, dr],
        [dr, 0.7, dl],
      ] as const) {
        const lp = this.ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 2600
        const fb = this.ac.createGain()
        fb.gain.value = 0.38
        d.connect(lp)
        lp.connect(fb)
        fb.connect(to)
        const p = this.ac.createStereoPanner ? this.ac.createStereoPanner() : null
        if (p) {
          p.pan.value = pan
          lp.connect(p)
          p.connect(out)
        } else lp.connect(out)
      }
      this.echoIn.connect(dl)
      out.connect(this.musicGain)
      this.echoTaps = [dl, dr]
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
    if (this.ac && this.sfxGain) this.sfxGain.gain.setTargetAtTime(this._sfxVol * SFX_TRIM, this.ac.currentTime, 0.05)
    this.applyMusicVol()
  }

  /** molada müzik kısılır ve boğuklaşır (bir oda ötede çalıyor gibi), durmaz */
  duck(on: boolean) {
    if (this.ducked === on) return
    this.ducked = on
    this.applyMusicVol()
    if (this.ac && this.muffle) this.muffle.frequency.setTargetAtTime(on ? 700 : MUFFLE_OPEN, this.ac.currentTime, on ? 0.12 : 0.3)
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

  /** armonik diziden periyodik dalga (önbellekli): tek osilatörle zengin, yumuşak tını */
  private wave(kind: 'rhodes' | 'ney' | 'voice'): PeriodicWave {
    let w = this.waves[kind]
    if (!w) {
      const imag = new Float32Array(WAVES[kind])
      w = this.ac!.createPeriodicWave(new Float32Array(imag.length), imag)
      this.waves[kind] = w
    }
    return w
  }

  /** olaya özgü küçük stereo kayma (perdeye göre, sabit): arpejin notaları sağa sola hafifçe yayılır */
  private spread(out: AudioNode, pan: number): AudioNode {
    const ac = this.ac!
    if (!ac.createStereoPanner) return out
    const p = ac.createStereoPanner()
    p.pan.value = pan
    p.connect(out)
    return p
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
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(dest ?? this.sfxBus ?? this.master)
    this.duckForSfx(t + dur)
    o.start(t)
    o.stop(t + dur + 0.02)
    // alçak notalar (iniş, yer sarsıntısı, hırıltı) küçük hoparlörde duyulmaz: ikinci harmonik onları taşır
    if (freq < 200 && type === 'sine') {
      const h = this.ac.createOscillator()
      h.type = 'sine'
      h.frequency.setValueAtTime(freq * 2, t)
      if (slide) h.frequency.exponentialRampToValueAtTime(Math.max(60, (freq + slide) * 2), t + dur)
      const hg = this.ac.createGain()
      hg.gain.value = 0.4
      h.connect(hg)
      hg.connect(g)
      h.start(t)
      h.stop(t + dur + 0.02)
    }
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
    this.duckForSfx(t + dur)
    src.start(t, Math.random() * 0.5, dur + 0.05)
  }

  /**
   * Teyze çığlığı: "a" ünlüsünün armonikleriyle (WAVES.voice) iki hafif akortsuz ses, perde yükselip tepede titrer ve düşer
   * (komik "Aaaa!"), ağızdan çıkan nefes için üst formantta hafif gürültü. Kare ya da testere dalga yok; efekt yolundan geçer.
   */
  private scream(t: number) {
    const ac = this.ac
    if (!ac || !this.sfxBus) return
    const dur = 0.62
    const out = ac.createGain()
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.11, t + 0.04)
    out.gain.setValueAtTime(0.11, t + dur * 0.6)
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    out.connect(this.sfxBus)
    this.duckForSfx(t + dur)
    // titreme: 7 Hz'lik perde salınımı (yaşlı teyze vibratosu)
    const lfo = ac.createOscillator()
    lfo.frequency.value = 7.5
    const depth = ac.createGain()
    depth.gain.value = 22
    lfo.connect(depth)
    const voices: OscillatorNode[] = []
    for (const det of [0, 9]) {
      const o = ac.createOscillator()
      o.setPeriodicWave(this.wave('voice'))
      // "A-aaa-a": kalkış, tepe, düşüş
      o.frequency.setValueAtTime(520, t)
      o.frequency.exponentialRampToValueAtTime(820, t + 0.12)
      o.frequency.setValueAtTime(820, t + 0.32)
      o.frequency.exponentialRampToValueAtTime(600, t + dur)
      o.detune.value = det
      depth.connect(o.frequency)
      const g = ac.createGain()
      g.gain.value = det ? 0.45 : 0.7
      o.connect(g)
      g.connect(out)
      voices.push(o)
    }
    for (const x of [lfo, ...voices]) {
      x.start(t)
      x.stop(t + dur + 0.05)
    }
    // nefes: üst formant çevresinde hafif gürültü
    this.noise(dur * 0.9, 0.025, 2600, t, 2, 'bandpass')
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
    this.duckForSfx(t + dur)
    // gövde: müzikteki piyanoyla aynı armonik dalga, iki tel hafif akortsuz; üstte çabuk sönen çan kısmı
    const o = ac.createOscillator()
    o.setPeriodicWave(this.wave('rhodes'))
    o.frequency.value = f
    const o2 = ac.createOscillator()
    o2.setPeriodicWave(this.wave('rhodes'))
    o2.frequency.value = f
    o2.detune.value = 7
    const og = ac.createGain()
    og.gain.value = 0.55
    const b = ac.createOscillator()
    b.type = 'sine'
    b.frequency.value = f * 4.01
    const bg = ac.createGain()
    bg.gain.setValueAtTime(0.12, t)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.2, dur))
    o.connect(g)
    o2.connect(og)
    og.connect(g)
    b.connect(bg)
    bg.connect(g)
    for (const x of [o, o2, b]) {
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
        return this.tone(330 * vary, 0.1, 'sine', 0.07, 140)
      case 'walljump':
        this.tone(392 * vary, 0.1, 'sine', 0.07, 150)
        return this.noise(0.05, 0.03, 1200, now, 0.7, 'lowpass')
      case 'dash':
        // süzülmüş hava: alçak geçiren hışırtı, sert değil
        this.noise(0.18, 0.11, 1100 * vary, now, 0.6, 'lowpass')
        return this.tone(520 * vary, 0.12, 'sine', 0.04, -180)
      case 'land':
        return this.tone(140 * vary, 0.07, 'sine', 0.07, -40)
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
        return this.tone(220, 0.22, 'sine', 0.07, 330)
      case 'growl':
        // Kangal yaklaşıyor: alçak, titreyen hırıltı
        this.noise(0.45, 0.06, 320, now, 0.8, 'lowpass')
        return this.tone(95 * vary, 0.45, 'triangle', 0.075, -15, now)
      case 'tideUp':
      case 'tideDown':
        // gelgit dönüyor: dalga hışırtısı ve makamdan bir çan (yükselecekse tiz, çekilecekse pes)
        this.noise(0.9, 0.03, 900, now, 0.5, 'lowpass')
        return this.chime(this.scaleNote(name === 'tideUp' ? 4 : 0, name === 'tideUp' ? 1 : 0), 0.05, now + 0.15, 0.7)
      case 'shriek':
        // havuz teyzesi: "Aaaa!" diye çığlık (ünlü tınısında ses, titrek), ardından havlunun savruluşu
        this.scream(now)
        return this.noise(0.22, 0.05, 1400, now + 0.35, 0.6, 'lowpass')
      case 'sink':
        // yüzen ada gömüldü: pes bir "blop" ve kabarcık hışırtısı
        this.tone(180 * vary, 0.18, 'sine', 0.06, -90, now)
        return this.noise(0.35, 0.03, 600, now + 0.05, 0.6, 'lowpass')
      case 'freeze':
        // su donuyor: tiz, çıtırdayan kısa buz sesi ve makamdan tiz bir çan
        this.noise(0.25, 0.03, 3200, now, 0.4, 'lowpass')
        return this.chime(this.scaleNote(7, 1), 0.04, now + 0.05, 0.5)
      case 'thaw':
        // buz eriyor: yumuşak su şırıltısı ve pes bir çan
        this.noise(0.5, 0.03, 700, now, 0.5, 'lowpass')
        return this.chime(this.scaleNote(0, 0), 0.04, now + 0.1, 0.6)
      case 'bite':
        // Kangal havlar: iki kısa, inen "hav"
        this.tone(220 * vary, 0.09, 'triangle', 0.095, -90, now)
        return this.tone(180 * vary, 0.11, 'triangle', 0.095, -80, now + 0.13)
      case 'shoulder':
        // omuz sekmesi: yayınkinden yumuşak, makamdan iki nota
        this.chime(this.scaleNote(2, 1), 0.05, now, 0.4)
        return this.tone(260 * vary, 0.16, 'sine', 0.045, 260)
      case 'stomp':
        // ezme: tok, yumuşak bir "pop"
        this.tone(160, 0.1, 'sine', 0.06, -70)
        return this.chime(this.scaleNote(4, 1), 0.04, now + 0.02, 0.25)
      case 'crumble':
        return this.noise(0.22, 0.16, 420, now, 0.6, 'lowpass')
      case 'shoot':
        return this.noise(0.06, 0.075, 1800, now, 1.2, 'lowpass')
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
      case 'beat':
        // ritim blokları değişti: çok kısık, yumuşak bir tık (metronom)
        return this.chime(this.scaleNote(4, 0), 0.03, now, 0.12)
      case 'perfect':
        ;[0, 4, 7, 12].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.05, now + i * 0.04, 0.35))
        return
      case 'nitro':
        // nitro: hızla yükselen üç nota
        ;[0, 4, 7].forEach((d, i) => this.chime(this.scaleNote(d, 1), 0.05, now + i * 0.045, 0.3))
        return
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
        return this.tone(196 * vary, 0.08, 'sine', 0.07, 30)
      case 'swim':
        return this.noise(0.14, 0.09, 650 * vary, now, 0.6, 'lowpass')
      case 'breath':
        // nefes azalıyor: kabarcık "blup" + makamdan inen tek nota; kalan saniye azaldıkça biraz daha belirgin
        this.tone(330, 0.12, 'sine', 0.04, -150)
        return this.chime(this.scaleNote(2, 0), 0.045, now + 0.05, 0.35)
      case 'drown':
        // nefes bitti: kabarcık dizisi yukarı kaçar
        ;[0, 1, 2, 3].forEach((i) => this.tone(260 + i * 90, 0.07, 'sine', 0.07, 120, now + i * 0.05))
        return
      case 'ui':
        return this.tone(560, 0.04, 'sine', 0.045)
    }
  }

  /* ── Müzik ────────────────────────────────────────────────── */

  /**
   * oyun müziği: şehirde de jenerik çalar (şehre özgü beste yok). Şehir yalnız efektlerin makamını seçer; jenerik zaten
   * çalıyorsa baştan başlamaz, menüden şehre geçişte müzik kesilmeden sürer
   */
  setMusic(city: CityKey) {
    if (this.city !== city) this.intense = false
    this.city = city
    this.play(titleTheme())
  }

  /** menülerin müziği: aynı jenerik (zaten çalıyorsa baştan başlamaz), boss katmanı söner */
  playTheme() {
    this.intense = false
    this.play(titleTheme())
  }

  /** müzik şu an çalıyor mu (Müzik Kutusu'nun çal/durdur düğmesi) */
  get playing() {
    return this.song !== null
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
    this.heat = 0
    for (const d of this.echoTaps) d.delayTime.setValueAtTime(song.echo, this.ac.currentTime)
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
      const { pan, wet, echo } = CHANNEL[inst]
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
      if (echo && this.echoIn) {
        const es = ac.createGain()
        es.gain.value = echo
        ch.connect(es)
        es.connect(this.echoIn)
        this.sends.push(es)
      }
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
    this.followSfx()
    while (this.nextTime < this.ac.currentTime + 0.3) {
      // giriş bir kez çalar; döngü bestenin döndüğü yerden sürer
      const n = this.stepIdx
      const i = n < song.length ? n : song.loop + ((n - song.loop) % (song.length - song.loop))
      // döngünün kaçıncı turu: tek turlarda ezgi başka çalgıda gelir (bestedeki `pass`)
      const pass = n < song.length ? 0 : Math.floor((n - song.loop) / (song.length - song.loop)) % 2
      // lo-fi sallantısı: tek adımlar biraz geç çalar
      const t = this.nextTime + (i % 2 ? song.swing * song.step : 0)
      for (const e of song.byStep[i]) if (e.pass === undefined || e.pass === pass) this.voice(e, t, song.step)
      // dövüş katmanı ~3 sn'de kabarır, ~2 sn'de söner
      this.heat = this.intense ? Math.min(1, this.heat + song.step / 3) : Math.max(0, this.heat - song.step / 2)
      if (this.heat > 0) this.battle(i, t, song)
      this.nextTime += song.step
      this.stepIdx++
    }
  }

  /** yan zincir: efekt çalarken müzik hızla ~3 dB eğilir (efektin zamanlanmış bitişi `sfxEnd`'e yazılır) */
  private duckForSfx(end: number) {
    this.sfxEnd = Math.max(this.sfxEnd, end)
    if (this.sfxDucked || !this.ac || !this.sfxDuck) return
    this.sfxDucked = true
    this.sfxDuck.gain.setTargetAtTime(SFX_DUCK, this.ac.currentTime, 0.03)
  }

  /**
   * Efekt bitince müzik yavaşça geri gelir (zamanlayıcıda, ~50 ms'de bir; yalnız eğikken bir karşılaştırma). Eskiden
   * efekt yolunu bir ölçer (AnalyserNode) dinliyor, her tikte 1024 örnek okunuyordu: efektin ne zaman biteceği zaten belli.
   */
  private followSfx() {
    const ac = this.ac
    if (!this.sfxDucked || !ac || !this.sfxDuck || ac.currentTime < this.sfxEnd + 0.1) return
    this.sfxDucked = false
    this.sfxDuck.gain.setTargetAtTime(1, ac.currentTime, 0.4)
  }

  /**
   * Boss dövüşü katmanı: ölçünün başında ve ortasında yumuşak bas davul, usulün (3+3+2) vurgularında alçak tokmak davulu
   * (çerçeve davulu gibi, tıkırtısız) bestenin o ölçüdeki kökünde ve beşlisinde, ikide ve dörtte kısık kenar vuruşu, on
   * altılık zil (ritim sıklaşır), kökte pedal bas ve dem, kanunda usule basan ostinato. Armoni bestenin ölçü köklerinden
   * (`song.roots`) gelir, ezgiyle çatışmaz. Ses yükselmez, tizlenmez. Gücü `heat` ile kabarıp söner.
   */
  private battle(step: number, t: number, song: Song) {
    const beats = song.bar
    const pos = step % beats
    const bar = Math.floor(step / beats)
    const h = this.heat
    const at = (inst: Inst, vol: number, midi: number[] = [], dur = 1, dt = 0) => this.voice({ at: step, dur, inst, midi, vol: vol * h }, t + dt, song.step)
    const root = song.roots[bar] ?? song.roots[0]
    const tom = root < 48 ? root : root - 12
    // usulün vurguları ölçüye yayılır (sekizlikte 0, 3, 6)
    const a2 = Math.round((beats * 3) / 8)
    const a3 = Math.round((beats * 6) / 8)
    if (pos === 0) at('kick', 0.16)
    else if (pos === beats / 2) at('kick', 0.1)
    else if (pos === beats - 1 && bar % 2) at('kick', 0.06)
    if (pos === 0) at('tom', 0.15, [tom])
    else if (pos === a2) at('tom', 0.075, [tom + 7])
    else if (pos === a3) at('tom', 0.09, [tom])
    if (pos === beats / 4 || pos === (3 * beats) / 4) at('rim', 0.045)
    // zil adımda ve adımın ortasında (on altılık): dövüşte ritim sıklaşır ama sertleşmez
    at('hat', pos % 4 === 0 ? 0.022 : pos % 2 === 0 ? 0.015 : 0.011)
    at('hat', 0.008, [], 1, song.step / 2)
    if (pos === 0) at('sub', 0.08, [root], beats / 2)
    else if (pos === beats / 2) at('sub', 0.05, [root], beats / 2 - 1)
    if (pos === 0) at('pad', 0.03, [root + 12, root + 19], beats)
    const k = root + 24
    if (pos === 0 || pos === a2) at('kanun', 0.02, [k])
    else if (pos === a3) at('kanun', 0.017, [k + 7])
  }

  /** bir notayı çalgısıyla çalar */
  private voice(e: NoteEvent, t0: number, step: number) {
    const ac = this.ac!
    const out = this.channel(e.inst)
    const dur = e.dur * step
    const drum = e.inst === 'kick' || e.inst === 'rim' || e.inst === 'hat' || e.inst === 'tom'
    // insan eli: ezgide en çok 12 ms gecikme, güçte ±8 % (her döngüde aynı)
    const w = wobble(e.at * 31 + (e.midi[0] ?? 7))
    const t = t0 + (drum ? w * 0.004 : w * 0.012)
    const vol = e.vol * TRIM[e.inst] * (0.92 + w * 0.16)
    switch (e.inst) {
      case 'ney': {
        // ney: notaya alttan kayarak girer; yavaş açılan vibrato; iki hafif akortsuz ses (topluluk); girişte süzgeç
        // açılır (nefesle üflenen perde); nefes sesi
        const f = mtof(e.midi[0])
        const f0 = e.from ? mtof(e.from) : f * 0.982
        const grace = !!e.from && e.from > e.midi[0]
        const voices: OscillatorNode[] = []
        const vg = ac.createGain()
        for (const det of [-4, 5]) {
          const x = ac.createOscillator()
          x.setPeriodicWave(this.wave('ney'))
          x.detune.value = det
          x.frequency.setValueAtTime(f0, t)
          if (grace) x.frequency.setValueAtTime(f0, t + 0.055)
          x.frequency.exponentialRampToValueAtTime(f, t + (grace ? 0.08 : e.from ? 0.14 : 0.07))
          x.connect(vg)
          voices.push(x)
        }
        vg.gain.value = 0.62
        const lfo = ac.createOscillator()
        lfo.frequency.value = 4.8 + w * 0.8
        const lg = ac.createGain()
        lg.gain.setValueAtTime(0, t)
        lg.gain.linearRampToValueAtTime(f * 0.009, t + Math.min(0.5, dur * 0.7))
        lfo.connect(lg)
        for (const x of voices) lg.connect(x.frequency)
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.Q.value = 0.5
        lp.frequency.setValueAtTime(Math.min(2600, f * 2.6), t)
        lp.frequency.linearRampToValueAtTime(Math.min(4200, f * 4.5), t + Math.min(0.35, dur * 0.6))
        const g = ac.createGain()
        const atk = Math.min(0.1, dur * 0.35)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + atk)
        g.gain.setValueAtTime(vol * 0.85, t + Math.max(atk, dur - 0.08))
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3)
        vg.connect(g)
        g.connect(lp)
        lp.connect(out)
        // nefes: girişte belirgin, nota boyunca hafif
        this.hit(t, Math.min(0.16, dur), vol * 0.3, Math.min(5000, f * 2.5), out, 0.8)
        if (dur > 0.4) this.hit(t + 0.1, dur - 0.1, vol * 0.07, Math.min(5000, f * 3), out, 0.6)
        for (const x of [...voices, lfo]) {
          x.start(t)
          x.stop(t + dur + 0.35)
        }
        return
      }
      case 'kanun': {
        // kanun: önbellekteki Karplus-Strong tel tamponu, tırnakla çekilmiş kısa tını; tremoloda nota boyunca sık
        // tekrar (en çok 14 çekiş), kabarıp söner
        const buf = this.pluck(e.midi[0])
        const n = e.trem ? Math.min(14, Math.max(2, Math.floor(dur / 0.09))) : 1
        for (let k = 0; k < n; k++) {
          const tk = t + k * 0.09
          const a = e.trem ? vol * (0.45 + 0.7 * Math.sin((Math.PI * (k + 0.5)) / n)) : vol * 1.3
          const ring = e.trem ? 0.16 : Math.min(0.75, Math.max(0.35, dur + 0.2))
          const src = ac.createBufferSource()
          src.buffer = buf
          const g = ac.createGain()
          g.gain.setValueAtTime(a, tk)
          g.gain.setValueAtTime(a, tk + ring * 0.8)
          g.gain.exponentialRampToValueAtTime(0.0001, tk + ring)
          src.connect(g)
          g.connect(out)
          src.start(tk)
          src.stop(tk + ring + 0.05)
        }
        return
      }
      case 'pad': {
        // dem: hafif akortsuz üçgenler, yavaşça nefes alan süzgeç (ek olarak çok yavaş bir salınım: durağan değil)
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.setValueAtTime(700, t)
        lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5)
        lp.frequency.linearRampToValueAtTime(800, t + dur + 0.4)
        const sway = ac.createOscillator()
        sway.frequency.value = 0.09 + w * 0.05
        const sg = ac.createGain()
        sg.gain.value = 180
        sway.connect(sg)
        sg.connect(lp.frequency)
        sway.start(t)
        sway.stop(t + dur + 0.55)
        const g = ac.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol * 1.4, t + Math.min(0.8, dur * 0.4))
        g.gain.setValueAtTime(vol * 1.4, t + dur * 0.8)
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6)
        lp.connect(g)
        g.connect(out)
        // akortsuz sesler sağa ve sola açılır: dem ortada değil, odanın iki yanından sarar (geniş, sıcak yatak)
        const sides = [-0.55, 0, 0.55].map((pan) => {
          const sg2 = ac.createGain()
          sg2.gain.value = 1 / (e.midi.length * 3)
          sg2.connect(pan ? this.spread(lp, pan) : lp)
          return sg2
        })
        for (const n of e.midi) {
          ;[-9, 0, 9].forEach((det, k) => {
            const o = ac.createOscillator()
            o.type = 'triangle'
            o.frequency.value = mtof(n)
            o.detune.value = det
            o.connect(sides[k])
            o.start(t)
            o.stop(t + dur + 0.65)
          })
        }
        return
      }
      case 'keys': {
        // elektrik piyano (Rhodes benzeri): armonik dalga (iki tel, hafif akortsuz) + çabuk sönen çan kısmı; yumuşak giriş,
        // yavaş titreşim; süzgeç vuruşta açık, ses söndükçe kapanır (çıngırdayan tine'in doğası)
        const single = e.midi.length === 1
        const dest = single ? this.spread(out, ((e.midi[0] % 12) - 5.5) / 5.5 * 0.28) : out
        const g = ac.createGain()
        const ring = Math.max(0.6, dur * 1.1)
        // akorda vuruş biraz yumuşak (dört ses birden sivri bir tepe yapıyordu), tek notada çekiç belirgin
        const atk = single ? 0.01 : 0.022
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + atk)
        g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.35)
        g.gain.exponentialRampToValueAtTime(0.0001, t + ring + 0.4)
        const trem = ac.createOscillator()
        trem.frequency.value = 4.2 + w * 0.9
        const tg = ac.createGain()
        tg.gain.value = vol * 0.1
        trem.connect(tg)
        tg.connect(g.gain)
        // yumuşak basılan nota daha boğuk, güçlüsü biraz parlak (piyanonun doğası)
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        const top = Math.min(5200, 1800 + vol * 9000)
        lp.frequency.setValueAtTime(top, t)
        lp.frequency.exponentialRampToValueAtTime(Math.max(900, top * 0.45), t + 0.7)
        g.connect(lp)
        lp.connect(dest)
        const nodes: OscillatorNode[] = [trem]
        for (const n of e.midi) {
          const f = mtof(n)
          const og = ac.createGain()
          og.gain.value = 1 / Math.max(1, e.midi.length * 1.05)
          for (const [det, amp] of [[-3, 1], [4, 0.5]] as const) {
            const o = ac.createOscillator()
            o.setPeriodicWave(this.wave('rhodes'))
            o.frequency.value = f
            o.detune.value = det
            if (amp === 1) o.connect(og)
            else {
              const ag = ac.createGain()
              ag.gain.value = amp
              o.connect(ag)
              ag.connect(og)
            }
            nodes.push(o)
          }
          const bell = ac.createOscillator()
          bell.type = 'sine'
          bell.frequency.value = f * 4.01
          const bg = ac.createGain()
          bg.gain.setValueAtTime(0.16, t)
          bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
          bell.connect(bg)
          bg.connect(og)
          og.connect(g)
          nodes.push(bell)
        }
        for (const x of nodes) {
          x.start(t)
          x.stop(t + ring + 0.45)
        }
        return
      }
      case 'sub': {
        // sıcak alt bas: yuvarlak sinüs gövde + üçgen ikinci harmonik (küçük hoparlörde de duyulur); harmonik, parmakla
        // çekilmiş tel gibi parlak girip çabucak yumuşar (süzgeç kapanır): bas notası kıpırdar, uğuldamaz
        const f = mtof(e.midi[0])
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const h = ac.createOscillator()
        h.type = 'triangle'
        h.frequency.value = f * 2
        const hg = ac.createGain()
        hg.gain.value = 0.4
        const hl = ac.createBiquadFilter()
        hl.type = 'lowpass'
        hl.Q.value = 0.7
        hl.frequency.setValueAtTime(Math.min(1400, f * 9), t)
        hl.frequency.exponentialRampToValueAtTime(Math.max(160, f * 3), t + 0.25)
        const g = ac.createGain()
        const end = Math.max(0.3, dur)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.02)
        g.gain.exponentialRampToValueAtTime(vol * 0.78, t + 0.3)
        g.gain.setValueAtTime(vol * 0.78, t + Math.max(0.3, end * 0.6))
        g.gain.exponentialRampToValueAtTime(0.0001, t + end + 0.1)
        o.connect(g)
        h.connect(hg)
        hg.connect(hl)
        hl.connect(g)
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
      case 'tom': {
        // alçak tokmak (çerçeve davulu): perdesi hızla düşen sinüs, kısa ve yumuşak deri sesi; tıkırtısız
        const f = mtof(e.midi[0] ?? 45)
        const o = ac.createOscillator()
        o.type = 'sine'
        o.frequency.setValueAtTime(f * 1.6, t)
        o.frequency.exponentialRampToValueAtTime(f, t + 0.1)
        const g = ac.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol, t + 0.008)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
        const h = ac.createOscillator()
        h.type = 'sine'
        h.frequency.setValueAtTime(f * 3.2, t)
        h.frequency.exponentialRampToValueAtTime(f * 2, t + 0.08)
        const hg = ac.createGain()
        hg.gain.value = 0.3
        o.connect(g)
        h.connect(hg)
        hg.connect(g)
        g.connect(out)
        this.hit(t, 0.05, vol * 0.18, 500, out, 0.8)
        for (const x of [o, h]) {
          x.start(t)
          x.stop(t + 0.55)
        }
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
        this.hit(t, 0.04, vol, 5600, out, 0.6)
        return
      }
    }
  }

  /**
   * Karplus-Strong tel benzetimi (kanun): gürültüyle başlayan, perde boyunda geciktirilip ortalanarak sönen dalga.
   * Kanunun her notası iki-üç telden oluşur: burada iki tel, binde bir akortsuz toplanır (kor; yavaş "çarpan" bir
   * parıltı). Tırnak vuruşu süzülmüş gürültüdür (tohumdan: her üretimde aynı tını, ölçüm tekrarlanabilir); tiz notalarda
   * ek bir alçak geçiren tamponun içine yazılır, hem ucuz (çalarken düğüm yok) hem kulak yormaz. Nota başına bir kez,
   * ilk çalındığında üretilir.
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
    // tohumlu küçük rastgele üreteç (notaya bağlı)
    let seed = (midi * 2654435761) >>> 0
    const rnd = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const high = midi > 74
    // sönüm: tiz notalar daha çabuk söner; bağlamanın teli uzun tınlar
    const decay = 0.993
    for (const [det, amp] of [[1, 0.55], [1.0013, 0.45]] as const) {
      const f = mtof(midi) * det
      // döngü gecikmesi = tampon (N) + ortalama süzgeci (0,5) + kesirli tüm geçiren (frac): tam perde boyu
      const period = sr / f
      const n = Math.max(2, Math.floor(period - 0.6))
      const frac = period - 0.5 - n
      const c = (1 - frac) / (1 + frac)
      const ring = new Float32Array(n)
      // çekiş: süzülmüş gürültü (tiz notada daha yumuşak: tırnak sivrilmez)
      let lp = 0
      const bright = high ? 0.38 : 0.55
      for (let i = 0; i < n; i++) {
        lp += (rnd() * 2 - 1 - lp) * bright
        ring[i] = lp
      }
      const damp = Math.pow(decay, 440 / f)
      let idx = 0
      let prev = 0
      let apIn = 0
      let apOut = 0
      for (let i = 0; i < len; i++) {
        const x = ring[idx]
        d[i] += x * amp
        const avg = damp * 0.5 * (x + prev)
        const ap = c * avg + apIn - c * apOut
        apIn = avg
        apOut = ap
        ring[idx] = ap
        prev = x
        idx = (idx + 1) % n
      }
    }
    // tiz notalarda (≈ 500 Hz üstü temel) sert tırnak tizleri tamponda yumuşatılır
    if (midi > 72) {
      let y = 0
      for (let i = 0; i < len; i++) {
        y += (d[i] - y) * 0.55
        d[i] = y
      }
    }
    // tepe 1'e çekilir, baştaki tıkırtı yumuşatılır
    let peak = 0
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]))
    const k = peak > 0 ? 0.9 / peak : 1
    for (let i = 0; i < len; i++) d[i] *= k * Math.min(1, i / 60)
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
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.004, dur * 0.3))
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
