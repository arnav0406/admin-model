import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import apiFetch from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'

function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsersTable() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const limit = 20

    const debouncedSearch = useDebounce(search, 350)

    // Sync to URL
    useEffect(() => {
        const params = {}
        if (debouncedSearch) params.search = debouncedSearch
        if (page > 1) params.page = page
        setSearchParams(params, { replace: true })
    }, [debouncedSearch, page, setSearchParams])

    useEffect(() => {
        setLoading(true)
        const params = new URLSearchParams({ page, limit })
        if (debouncedSearch) params.set('search', debouncedSearch)
        apiFetch(`/api/admin/users?${params}`)
            .then(data => {
                setUsers(data.users || [])
                setTotal(data.total || 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [debouncedSearch, page])

    // Reset page on search change
    useEffect(() => { setPage(1) }, [debouncedSearch])

    const totalPages = Math.ceil(total / limit)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Users &amp; Accounts</h1>
                    <p className="page-subtitle">{total} account{total !== 1 ? 's' : ''}</p>
                </div>
                <div className="page-controls">
                    <input
                        id="users-search-input"
                        type="search"
                        className="search-input"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="data-table-wrap">
                {loading ? (
                    <div className="page-loading"><div className="loading-spinner" /></div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <p>No accounts found.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Email</th>
                                <th>Users</th>
                                <th>Documents</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th className="cell-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)}>
                                    <td>
                                        <span className="cell-name">{user.display_name}</span>
                                    </td>
                                    <td><span className="cell-email">{user.email}</span></td>
                                    <td>
                                        <span className="count-badge" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
                                            {user.user_count}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="count-badge">{user.doc_count}</span>
                                    </td>
                                    <td><StatusBadge status={user.is_active} type="account" /></td>
                                    <td className="cell-date">{fmtDate(user.created_at)}</td>
                                    <td className="cell-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            id={`view-user-${user.id}`}
                                            className="btn btn-ghost"
                                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                            onClick={() => navigate(`/users/${user.id}`)}
                                        >
                                            Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {total > limit && (
                <div className="pagination">
                    <span className="pagination-info">
                        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
                    </span>
                    <div className="pagination-controls">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} id="users-prev-btn">← Prev</button>
                        <span>{page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} id="users-next-btn">Next →</button>
                    </div>
                </div>
            )}
        </div>
    )
}
