import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const actionConfig = {
    admin_login:       { label: 'Admin Login',        color: 'var(--accent)' },
    admin_logout:      { label: 'Admin Logout',       color: 'var(--muted)' },
    document_approved: { label: 'Approved',           color: 'var(--green)' },
    document_rejected: { label: 'Rejected',           color: 'var(--red)' },
    document_archived: { label: 'Archived',           color: 'var(--gray)' },
    document_pending:  { label: 'Reverted to Pending',color: 'var(--yellow)' },
    document_delete:   { label: 'Deleted',            color: 'var(--red)' },
    document_bulk_delete: { label: 'Bulk Delete',     color: 'var(--red)' },
}

const fmtDate = (d) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
        ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API}/api/admin/stats`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>

    const stats = data?.stats || {}
    const categories = data?.categories || []
    const activity = data?.recentActivity || []
    const maxCat = categories[0]?.count || 1

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">Document management overview</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon icon-total">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{stats.total ?? 0}</div>
                        <div className="stat-label">Total Documents</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-pending">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{stats.pending ?? 0}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-approved">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{stats.approved ?? 0}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-rejected">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{stats.rejected ?? 0}</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-archived">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                            <line x1="10" y1="12" x2="14" y2="12"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{stats.archived ?? 0}</div>
                        <div className="stat-label">Archived</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-bottom">
                <div className="section-card">
                    <div className="section-card-header">
                        <h2>Recent Activity</h2>
                    </div>
                    {activity.length === 0 ? (
                        <div className="empty-state"><p>No recent activity.</p></div>
                    ) : (
                        <div className="activity-list">
                            {activity.map(log => {
                                const cfg = actionConfig[log.action] || { label: log.action, color: 'var(--muted)' }
                                return (
                                    <div key={log.id} className="activity-item">
                                        <div className="activity-dot" style={{ background: cfg.color }} />
                                        <div className="activity-details">
                                            <div className="activity-action">{cfg.label}</div>
                                            <div className="activity-desc">{log.details || '—'}</div>
                                            <div className="activity-time">{fmtDate(log.created_at)}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="section-card">
                    <div className="section-card-header">
                        <h2>By Category</h2>
                    </div>
                    {categories.length === 0 ? (
                        <div className="empty-state"><p>No documents yet.</p></div>
                    ) : (
                        <div className="category-list">
                            {categories.map(cat => (
                                <div key={cat.category} className="category-row">
                                    <span className="category-name">{cat.category}</span>
                                    <div className="category-bar-wrap">
                                        <div
                                            className="category-bar"
                                            style={{ width: `${Math.round((cat.count / maxCat) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="category-count">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
