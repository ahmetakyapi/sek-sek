/**
 * seksek_ tablolarını oluşturur (idempotent: IF NOT EXISTS). Kullanım: npm run db:migrate
 * Vercel'de her dağıtımda derlemeden önce de çalışır (`vercel-build`, `--derleme`): DATABASE_URL Vercel'de "sensitive"
 * olduğu için dışarıdan okunamaz, derleme ortamında vardır. Derlemede bir hata dağıtımı durdurmaz, yalnız uyarır
 * (kod tablo yokken sessizce yerel kayda düşer); elle koşuda hata hata olarak kalır.
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const build = process.argv.includes('--derleme')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL tanımlı değil')
  const sql = neon(url)
  const dir = join(process.cwd(), 'drizzle')
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const text = readFileSync(join(dir, f), 'utf8')
    for (const stmt of text.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(stmt)
    console.log('uygulandı:', f)
  }
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  if (build) console.warn(`göç atlandı (dağıtım sürüyor): ${msg}`)
  else {
    console.error(msg)
    process.exit(1)
  }
})
