const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/register', authController.showRegister);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.sendResetCode);
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);


const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  // Fetch folders and files for the logged-in user
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const folders = await prisma.folder.findMany({ where: { userId: req.user.id } });
  const files = await prisma.file.findMany({ where: { userId: req.user.id } });
  res.render('dashboard', { user: req.user, folders, files });
});


module.exports = router;