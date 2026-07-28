const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { adminAuth } = require('../middleware/adminAuth');

router.post('/login', adminAuthController.login);
router.post('/logout', adminAuth, adminAuthController.logout);
router.get('/me', adminAuth, adminAuthController.getMe);

module.exports = router;
