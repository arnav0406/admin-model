import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import FilterBar from './FilterBar'
import DocumentDetail from './DocumentDetail'
import apiFetch, { buildUrl } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useDebounce } from '../hooks/useDebounce'

const API = import.meta.env.VITE_API_URL || ''

function fmtSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function MimeBadge({ mime }) {
    if (!mime) return null
    if (mime.includes('pdf')) return <span className="mime-badge mime-pdf">PDF</span>
    if (mime.startsWith('image/')) return <span className="mime-badge mime-img">IMG</span>
    return <span className="mime-badge mime-other">FILE</span>
}

// Sort arrow icon
function SortIcon({ active, order }) {
    return (
        <span className={`sort-icon ${active && order === 'asc' ? 'asc' : ''}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </span>
    )
}

// Pagination pills
function PaginationPills({ page, totalPages, onChange }) {
    const pages = []
    const range = 2
    const start = Math.max(1, page - range)
    const end = Math.min(totalPages, page + range)
    for (let p = start; p <= end; p++) pages.push(p)

    return (
        <div className="pagination-pills">
            <button className="pagination-pill" disabled={page <= 1} onClick={() => onChange(page - 1)}>←</button>
            {start > 1 && <><button className="pagination-pill" onClick={() => onChange(1)}>1</button>{start > 2 && <span style={{ padding: '0 4px', color: 'var(--muted)' }}>…</span>}</>}
            {pages.map(p => (
                <button key={p} className={`pagination-pill ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
            ))}
            {end < totalPages && <>{end < totalPages - 1 && <span style={{ padding: '0 4px', color: 'var(--muted)' }}>…</span>}<button className="pagination-pill" onClick={() => onChange(totalPages)}>{totalPages}</button></>}
            <button className="pagination-pill" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>→</button>
        </div>
    )
}

const SORTABLE_COLS = [
    { key: 'title',       label: 'Title' },
    { key: '',            label: 'Owner' },
    { key: '',            label: 'Type' },
    { key: 'file_size',   label: 'Size' },
    { key: 'status',      label: 'Status' },
    { key: 'uploaded_at', label: 'Uploaded' },
    { key: '',            label: 'Actions' },
]

