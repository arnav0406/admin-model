const bcrypt = require('bcrypt');
const documentModel = require('../models/documentModel');
const { setAdminCookie, clearAdminCookie } = require('../middleware/adminAuth');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const admin = await documentModel.getAdminByEmail(email);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!admin.is_active) {
            return res.status(403).json({ error: 'This admin account has been deactivated.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        setAdminCookie(res, admin.id);

        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: admin.id,
            action: 'admin_login',
            details: `Admin "${admin.display_name}" logged in to Doc CMS`,
            ipAddress: req.ip
        });

        res.json({
            id: admin.id,
            email: admin.email,
            displayName: admin.display_name
        });
    } catch (err) {
        console.error('Admin login error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
};

const logout = async (req, res) => {
    if (req.adminId) {
        await documentModel.createAuditLog({
            actorType: 'admin',
            actorId: req.adminId,
            action: 'admin_logout',
            ipAddress: req.ip
        }).catch(() => {});
    }

    clearAdminCookie(res);
    res.json({ message: 'Logged out.' });
};

const getMe = async (req, res) => {
    try {
        const admin = await documentModel.getAdminById(req.adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin account not found.' });
        }
        res.json({
            id: admin.id,
            email: admin.email,
            displayName: admin.display_name
        });
    } catch (err) {
        console.error('Admin getMe error:', err.message);
        res.status(500).json({ error: 'Failed to fetch admin account.' });
    }
};

module.exports = { login, logout, getMe };
