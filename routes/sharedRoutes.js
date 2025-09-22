const express = require('express');
const router = express.Router();
const sharedController = require('../controller/sharedController');

// Share folder
router.post('/folder/:id', sharedController.shareFolder);

// Access shared folder
router.get('/folder/:token', sharedController.accessSharedFolder);

module.exports = router;