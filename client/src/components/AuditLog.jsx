import { useState, useEffect } from 'react'
import apiFetch from '../lib/api'

const actionConfig = {
    admin_login:             { label: 'Admin Login',        color: 'var(--accent)' },
    admin_logout:            { label: 'Admin Logout',       color: 'var(--muted)' },
    document_approved:       { label: 'Approved',           color: 'var(--green)' },
    document_rejected:       { label: 'Rejected',           color: 'var(--red)' },
    document_archived:       { label: 'Archived',           color: 'var(--gray)' },
    document_pending:        { label: 'Reverted to Pending',color: 'var(--yellow)' },
    document_delete:         { label: 'Deleted',            color: 'var(--red)' },
    document_bulk_delete:    { label: 'Bulk Delete',        color: 'var(--red)' },
    document_bulk_approved:  { label: 'Bulk Approved',      color: 'var(--green)' },
    document_bulk_rejected:  { label: 'Bulk Rejected',      color: 'var(--red)' },
}

const ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'admin_login', label: 'Admin Login' },
    { value: 'admin_logout', label: 'Admin Logout' },
    { value: 'document_approved', label: 'Document Approved' },
    { value: 'document_rejected', label: 'Document Rejected' },
    { value: 'document_archived', label: 'Document Archived' },
    { value: 'document_delete', label: 'Document Deleted' },
    { value: 'document_bulk_delete', label: 'Bulk Delete' },
    { value: 'document_bulk_approved', label: 'Bulk Approved' },
    { value: 'document_bulk_rejected', label: 'Bulk Rejected' },
]

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

export default function AuditLog() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [action, setAction] = useState('')
    const [loading, setLoading] = useState(true)
    const limit = 30

    useEffect(() => {
        setLoading(true)
        apiFetch(`/api/admin/audit?page=${page}&limit=${limit}${action ? `&action=${action}` : ''}`)
            .then(data => { setLogs(data.logs || []); setTotal(data.total || 0); setLoading(false) })
            .catch(() => setLoading(false))
    }, [page, action])

    useEffect(() => { setPage(1) }, [action])

    const totalPages = Math.ceil(total / limit)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Audit Log</h1>
                    <p className="page-subtitle">{total} events recorded</p>
                </div>
                <div className="page-controls">
                    <select
                        id="audit-action-filter"
                        className="filter-select"
                        value={action}
                        onChange={e => setAction(e.target.value)}
                    >
                        {ACTION_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="loading-spinner" /></div>
            ) : logs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    </div>
                    <p>No audit events found.</p>
                </div>
            ) : (
                <div className="audit-timeline">
                    {logs.map(log => {
                        const cfg = actionConfig[log.action] || { label: log.action, color: 'var(--muted)' }
                        return (
                            <div key={log.id} className="audit-item">
                                <div className="audit-dot" style={{ background: cfg.color }} />
                                <div className="audit-line" />
                                <div className="audit-card">
                                    <div className="audit-card-top">
                                        <span className="audit-action-label" style={{ color: cfg.color }}>{cfg.label}</span>
                                        <span className="audit-time">{fmtDate(log.created_at)}</span>
                                    </div>
                                    {log.details && <div className="audit-details">{log.details}</div>}
                                    <div className="audit-meta">
                                        {log.admin_name && <span>By: <strong>{log.admin_name}</strong></span>}
                                        {log.ip_address && <span>IP: <code>{log.ip_address}</code></span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {total > limit && (
                <div className="pagination" style={{ marginTop: 24 }}>
                    <span className="pagination-info">
                        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
                    </span>
                    <div className="pagination-controls">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} id="audit-prev-btn">← Prev</button>
                        <span>{page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} id="audit-next-btn">Next →</button>
                    </div>
                </div>
            )}
        </div>
    )
}
