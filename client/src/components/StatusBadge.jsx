export default function StatusBadge({ status, type = 'doc' }) {
    if (type === 'account') {
        return (
            <span className={`status-badge ${status ? 'badge-active' : 'badge-inactive'}`}>
                {status ? 'Active' : 'Inactive'}
            </span>
        )
    }

    const map = {
        pending:  'badge-pending',
        approved: 'badge-approved',
        rejected: 'badge-rejected',
        archived: 'badge-archived',
    }
    return (
        <span className={`status-badge ${map[status] || 'badge-archived'}`}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
        </span>
    )
}
