const express = require('express');
const router = express.Router();
const fileController = require('../controller/fileController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + unique + ext);
  }
});
const upload = multer({ storage });

// List files
router.get('/', fileController.listFiles);

// Upload single file (use field name 'file' on client)
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Upload multiple files (optional)
router.post('/upload-multiple', upload.array('files'), fileController.uploadFile);

// Download file
router.get('/download/:id', fileController.downloadFile);

// View file details
router.get('/:id', fileController.viewFile);

// Delete file
router.delete('/:id', fileController.deleteFile);

module.exports = router;