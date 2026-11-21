import { NextResponse, type NextRequest } from 'next/server'
import { cleanTitle, titleProblem } from '@/lib/communityMaps'
import { decodeMap, encodeMap } from '@/lib/customLevel'

/** en uzun harita (600 sütun, hiç tekrarsız: ~19 200 karakter) bile bunun altında kalır */
export const MAX_CODE = 24_000
export const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status })

/**
 * Yayın ve güncelleme gövdesi { code, title, solved: true }: boyut, JSON, kod, çözücü bayrağı ve başlık denetlenir.
 * Kod çözülüp yeniden kodlanarak tek biçime getirilir. Hata varsa hazır yanıt döner.
 */
export async function readMapBody(req: NextRequest): Promise<{ res: NextResponse } | { code: string; title: string; city: string }> {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_CODE + 1000) return { res: bad('Harita çok büyük', 413) }
  const text = await req.text()
  if (text.length > MAX_CODE + 1000) return { res: bad('Harita çok büyük', 413) }
  let b: Record<string, unknown>
  try {
    b = JSON.parse(text) as Record<string, unknown>
  } catch {
    return { res: bad('Geçersiz istek') }
  }
  if (!b || typeof b !== 'object') return { res: bad('Geçersiz istek') }
  const raw = typeof b.code === 'string' ? b.code.trim() : ''
  if (!raw || raw.length > MAX_CODE) return { res: bad('Harita kodu bozuk.') }
  const decoded = decodeMap(raw)
  if ('error' in decoded) return { res: bad(decoded.error) }
  if (b.solved !== true) return { res: bad('Önce çözücüyle sına: yalnız bitirilebilir haritalar yayınlanır.') }
  const problem = titleProblem(b.title)
  if (problem) return { res: bad(problem) }
  return { code: encodeMap(decoded.map, decoded.city, decoded.texts), title: cleanTitle(b.title), city: decoded.city }
}
