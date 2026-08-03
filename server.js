require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminDocRoutes = require('./routes/adminDocRoutes');
const { setCsrfCookie, validateCsrf } = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 5002;

// ─── Security Headers (helmet) ───
app.use(helmet({
    contentSecurityPolicy: false, // CSP configured separately if needed
    crossOriginEmbedderPolicy: false,
}));

// ─── CORS ───
const allowedOrigins = process.env.CLIENT_URL
    ? [process.env.CLIENT_URL]
    : null;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        // In development allow any localhost port
        if (!allowedOrigins) {
            if (origin.startsWith('http://localhost:')) return callback(null, true);
            if (origin.endsWith('.vercel.app')) return callback(null, true);
        } else {
            if (allowedOrigins.includes(origin)) return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ─── CSRF cookie on every response ───
app.use(setCsrfCookie);

// ─── Rate Limiting on Auth ───
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    skipSuccessfulRequests: true,
});

// ─── Auth routes (rate-limited, no CSRF on login) ───
app.use('/api/admin/auth', authLimiter, adminAuthRoutes);

// ─── Document management routes (CSRF validated on state-changing requests) ───
app.use('/api/admin', validateCsrf, adminDocRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`eo-doc-cms server running on port ${PORT}`);
});
