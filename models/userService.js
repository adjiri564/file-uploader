const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.createUser = async (data) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email, // Explicitly map the email
        password: data.password, // Explicitly map the password,
      },
    });
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

exports.findUserByEmail = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

exports.findUserByResetToken = async (token) => {
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    return user;
  } catch (error) {
    console.error("Error finding user by reset token:", error);
    throw error;
  }
};

exports.setResetToken = async (email, token, expiry) => {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
    return user;
  } catch (error) {
    console.error("Error setting reset token:", error);
    throw error;
  }
};

exports.updatePassword = async (userId, password) => {
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });
    return user;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

exports.findUserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

