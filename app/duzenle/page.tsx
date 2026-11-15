import type { Metadata } from 'next'
import Editor from '@/components/Editor'

export const metadata: Metadata = {
  title: 'Bölüm Düzenleyici · Sek-Sek',
  description: 'Kendi Sek-Sek bölümünü çiz, çözücüyle bitirilebilir mi diye sına ve bağlantıyla paylaş.',
  alternates: { canonical: '/duzenle' },
}

export default function Duzenle() {
  return <Editor />
}
