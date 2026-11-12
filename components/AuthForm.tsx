'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import type { Player } from '@/lib/storage'

const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u

const field =
  'w-full min-w-0 bg-ink px-3 py-2.5 text-cream outline-none [box-shadow:0_-2px_0_0_#3d3550,0_2px_0_0_#3d3550,-2px_0_0_0_#3d3550,2px_0_0_0_#3d3550] focus:[box-shadow:0_-2px_0_0_#f2c14e,0_2px_0_0_#f2c14e,-2px_0_0_0_#f2c14e,2px_0_0_0_#f2c14e]'

/** Üye ol / giriş yap: kullanıcı adı + şifre. Oturum anahtarı cihazda kalır, tekrar giriş gerekmez. */
export default function AuthForm({ onDone, onMode, suggestion = '', autoFocus = true }: { onDone: (p: Player) => void; onMode?: (m: 'signup' | 'login') => void; suggestion?: string; autoFocus?: boolean }) {
  const t = useT()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [avail, setAvail] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const clean = name.trim().replace(/\s+/g, ' ')

  // üye olurken ad boşta mı, yazdıkça sor
  useEffect(() => {
    setErr('')
    if (mode !== 'signup' || !clean) return setAvail('idle')
    if (!NAME_RE.test(clean)) return setAvail('invalid')
    setAvail('checking')
    const ctl = new AbortController()
    const id = setTimeout(() => {
      fetch(`/api/players?name=${encodeURIComponent(clean)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((j: { available?: boolean }) => setAvail(j.available ? 'free' : 'taken'))
        .catch(() => {})
    }, 350)
    return () => {
      clearTimeout(id)
      ctl.abort()
    }
  }, [clean, mode])

  const passOk = password.length >= 6 && password.length <= 64
  const ready = mode === 'signup' ? avail === 'free' && passOk : clean.length > 0 && password.length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(mode === 'signup' ? '/api/players' : '/api/players/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean, password }),
      })
      const j = (await res.json()) as { id?: string; name?: string; token?: string; error?: string }
      if (!res.ok || !j.id || !j.token) throw new Error(j.error ?? t('Bir sorun çıktı, tekrar dene'))
      onDone({ id: j.id, name: j.name ?? clean, token: j.token })
    } catch (e2) {
      setErr(e2 instanceof Error ? t(e2.message) : t('Bir sorun çıktı, tekrar dene'))
      if (mode === 'signup' && e2 instanceof Error && /alınmış/.test(e2.message)) setAvail('taken')
    } finally {
      setBusy(false)
    }
  }

  const nameHint =
    mode === 'login'
      ? ''
      : avail === 'invalid'
        ? t('2–16 karakter: harf, rakam, boşluk, - _ .')
        : avail === 'checking'
          ? t('Bakılıyor…')
          : avail === 'free'
            ? t('Bu ad boşta.')
            : avail === 'taken'
              ? t('Bu ad alınmış. Senin hesabınsa giriş yap.')
              : t('Skor tablosunda ve kullanıcı sayfanda bu adla görünürsün.')

  return (
    <form onSubmit={submit} className="grid gap-3">
      {/* tek parça sekme çubuğu: iki iri düğme yerine */}
      <div className="grid grid-cols-2 bg-ink/60 p-1 [box-shadow:inset_0_0_0_2px_#3d3550]" role="tablist">
        {(['signup', 'login'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`py-1.5 text-sm font-semibold transition-colors ${mode === m ? 'bg-accent text-ink' : 'text-muted hover:text-cream'}`}
            onClick={() => {
              setMode(m)
              onMode?.(m)
            }}
          >
            {m === 'signup' ? t('Üye Ol') : t('Giriş Yap')}
          </button>
        ))}
      </div>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold tracking-[0.2em] text-muted">{t('KULLANICI ADI')}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={suggestion || t('Adın')}
          className={`${field} font-display text-xl`}
        />
        {/* varsayılan açıklama yalnız geniş ekranda; telefonda yalnız durum (boşta, alınmış, geçersiz) görünür: form ekrana sığsın */}
        {nameHint && (
          <span className={`text-[12px] ${avail === 'free' ? 'text-gold' : avail === 'taken' ? 'text-accent-2' : 'text-muted'} ${avail === 'idle' ? 'hidden sm:inline short:hidden' : ''}`} aria-live="polite">
            {nameHint}
          </span>
        )}
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold tracking-[0.2em] text-muted">{t('ŞİFRE')}</span>
        <span className="flex gap-2">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={64}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            enterKeyHint="go"
            placeholder={mode === 'signup' ? t('En az 6 karakter') : ''}
            className={`${field} text-base placeholder:text-muted/70`}
          />
          <button type="button" className="pixel-btn shrink-0 px-3 text-[12px]" onClick={() => setShow((v) => !v)} aria-pressed={show}>
            {show ? t('Gizle') : t('Göster')}
          </button>
        </span>
        {mode === 'signup' && password && !passOk && <span className="text-[12px] text-accent-2">{t('En az 6 karakter.')}</span>}
      </label>
      {err && (
        <p className="text-[12px] text-accent-2" aria-live="polite">
          {err}
        </p>
      )}
      <button className="pixel-btn primary justify-center" disabled={!ready || busy}>
        {busy ? '…' : mode === 'signup' ? t('Hesabı Aç') : t('Giriş Yap')}
      </button>
    </form>
  )
}
