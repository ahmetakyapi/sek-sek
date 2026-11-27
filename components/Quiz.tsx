'use client'
import { useEffect, useRef, useState } from 'react'
import { Overlay, ic } from '@/components/ui'
import { LEVELS } from '@/game/levels'
import type { LevelDef } from '@/game/types'
import { localize, useLang, useT } from '@/lib/i18n'
import { QUIZ_MIN, QUIZ_PRIZE, QUIZ_SIZE, makeQuiz, quizInfo, quizPoints, quizPrompt, type QuizKind, type QuizMark, type QuizQ } from '@/lib/quiz'

/** sorunun cümlesi (ipucu {x}) ve küçük etiketi */
const ASK: Record<QuizKind, { q: string; tag: string }> = {
  fact: { q: '“{x}” hangi şehrin defter sayfasında?', tag: 'Defter Sayfası' },
  item: { q: 'Hatırası “{x}” olan şehir hangisi?', tag: 'Şehrin Hatırası' },
  nickname: { q: '“{x}” diye de anılan şehir hangisi?', tag: 'Takma Ad' },
  boss: { q: 'Meydanında “{x}” bekleyen şehir hangisi?', tag: 'Boss' },
  subtitle: { q: 'Bölümünün adı “{x}” olan şehir hangisi?', tag: 'Bölüm Adı' },
}

const byId = (id: string) => LEVELS.find((l) => l.id === id)!

/**
 * Defter Bilmecesi: bitirilen şehirlerden on soru (lib/quiz.ts). Dört seçenek, yanıttan sonra şehrin kartpostalı ve bilgi metni;
 * hızlı yanıt bonus puan. Sınav bitince `onFinish` puanı kayda yazar ve (ilk tam puanda) ödülü döner.
 */
