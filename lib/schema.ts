import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/** Paylaşılan Neon veritabanında çakışmasın diye tablo adı memleket_ önekli. */
/** Hesaplar: kullanıcı adı (büyük/küçük harf duyarsız tekil) + scrypt ile saklanan şifre. */
export const players = pgTable('memleket_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/** Oturumlar: her cihaz kendi anahtarını taşır, çıkış yapana kadar girişli kalır. */
export const sessions = pgTable('memleket_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const scores = pgTable(
  'memleket_scores',
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
  (t) => [index('memleket_scores_level_time_idx').on(t.level, t.timeMs), uniqueIndex('memleket_scores_level_player_idx').on(t.level, t.playerId)],
)

