'use client'

import { useT } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import type { Player } from '@/lib/storage'

const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u

/** Yolcu adı: yazdıkça uygunluğu sorar, kaydedince sunucudan kimlik + gizli anahtar alır. */
export default function NameForm({ player, onDone, submitLabel, autoFocus = true, suggestion = '' }: { player: Player | null; onDone: (p: Player) => void; submitLabel?: string; autoFocus?: boolean; suggestion?: string }) {
  const t = useT()
  // öneri yer tutucu olarak görünür: alınmış bir adla açılıp oyuncuyu uyarmayalım
  const [name, setName] = useState(player?.name ?? '')
  const [state, setState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid' | 'saving' | 'error'>('idle')
  const [err, setErr] = useState('')
  const clean = name.trim().replace(/\s+/g, ' ')
  const same = !!player && clean.toLocaleLowerCase('tr') === player.name.toLocaleLowerCase('tr')

  useEffect(() => {
    if (!clean) return setState('idle')
    if (!NAME_RE.test(clean)) return setState('invalid')
    if (same) return setState('free')
    setState('checking')
    const ctl = new AbortController()
    const id = setTimeout(() => {
      fetch(`/api/players?name=${encodeURIComponent(clean)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((j: { available?: boolean }) => setState(j.available ? 'free' : 'taken'))
        .catch(() => {})
    }, 350)
    return () => {
      clearTimeout(id)
      ctl.abort()
    }
  }, [clean, same])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state !== 'free') return
    if (same && player) return onDone({ ...player, name: clean })
    setState('saving')
    try {
      const res = await fetch('/api/players', {
        method: player ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player ? { id: player.id, token: player.token, name: clean } : { name: clean }),
      })
      const j = (await res.json()) as { id?: string; name?: string; token?: string; error?: string }
      if (!res.ok || !j.id) throw new Error(j.error ?? t('Kaydedilemedi'))
      onDone({ id: j.id, name: j.name ?? clean, token: j.token ?? player!.token })
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t('Kaydedilemedi'))
      setState(e2 instanceof Error && /alınmış/.test(e2.message) ? 'taken' : 'error')
    }
  }

  const hint = t(
    state === 'invalid'
      ? '2–16 karakter: harf, rakam, boşluk, - _ .'
      : state === 'checking'
        ? 'Bakılıyor…'
        : state === 'free'
          ? same
            ? 'Bu senin adın.'
            : 'Bu ad boşta.'
          : state === 'taken'
            ? 'Bu ad alınmış, başka bir ad dene.'
            : state === 'error'
              ? err
              : 'Skor tablosunda bu adla görünürsün.',
  )

  return (
    <form onSubmit={submit} className="grid gap-2">
      <label htmlFor="yolcu-adi" className="sr-only">
        {t('Yolcu adı')}
      </label>
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:gap-2">
        <input
          id="yolcu-adi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          autoComplete="nickname"
          autoCapitalize="words"
          enterKeyHint="done"
          autoFocus={autoFocus}
          placeholder={suggestion || t("Adın")}
          className="min-w-0 flex-1 bg-ink px-3 py-2.5 font-display text-xl text-cream outline-none [box-shadow:0_-2px_0_0_#3d3550,0_2px_0_0_#3d3550,-2px_0_0_0_#3d3550,2px_0_0_0_#3d3550] focus:[box-shadow:0_-2px_0_0_#f2c14e,0_2px_0_0_#f2c14e,-2px_0_0_0_#f2c14e,2px_0_0_0_#f2c14e]"
        />
        <button className="pixel-btn primary shrink-0 justify-center" disabled={state !== 'free'}>
          {state === 'saving' ? '…' : (submitLabel ?? t('Bu Adla Devam Et'))}
        </button>
      </div>
      <p className={`text-[12px] ${state === 'free' ? 'text-gold' : state === 'taken' || state === 'error' ? 'text-accent-2' : 'text-muted'}`} aria-live="polite">
        {hint}
      </p>
    </form>
  )
}
