const path = require('path');
const fs = require('fs');
const documentModel = require('../models/documentModel');

const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');

// ─── Dashboard ───

const getStats = async (req, res) => {
    try {
        const [stats, categories, recentActivity] = await Promise.all([
            documentModel.getDocumentStats(),
            documentModel.getCategoryBreakdown(),
            documentModel.getRecentActivity(8)
        ]);
        res.json({ stats, categories, recentActivity });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.status(500).json({ error: 'Failed to fetch statistics.' });
    }
};

// ─── Documents ───

const listDocuments = async (req, res) => {
    try {
        const {
            search = '', status = '', category = '', owner_id = '',
            mime_type = '', from = '', to = '',
            page = '1', limit = '20',
            sort = 'uploaded_at', order = 'desc'
        } = req.query;

        const parsedPage = Math.max(Number(page) || 1, 1);
        const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

        const data = await documentModel.getAllDocuments({
            search, status, category, owner_id, mime_type, from, to,
            page: parsedPage, limit: parsedLimit, sort, order
        });
        res.json(data);
    } catch (err) {
        console.error('List documents error:', err.message);
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
};

const getDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await documentModel.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        console.error('Get document error:', err.message);
        res.status(500).json({ error: 'Failed to fetch document.' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, review_note } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const existing = await documentModel.getDocumentById(id);
        if (!existing) return res.status(404).json({ error: 'Document not found.' });

        const updated = await documentModel.updateDocumentStatus(id, {
            status,
            reviewedBy: req.adminId,
            reviewNote: review_note
        });

        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: req.adminId,
            action: `document_${status}`,
            targetType: 'document',
            targetId: null,
            details: `Document "${existing.title}" marked as ${status}. ${review_note ? `Note: ${review_note}` : ''}`.trim(),
            ipAddress: req.ip
        });

        res.json(updated);
    } catch (err) {
        console.error('Update status error:', err.message);
        res.status(500).json({ error: 'Failed to update document status.' });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await documentModel.getDocumentById(id);
        if (!existing) return res.status(404).json({ error: 'Document not found.' });

        const deleted = await documentModel.deleteDocument(id);

        // Attempt to remove the file from disk (non-fatal)
        try {
            const filePath = path.join(UPLOADS_PATH, existing.file_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (fileErr) {
            console.warn('Could not delete file from disk:', fileErr.message);
        }

        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: req.adminId,
            action: 'document_delete',
            targetType: 'document',
            targetId: null,
            details: `Deleted document "${existing.title}" (${existing.file_name})`,
            ipAddress: req.ip
        });

        res.json({ message: 'Document deleted.', document: deleted });
    } catch (err) {
        console.error('Delete document error:', err.message);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
};

const bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids must be a non-empty array.' });
        }

        const deleted = await documentModel.bulkDeleteDocuments(ids);

        // Delete files from disk (non-fatal per file)
        for (const doc of deleted) {
            try {
                const filePath = path.join(UPLOADS_PATH, doc.file_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (fileErr) {
                console.warn('Could not delete file:', fileErr.message);
            }
        }

        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: req.adminId,
            action: 'document_bulk_delete',
            details: `Bulk deleted ${deleted.length} document(s)`,
            ipAddress: req.ip
        });

        res.json({ message: `${deleted.length} document(s) deleted.`, deleted });
    } catch (err) {
        console.error('Bulk delete error:', err.message);
        res.status(500).json({ error: 'Failed to bulk delete documents.' });
    }
};

const bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'archived'];

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids must be a non-empty array.' });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const updated = await documentModel.bulkUpdateDocumentStatus(ids, status, req.adminId);

        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: req.adminId,
            action: `document_bulk_${status}`,
            details: `Bulk marked ${updated.length} document(s) as ${status}`,
            ipAddress: req.ip
        });

        res.json({ message: `${updated.length} document(s) updated.`, updated });
    } catch (err) {
        console.error('Bulk status update error:', err.message);
        res.status(500).json({ error: 'Failed to bulk update document status.' });
    }
};

const exportDocuments = async (req, res) => {
    try {
        const { search = '', status = '', category = '', owner_id = '', mime_type = '', from = '', to = '' } = req.query;
        const docs = await documentModel.getAllDocumentsFlat({ search, status, category, owner_id, mime_type, from, to });

        const escape = (v) => {
            if (v == null) return '';
            const s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };

        const headers = ['ID', 'Title', 'Description', 'Category', 'Status', 'File Name', 'File Size (bytes)', 'MIME Type', 'Owner Name', 'Owner Email', 'Reviewer', 'Uploaded At', 'Review Note'];
        const rows = docs.map(d => [
            d.id, d.title, d.description, d.category, d.status, d.file_name, d.file_size,
            d.mime_type, d.owner_name, d.owner_email, d.reviewer_name,
            d.uploaded_at ? new Date(d.uploaded_at).toISOString() : '',
            d.review_note
        ].map(escape).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const filename = `documents-export-${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    } catch (err) {
        console.error('Export error:', err.message);
        res.status(500).json({ error: 'Failed to export documents.' });
    }
};

const getAuditLog = async (req, res) => {
    try {
        const { page = '1', limit = '30', action = '' } = req.query;
        const parsedPage = Math.max(Number(page) || 1, 1);
        const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
        const data = await documentModel.getAuditLogs({ page: parsedPage, limit: parsedLimit, action });
        res.json(data);
    } catch (err) {
        console.error('Audit log error:', err.message);
        res.status(500).json({ error: 'Failed to fetch audit log.' });
    }
};

const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await documentModel.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Document not found.' });

        const filePath = path.join(UPLOADS_PATH, doc.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk.' });
        }

        // Path traversal guard
        const resolvedPath = path.resolve(filePath);
        const resolvedUploads = path.resolve(UPLOADS_PATH);
        if (!resolvedPath.startsWith(resolvedUploads)) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
        res.setHeader('Content-Type', doc.mime_type);

        const stream = fs.createReadStream(resolvedPath);
        stream.pipe(res);
    } catch (err) {
        console.error('Download error:', err.message);
        res.status(500).json({ error: 'Failed to stream file.' });
    }
};

// ─── Users ───

const listUsers = async (req, res) => {
    try {
        const { search = '', page = '1', limit = '20' } = req.query;
        const parsedPage = Math.max(Number(page) || 1, 1);
        const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

        const data = await documentModel.getAllUsers({ search, page: parsedPage, limit: parsedLimit });
        res.json(data);
    } catch (err) {
        console.error('List users error:', err.message);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID.' });

        const profile = await documentModel.getUserProfile(id);
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        res.json(profile);
    } catch (err) {
        console.error('User profile error:', err.message);
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
};

module.exports = {
    getStats,
    listDocuments,
    getDocument,
    updateStatus,
    deleteDocument,
    bulkDelete,
    bulkUpdateStatus,
    exportDocuments,
    downloadDocument,
    listUsers,
    getUserProfile,
    getAuditLog
};
