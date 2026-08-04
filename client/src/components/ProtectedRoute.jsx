import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

const dummyAdmin = { id: 1, username: 'Admin User', role: 'admin' }

export default function ProtectedRoute({ children }) {
    // TODO(security): Authentication bypass enabled for local development
    return children(dummyAdmin)

    /*
    const [admin, setAdmin] = useState(null)
    const [checking, setChecking] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`${API}/api/admin/auth/me`, { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error()
                return r.json()
            })
            .then(data => { setAdmin(data); setChecking(false) })
            .catch(() => { navigate('/login'); setChecking(false) })
    }, [navigate])

    if (checking) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
            </div>
        )
    }

    return admin ? children(admin) : null
    */
}
