'use client'

import { useCallback, useEffect, useState } from 'react'

/** Chromium'un "uygulamayı yükle" olayı (standart TS tiplerinde yok) */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPrompt {
  /** tarayıcı yükleme penceresini açabilir (Chromium: beforeinstallprompt geldi) */
  canInstall: boolean
  /** yükleme penceresini açar; kabul edilirse true */
  install: () => Promise<boolean>
  /** iOS Safari: olay yok, "Paylaş → Ana Ekrana Ekle" tarifi gösterilmeli */
  iosHint: boolean
}

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOS() {
  const ua = navigator.userAgent
  // iPadOS 13+ kendini Mac olarak tanıtır; dokunmatik Mac yok
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** "Ana Ekrana Ekle": beforeinstallprompt olayını saklar, istenince açar */
export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    // tarayıcıya özgü bilgi yalnız istemcide okunur (sunucu çiziminde false kalır)
    setIosHint(isIOS() && !standalone())
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setIosHint(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    return outcome === 'accepted'
  }, [deferred])

  return { canInstall: deferred !== null, install, iosHint }
}
