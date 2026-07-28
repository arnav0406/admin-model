import { useRef, useEffect } from 'react'

export default function FilterBar({ filters, onChange }) {
    const searchRef = useRef(null)

    // Auto-focus search on mount
    useEffect(() => { searchRef.current?.focus() }, [])

    const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 })

    return (
        <div className="filter-bar">
            <input
                ref={searchRef}
                id="doc-search-input"
                type="search"
                className="search-input filter-bar-search"
                placeholder="Search title or description…"
                value={filters.search || ''}
                onChange={e => set('search', e.target.value)}
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
            <select
                id="filter-sort"
                className="filter-select"
                value={filters.sort || 'uploaded_at'}
                onChange={e => set('sort', e.target.value)}
            >
                <option value="uploaded_at">Sort: Date</option>
                <option value="title">Sort: Title</option>
                <option value="file_size">Sort: Size</option>
                <option value="status">Sort: Status</option>
            </select>
            <select
                id="filter-order"
                className="filter-select"
                value={filters.order || 'desc'}
                onChange={e => set('order', e.target.value)}
            >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
            </select>
            {(filters.search || filters.status || filters.mime_type) && (
                <button
                    id="clear-filters-btn"
                    className="btn btn-ghost"
                    onClick={() => onChange({ search: '', status: '', mime_type: '', sort: 'uploaded_at', order: 'desc', page: 1 })}
                >
                    Clear
                </button>
            )}
        </div>
    )
}
