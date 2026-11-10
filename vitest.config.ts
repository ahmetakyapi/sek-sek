import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// "@/…" yolları uygulamadaki gibi depo köküne çözülür (lib/ modülleri birbirini böyle içe aktarır)
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, test: { include: ['tests/**/*.test.ts'] } })
