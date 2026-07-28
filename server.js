require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminDocRoutes = require('./routes/adminDocRoutes');
const { setCsrfCookie, validateCsrf } = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 5002;

// CORS: allow credentials from admin frontend
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        callback(null, false);
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// CSRF cookie on every response
app.use(setCsrfCookie);

// Auth routes (no CSRF on login)
app.use('/api/admin/auth', adminAuthRoutes);

// Document management routes (CSRF validated on state-changing requests)
app.use('/api/admin', validateCsrf, adminDocRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`eo-doc-cms server running on port ${PORT}`);
});
