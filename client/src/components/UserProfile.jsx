import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import DocumentDetail from './DocumentDetail'

const API = import.meta.env.VITE_API_URL || ''

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtSize(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function Avatar({ name, src }) {
    if (src) {
        return (
            <div className="profile-avatar">
                <img src={src.startsWith('http') ? src : `${API.replace('/api', '')}/${src}`} alt={name} />
            </div>
        )
    }
    const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return <div className="profile-avatar">{initials}</div>
}

export default function UserProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeDocId, setActiveDocId] = useState(null)

    useEffect(() => {
        setLoading(true)
        fetch(`${API}/api/admin/users/${id}`, { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error()
                return r.json()
            })
            .then(data => { setProfile(data); setLoading(false) })
            .catch(() => { setError('User not found.'); setLoading(false) })
    }, [id])

    if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>
    if (error) return <div className="empty-state"><p>{error}</p></div>

    const { account, users, documents } = profile

    return (
        <div>
            <button className="back-link" onClick={() => navigate('/users')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Users
            </button>

            {/* Account header */}
            <div className="page-header">
                <div>
                    <h1>{account.display_name}</h1>
                    <p className="page-subtitle">{account.email}</p>
                </div>
                <div className="page-controls">
                    <StatusBadge status={account.is_active} type="account" />
                </div>
            </div>

            {/* User records */}
            {users.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>
                        Employee Records ({users.length})
                    </h2>
                    {users.map(user => (
                        <div key={user.id} className="user-entry">
                            <div className="user-entry-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <Avatar name={user.name} src={user.profile_image} />
                                    <div>
                                        <div className="user-entry-name">{user.name}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{user.email}</div>
                                    </div>
                                </div>
                                <StatusBadge status={user.status === 'Active'} type="account" />
                            </div>

                            <div className="user-entry-meta">
                                {user.role && <span>🎯 {user.role}</span>}
                                {user.department && <span>🏢 {user.department}</span>}
                                {user.location && <span>📍 {user.location}</span>}
                                {user.phone && <span>📞 {user.phone}</span>}
                                {user.gender && <span>{user.gender}</span>}
                                {user.join_date && <span>📅 Joined {fmtDate(user.join_date)}</span>}
                                {user.linkedin && (
                                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>
                                        LinkedIn ↗
                                    </a>
                                )}
                            </div>

                            {user.bio && (
                                <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                    {user.bio}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Documents */}
            <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>
                    Documents ({documents.length})
                </h2>
                {documents.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 20px' }}>
                        <p>No documents uploaded.</p>
                    </div>
                ) : (
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Size</th>
                                    <th>Status</th>
                                    <th>Uploaded</th>
                                    <th>Reviewer</th>
                                    <th className="cell-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.id}>
                                        <td className="cell-title">
                                            <span className="cell-name">{doc.title}</span>
                                        </td>
                                        <td>
                                            <span className="tag">{doc.category || 'general'}</span>
                                        </td>
                                        <td className="cell-size">{fmtSize(doc.file_size)}</td>
                                        <td><StatusBadge status={doc.status} /></td>
                                        <td className="cell-date">{fmtDate(doc.uploaded_at)}</td>
                                        <td className="cell-owner">{doc.reviewer_name || '—'}</td>
                                        <td className="cell-actions">
                                            <button
                                                id={`profile-view-doc-${doc.id}`}
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
                    </div>
                )}
            </div>

            {activeDocId && (
                <DocumentDetail
                    docId={activeDocId}
                    onClose={() => setActiveDocId(null)}
                    onStatusChange={(updated) => {
                        setProfile(prev => ({
                            ...prev,
                            documents: prev.documents.map(d => d.id === updated.id ? { ...d, ...updated } : d)
                        }))
                    }}
                    onDelete={(docId) => {
                        setProfile(prev => ({
                            ...prev,
                            documents: prev.documents.filter(d => d.id !== docId)
                        }))
                        setActiveDocId(null)
                    }}
                />
            )}
        </div>
    )
}
