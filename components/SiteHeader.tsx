import Link from 'next/link'
import Logo from '@/components/Logo'

/**
 * Oyun dışı sayfaların üst çubuğu: yapışkan, opak ve telefonun güvenli alanını bilir. iOS 26 Safari durum çubuğunun
 * altına kayan içeriği bulanıklaştırır; çubuk opak olduğu için oraya yalnız düz renk düşer, düğmeler çentiğin altına girmez.
 * Telefonda "Hemen Oyna" kısalır ("Oyna"), yan bağlantılar `nav` içinde `hidden sm:block` ile gizlenir.
 */
export default function SiteHeader({ children, wide = false }: { children?: React.ReactNode; wide?: boolean }) {
  return (
    <header
      className="sticky top-0 z-30 border-b-2 border-line bg-ink"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-2.5 sm:py-3 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <Link href="/" aria-label="Oyuna Dön" className="shrink-0">
          <span className="sm:hidden">
            <Logo size={28} />
          </span>
          <span className="hidden sm:inline">
            <Logo size={34} />
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-4 text-sm text-muted" aria-label="Sayfalar">
          {children}
          <Link href="/" className="pixel-btn primary shrink-0 whitespace-nowrap px-3.5 py-2 text-sm sm:px-4">
            ▶ <span className="sm:hidden">Oyna</span>
            <span className="hidden sm:inline">Hemen Oyna</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
