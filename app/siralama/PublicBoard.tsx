'use client'

import { useEffect, useState } from 'react'
import ScoreBoard from '@/components/ScoreBoard'
import { loadSave, writeSave } from '@/lib/storage'

/**
 * Sayfadaki tablo: günün meydan okumasına oyunun Modlar ekranından girilir. Bu cihazda giriş yapmış bir yolcu varsa
 * "Senin Sıran" şeridi ve arkadaşlar sekmesi de açılır (arkadaşlar bu cihazın kaydına yazılır, oyun açılınca buluta gider).
 */
export default function PublicBoard() {
  const [me, setMe] = useState('')
  const [friends, setFriends] = useState<string[]>([])
  useEffect(() => {
    const s = loadSave()
    setMe(s.player?.name ?? '')
    setFriends(s.friends ?? [])
  }, [])
  const toggle = (name: string) => {
    const s = loadSave()
    const list = s.friends ?? []
    const key = name.toLocaleLowerCase('tr')
    const next = list.some((f) => f.toLocaleLowerCase('tr') === key) ? list.filter((f) => f.toLocaleLowerCase('tr') !== key) : [...list, name].slice(-50)
    writeSave({ ...s, friends: next })
    setFriends(next)
  }
  return <ScoreBoard me={me} onDaily={() => (location.href = '/?mod=gunluk')} friends={friends} onFriend={toggle} />
}
