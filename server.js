require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const dns = require('dns');

const helmet = require ('helmet');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const fileController = require('./controller/fileController');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Passport configuration
const passportConfig = require('./controller/passportConfig');
passportConfig(passport);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure PostgreSQL connection pool
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 30000,
  // Add SSL if needed
  ssl: {
    rejectUnauthorized: false
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, {family: 4}, callback);
  }
});

(async () => {
  try {
    const client = await pgPool.connect();
    console.log("✅ Connected to Neon");
    client.release();
  } catch (err) {
    console.error("❌ Database connection failed");
    console.error(err);
  }
})();

(async () => {
  try {
    const result = await pgPool.query('SELECT NOW()');
    console.log(result.rows);
  } catch (err) {
    console.error(err);
  }
})();


// session configuration
const sessionStore = new pgSession({
  pool: pgPool,
  tableName: "session",
  createTableIfMissing: false,
});

sessionStore.on("error", (err) => {
  console.error("SESSION STORE ERROR:", err);
});

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.set('trust proxy', 1); // Trust first proxy
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new pgSession({
    pool: pgPool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  cookie: {
    secure: isProduction, // Set to true if using HTTPS in production
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));




app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// A simple middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Use modularized routes
app.use('/', require('./routes/authRoutes'));
// app.use('/files', require('./routes/fileRoutes')); // Replaced by direct routes below
app.use('/folders', isAuthenticated, require('./routes/folderRoutes'));
app.use('/share', require('./routes/sharedRoutes')(isAuthenticated));

// File routes
app.post('/upload', isAuthenticated, upload.array('file', 10), fileController.uploadFile);
app.get('/files/:id', isAuthenticated, fileController.viewFile);
app.get('/download/:id', isAuthenticated, fileController.downloadFile);
app.delete('/files/:id', isAuthenticated, fileController.deleteFile);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});
//Before you define your routes, call the function:
(async () => {
  try {
          app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
      console.error("Failed to start the server", error);
  }
})();

