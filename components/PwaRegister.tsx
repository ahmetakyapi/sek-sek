'use client'

import { useEffect } from 'react'

/**
 * Çevrimdışı oynanış için service worker kaydı (public/sw.js). Yalnız üretimde: geliştirmede önbellek
 * sıcak yeniden yüklemeyi bozar. Kayıttan önce indirilmiş statik dosyaları da worker'a bildirir.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          const urls = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin))
          reg.active?.postMessage({ type: 'cache-urls', urls })
        })
        .catch(() => {})
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])
  return null
}
