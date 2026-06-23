const express = require('express');
const router = express.Router();
const sharedController = require('../controller/sharedController');

module.exports = (isAuthenticated) => {
  // Share folder
  router.post('/folder/:id', isAuthenticated, sharedController.shareFolder);

  // Access shared folder
  router.get('/:token', sharedController.accessSharedFolder);

  return router;
};
