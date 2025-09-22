const userService = require('../models/userService');
const passport = require('passport');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.showLogin = (req, res) => {
  res.render('login', { 
    googleOAuthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
};

exports.login = passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
});

exports.showRegister = (req, res) => {
  res.render('register', { 
    messages: req.flash(),
    googleOAuthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await userService.createUser({ name, email, password: hashedPassword });
    res.redirect('/login');
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      req.flash('error', 'A user with this email already exists.');
    } else {
      req.flash('error', 'Registration failed. Please try again.');
    }
    res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
};

exports.showForgotPassword = (req, res) => {
  res.render('forgot-password', { message: null });
};

exports.sendResetCode = async (req, res) => {
  const { email } = req.body;
  const user = await userService.findUserByEmail(email);
  if (!user) return res.render('forgot-password', { message: 'Email not found.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await userService.setResetToken(email, code, expiry);

  await transporter.sendMail({
    from: `"File Uploader" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Your Password Reset Code',
    html: `<p>Your password reset code is: <b>${code}</b><br>This code expires in 10 minutes.</p>`
  });

  res.render('reset-password', { email, message: 'A 6-digit code has been sent to your email.' });
};

exports.showResetPassword = (req, res) => {
  res.render('reset-password', { email: '', message: null });
};

exports.resetPassword = async (req, res) => {
  const { email, code, password, confirmPassword } = req.body;
  const user = await userService.findUserByEmail(email);

  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    return res.render('reset-password', { email, message: 'Invalid request or expired code.' });
  }
  if (user.resetToken !== code || user.resetTokenExpiry < new Date()) {
    return res.render('reset-password', { email, message: 'Invalid or expired code.' });
  }
  if (password !== confirmPassword) {
    return res.render('reset-password', { email, message: 'Passwords do not match.' });
  }

  await userService.updatePassword(user.id, password);
  res.redirect('/login');
};