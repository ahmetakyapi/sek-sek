import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Veritabanı başka projelerle paylaşılıyor: yalnızca bu projenin tablolarına dokun
  tablesFilter: ['memleket_*'],
})
