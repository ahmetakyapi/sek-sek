import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/** Paylaşılan Neon veritabanında çakışmasın diye tablo adı memleket_ önekli. */
export const scores = pgTable(
  'memleket_scores',
  {
    id: serial('id').primaryKey(),
    level: text('level').notNull(),
    name: text('name').notNull(),
    timeMs: integer('time_ms').notNull(),
    deaths: integer('deaths').notNull(),
    items: integer('items').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('memleket_scores_level_time_idx').on(t.level, t.timeMs)],
)

export type Score = typeof scores.$inferSelect
