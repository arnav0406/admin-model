import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import apiFetch from '../lib/api'

export default function Layout({ admin, children }) {
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1')
    const [mobileOpen, setMobileOpen] = useState(false)
    const [pendingCount, setPendingCount] = useState(null)

    // Persist collapse state
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
    }, [collapsed])

    // Fetch pending count for badge
    useEffect(() => {
        apiFetch('/api/admin/stats')
            .then(d => setPendingCount(d?.stats?.pending ?? null))
            .catch(() => {})
    }, [])

    const handleLogout = async () => {
        await apiFetch('/api/admin/auth/logout', { method: 'POST' })
        navigate('/login')
    }

    const closeMobile = () => setMobileOpen(false)

    return (
        <div className="admin-layout">
            {/* Mobile top bar */}
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <div className="sidebar-title">Doc CMS</div>
            </div>

            {/* Mobile backdrop */}
            {mobileOpen && <div className="sidebar-backdrop visible" onClick={closeMobile} />}

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="sidebar-title">Doc CMS</div>
                            <div className="sidebar-subtitle">e-Office Documents</div>
                        </div>
                    )}
                    <button
                        className="sidebar-collapse-btn"
                        onClick={() => { setCollapsed(c => !c); setMobileOpen(false) }}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span className="nav-link-text">Dashboard</span>
                    </NavLink>

                    {!collapsed && <div className="nav-section-label">Documents</div>}

                    <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span className="nav-link-text">All Documents</span>
                    </NavLink>

                    <NavLink to="/documents?status=pending" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span className="nav-link-text">Pending Review</span>
                        {pendingCount > 0 && <span className="pending-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}
                    </NavLink>

                    {!collapsed && <div className="nav-section-label">People</div>}

                    <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span className="nav-link-text">Users &amp; Accounts</span>
                    </NavLink>

                    {!collapsed && <div className="nav-section-label">System</div>}

                    <NavLink to="/audit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span className="nav-link-text">Audit Log</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-info">
                        <div className="admin-avatar">{admin?.displayName?.[0] || 'A'}</div>
                        {!collapsed && (
                            <div>
                                <div className="admin-name">{admin?.displayName}</div>
                                <div className="admin-email">{admin?.email}</div>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="sidebar-footer-actions">
                            <ThemeToggle showLabel className="sidebar-theme-toggle" />
                            <button id="logout-btn" className="btn-logout-sidebar" onClick={handleLogout}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <main className={`admin-main ${collapsed ? 'sidebar-collapsed-main' : ''}`}>
                {children}
            </main>
        </div>
    )
}
