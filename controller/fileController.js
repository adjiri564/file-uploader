const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

function normalizeId(id) {
  const num = Number(id);
  return Number.isNaN(num) ? id : num;
}

// List all files for the logged-in user (optionally by folder)
exports.listFiles = async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.render('files', { files, user: req.user, activePage: 'files' });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to list files' });
  }
};

// Upload files (expects multer middleware in the route)
exports.uploadFile = async (req, res) => {
  try {
    // detect whether client expects JSON (fetch/ajax)
    const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1);

    if (!req.file && (!req.files || req.files.length === 0)) {
      const msg = 'No file uploaded';
      if (wantsJson) return res.status(400).json({ error: msg });
      return res.status(400).render('error', { message: msg });
    }

    const filesToProcess = [];
    if (req.file) filesToProcess.push(req.file);
    if (req.files && req.files.length) filesToProcess.push(...req.files);

    const folderId = req.body.folderId || null;
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId: req.user.id }
      });

      if (!folder) {
        const msg = 'Folder not found';
        if (wantsJson) return res.status(404).json({ error: msg });
        return res.status(404).render('error', { message: msg });
      }
    }

    const uploadedFiles = [];
    for (const file of filesToProcess) {
      const record = await prisma.file.create({
        data: {
          originalName: file.originalname,
          fileName: file.filename,
          fileUrl: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          userId: req.user.id,
          folderId
        }
      });
      uploadedFiles.push(record);
    }

    if (wantsJson) {
      return res.json({ files: uploadedFiles, message: `${uploadedFiles.length} file(s) uploaded successfully` });
    }
    return res.send('<script>window.location.reload();</script>');  
  } catch (error) {
    console.error('Upload error:', error);
    const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1);
    if (wantsJson) return res.status(500).json({ error: 'Failed to upload file' });
    return res.status(500).render('error', { message: 'Failed to upload file' });
  }
};

// Download a file
exports.downloadFile = async (req, res) => {
  try {
    const rawId = req.params.id;
    const id = normalizeId(rawId);
    const file = await prisma.file.findFirst({
      where: typeof id === 'number' ? { id, userId: req.user.id } : { id: id, userId: req.user.id }
    });
    if (!file) return res.status(404).render('error', { message: 'File not found' });

    if (file.userId !== req.user.id) {
      return res.status(403).render('error', { message: 'Forbidden' });
    }

    // resolve path - allow both absolute and relative stored paths
    const filePath = file.fileUrl.startsWith('/')
      ? path.join(process.cwd(), file.fileUrl)
      : path.join(process.cwd(), 'uploads', file.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).render('error', { message: 'File missing on disk' });
    }

    res.download(filePath, file.originalName, (err) => {
      if (err && !res.headersSent) {
        console.error('Download error', err);
        res.status(500).render('error', { message: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Failed to download file' });
  }
};

// View file details
exports.viewFile = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    const file = await prisma.file.findFirst({
      where: typeof id === 'number' ? { id, userId: req.user.id } : { id: id, userId: req.user.id }
    });
    if (!file) return res.status(404).render('error', { message: 'File not found' });
    res.render('file-details', { file, user: req.user, activePage: 'files' });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load file details' });
  }
};

// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const rawId = req.params.id;
    const id = normalizeId(rawId);

    const file = await prisma.file.findFirst({
      where: typeof id === 'number' ? { id, userId: req.user.id } : { id: id, userId: req.user.id }
    });
    if (!file) return res.status(404).render('error', { message: 'File not found' });

    // resolve path - allow both absolute and relative stored paths
    const filePath = file.fileUrl && file.fileUrl.startsWith('/')
      ? path.join(process.cwd(), file.fileUrl)
      : path.join(process.cwd(), 'uploads', file.fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.file.delete({ where: { id: file.id } });

    // respond or redirect depending on how front-end calls this route
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ message: 'File deleted successfully' });
    }
    // return res.redirect('/files');
    return res.send('<script>window.location.reload();</script>');  
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).render('error', { message: 'Failed to delete file' });
  }
};
