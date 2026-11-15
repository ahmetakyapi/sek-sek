import type { NextRequest } from 'next/server'
import { cookieSession, verifyPlayer } from '@/lib/players'

/** Oturum: çerezden (seksek_oturum), yoksa başlıktan (x-seksek-oyuncu: <id>.<anahtar>); doğrulanmış oyuncu ya da null */
export async function mapViewer(req: NextRequest) {
  const c =
    cookieSession(req) ??
    (() => {
      const [id, token] = (req.headers.get('x-seksek-oyuncu') ?? '').split('.')
      return id && token ? { id, token } : null
    })()
  return c ? verifyPlayer(c.id, c.token) : null
}

/** İstekte oturum izi var mı (doğrulamadan): yanıt kişiye özelse önbelleğe girmesin */
export const hasSession = (req: NextRequest) => !!cookieSession(req) || req.headers.has('x-seksek-oyuncu')
