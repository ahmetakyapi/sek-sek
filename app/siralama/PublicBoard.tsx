'use client'

import ScoreBoard from '@/components/ScoreBoard'

/** Sayfadaki tablo: günün meydan okumasına oyunun Modlar ekranından girilir */
export default function PublicBoard() {
  return <ScoreBoard me="" onDaily={() => (location.href = '/?mod=gunluk')} />
}
