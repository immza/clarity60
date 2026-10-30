import { MAX_QUERY_LENGTH } from '@/lib/text'

/**
 * A plain GET form to /search, so search works before (and without) JavaScript.
 * Used in the masthead pop-out, the side drawer and on the results page.
 */
export function SearchForm({
  defaultValue,
  variant,
  autoFocus,
}: {
  defaultValue?: string
  variant: 'page' | 'drawer' | 'popout'
  autoFocus?: boolean
}) {
  return (
    <form action="/search" method="get" role="search" className={`search-form search-form--${variant}`}>
      <label className="sr-only" htmlFor={`search-${variant}`}>
        Search Clarity60
      </label>
      <input
        id={`search-${variant}`}
        className="search-form__input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search stories"
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        required
      />
      <button type="submit" className="search-form__submit">
        Search
      </button>
    </form>
  )
}
