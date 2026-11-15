'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

/**
 * Vercel Web Analytics ve Speed Insights: çerezsiz, kişisel veri yok. Adresin sorgu kısmı gönderilmez
 * (`?yaris=<şehir>~<ad>` yolcu adı, `?ozel=` harita kodu taşır); yalnız sayfa yolu kalır.
 */
const stripQuery = <T extends { url: string }>(event: T): T => {
  const u = new URL(event.url)
  u.search = ''
  u.hash = ''
  return { ...event, url: u.toString() }
}

export default function Telemetry() {
  return (
    <>
      <Analytics beforeSend={stripQuery} />
      <SpeedInsights beforeSend={stripQuery} />
    </>
  )
}
