'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { label: string; href: string }

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <ul className="nav__list">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="nav__link"
            aria-current={isActive(item.href) ? 'page' : undefined}
            prefetch={false}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
