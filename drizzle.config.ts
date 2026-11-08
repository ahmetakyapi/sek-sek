import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Oyun kendi Neon veritabanında (8 Kasım). Önek ve ayrı kayıt tablosu yine de
  // korunuyor: veritabanı bir gün paylaşılırsa başka projenin tablosuna ya da
  // drizzle.__drizzle_migrations kaydına dokunulmasın (Açılış Zili'deki ders).
  tablesFilter: ['seksek_*'],
  migrations: { table: '__drizzle_migrations_seksek', schema: 'drizzle' },
})
