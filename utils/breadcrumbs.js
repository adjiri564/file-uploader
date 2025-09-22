const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getFolderPath(folderId) {
  const path = [];
  let currentId = folderId;
  while (currentId) {
    const folder = await prisma.folder.findUnique({ where: { id: currentId } });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }
  return path;
}

module.exports = { getFolderPath };