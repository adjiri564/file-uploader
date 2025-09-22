const express = require('express');
const router = express.Router();
const folderController = require('../controller/folderController');

// List folders
router.get('/', folderController.listFolders);

// Create folder
router.post('/', folderController.createFolder);

// Edit folder
router.put('/:id', folderController.editFolder);

// Delete folder
router.delete('/:id', folderController.deleteFolder);

// View folder details
router.get('/:id', folderController.viewFolder);

module.exports = router;