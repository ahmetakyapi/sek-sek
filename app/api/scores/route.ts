import { and, asc, eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { LEVELS } from '@/game/levels'
import { db } from '@/lib/db'
import { scores } from '@/lib/schema'

export const dynamic = 'force-dynamic'

const LEVEL_IDS = new Set(LEVELS.map((l) => l.id))
const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u

export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level') ?? ''
  if (!LEVEL_IDS.has(level)) return NextResponse.json({ error: 'Geçersiz bölüm' }, { status: 400 })
  try {
    const rows = await db()
      .select({ name: scores.name, timeMs: scores.timeMs, deaths: scores.deaths, items: scores.items, createdAt: scores.createdAt })
      .from(scores)
      .where(eq(scores.level, level))
      .orderBy(asc(scores.timeMs), asc(scores.deaths), asc(scores.createdAt))
      .limit(10)
    return NextResponse.json({ scores: rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Skorlar şu an alınamıyor' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const level = typeof b.level === 'string' ? b.level : ''
  const name = typeof b.name === 'string' ? b.name.trim().replace(/\s+/g, ' ') : ''
  const timeMs = Number(b.timeMs)
  const deaths = Number(b.deaths)
  const items = Number(b.items)
  if (!LEVEL_IDS.has(level)) return NextResponse.json({ error: 'Geçersiz bölüm' }, { status: 400 })
  if (!NAME_RE.test(name)) return NextResponse.json({ error: 'İsim 2–16 karakter olmalı (harf, rakam, boşluk, - _ .)' }, { status: 400 })
  if (!Number.isInteger(timeMs) || timeMs < 5000 || timeMs > 3_600_000) return NextResponse.json({ error: 'Geçersiz süre' }, { status: 400 })
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 9999) return NextResponse.json({ error: 'Geçersiz ölüm sayısı' }, { status: 400 })
  if (!Number.isInteger(items) || items < 0 || items > 3) return NextResponse.json({ error: 'Geçersiz hatıra sayısı' }, { status: 400 })

  try {
    const d = db()
    // aynı isim aynı bölümde yalnızca en iyi süresiyle kalsın
    const existing = await d.select({ id: scores.id, timeMs: scores.timeMs }).from(scores).where(and(eq(scores.level, level), eq(scores.name, name))).limit(1)
    if (existing[0]) {
      if (existing[0].timeMs > timeMs) await d.update(scores).set({ timeMs, deaths, items, createdAt: new Date() }).where(eq(scores.id, existing[0].id))
    } else {
      await d.insert(scores).values({ level, name, timeMs, deaths, items })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Skor kaydedilemedi' }, { status: 503 })
  }
}
