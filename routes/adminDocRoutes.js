const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const dc = require('../controllers/documentController');

// Dashboard
router.get('/stats', adminAuth, dc.getStats);

// Audit log
router.get('/audit', adminAuth, dc.getAuditLog);

// Documents — export before :id routes to avoid param capture
router.get('/documents/export', adminAuth, dc.exportDocuments);
router.get('/documents', adminAuth, dc.listDocuments);
router.get('/documents/:id/download', adminAuth, dc.downloadDocument);
router.get('/documents/:id', adminAuth, dc.getDocument);
router.patch('/documents/bulk-status', adminAuth, dc.bulkUpdateStatus);
router.patch('/documents/:id/status', adminAuth, dc.updateStatus);
router.delete('/documents/bulk', adminAuth, dc.bulkDelete);
router.delete('/documents/:id', adminAuth, dc.deleteDocument);

// Users
router.get('/users', adminAuth, dc.listUsers);
router.get('/users/:id', adminAuth, dc.getUserProfile);

module.exports = router;
