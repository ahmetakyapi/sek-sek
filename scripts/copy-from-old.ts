/**
 * Tek seferlik taşıma (8 Kasım 2026): oyuncu, oturum ve skorları eski, ortak
 * Neon veritabanındaki `memleket_*` tablolarından oyunun kendi
 * veritabanındaki `seksek_*` tablolarına kopyalar. Kimlikler korunur:
 * oyuncular aynı ad ve şifreyle, cihazlar aynı oturumla devam eder.
 *
 *   OLD_DATABASE_URL=<eski> DATABASE_URL=<yeni> npx tsx scripts/copy-from-old.ts          # kuru: yalnız sayar
 *   OLD_DATABASE_URL=<eski> DATABASE_URL=<yeni> npx tsx scripts/copy-from-old.ts --apply  # kopyalar
 *
 * Önce yeni veritabanında `npm run db:migrate`. Eski veriye dokunmaz; tekrar
 * koşulabilir (var olan satır atlanır).
 */
import { neon } from '@neondatabase/serverless'

const oldUrl = process.env.OLD_DATABASE_URL
const newUrl = process.env.DATABASE_URL
if (!oldUrl || !newUrl) throw new Error('OLD_DATABASE_URL ve DATABASE_URL gerekli')
if (oldUrl === newUrl) throw new Error('Eski ve yeni adres aynı')
const apply = process.argv.includes('--apply')
const from = neon(oldUrl)
const to = neon(newUrl)

type Row = Record<string, unknown>
const players = (await from.query('select id, name, name_key, password_hash, created_at from memleket_players')) as Row[]
const sessions = (await from.query('select id, player_id, token_hash, created_at from memleket_sessions')) as Row[]
const scores = (await from.query('select id, level, name, time_ms, deaths, items, player_id, created_at from memleket_scores order by id')) as Row[]
console.log(`eski veritabanı: oyuncu ${players.length}, oturum ${sessions.length}, skor ${scores.length}`)
if (!apply) {
  console.log('kuru çalışma — kopyalamak için --apply')
} else {
  for (const p of players) {
    await to.query(
      'insert into seksek_players (id, name, name_key, password_hash, created_at) values ($1, $2, $3, $4, $5) on conflict do nothing',
      [p.id, p.name, p.name_key, p.password_hash, p.created_at],
    )
  }
  for (const s of sessions) {
    await to.query('insert into seksek_sessions (id, player_id, token_hash, created_at) values ($1, $2, $3, $4) on conflict do nothing', [
      s.id,
      s.player_id,
      s.token_hash,
      s.created_at,
    ])
  }
  for (const s of scores) {
    await to.query(
      'insert into seksek_scores (id, level, name, time_ms, deaths, items, player_id, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict do nothing',
      [s.id, s.level, s.name, s.time_ms, s.deaths, s.items, s.player_id, s.created_at],
    )
  }
  await to.query("select setval(pg_get_serial_sequence('seksek_scores', 'id'), greatest((select coalesce(max(id), 0) from seksek_scores), 1))")
  const [c] = (await to.query(
    'select (select count(*) from seksek_players)::int p, (select count(*) from seksek_sessions)::int s, (select count(*) from seksek_scores)::int k',
  )) as { p: number; s: number; k: number }[]
  console.log(`yeni veritabanı: oyuncu ${c.p}, oturum ${c.s}, skor ${c.k}`)
}
