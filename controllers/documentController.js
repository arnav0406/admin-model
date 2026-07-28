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
    downloadDocument,
    listUsers,
    getUserProfile
};
