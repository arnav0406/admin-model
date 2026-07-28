import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

export default function ProtectedRoute({ children }) {
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
}
