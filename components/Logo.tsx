/** Plaka rozeti amblemi (public/logo-emblem.png, 32×32 piksel ızgaradan) + yazı. */
export function Emblem({ size = 40, className = '' }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-emblem.png" width={size} height={size} alt="" className={className} style={{ imageRendering: 'pixelated' }} />
}

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Emblem size={size} />
      <span className="font-display leading-none text-cream" style={{ fontSize: size * 0.62 }}>
        Sek-Sek
      </span>
    </span>
  )
}
