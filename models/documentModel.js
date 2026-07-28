const pool = require('../db');

// ─── Admin Account Queries ───

const getAdminByEmail = async (email) => {
    const result = await pool.query(
        'SELECT * FROM admin_accounts WHERE email = $1',
        [email]
    );
    return result.rows[0];
};

const getAdminById = async (id) => {
    const result = await pool.query(
        'SELECT id, email, display_name, created_at FROM admin_accounts WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

// ─── Audit Log ───

const createAuditLog = async ({ actorType, actorId, action, targetType, targetId, details, ipAddress }) => {
    const result = await pool.query(
        'INSERT INTO audit_logs (actor_type, actor_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [actorType, actorId, action, targetType || null, targetId || null, details || null, ipAddress || null]
    );
    return result.rows[0];
};

// ─── Dashboard Stats ───

const getDocumentStats = async () => {
    const [total, pending, approved, rejected, archived] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM documents'),
        pool.query("SELECT COUNT(*)::int AS count FROM documents WHERE status = 'pending'"),
        pool.query("SELECT COUNT(*)::int AS count FROM documents WHERE status = 'approved'"),
        pool.query("SELECT COUNT(*)::int AS count FROM documents WHERE status = 'rejected'"),
        pool.query("SELECT COUNT(*)::int AS count FROM documents WHERE status = 'archived'"),
    ]);

    return {
        total: total.rows[0].count,
        pending: pending.rows[0].count,
        approved: approved.rows[0].count,
        rejected: rejected.rows[0].count,
        archived: archived.rows[0].count,
    };
};

const getCategoryBreakdown = async () => {
    const result = await pool.query(
        'SELECT category, COUNT(*)::int AS count FROM documents GROUP BY category ORDER BY count DESC'
    );
    return result.rows;
};

const getRecentActivity = async (limit = 8) => {
    const result = await pool.query(
        `SELECT al.*, aa.display_name AS admin_name
         FROM audit_logs al
         LEFT JOIN admin_accounts aa ON aa.id = al.actor_id AND al.actor_type = 'admin'
         ORDER BY al.created_at DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows;
};

// ─── Documents ───

const getAllDocuments = async ({ search, status, category, owner_id, mime_type, from, to, page, limit, sort, order }) => {
    const safeSort = ['uploaded_at', 'title', 'file_size', 'status', 'updated_at'].includes(sort) ? sort : 'uploaded_at';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    const params = [];
    const conditions = [];

    if (search) {
        params.push(search);
        conditions.push(`d.search_vector @@ plainto_tsquery('english', $${params.length})`);
    }
    if (status) {
        params.push(status);
        conditions.push(`d.status = $${params.length}`);
    }
    if (category) {
        params.push(category);
        conditions.push(`d.category = $${params.length}`);
    }
    if (owner_id) {
        params.push(parseInt(owner_id));
        conditions.push(`d.owner_id = $${params.length}`);
    }
    if (mime_type) {
        params.push(`${mime_type}%`);
        conditions.push(`d.mime_type ILIKE $${params.length}`);
    }
    if (from) {
        params.push(from);
        conditions.push(`d.uploaded_at >= $${params.length}`);
    }
    if (to) {
        params.push(to);
        conditions.push(`d.uploaded_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int AS count FROM documents d ${where}`;
    const countResult = await pool.query(countQuery, params);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const dataQuery = `
        SELECT d.*,
               a.email AS owner_email, a.display_name AS owner_name,
               u.name AS user_name, u.email AS user_email,
               aa.display_name AS reviewer_name
        FROM documents d
        LEFT JOIN accounts a ON a.id = d.owner_id
        LEFT JOIN users u ON u.id = d.user_id
        LEFT JOIN admin_accounts aa ON aa.id = d.reviewed_by
        ${where}
        ORDER BY d.${safeSort} ${safeOrder}
        LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(dataQuery, params);

    return {
        documents: result.rows,
        total: countResult.rows[0].count,
        page,
        limit
    };
};

const getDocumentById = async (id) => {
    const result = await pool.query(
        `SELECT d.*,
                a.email AS owner_email, a.display_name AS owner_name,
                u.name AS user_name, u.email AS user_email, u.role, u.department, u.phone,
                u.profile_image, u.gender, u.linkedin, u.join_date, u.bio, u.location,
                aa.display_name AS reviewer_name, aa.email AS reviewer_email
         FROM documents d
         LEFT JOIN accounts a ON a.id = d.owner_id
         LEFT JOIN users u ON u.id = d.user_id
         LEFT JOIN admin_accounts aa ON aa.id = d.reviewed_by
         WHERE d.id = $1`,
        [id]
    );
    return result.rows[0];
};

const updateDocumentStatus = async (id, { status, reviewedBy, reviewNote }) => {
    const result = await pool.query(
        `UPDATE documents
         SET status = $1, reviewed_by = $2, review_note = $3,
             reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, reviewedBy, reviewNote || null, id]
    );
    return result.rows[0];
};

const deleteDocument = async (id) => {
    const result = await pool.query(
        'DELETE FROM documents WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

const bulkDeleteDocuments = async (ids) => {
    const result = await pool.query(
        'DELETE FROM documents WHERE id = ANY($1::uuid[]) RETURNING *',
        [ids]
    );
    return result.rows;
};

// ─── Users ───

const getAllUsers = async ({ search, page, limit }) => {
    const params = [];
    let where = '';

    if (search) {
        params.push(`%${search}%`);
        where = `WHERE a.email ILIKE $1 OR a.display_name ILIKE $1 OR u.name ILIKE $1 OR u.email ILIKE $1`;
    }

    const countQuery = `
        SELECT COUNT(DISTINCT a.id)::int AS count
        FROM accounts a
        LEFT JOIN users u ON u.owner_id = a.id
        ${where}
    `;
    const countResult = await pool.query(countQuery, params);

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);

    const dataQuery = `
        SELECT a.id, a.email, a.display_name, a.is_active, a.created_at,
               COUNT(DISTINCT u.id)::int AS user_count,
               COUNT(DISTINCT d.id)::int AS doc_count
        FROM accounts a
        LEFT JOIN users u ON u.owner_id = a.id
        LEFT JOIN documents d ON d.owner_id = a.id
        ${where}
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(dataQuery, params);

    return {
        users: result.rows,
        total: countResult.rows[0].count,
        page,
        limit
    };
};

const getUserProfile = async (accountId) => {
    // Get account info + all their users
    const accountResult = await pool.query(
        `SELECT a.id, a.email, a.display_name, a.is_active, a.created_at
         FROM accounts a WHERE a.id = $1`,
        [accountId]
    );
    if (!accountResult.rows[0]) return null;

    const usersResult = await pool.query(
        `SELECT * FROM users WHERE owner_id = $1 ORDER BY id DESC`,
        [accountId]
    );

    const docsResult = await pool.query(
        `SELECT d.*, aa.display_name AS reviewer_name
         FROM documents d
         LEFT JOIN admin_accounts aa ON aa.id = d.reviewed_by
         WHERE d.owner_id = $1
         ORDER BY d.uploaded_at DESC`,
        [accountId]
    );

    return {
        account: accountResult.rows[0],
        users: usersResult.rows,
        documents: docsResult.rows
    };
};

module.exports = {
    getAdminByEmail,
    getAdminById,
    createAuditLog,
    getDocumentStats,
    getCategoryBreakdown,
    getRecentActivity,
    getAllDocuments,
    getDocumentById,
    updateDocumentStatus,
    deleteDocument,
    bulkDeleteDocuments,
    getAllUsers,
    getUserProfile
};
