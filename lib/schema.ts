import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/** Tablo adları seksek_ önekli (8 Kasım'a dek ortak veritabanında memleket_ önekliydi; oyun artık kendi Neon veritabanında). */
/** Hesaplar: kullanıcı adı (büyük/küçük harf duyarsız tekil) + scrypt ile saklanan şifre. */
export const players = pgTable('seksek_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/** Oturumlar: her cihaz kendi anahtarını taşır, çıkış yapana kadar girişli kalır. */
export const sessions = pgTable('seksek_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/** Bulut kaydı: hesaba bağlı ilerleme (açılan şehirler, süreler, pul, nazar, rozetler). Tarayıcının yerel deposu
 *  silinse de (Safari 7 gün kullanılmayan sitenin deposunu siler) giriş yapan oyuncu kaldığı yerden devam eder. */
export const saves = pgTable('seksek_saves', {
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const scores = pgTable(
  'seksek_scores',
  {
    id: serial('id').primaryKey(),
    level: text('level').notNull(),
    name: text('name').notNull(),
    timeMs: integer('time_ms').notNull(),
    deaths: integer('deaths').notNull(),
    items: integer('items').notNull(),
    playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('seksek_scores_level_time_idx').on(t.level, t.timeMs), uniqueIndex('seksek_scores_level_player_idx').on(t.level, t.playerId)],
)

