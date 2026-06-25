require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');

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
  connectionTimeoutMillis: 20000,
  // Add SSL if needed
  ssl: {
    rejectUnauthorized: false
  }
});

pgPool.on('error', (err) => {
  console.error('PG Pool Error:', err);
});


// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: new pgSession({
    pool: pgPool,                // Use pgPool instance
    tableName: 'session',   // Use a separate table for sessions
    createTableIfMissing: true
  }),
  // cookie: {
  //   secure: process.env.RENDER ? 
  //   httpOnly: true,
  //   sameSite: 'lax',
  //   maxAge: 24 * 60 * 60 * 1000 // 24 hours
  // }
  cookie: {
  secure: process.env.RENDER ? true : false,
  httpOnly: true,
  sameSite: 'lax'
}

}));

// Session test route
app.get('/session-test', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Session views: ${req.session.views}`);
});


//Confirm sessions
app.get('/session-test', (req, res) => {
  req.session.test = (req.session.test || 0) + 1;
  res.send(`Session count: ${req.session.test}`);
});


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
