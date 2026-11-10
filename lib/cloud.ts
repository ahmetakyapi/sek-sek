'use client'

import { cloudPart, mergeSaves, normalizeSave, type Player, type Save } from '@/lib/storage'

/**
 * Bulut kaydı (istemci): giriş yapan oyuncunun ilerlemesi hesabında da durur.
 *  - restorePlayer: yerel depo silinmişse oturum çerezinden girişi geri alır
 *  - pullMerge: buluttaki kaydı yereldekiyle birleştirir (hiçbir ilerleme kaybolmaz)
 *  - pushSave: birleşmiş kaydı hesaba yazar
 * Bulut yanıt vermezse oyun yerel kayıtla sürer; hiçbir hata oyunu durdurmaz.
 */
const auth = (p: Player) => ({ 'x-seksek-oyuncu': `${p.id}.${p.token}` })

/** Çerezden önceki girişler: yerel depodaki geçerli oturumdan çerezi bir kez kurar; geçersizse false (oturum kapanmış) */
export async function bindCookie(p: Player): Promise<boolean> {
  try {
    const r = await fetch('/api/players/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, token: p.token }) })
    return r.status !== 401
  } catch {
    return true
  }
}

export async function restorePlayer(): Promise<Player | null> {
  try {
    const r = await fetch('/api/players/me', { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { player?: Player | null }
    return j.player ?? null
  } catch {
    return null
  }
}

/** Birleşmiş kaydı döndürür; bulut okunamazsa null (o durumda yerel kayıt buluta yazılmaz ki eski ilerleme ezilmesin). */
export async function pullMerge(local: Save): Promise<Save | null> {
  if (!local.player) return null
  try {
    const r = await fetch('/api/players/save', { cache: 'no-store', headers: auth(local.player) })
    if (!r.ok) return null
    const j = (await r.json()) as { data: Partial<Save> | null }
    return j.data ? mergeSaves(local, normalizeSave({ ...j.data, accountVersion: 2 })) : local
  } catch {
    return null
  }
}

export async function pushSave(s: Save) {
  if (!s.player) return
  try {
    await fetch('/api/players/save', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(s.player) }, body: JSON.stringify({ data: cloudPart(s) }), keepalive: true })
  } catch {
    /* bir sonraki değişiklikte yeniden denenir */
  }
}
