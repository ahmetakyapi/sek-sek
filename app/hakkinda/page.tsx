import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Portrait from '@/components/Portrait'
import TurkeyMap from '@/components/TurkeyMap'
import { CHARACTERS } from '@/game/characters'
import { FEATURES as FEATURE_TEXT } from '@/game/features'
import { LEVELS } from '@/game/levels'

const FEATURES = Object.fromEntries(Object.entries(FEATURE_TEXT).map(([k, v]) => [k, v.tr]))

const DIFF_COLOR: Record<string, string> = { Kolay: '#7fc97a', Orta: '#f2c14e', Zor: '#f08a4a', 'Çok Zor': '#e5484d' }

const plate = (n: number) => String(n).padStart(2, '0')

export const metadata: Metadata = {
  title: 'Oyun Hakkında · Sek-Sek',
  description: 'Sek-Sek nedir: İstanbul’dan Bayburt’a 25 şehir, 75 hatıra, iki yolcu ve Gezgin’in yarım kalmış defteri.',
  alternates: { canonical: '/hakkinda' },
}

export default function Hakkinda() {
  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      {/* ── üst bar */}
      <header className="sticky top-0 z-30 border-b-2 border-line bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Oyuna dön">
            <Logo size={36} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Bölümler">
            <a href="#hikaye" className="hover:text-cream">Hikâye</a>
            <a href="#karakterler" className="hover:text-cream">Karakterler</a>
            <a href="#sehirler" className="hover:text-cream">Şehirler</a>
            <a href="#nasil" className="hover:text-cream">Nasıl Oynanır</a>
          </nav>
          <Link href="/" className="pixel-btn primary py-2 text-sm">
            ▶ Hemen Oyna
          </Link>
        </div>
      </header>

      {/* ── kahraman: tam genişlik illüstrasyon levhası */}
      <section className="relative isolate overflow-hidden border-b-2 border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sehirler/istanbul.webp" alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_80%]" style={{ imageRendering: 'pixelated' }} />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#120f1a_0%,rgba(18,15,26,0.92)_38%,rgba(18,15,26,0.35)_70%,rgba(18,15,26,0.15)_100%)] max-md:bg-[linear-gradient(180deg,rgba(18,15,26,0.35)_0%,rgba(18,15,26,0.82)_45%,#120f1a_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-ink to-transparent" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 md:min-h-[640px] md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div>
            <h1 className="font-display leading-[0.95] text-cream [text-shadow:0_5px_0_#120f1a]">
              <span className="block whitespace-nowrap text-[clamp(44px,9vw,88px)]">Şehir Şehir</span>
              <span className="block whitespace-nowrap text-[clamp(52px,11vw,112px)] text-accent-2">Anadolu</span>
            </h1>
            <ul className="mt-6 grid max-w-md grid-cols-3 gap-3" aria-label="Oyunda neler yaparsın">
              {[
                ['▲', 'Zıpla'],
                ['⇡', 'Tırman'],
                ['◆', 'Keşfet'],
              ].map(([icon, word]) => (
                <li key={word} className="pixel-btn pointer-events-none justify-center gap-1.5 whitespace-nowrap px-2 py-2 font-display text-base sm:gap-2 sm:text-xl">
                  <span className="text-accent-2">{icon}</span>
                  {word}
                </li>
              ))}
            </ul>
            <p className="mt-7 max-w-md text-[17px] leading-relaxed text-cream/85">
              Gezgin’in yarım kalmış defterini tamamla.
              <br />
              <span className="text-muted">Yirmi beş şehir. Yetmiş beş hatıra. Tek yolculuk.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/" className="pixel-btn primary px-7 py-3.5 text-lg">
                ▶ Hemen Oyna
              </Link>
              <a href="#sehirler" className="pixel-btn px-6 py-3.5 text-lg">
                Şehirleri Gör
              </a>
            </div>
          </div>

          {/* polaroidler ve pul */}
          <div className="relative mx-auto h-[300px] w-full max-w-[420px] sm:h-[380px]">
            <figure className="polaroid absolute left-0 top-8 w-[44%] rotate-[-7deg]">
              <span className="tape" />
              <Portrait id="uktun" className="w-full" />
              <figcaption>Uktun · İstanbul</figcaption>
            </figure>
            <figure className="polaroid absolute right-0 top-0 w-[44%] rotate-[6deg]">
              <span className="tape" />
              <Portrait id="memo" className="w-full" />
              <figcaption>Memo · Diyarbakır</figcaption>
            </figure>
            <div className="stamp absolute bottom-2 left-[38%] rotate-[-4deg] text-center text-[#1a1420]">
              <div className="border-2 border-dashed border-[#1a1420]/40 px-3 py-1.5">
                <p className="font-display text-4xl leading-none">34</p>
                <p className="text-[10px] font-bold tracking-[0.2em]">İSTANBUL</p>
              </div>
            </div>
          </div>
        </div>
        <div className="kilim absolute inset-x-0 bottom-0" />
      </section>

      {/* ── hikâye */}
      <section id="hikaye" className="scroll-mt-20 border-y-2 border-line bg-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="notebook rotate-[-1.5deg] p-6">
            <p className="font-display text-2xl">Memleket</p>
            <p className="mt-1 text-[12px] opacity-70">Gezgin’in Yol Defteri</p>
            <ul className="mt-4 grid grid-cols-2 gap-1.5 text-[13px]">
              {LEVELS.map((l) => (
                <li key={l.id} className="flex items-center gap-2 border border-[#5a3c26]/30 px-2 py-1">
                  <span className="font-bold">{plate(l.plate)}</span> {l.name}
                  <span className="ml-auto tracking-widest opacity-60">□□□</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14px] italic">“Yolun sonu, başladığım yer.”</p>
          </div>
          <div>
            <p className="text-[12px] font-bold tracking-[0.3em] text-accent">HİKÂYE</p>
            <h2 className="mt-2 font-display text-4xl text-cream">Sahaftaki Defter</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Bir sahafın rafından tozlu bir yol defteri çıkar; altındaki imza tek kelime: Gezgin. Her sayfa bir şehre ayrılmış, her şehirde üç boş kutu var. Sırt çantanı hazırla, kırmızı atkını
              boynuna dola: İstanbul’dan başlayıp Bayburt Kalesi’nin burcunda biten bir yolculuk seni bekliyor.
            </p>
            <p className="mt-3 leading-relaxed text-muted">Topladığın her hatıra deftere bir sayfa ekler: Galata Kulesi’nin yaşı, Kadeş Antlaşması, Divriği’nin taş kapısı…</p>
          </div>
        </div>
      </section>

      {/* ── karakterler */}
      <section id="karakterler" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16">
        <p className="text-[12px] font-bold tracking-[0.3em] text-accent">YOL ARKADAŞIN</p>
        <h2 className="mt-2 font-display text-4xl text-cream">İki Yolcu, Tek Defter</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(['uktun', 'memo'] as const).map((id) => {
            const c = CHARACTERS[id]
            return (
              <article key={id} className="pixel-panel flex gap-5 p-5">
                <div className="portrait-frame w-[120px] shrink-0 sm:w-[150px]">
                  <Portrait id={id} className="w-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-accent">{c.role.toLocaleUpperCase('tr')}</p>
                  <h3 className="font-display text-3xl text-cream">{c.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.bio}</p>
                  <Link href={`/?karakter=${id}`} className="pixel-btn primary mt-4 py-2 text-sm">
                    {c.short} ile Oyna
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── şehirler */}
      <section id="sehirler" className="scroll-mt-20 border-y-2 border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-end">
            <div>
              <p className="text-[12px] font-bold tracking-[0.3em] text-accent">ROTA</p>
              <h2 className="mt-2 font-display text-4xl text-cream">On Altı Şehir, Artan Zorluk</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Her şehir yeni bir şey öğretir, bir sonraki onu bekler. Kolay İstanbul’dan Çok Zor Bayburt’a; her şehirde üç hatıra, altın-gümüş-bronz süre madalyaları
                ve konuşmayı seven yerel insanlar.
              </p>
            </div>
            <div className="pixel-panel p-3">
              <TurkeyMap unlocked={LEVELS.length - 1} selected={-1} />
            </div>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((l, i) => (
              <li key={l.id} className="group flex flex-col border-2 border-line bg-ink">
                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/sehirler/${l.id}.webp`} alt={`${l.name} bölümünden görüntü`} loading="lazy" className="block aspect-[40/21] w-full transition-transform duration-300 group-hover:scale-[1.04]" style={{ imageRendering: 'pixelated' }} />
                  <span className="plate absolute left-2 top-2 text-base">
                    <span>{plate(l.plate)}</span>
                  </span>
                  <span className="absolute right-2 top-2 bg-ink/80 px-2 py-0.5 text-[11px] font-bold" style={{ color: DIFF_COLOR[l.difficulty] }}>
                    {String(i + 1).padStart(2, '0')} · {l.difficulty}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-xl leading-tight text-cream">
                    {l.name}
                    {l.nickname && <span className="text-accent-2"> ({l.nickname})</span>}
                  </h3>
                  <p className="text-[12px] text-muted">{l.subtitle}</p>
                  <p className="mt-2 text-[13px] leading-snug text-cream/85">{FEATURES[l.id]}</p>
                  <p className="mt-auto pt-3 text-[12px] text-gold">◆ Hatıra: {l.item}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── nasıl oynanır */}
      <section id="nasil" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16">
        <p className="text-[12px] font-bold tracking-[0.3em] text-accent">KONTROLLER</p>
        <h2 className="mt-2 font-display text-4xl text-cream">Telefonda da Klavyede de Kolay</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Telefon', ['Sol yarıda nereye dokunursan joystick orada çıkar', 'ZIPLA: uzun basarsan daha yükseğe', 'DASH: joystick yönünde hızla fırla', 'Mola menüsünden büyük tuşlar ve tam ekran']],
            ['Klavye', ['← → ya da A D ile yürü', '↑, W ya da Z ile zıpla', 'Boşluk, X ya da Shift ile 8 yöne dash at', '↓ ile ince platformdan in · Esc mola · R bayrak']],
            ['Oyun Kolu', ['Sol çubuk ya da yön tuşları', 'A / Y zıpla', 'X / B / RT dash at', 'Start mola']],
          ].map(([t, items]) => (
            <div key={t as string} className="pixel-panel p-5">
              <h3 className="font-display text-2xl text-cream">{t as string}</h3>
              <ul className="mt-3 grid gap-2 text-[14px] text-muted">
                {(items as string[]).map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-accent">▸</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Hatıralar', 'Her şehirde üç hatıra, her biri doğrulanmış bir bilgi kartı açar.'],
            ['Madalyalar', 'Süreye göre altın, gümüş, bronz. Skor tablosunda yerini al.'],
            ['Skor Kartları', 'Bölüm sonunda skorunu kart olarak WhatsApp’tan paylaş.'],
            ['Kurulum Yok', 'Tarayıcıda açılır; ana ekrana ekleyip uygulama gibi oynayabilirsin.'],
          ].map(([t, d]) => (
            <div key={t} className="border-2 border-line p-4">
              <h3 className="font-display text-lg text-gold">{t}</h3>
              <p className="mt-1 text-[13px] leading-snug text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── son çağrı */}
      <section className="border-t-2 border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center">
          <h2 className="font-display text-4xl text-cream sm:text-5xl">Defter Seni Bekliyor</h2>
          <p className="max-w-lg text-muted">Bir dakikada başlarsın, ilk şehir İstanbul. Simitçi Hasan Amca’ya selam söyle.</p>
          <Link href="/" className="pixel-btn primary px-8 py-3 text-lg">
            ▶ Hemen Oyna
          </Link>
        </div>
      </section>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-muted">
          <Logo size={24} />
          <p>Bütün çizimler ve müzik kodla üretildi. Bilgi kartları kaynaklarla doğrulandı.</p>
        </div>
      </footer>
    </div>
  )
}
