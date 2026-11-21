'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n'
import { loadSave, writeSave } from '@/lib/storage'

/**
 * Herkese açık profilin düğmeleri: arkadaş ekle / çıkar (bu cihazın kaydına yazılır, oyun açılınca buluta gider),
 * "Beni Geç" (yolcunun hayaletiyle yarış), skor kartı ve profil bağlantısını paylaş. Profil oyuncunun kendisininse
 * arkadaş düğmesi yerine "Bu Sensin" görünür.
 */
export default function ProfileActions({ name, raceCity, cardQuery }: { name: string; raceCity: string | null; cardQuery: string | null }) {
  const t = useT()
  const [me, setMe] = useState<string | null>(null)
  const [friend, setFriend] = useState(false)
  const [note, setNote] = useState('')
  const key = name.toLocaleLowerCase('tr')
  useEffect(() => {
    const s = loadSave()
    setMe(s.player?.name ?? '')
    setFriend((s.friends ?? []).some((f) => f.toLocaleLowerCase('tr') === key))
  }, [key])
  const isMe = !!me && me.toLocaleLowerCase('tr') === key
  const toggle = () => {
    const s = loadSave()
    const list = s.friends ?? []
    const has = list.some((f) => f.toLocaleLowerCase('tr') === key)
    writeSave({ ...s, friends: has ? list.filter((f) => f.toLocaleLowerCase('tr') !== key) : [...list, name].slice(-50) })
    setFriend(!has)
    setNote(has ? t('{name} arkadaşlarından çıkarıldı.', { name }) : t('{name} arkadaşlarına eklendi.', { name }))
  }
  const share = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: name, url })
      else {
        await navigator.clipboard.writeText(url)
        setNote(t('Profil bağlantısı kopyalandı.'))
      }
    } catch {
      /* paylaşım penceresi kapatıldı */
    }
  }
  return (
    <>
      {isMe ? (
        <span className="inline-flex items-center border-2 border-gold/70 bg-gold/10 px-3 text-[14px] font-bold text-gold">{t('Bu Sensin')}</span>
      ) : (
        me !== null && (
          <button className={`pixel-btn px-3 text-[14px] ${friend ? 'primary' : ''}`} aria-pressed={friend} onClick={toggle}>
            {friend ? '★' : '☆'} {friend ? t('Arkadaşın') : t('Arkadaş Ekle')}
          </button>
        )
      )}
      {!isMe && raceCity && (
        <Link href={`/?yaris=${raceCity}~${encodeURIComponent(name)}`} className="pixel-btn inline-flex items-center px-3 text-[14px]">
          ⚔ {t('Beni Geç')}
        </Link>
      )}
      {cardQuery && (
        <Link href={`/skor?${cardQuery}`} className="pixel-btn inline-flex items-center px-3 text-[14px]">
          {t('Skor Kartı')}
        </Link>
      )}
      <button className="pixel-btn px-3 text-[14px]" onClick={share}>
        {t('Paylaş')}
      </button>
      <span className="w-full text-[13px] text-muted empty:hidden" role="status" aria-live="polite">
        {note}
      </span>
    </>
  )
}