export function QuizScreen({ mark, pool, onFinish, onBack }: { mark: QuizMark | null | undefined; /** bitirilmiş, metni yazılmış şehirler */ pool: LevelDef[]; onFinish: (points: number, correct: number, size: number) => { best: boolean; prize: number }; onBack: () => void }) {
  const t = useT()
  const lng = useLang()
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [score, setScore] = useState({ points: 0, correct: 0, last: 0 })
  const [end, setEnd] = useState<{ best: boolean; prize: number } | null>(null)
  const shownAt = useRef(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const locked = pool.length < QUIZ_MIN

  const begin = () => {
    const q = makeQuiz(`${Date.now()}:${Math.random()}`, pool)
    if (!q.length) return
    setQuiz(q)
    setI(0)
    setPick(null)
    setScore({ points: 0, correct: 0, last: 0 })
    setEnd(null)
    shownAt.current = performance.now()
  }
  const q = quiz?.[i]
  const answer = (id: string) => {
    if (!q || pick) return
    const ok = id === q.city
    const pts = quizPoints(ok, performance.now() - shownAt.current)
    setPick(id)
    setScore((s) => ({ points: s.points + pts, correct: s.correct + (ok ? 1 : 0), last: pts }))
  }
  const next = () => {
    if (!quiz || !pick) return
    if (i + 1 < quiz.length) {
      setI(i + 1)
      setPick(null)
      shownAt.current = performance.now()
    } else setEnd(onFinish(score.points, score.correct, quiz.length))
  }
  useEffect(() => {
    if (pick) nextRef.current?.focus()
  }, [pick])
  // 1-4 seçer, Enter sıradaki soruya geçer
  useEffect(() => {
    if (!q || end) return
    const on = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const n = Number(e.key)
      if (!pick && n >= 1 && n <= q.options.length) (e.preventDefault(), answer(q.options[n - 1]))
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const head = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-3xl leading-none text-cream short:text-2xl">{t('Defter Bilmecesi')}</h2>
        <p className="mt-1.5 text-[14px] text-muted max-sm:hidden short:hidden">{t('Gezdiğin şehirleri ne kadar hatırlıyorsun?')}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {quiz && !end && (
          <span className="tabular-nums text-[14px] font-bold text-gold" aria-live="polite">
            {i + 1}/{quiz.length} · {score.points}
          </span>
        )}
        <button data-back className="pixel-btn back-btn whitespace-nowrap" onClick={onBack}>
          {ic(t('← Geri'))}
        </button>
      </div>
    </div>
  )

  let body: React.ReactNode
  if (locked) {
    body = (
      <div className="mt-4 border-2 border-dashed border-line px-4 py-6 text-center">
        <p className="font-display text-xl text-cream">{t('Defter Henüz İnce')}</p>
        <p className="mt-1 text-[14px] text-muted">{t('Sorular bitirdiğin şehirlerden gelir: en az {n} şehri bitir ({k}/{n}).', { n: QUIZ_MIN, k: pool.length })}</p>
      </div>
    )
  } else if (!quiz) {
    body = (
      <div className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              [t('En İyi Skor'), mark ? String(mark.best) : '—'],
              [t('Oynanan'), String(mark?.plays ?? 0)],
              [t('Şehir'), String(pool.length)],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="opt-card px-2 py-2 text-center">
              <p className="font-display text-xl leading-none tabular-nums text-cream">{v}</p>
              <p className="mt-1 text-[12px] leading-tight text-muted">{k}</p>
            </div>
          ))}
        </div>
        <p className="text-[14px] leading-snug text-cream/85">
          {t('Bitirdiğin {n} şehirden {k} soru. Doğru yanıt 100 puan, hızlı yanıt 50 puana dek bonus.', { n: pool.length, k: Math.min(QUIZ_SIZE, pool.length) })}{' '}
          {mark?.perfect ? <span className="text-muted">{t('Tam puanın ödülünü aldın.')}</span> : <span className="text-gold">{pool.length >= QUIZ_SIZE ? t('İlk tam puan +{n} parça.', { n: QUIZ_PRIZE }) : t('On şehri bitirince tam puan +{n} parça.', { n: QUIZ_PRIZE })}</span>}
        </p>
        <button className="pixel-btn primary cta justify-center self-start px-8" onClick={begin} autoFocus>
          {ic(t('▶ Başla'))}
        </button>
      </div>
    )
  } else if (end) {
    body = (
      <div className="rise mt-4 flex flex-col items-center gap-2 text-center">
        <p className="text-[14px] font-bold text-gold">{end.best ? t('★ Yeni Rekor') : t('Sınav Bitti')}</p>
        <p className="font-display text-6xl leading-none tabular-nums text-cream short:text-5xl">{score.points}</p>
        <p className="text-[14px] text-muted">{t('{n}/{m} doğru', { n: score.correct, m: quiz.length })}</p>
        {end.prize > 0 && <p className="count-pop font-display text-xl text-gold">{t('Tam puan! +{n} parça', { n: end.prize })}</p>}
        <div className="mt-2 flex gap-2">
          <button className="pixel-btn primary justify-center px-6" onClick={begin} autoFocus>
            {ic(t('↻ Yeniden Oyna'))}
          </button>
          <button className="pixel-btn justify-center px-6" onClick={onBack}>
            {t('Modlar')}
          </button>
        </div>
      </div>
    )
  } else if (q) {
    const lv = byId(q.city)
    const loc = localize(lv, lng)
    const ok = pick === q.city
    body = (
      <div className="mt-3 flex flex-col gap-3 short:mt-2 short:gap-2">
        <div className="h-1.5 w-full bg-white/10" aria-hidden>
          <div className="h-full bg-gold transition-[width]" style={{ width: `${((i + (pick ? 1 : 0)) / quiz.length) * 100}%` }} />
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-accent-2">{t(ASK[q.kind].tag)}</p>
          <p className="mt-0.5 font-display text-[22px] leading-snug text-cream short:text-lg">{t(ASK[q.kind].q, { x: quizPrompt(q, lv, lng) })}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {q.options.map((id, k) => {
            const right = pick && id === q.city
            const wrong = pick === id && id !== q.city
            return (
              <button key={id} className={`pixel-btn hit justify-start gap-2 px-3 text-left ${right ? 'primary' : ''} ${wrong ? 'opacity-70 line-through' : ''}`} onClick={() => answer(id)} disabled={!!pick && !right && !wrong} aria-pressed={pick === id}>
                <kbd className="mode-kbd shrink-0 max-sm:hidden">{k + 1}</kbd>
                <span className="truncate">{byId(id).name}</span>
                {right && <span className="ml-auto shrink-0">✓</span>}
                {wrong && <span className="ml-auto shrink-0">✗</span>}
              </button>
            )
          })}
        </div>
        {pick && (
          <div className="rise opt-card flex min-w-0 gap-3 p-3" role="status">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sehirler/${lv.id}.webp`} alt={loc.name} className="h-[86px] w-[120px] shrink-0 rounded-sm object-cover shadow-[0_0_0_2px_#37337a] max-sm:h-[64px] max-sm:w-[80px] short:h-[60px] short:w-[84px]" />
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] font-bold ${ok ? 'text-gold' : 'text-coral'}`}>
                {ok ? <span className="count-pop inline-block">{t('Doğru! +{n}', { n: score.last })}</span> : t('Doğrusu: {city}', { city: loc.name })}
              </p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-cream/85 short:line-clamp-2">{quizInfo(q, lv, lng)}</p>
            </div>
            <button ref={nextRef} className="pixel-btn primary shrink-0 self-end justify-center px-4" onClick={next}>
              {i + 1 < quiz.length ? t('Sıradaki ›') : t('Bitir')}
            </button>
          </div>
        )}
      </div>
    )
  }
  return (
    <Overlay>
      <div className="rise pixel-panel flex max-h-[calc(100dvh-32px)] w-full max-w-2xl flex-col overflow-y-auto p-4 sm:p-6 short:max-w-[min(860px,100%)] short:py-3">
        {head}
        {body}
      </div>
    </Overlay>
  )
}

/** Modlar kutucuğunun madalyon çizimi: açık defter ve soru işareti */
export function QuizGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden="true">
      <path d="M24 9c-5-4-12-5-19-3v28c7-2 14-1 19 3z" fill="#f3e6c4" stroke="#8a6a3a" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M24 9c5-4 12-5 19-3v28c-7-2-14-1-19 3z" fill="#fff4dc" stroke="#8a6a3a" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M9 13h10M9 18h10M9 23h8" stroke="#c9b48a" strokeWidth={1.4} strokeLinecap="round" />
      <text x="34" y="28" textAnchor="middle" fontSize="17" fontWeight="800" fill="#2f3cb0" fontFamily="var(--font-title), sans-serif">?</text>
    </svg>
  )
}
