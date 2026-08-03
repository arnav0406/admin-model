import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import apiFetch from '../lib/api'

const API = import.meta.env.VITE_API_URL || ''

const actionConfig = {
    admin_login:             { label: 'Admin Login',         color: 'var(--accent)' },
    admin_logout:            { label: 'Admin Logout',        color: 'var(--muted)' },
    document_approved:       { label: 'Approved',            color: 'var(--green)' },
    document_rejected:       { label: 'Rejected',            color: 'var(--red)' },
    document_archived:       { label: 'Archived',            color: 'var(--gray)' },
    document_pending:        { label: 'Reverted to Pending', color: 'var(--yellow)' },
    document_delete:         { label: 'Deleted',             color: 'var(--red)' },
    document_bulk_delete:    { label: 'Bulk Delete',         color: 'var(--red)' },
    document_bulk_approved:  { label: 'Bulk Approved',       color: 'var(--green)' },
    document_bulk_rejected:  { label: 'Bulk Rejected',       color: 'var(--red)' },
}

const fmtDate = (d) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
        ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// Animated count-up hook
function useCountUp(target, duration = 700) {
    const [value, setValue] = useState(0)
    const rafRef = useRef(null)
    useEffect(() => {
        if (target == null) return
        const start = Date.now()
        const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setValue(Math.round(eased * target))
            if (progress < 1) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [target, duration])
    return value
}

// SVG Donut chart
function DonutChart({ segments, size = 120, strokeWidth = 18 }) {
    const r = (size - strokeWidth) / 2
    const circ = 2 * Math.PI * r
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1

    let offset = 0
    const arcs = segments.map((seg) => {
        const dash = (seg.value / total) * circ
        const arc = { ...seg, dash, gap: circ - dash, offset }
        offset += dash
        return arc
    })

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
            {arcs.map((arc, i) => arc.value > 0 && (
                <circle
                    key={i}
                    cx={size/2} cy={size/2} r={r}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arc.dash} ${arc.gap}`}
                    strokeDashoffset={-arc.offset}
                    strokeLinecap="butt"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
            ))}
        </svg>
    )
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = () => {
        apiFetch('/api/admin/stats')
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchData()
        // Refresh on tab focus
        const onFocus = () => fetchData()
        document.addEventListener('visibilitychange', onFocus)
        return () => document.removeEventListener('visibilitychange', onFocus)
    }, [])

    const stats = data?.stats || {}
    const categories = data?.categories || []
    const activity = data?.recentActivity || []
    const maxCat = categories[0]?.count || 1

    // Count-up values
    const total    = useCountUp(loading ? null : (stats.total ?? 0))
    const pending  = useCountUp(loading ? null : (stats.pending ?? 0))
    const approved = useCountUp(loading ? null : (stats.approved ?? 0))
    const rejected = useCountUp(loading ? null : (stats.rejected ?? 0))
    const archived = useCountUp(loading ? null : (stats.archived ?? 0))

    const donutSegments = [
        { label: 'Pending',  value: stats.pending  ?? 0, color: 'var(--yellow)' },
        { label: 'Approved', value: stats.approved ?? 0, color: 'var(--green)' },
        { label: 'Rejected', value: stats.rejected ?? 0, color: 'var(--red)' },
        { label: 'Archived', value: stats.archived ?? 0, color: 'var(--gray)' },
    ]

    if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">Document management overview</p>
                </div>
            </div>

            {/* Pending alert */}
            {stats.pending > 0 && (
                <div className="pending-alert">
                    <span className="pending-alert-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </span>
                    <span className="pending-alert-text">
                        <strong>{stats.pending} document{stats.pending !== 1 ? 's' : ''}</strong> awaiting review
                    </span>
                    <Link to="/documents?status=pending" className="pending-alert-link">Review now →</Link>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon icon-total">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div>
                        <div className="stat-value">{total}</div>
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
                        <div className="stat-value">{pending}</div>
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
                        <div className="stat-value">{approved}</div>
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
                        <div className="stat-value">{rejected}</div>
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
                        <div className="stat-value">{archived}</div>
                        <div className="stat-label">Archived</div>
                    </div>
                </div>
            </div>

            {/* Charts row */}
            <div className="dashboard-charts">
                <div className="chart-card">
                    <div className="chart-card-header"><h2>Status Distribution</h2></div>
                    <div className="donut-wrap">
                        <DonutChart segments={donutSegments} size={130} strokeWidth={20} />
                        <div className="donut-legend">
                            {donutSegments.map(s => (
                                <div key={s.label} className="donut-legend-item">
                                    <div className="donut-dot" style={{ background: s.color }} />
                                    <span className="donut-legend-label">{s.label}</span>
                                    <span className="donut-legend-value">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card-header"><h2>By Category</h2></div>
                    {categories.length === 0 ? (
                        <div className="empty-state"><p>No documents yet.</p></div>
                    ) : (
                        <div className="category-list">
                            {categories.map(cat => (
                                <div key={cat.category} className="category-row">
                                    <span className="category-name">{cat.category}</span>
                                    <div className="category-bar-wrap">
                                        <div className="category-bar" style={{ width: `${Math.round((cat.count / maxCat) * 100)}%` }} />
                                    </div>
                                    <span className="category-count">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-bottom">
                <div className="section-card">
                    <div className="section-card-header"><h2>Recent Activity</h2></div>
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
                        <h2>Recent Activity (Full)</h2>
                        <Link to="/audit" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                            View All →
                        </Link>
                    </div>
                    {activity.length === 0 ? (
                        <div className="empty-state"><p>No recent activity.</p></div>
                    ) : (
                        <div className="activity-list">
                            {activity.slice(0, 5).map(log => {
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
            </div>
        </div>
    )
}
