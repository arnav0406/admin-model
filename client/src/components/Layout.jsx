import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const API = import.meta.env.VITE_API_URL || ''

function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)admin_csrf_token=([^;]*)/)
    return match ? match[1] : ''
}

export default function Layout({ admin, children }) {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await fetch(`${API}/api/admin/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'x-csrf-token': getCsrfToken() }
        })
        navigate('/login')
    }

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div>
                        <div className="sidebar-title">Doc CMS</div>
                        <div className="sidebar-subtitle">e-Office Documents</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        Dashboard
                    </NavLink>

                    <div className="nav-section-label">Documents</div>

                    <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        All Documents
                    </NavLink>

                    <NavLink to="/documents?status=pending" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Pending Review
                    </NavLink>

                    <div className="nav-section-label">People</div>

                    <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Users &amp; Accounts
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-info">
                        <div className="admin-avatar">{admin?.displayName?.[0] || 'A'}</div>
                        <div>
                            <div className="admin-name">{admin?.displayName}</div>
                            <div className="admin-email">{admin?.email}</div>
                        </div>
                    </div>
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
                </div>
            </aside>

            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}
