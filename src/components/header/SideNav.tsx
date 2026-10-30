'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { SearchForm } from './SearchForm'

export type SideNavGroup = {
  label: string
  href: string
  children: { label: string; href: string; children: { label: string; href: string }[] }[]
}

/**
 * "☰ Sections" drawer listing every desk, category and sub-category. Built on the
 * native <dialog>, which gives focus trapping, Esc to close and an inert background.
 */
export function SideNav({ groups, extras }: { groups: SideNavGroup[]; extras: { label: string; href: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  // Close after navigating.
  useEffect(() => {
    dialog.current?.close()
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="sidenav-toggle"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <span aria-hidden="true" className="sidenav-toggle__icon">
          ☰
        </span>
        Sections
      </button>

      <dialog
        ref={dialog}
        className="sidenav"
        aria-label="All sections"
        onClick={(e) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (e.target === dialog.current) dialog.current?.close()
        }}
      >
        <div className="sidenav__panel">
          <div className="sidenav__head">
            <span className="sidenav__title">Sections</span>
            <button type="button" className="sidenav__close" onClick={() => dialog.current?.close()} aria-label="Close sections">
              ✕
            </button>
          </div>

          <SearchForm variant="drawer" />

          <nav aria-label="All sections">
            <ul className="sidenav__list">
              <li>
                <Link href="/" className="sidenav__desk" prefetch={false}>
                  Front Page
                </Link>
              </li>
              <li>
                <Link href="/latest" className="sidenav__desk" prefetch={false}>
                  Latest
                </Link>
              </li>
              {groups.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="sidenav__desk" prefetch={false}>
                    {g.label}
                  </Link>
                  {g.children.length > 0 && (
                    <ul className="sidenav__cats">
                      {g.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} prefetch={false}>
                            {c.label}
                          </Link>
                          {c.children.length > 0 && (
                            <ul className="sidenav__subs">
                              {c.children.map((s) => (
                                <li key={s.href}>
                                  <Link href={s.href} prefetch={false}>
                                    {s.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {extras.map((x) => (
                <li key={x.href}>
                  <Link href={x.href} className="sidenav__desk" prefetch={false}>
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  )
}
