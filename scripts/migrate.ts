/** Yalnızca memleket_ tablolarını oluşturur (idempotent). Kullanım: npm run db:migrate */
import { neon } from '@neondatabase/serverless'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL tanımlı değil')
const sql = neon(url)
const dir = join(process.cwd(), 'drizzle')
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  const text = readFileSync(join(dir, f), 'utf8')
  for (const stmt of text.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(stmt)
  console.log('uygulandı:', f)
}
