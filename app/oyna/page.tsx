import type { Metadata } from 'next'
import Game from '@/components/Game'

export const metadata: Metadata = {
  title: 'Oyna · Memleket',
  alternates: { canonical: '/oyna' },
}

export default function OynaPage() {
  return <Game />
}
