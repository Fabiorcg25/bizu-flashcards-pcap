'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  ['/dashboard', '⌂', 'Início'],
  ['/estudar', '▶', 'Estudar'],
  ['/estudar/revisao', '↻', 'Revisar'],
  ['/desempenho', '◫', 'Desempenho'],
  ['/perfil', '●', 'Perfil']
]

export default function AppNav() {
  const pathname = usePathname()
  return <nav className="app-nav" aria-label="Navegação principal">
    {items.map(([href, icon, label]) => {
      const active = href === '/dashboard'
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`)
      return <Link key={href} href={href} className={active ? 'active' : ''}>
        <span>{icon}</span><b>{label}</b>
      </Link>
    })}
  </nav>
}
