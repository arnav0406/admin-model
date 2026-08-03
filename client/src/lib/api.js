const API = import.meta.env.VITE_API_URL || ''

function getCsrf() {
    const m = document.cookie.match(/(?:^|;\s*)admin_csrf_token=([^;]*)/)
    return m ? m[1] : ''
}

export async function apiFetch(path, opts = {}) {
    const method = opts.method?.toUpperCase() || 'GET'
    const isStateMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)

    const res = await fetch(`${API}${path}`, {
        credentials: 'include',
        headers: {
            ...(isStateMutating ? { 'x-csrf-token': getCsrf() } : {}),
            ...opts.headers,
        },
        ...opts,
    })

    if (res.status === 401) {
        window.location.href = '/login'
        throw new Error('Unauthorized')
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
    }

    return res.json()
}

export function buildUrl(path, params = {}) {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v) })
    const qs = p.toString()
    return qs ? `${path}?${qs}` : path
}

export { getCsrf }
export default apiFetch
