import { index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

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

/** Hız sınırı sayaçları (sabit pencere): anahtar = işlem + IP ya da ad özeti + pencere. Düz IP saklanmaz; süresi geçen
 *  satırlar ara sıra silinir (lib/rateLimit.ts). */
export const rate = pgTable(
  'seksek_rate',
  {
    key: text('key').primaryKey(),
    count: integer('count').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('seksek_rate_expires_idx').on(t.expiresAt)],
)

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
    /** bütün koşulardaki en az düşüş ve en çok hatıra (en iyi süreli koşudan bağımsız) ve bitiriş sayısı */
    minDeaths: integer('min_deaths'),
    maxItems: integer('max_items'),
    plays: integer('plays').default(1).notNull(),
    playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('seksek_scores_level_time_idx').on(t.level, t.timeMs), uniqueIndex('seksek_scores_level_player_idx').on(t.level, t.playerId)],
)


/** Hayalet koşular: oyuncunun şehirdeki en iyi koşusunun kaydı (saniyede 15 örnek: x, y, poz). Skor tablosundan
 *  "Hayaletiyle Yarış" bunu indirir. `v`: koşulduğu şehir haritası (harita değişince eski hayalet gösterilmez). */
export const ghosts = pgTable(
  'seksek_ghosts',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    level: text('level').notNull(),
    v: text('v').notNull(),
    timeMs: integer('time_ms').notNull(),
    hero: text('hero').notNull(),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.level] })],
)

/** Topluluk Haritaları: düzenleyicide çözücüyle sınanıp yayınlanan özel haritalar (/haritalar). `code` harita kodudur
 *  (lib/customLevel), aynı harita iki kez yayınlanmaz. `author` yayın anındaki ad; galeri güncel adı oyuncudan okur. */
export const maps = pgTable(
  'seksek_maps',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    author: text('author').notNull(),
    city: text('city').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    plays: integer('plays').default(0).notNull(),
    likes: integer('likes').default(0).notNull(),
    /** sahibi yayındaki haritayı güncelleyince dolar (galeride "Güncellendi" rozeti) */
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('seksek_maps_code_idx').on(t.code),
    index('seksek_maps_created_idx').on(t.createdAt),
    index('seksek_maps_likes_idx').on(t.likes, t.createdAt),
    index('seksek_maps_plays_idx').on(t.plays, t.createdAt),
    index('seksek_maps_player_idx').on(t.playerId, t.createdAt),
  ],
)

/** Beğeniler: oyuncu bir haritayı bir kez beğenir (aç/kapa); sayısı seksek_maps.likes'ta da tutulur. */
export const mapLikes = pgTable(
  'seksek_map_likes',
  {
    mapId: integer('map_id')
      .notNull()
      .references(() => maps.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.mapId, t.playerId] })],
)
