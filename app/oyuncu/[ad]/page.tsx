import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProfileActions from '@/components/ProfileActions'
import ProfileView from '@/components/ProfileView'
import SiteHeader from '@/components/SiteHeader'
import { LEVELS } from '@/game/levels'
import { bestCity } from '@/lib/profile'
import { adOf, loadProfile } from '@/lib/profileServer'
import { shareQuery } from '@/lib/share'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ad: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = adOf((await params).ad)
  return { title: `${name} · Sek-Sek Yolcusu`, description: `${name} adlı yolcunun Sek-Sek’te geçtiği şehirler, süreleri ve hatıraları.`, robots: { index: false } }
}

export default async function OyuncuPage({ params }: Props) {
  const data = await loadProfile(adOf((await params).ad))
  if (!data) notFound()
  const best = bestCity(data)
  const level = best && LEVELS.find((l) => l.id === best.id)
  // skor kartı: en iyi sıradaki şehrin koşusu (kart bağlantısı adı ve atkıyı taşır)
  const cardQuery = best ? shareQuery({ level: best.id, timeMs: best.timeMs, deaths: best.deaths, items: best.items, character: data.hero, name: data.name, scarf: data.scarf }) : null
  return (
    <div className="landing min-h-dvh bg-ink text-cream">
      <SiteHeader>
        <Link href="/siralama" className="hidden hover:text-cream sm:block">
          Sıralama
        </Link>
      </SiteHeader>
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:pt-8" style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}>
        <nav className="mb-3 text-[14px]">
          <Link href="/siralama" className="text-accent-2 underline-offset-4 hover:underline">
            ← Sıralamaya Dön
          </Link>
        </nav>
        <ProfileView data={data} headingLevel={1} actions={<ProfileActions name={data.name} raceCity={level ? level.id : null} cardQuery={cardQuery} />} />
      </main>
    </div>
  )
}
