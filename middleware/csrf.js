const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';
const CSRF_COOKIE = 'admin_csrf_token';
const CSRF_HEADER = 'x-csrf-token';

const setCsrfCookie = (req, res, next) => {
    if (!req.cookies[CSRF_COOKIE]) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE, token, {
            httpOnly: false,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    }
    next();
};

const validateCsrf = (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken) {
        return res.status(403).json({ error: 'CSRF token missing.' });
    }

    try {
        const cookieBuf = Buffer.from(cookieToken, 'utf-8');
        const headerBuf = Buffer.from(headerToken, 'utf-8');
        if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
            return res.status(403).json({ error: 'CSRF token invalid.' });
        }
    } catch (err) {
        return res.status(403).json({ error: 'CSRF token invalid.' });
    }

    next();
};

module.exports = { setCsrfCookie, validateCsrf, CSRF_COOKIE };