export default function DocumentsTable() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const addToast = useToast()

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        mime_type: searchParams.get('mime_type') || '',
        sort: searchParams.get('sort') || 'uploaded_at',
        order: searchParams.get('order') || 'desc',
        page: parseInt(searchParams.get('page') || '1'),
    })

    const [docs, setDocs] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [activeDocId, setActiveDocId] = useState(null)
    const [bulkDeleting, setBulkDeleting] = useState(false)
    const [bulkUpdating, setBulkUpdating] = useState(false)

    const debouncedSearch = useDebounce(filters.search, 350)
    const limit = 20

    const fetchDocs = useCallback(() => {
        setLoading(true)
        apiFetch(buildUrl('/api/admin/documents', { ...filters, search: debouncedSearch, limit }))
            .then(data => {
                setDocs(data.documents || [])
                setTotal(data.total || 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [filters, debouncedSearch])

    useEffect(() => { fetchDocs() }, [fetchDocs])

    // Sync filters → URL
    useEffect(() => {
        const params = {}
        Object.entries(filters).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) params[k] = v })
        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    const totalPages = Math.ceil(total / limit)

    const toggleSelect = (id, e) => {
        e.stopPropagation()
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleAll = (e) => {
        e.stopPropagation()
        setSelectedIds(prev =>
            prev.size === docs.length ? new Set() : new Set(docs.map(d => d.id))
        )
    }

    const handleSort = (col) => {
        if (!col) return
        setFilters(f => ({
            ...f,
            sort: col,
            order: f.sort === col && f.order === 'desc' ? 'asc' : 'desc',
            page: 1,
        }))
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} document(s)? This cannot be undone.`)) return
        setBulkDeleting(true)
        try {
            await apiFetch('/api/admin/documents/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [...selectedIds] })
            })
            addToast(`Deleted ${selectedIds.size} document(s)`, 'success')
            setSelectedIds(new Set())
            fetchDocs()
        } catch (err) {
            addToast(err.message || 'Bulk delete failed', 'error')
        }
        setBulkDeleting(false)
    }

    const handleBulkStatus = async (status) => {
        const label = status.charAt(0).toUpperCase() + status.slice(1)
        if (!confirm(`Mark ${selectedIds.size} document(s) as ${label}?`)) return
        setBulkUpdating(true)
        try {
            await apiFetch('/api/admin/documents/bulk-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [...selectedIds], status })
            })
            addToast(`${selectedIds.size} document(s) marked as ${label}`, 'success')
            setSelectedIds(new Set())
            fetchDocs()
        } catch (err) {
            addToast(err.message || 'Bulk update failed', 'error')
        }
        setBulkUpdating(false)
    }

    const handleExport = () => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.status) params.set('status', filters.status)
        if (filters.mime_type) params.set('mime_type', filters.mime_type)
        window.open(`${API}/api/admin/documents/export?${params}`, '_blank')
    }

    const handleStatusChange = (updated) => {
        setDocs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
    }

    const handleDelete = (id) => {
        setDocs(prev => prev.filter(d => d.id !== id))
        setTotal(t => t - 1)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Documents</h1>
                    <p className="page-subtitle">{total} document{total !== 1 ? 's' : ''} total</p>
                </div>
                <div className="page-controls">
                    <button id="export-btn" className="btn btn-ghost" onClick={handleExport}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            <FilterBar filters={filters} onChange={setFilters} />

            {selectedIds.size > 0 && (
                <div className="bulk-action-bar">
                    <span className="bulk-count">{selectedIds.size} selected</span>
                    <button
                        className="btn btn-success"
                        onClick={() => handleBulkStatus('approved')}
                        disabled={bulkUpdating || bulkDeleting}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Approve
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => handleBulkStatus('rejected')}
                        disabled={bulkUpdating || bulkDeleting}
                    >
                        Reject
                    </button>
                    <button
                        id="bulk-delete-btn"
                        className="btn btn-danger"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting || bulkUpdating}
                    >
                        {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size}`}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setSelectedIds(new Set())}>
                        Deselect All
                    </button>
                </div>
            )}

            <div className="data-table-wrap">
                {loading ? (
                    <div className="page-loading"><div className="loading-spinner" /></div>
                ) : docs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <p>No documents found.</p>
                        {(filters.search || filters.status) && (
                            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setFilters(f => ({ ...f, search: '', status: '', mime_type: '' }))}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="cell-check" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === docs.length && docs.length > 0}
                                        onChange={toggleAll}
                                        id="select-all-checkbox"
                                    />
                                </th>
                                {SORTABLE_COLS.map(col => (
                                    <th
                                        key={col.label}
                                        className={`${col.key ? 'sortable' : ''} ${filters.sort === col.key && col.key ? 'sort-active' : ''}`}
                                        onClick={() => handleSort(col.key)}
                                    >
                                        {col.label}
                                        {col.key && <SortIcon active={filters.sort === col.key} order={filters.order} />}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map(doc => (
                                <tr
                                    key={doc.id}
                                    className={selectedIds.has(doc.id) ? 'selected-row' : ''}
                                    onClick={() => setActiveDocId(doc.id)}
                                >
                                    <td className="cell-check" onClick={e => toggleSelect(doc.id, e)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(doc.id)}
                                            onChange={() => {}}
                                            id={`check-${doc.id}`}
                                        />
                                    </td>
                                    <td className="cell-title">
                                        <span className="doc-row-link cell-name">{doc.title}</span>
                                    </td>
                                    <td>
                                        <div className="cell-owner">{doc.owner_name || '—'}</div>
                                        <div className="cell-email">{doc.owner_email}</div>
                                    </td>
                                    <td><MimeBadge mime={doc.mime_type} /></td>
                                    <td className="cell-size">{fmtSize(doc.file_size)}</td>
                                    <td><StatusBadge status={doc.status} /></td>
                                    <td className="cell-date">{fmtDate(doc.uploaded_at)}</td>
                                    <td className="cell-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            id={`view-doc-${doc.id}`}
                                            className="btn btn-ghost"
                                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                            onClick={() => setActiveDocId(doc.id)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {total > limit && (
                <div className="pagination">
                    <span className="pagination-info">
                        Showing {((filters.page - 1) * limit) + 1}–{Math.min(filters.page * limit, total)} of {total}
                    </span>
                    <PaginationPills
                        page={filters.page}
                        totalPages={totalPages}
                        onChange={p => setFilters(f => ({ ...f, page: p }))}
                    />
                </div>
            )}

            {activeDocId && (
                <DocumentDetail
                    docId={activeDocId}
                    onClose={() => setActiveDocId(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUserClick={(ownerId) => navigate(`/users/${ownerId}`)}
                />
            )}
        </div>
    )
}
