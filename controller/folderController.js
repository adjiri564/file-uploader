const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getFolderPath } = require('../utils/breadcrumbs');

// List all folders for the logged-in user (root level)
exports.listFolders = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    const files = await prisma.file.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.render('dashboard', {
      folders,
      files,
      currentPath: [], // For breadcrumbs: at root
      user: req.user,
      activePage: 'dashboard'
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to list folders' });
  }
};

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    const folderName = name?.trim();
    const folderDescription = description?.trim() || null;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId: req.user.id }
      });

      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        description: folderDescription,
        userId: req.user.id,
        parentId: parentId || null
      }
    });
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create folder' });
  }
};

// Edit a folder
exports.editFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const folderName = name?.trim();
    const folderDescription = description?.trim() || null;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const result = await prisma.folder.updateMany({
      where: { id, userId: req.user.id },
      data: { name: folderName, description: folderDescription }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const folder = await prisma.folder.findUnique({ where: { id } });
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update folder' });
  }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.folder.deleteMany({
      where: { id, userId: req.user.id }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ message: 'Folder deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete folder' });
  }
};

// View folder details with breadcrumbs
exports.viewFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.user.id },
      include: { children: true, files: true }
    });
    if (!folder) return res.status(404).render('error', { message: 'Folder not found' });

    const currentPath = await getFolderPath(folder.id);
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    const files = await prisma.file.findMany({
      where: { userId: req.user.id, folderId: folder.id },
      orderBy: { createdAt: 'desc' }
    });

    res.render('dashboard', {
      folder,
      folders,
      files,
      currentPath,
      user: req.user,
      activePage: 'dashboard'
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load folder details' });
  }
};
