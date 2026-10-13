require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Route imports
const productRoutes = require('./routes/productRoutes');
const grainRoutes = require('./routes/grainRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const operationalCostRoutes = require('./routes/operationalCostRoutes');
const siteContentRoutes = require('./routes/siteContentRoutes');
const { router: deliveryAreaRoutes } = require('./routes/deliveryAreaRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const articleRoutes = require('./routes/articleRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (Render / Netlify / Cloudflare)
app.set('trust proxy', 1);

// Permanent 301 HTTPS Redirection in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Production security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Avoid blocking Vite development / inline SVG QR codes
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configured CORS Allowlist matching subdomains and local development
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const configuredOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://admin.localhost:3000',
  'http://delivery.localhost:3000',
  'https://arogyabhog.com',
  'https://www.arogyabhog.com',
  'http://arogyabhog.com',
  'http://www.arogyabhog.com',
  process.env.CUSTOMER_BASE_URL,
  process.env.ADMIN_BASE_URL,
  process.env.DELIVERY_BASE_URL,
  ...extraOrigins
].filter(Boolean).map(o => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || configuredOrigins.includes('*')) {
      return callback(null, true);
    }
    if (configuredOrigins.includes(origin) || origin.endsWith('.netlify.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    const isSubdomainAllowed = configuredOrigins.some(base => {
      try {
        const baseHostname = new URL(base).hostname;
        const originHostname = new URL(origin).hostname;
        return originHostname === baseHostname || originHostname.endsWith('.' + baseHostname);
      } catch (e) {
        return false;
      }
    });
    if (isSubdomainAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS block: Origin ${origin} not permitted`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order requests. Please try again later.' }
});

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// API Routes with rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/auth/recovery', recoveryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/grains', grainRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/operational-costs', operationalCostRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/delivery-areas', deliveryAreaRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/articles', articleRoutes);

// Health route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'Arogyabhog Artisanal Ayurveda',
    timestamp: new Date().toISOString(),
    unit: 'Unit #4 - Gurugram'
  });
});

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Arogyabhog Backend] Running on http://localhost:${PORT}`);
    console.log(`[Chakki Admin] Unit #4 - Gurugram live`);
  });
};

startServer();

module.exports = app;
