const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });

exports.findUserByResetToken = async (token) =>
  prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
  });

exports.setResetToken = async (email, token, expiry) =>
  prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpiry: expiry }
  });

exports.updatePassword = async (userId, password) => {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null }
  });
};

exports.findUserById = async (id) => prisma.user.findUnique({ where: { id } });