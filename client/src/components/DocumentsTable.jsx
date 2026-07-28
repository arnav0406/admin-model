import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import FilterBar from './FilterBar'
import DocumentDetail from './DocumentDetail'

const API = import.meta.env.VITE_API_URL || ''

function getCsrf() {
    const m = document.cookie.match(/(?:^|;\s*)admin_csrf_token=([^;]*)/)
    return m ? m[1] : ''
}

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

export default function DocumentsTable() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

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

    const limit = 20

    const fetchDocs = useCallback(() => {
        setLoading(true)
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        params.set('limit', limit)

        fetch(`${API}/api/admin/documents?${params}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setDocs(data.documents || [])
                setTotal(data.total || 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [filters])

    useEffect(() => { fetchDocs() }, [fetchDocs])

    // Sync filters → URL
    useEffect(() => {
        const params = {}
        Object.entries(filters).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) params[k] = v })
        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    const totalPages = Math.ceil(total / limit)

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        setSelectedIds(prev =>
            prev.size === docs.length ? new Set() : new Set(docs.map(d => d.id))
        )
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} document(s)? This cannot be undone.`)) return
        setBulkDeleting(true)
        await fetch(`${API}/api/admin/documents/bulk`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
            body: JSON.stringify({ ids: [...selectedIds] })
        })
        setSelectedIds(new Set())
        fetchDocs()
        setBulkDeleting(false)
    }

    const handleStatusChange = (updated) => {
        setDocs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
    }

    const handleDelete = (id) => {
        setDocs(prev => prev.filter(d => d.id !== id))
        setTotal(t => t - 1)
    }

    const handleUserClick = (ownerId) => {
        navigate(`/users/${ownerId}`)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Documents</h1>
                    <p className="page-subtitle">{total} document{total !== 1 ? 's' : ''} total</p>
                </div>
            </div>

            <FilterBar filters={filters} onChange={setFilters} />

            {selectedIds.size > 0 && (
                <div className="bulk-action-bar">
                    <span className="bulk-count">{selectedIds.size} selected</span>
                    <button
                        id="bulk-delete-btn"
                        className="btn btn-danger"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
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
                                <th className="cell-check">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === docs.length && docs.length > 0}
                                        onChange={toggleAll}
                                        id="select-all-checkbox"
                                    />
                                </th>
                                <th>Title</th>
                                <th>Owner</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Uploaded</th>
                                <th className="cell-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map(doc => (
                                <tr
                                    key={doc.id}
                                    className={selectedIds.has(doc.id) ? 'selected-row' : ''}
                                >
                                    <td className="cell-check">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(doc.id)}
                                            onChange={() => toggleSelect(doc.id)}
                                            id={`check-${doc.id}`}
                                        />
                                    </td>
                                    <td className="cell-title">
                                        <span
                                            className="doc-row-link cell-name"
                                            onClick={() => setActiveDocId(doc.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {doc.title}
                                        </span>
                    </td>
                                    <td>
                                        <div className="cell-owner">{doc.owner_name || '—'}</div>
                                        <div className="cell-email">{doc.owner_email}</div>
                                    </td>
                                    <td><MimeBadge mime={doc.mime_type} /></td>
                                    <td className="cell-size">{fmtSize(doc.file_size)}</td>
                                    <td><StatusBadge status={doc.status} /></td>
                                    <td className="cell-date">{fmtDate(doc.uploaded_at)}</td>
                                    <td className="cell-actions">
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
                    <div className="pagination-controls">
                        <button
                            disabled={filters.page <= 1}
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            id="prev-page-btn"
                        >← Prev</button>
                        <span>{filters.page} / {totalPages}</span>
                        <button
                            disabled={filters.page >= totalPages}
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            id="next-page-btn"
                        >Next →</button>
                    </div>
                </div>
            )}

            {/* Slide-over */}
            {activeDocId && (
                <DocumentDetail
                    docId={activeDocId}
                    onClose={() => setActiveDocId(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUserClick={handleUserClick}
                />
            )}
        </div>
    )
}
