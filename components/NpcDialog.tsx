'use client'

import { useEffect, useState } from 'react'
import Portrait from '@/components/Portrait'
import type { Npc } from '@/game/types'

/**
 * Diyalog kutusu: ekranın altında, büyük ve yüksek kontrastlı; yazı daktilo gibi akar.
 * Dokunmatik kontrollerin üstüne oturur, oyunu kapatmaz.
 */
export function NpcDialog({ npc, touch }: { npc: Npc; touch: boolean }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    setShown(0)
    const id = setInterval(() => setShown((n) => (n >= npc.text.length ? n : n + 2)), 24)
    return () => clearInterval(id)
  }, [npc])
  return (
    <div
      className="dialog-in pointer-events-none dlg-pos absolute inset-x-0 z-10 flex justify-center px-3"
      data-touch={touch ? '' : undefined}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex w-full max-w-[560px] items-start gap-3 bg-[#120f1a]/95 p-3 [box-shadow:0_-3px_0_0_#d9a441,0_3px_0_0_#d9a441,-3px_0_0_0_#d9a441,3px_0_0_0_#d9a441,0_10px_24px_rgba(0,0,0,0.5)] sm:gap-4 sm:p-4">
        <div className="shrink-0 bg-[#2a2438] p-1.5 [box-shadow:0_0_0_2px_#3d3550]">
          <Portrait id={npc.look} className="dlg-avatar w-[64px] sm:w-[76px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] leading-tight text-gold sm:text-[18px]">{npc.name}</p>
          <p className="mt-1 text-[14px] leading-snug text-cream sm:text-[15px]">
            {npc.text.slice(0, shown)}
            <span className="opacity-0">{npc.text.slice(shown)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/** Tabela ipucu: aynı yerde, ahşap tabela görünümünde. */
export function SignHint({ text, touch }: { text: string; touch: boolean }) {
  return (
    <div className="dialog-in dlg-pos pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3" data-touch={touch ? '' : undefined} role="status" aria-live="polite">
      <div className="flex w-full max-w-[520px] items-start gap-3 bg-[#3a2a1e] p-3 [box-shadow:0_-3px_0_0_#c79a62,0_3px_0_0_#c79a62,-3px_0_0_0_#c79a62,3px_0_0_0_#c79a62,0_10px_24px_rgba(0,0,0,0.5)]">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-[#c79a62] font-display text-lg text-[#3a2a1e]">!</span>
        <p className="text-[14px] leading-snug text-cream sm:text-[15px]">{text}</p>
      </div>
    </div>
  )
}
