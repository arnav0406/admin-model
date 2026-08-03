import { useRef, useEffect, useState } from 'react'

export default function FilterBar({ filters, onChange }) {
    const searchRef = useRef(null)
    // Local search state for instant typing feel (debounce happens in parent via useDebounce)
    const [localSearch, setLocalSearch] = useState(filters.search || '')

    // Auto-focus search on mount
    useEffect(() => { searchRef.current?.focus() }, [])

    // Sync inbound filter changes (e.g. clear filters button)
    useEffect(() => {
        setLocalSearch(filters.search || '')
    }, [filters.search])

    const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 })

    return (
        <div className="filter-bar">
            <input
                ref={searchRef}
                id="doc-search-input"
                type="search"
                className="search-input filter-bar-search"
                placeholder="Search title or description…"
                value={localSearch}
                onChange={e => {
                    setLocalSearch(e.target.value)
                    set('search', e.target.value)
                }}
            />
            <select
                id="filter-status"
                className="filter-select"
                value={filters.status || ''}
                onChange={e => set('status', e.target.value)}
            >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
            </select>
            <select
                id="filter-mime"
                className="filter-select"
                value={filters.mime_type || ''}
                onChange={e => set('mime_type', e.target.value)}
            >
                <option value="">All Types</option>
                <option value="application/pdf">PDF</option>
                <option value="image/">Images</option>
            </select>
            {(filters.search || filters.status || filters.mime_type) && (
                <button
                    id="clear-filters-btn"
                    className="btn btn-ghost"
                    onClick={() => {
                        setLocalSearch('')
                        onChange({ search: '', status: '', mime_type: '', sort: filters.sort || 'uploaded_at', order: filters.order || 'desc', page: 1 })
                    }}
                >
                    Clear
                </button>
            )}
        </div>
    )
}
