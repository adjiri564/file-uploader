const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getFolderPath } = require('../utils/breadcrumbs');

// List all folders for the logged-in user (root level)
exports.listFolders = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.id, parentId: null },
      include: { children: true, files: true }
    });
    res.render('folders', {
      folders,
      currentPath: [], // For breadcrumbs: at root
      user: req.user,
      activePage: 'folders'
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to list folders' });
  }
};

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    const folder = await prisma.folder.create({
      data: {
        name,
        description,
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
    const folder = await prisma.folder.update({
      where: { id, userId: req.user.id },
      data: { name, description }
    });
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update folder' });
  }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.folder.delete({
      where: { id, userId: req.user.id }
    });
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

    res.render('folder-details', {
      folder,
      currentPath,
      user: req.user,
      activePage: 'folders'
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load folder details' });
  }
};