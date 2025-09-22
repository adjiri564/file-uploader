const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

// Share a folder (generate a share link)
exports.shareFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body; // duration in days

    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

    const sharedFolder = await prisma.sharedFolder.create({
      data: {
        folderId: id,
        token: uuidv4(),
        expiresAt
      }
    });

    res.json({
      shareUrl: `${req.protocol}://${req.get('host')}/share/${sharedFolder.token}`,
      expiresAt: sharedFolder.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share folder' });
  }
};

// Access a shared folder by token
exports.accessSharedFolder = async (req, res) => {
  try {
    const { token } = req.params;
    const sharedFolder = await prisma.sharedFolder.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      },
      include: {
        folder: {
          include: { children: true, files: true }
        }
      }
    });
    if (!sharedFolder) {
      return res.status(404).render('error', { message: 'Shared link expired or invalid' });
    }
    res.render('shared-folder', { sharedFolder });
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load shared folder' });
  }
};