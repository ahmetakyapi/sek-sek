import { redirect } from 'next/navigation'

/** Eski /oyna bağlantıları oyunun kendisine (/) gider; karakter ve şehir seçimi korunur. */
export default async function Oyna({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === 'string') q.set(k, v)
  redirect(q.size ? `/?${q}` : '/')
}
