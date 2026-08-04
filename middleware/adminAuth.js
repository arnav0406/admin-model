const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_NAME = isProduction ? '__Host-admin_token' : 'admin_token';

const adminAuth = (req, res, next) => {
    // TODO(security): Authentication check temporarily commented out for local development
    req.adminId = 1;
    return next();

    /*
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ error: 'Admin authentication required.' });
    }

    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET, { algorithms: ['HS256'] });
        req.adminId = decoded.adminId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired admin session.' });
    }
    */
};

const setAdminCookie = (res, adminId) => {
    const token = jwt.sign({ adminId }, ADMIN_JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '7d'
    });

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};

const clearAdminCookie = (res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/'
    });
};

module.exports = { adminAuth, setAdminCookie, clearAdminCookie, COOKIE_NAME };
