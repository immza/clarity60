'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { SearchForm } from './SearchForm'

/**
 * The masthead's magnifying glass. Without JavaScript it is a plain link to /search;
 * with it, a small search box drops down under the top strip. Esc, a click elsewhere
 * or navigating closes it.
 */
export function SearchToggle() {
  const pathname = usePathname()
  // Remember which page the box was opened on, so navigating (or searching) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOn(null)
    }
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenOn(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="search-toggle" ref={root}>
      <Link
        href="/search"
        className="search-toggle__button"
        aria-label="Search"
        aria-expanded={open}
        title="Search"
        prefetch={false}
        onClick={(e) => {
          e.preventDefault()
          setOpenOn(open ? null : pathname)
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" strokeLinecap="square" />
        </svg>
      </Link>
      {open && (
        <div className="search-toggle__panel">
          <SearchForm variant="popout" autoFocus />
        </div>
      )}
    </div>
  )
}
