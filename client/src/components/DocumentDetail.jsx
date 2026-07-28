import { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'

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
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function MimeBadge({ mime }) {
    if (!mime) return null
    if (mime.includes('pdf')) return <span className="mime-badge mime-pdf">PDF</span>
    if (mime.startsWith('image/')) return <span className="mime-badge mime-img">Image</span>
    return <span className="mime-badge mime-other">{mime.split('/')[1]?.toUpperCase() || 'File'}</span>
}

export default function DocumentDetail({ docId, onClose, onStatusChange, onDelete, onUserClick }) {
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reviewNote, setReviewNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!docId) return
        setLoading(true)
        setError('')
        fetch(`${API}/api/admin/documents/${docId}`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                setDoc(d)
                setReviewNote(d.review_note || '')
                setLoading(false)
            })
            .catch(() => { setError('Failed to load document.'); setLoading(false) })
    }, [docId])

    const updateStatus = async (status) => {
        setSaving(true)
        setError('')
        try {
            const res = await fetch(`${API}/api/admin/documents/${docId}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrf()
                },
                body: JSON.stringify({ status, review_note: reviewNote })
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Failed to update.'); setSaving(false); return }
            setDoc(prev => ({ ...prev, ...data }))
            onStatusChange && onStatusChange(data)
        } catch {
            setError('Network error.')
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm(`Delete "${doc?.title}"? This cannot be undone.`)) return
        setSaving(true)
        try {
            const res = await fetch(`${API}/api/admin/documents/${docId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'x-csrf-token': getCsrf() }
            })
            if (!res.ok) { setError('Delete failed.'); setSaving(false); return }
            onDelete && onDelete(docId)
            onClose()
        } catch {
            setError('Network error.')
        }
        setSaving(false)
    }

    const handleDownload = () => {
        window.open(`${API}/api/admin/documents/${docId}/download`, '_blank')
    }

    return (
        <>
            <div className="slideover-backdrop" onClick={onClose} />
            <div className="slideover" role="dialog" aria-label="Document Detail">
                <div className="slideover-header">
                    <h2>Document Detail</h2>
                    <button id="slideover-close-btn" className="btn-close" onClick={onClose} aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div className="slideover-body">
                    {loading && <div className="page-loading"><div className="loading-spinner" /></div>}
                    {error && <div className="login-error">{error}</div>}

                    {doc && !loading && (
                        <>
                            {/* File info */}
                            <div className="detail-section">
                                <div className="detail-section-title">File</div>
                                <div className="detail-grid">
                                    <div className="detail-field full">
                                        <label>Title</label>
                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{doc.title}</span>
                                    </div>
                                    <div className="detail-field full">
                                        <label>Description</label>
                                        <span style={{ color: 'var(--text2)' }}>{doc.description || '—'}</span>
                                    </div>
                                    <div className="detail-field">
                                        <label>File Name</label>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{doc.file_name}</span>
                                    </div>
                                    <div className="detail-field">
                                        <label>Size</label>
                                        <span>{fmtSize(doc.file_size)}</span>
                                    </div>
                                    <div className="detail-field">
                                        <label>Type</label>
                                        <MimeBadge mime={doc.mime_type} />
                                    </div>
                                    <div className="detail-field">
                                        <label>Category</label>
                                        <span className="tag">{doc.category || 'general'}</span>
                                    </div>
                                    <div className="detail-field">
                                        <label>Status</label>
                                        <StatusBadge status={doc.status} />
                                    </div>
                                    <div className="detail-field">
                                        <label>Uploaded</label>
                                        <span>{fmtDate(doc.uploaded_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Owner/User */}
                            <div className="detail-section">
                                <div className="detail-section-title">Owner</div>
                                <div className="detail-grid">
                                    <div className="detail-field">
                                        <label>Account</label>
                                        <span>
                                            {doc.owner_id && onUserClick ? (
                                                <button className="link-text" onClick={() => onUserClick(doc.owner_id)}>
                                                    {doc.owner_name || doc.owner_email}
                                                </button>
                                            ) : (doc.owner_name || '—')}
                                        </span>
                                    </div>
                                    <div className="detail-field">
                                        <label>Account Email</label>
                                        <span>{doc.owner_email || '—'}</span>
                                    </div>
                                    {doc.user_name && (
                                        <>
                                            <div className="detail-field">
                                                <label>User Record</label>
                                                <span>{doc.user_name}</span>
                                            </div>
                                            <div className="detail-field">
                                                <label>User Email</label>
                                                <span>{doc.user_email || '—'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Review */}
                            <div className="detail-section">
                                <div className="detail-section-title">Review</div>
                                {doc.reviewed_at && (
                                    <div className="detail-grid" style={{ marginBottom: 12 }}>
                                        <div className="detail-field">
                                            <label>Reviewed By</label>
                                            <span>{doc.reviewer_name || '—'}</span>
                                        </div>
                                        <div className="detail-field">
                                            <label>Reviewed At</label>
                                            <span>{fmtDate(doc.reviewed_at)}</span>
                                        </div>
                                        {doc.review_note && (
                                            <div className="detail-field full">
                                                <label>Previous Note</label>
                                                <span style={{ color: 'var(--text2)' }}>{doc.review_note}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                                        Review Note
                                    </label>
                                    <textarea
                                        id="review-note-input"
                                        className="review-note-input"
                                        placeholder="Add a note for the owner (optional)…"
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {doc && (
                    <div className="slideover-footer">
                        <button
                            id="btn-approve"
                            className="btn btn-success"
                            onClick={() => updateStatus('approved')}
                            disabled={saving || doc.status === 'approved'}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Approve
                        </button>
                        <button
                            id="btn-reject"
                            className="btn btn-danger"
                            onClick={() => updateStatus('rejected')}
                            disabled={saving || doc.status === 'rejected'}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Reject
                        </button>
                        <button
                            id="btn-archive"
                            className="btn btn-ghost"
                            onClick={() => updateStatus('archived')}
                            disabled={saving || doc.status === 'archived'}
                        >Archive</button>
                        <button
                            id="btn-download"
                            className="btn btn-ghost"
                            onClick={handleDownload}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download
                        </button>
                        <button
                            id="btn-delete-doc"
                            className="btn btn-danger"
                            style={{ marginLeft: 'auto' }}
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
