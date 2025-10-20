import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateRefreshToken as generateRefreshTokenString } from '../utils/crypto';
import { bcryptConfig } from '../config/security';
import { asyncHandler, AppError } from '../middlewares/error';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName } = req.body;
  
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });
  
  if (existingUser) {
    throw new AppError('User already exists with this email or username', 409);
  }
  
  // Hash du password
  const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);
  
  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  
  // Générer les tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });
  
  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });
  
  // Stocker le refresh token
  const refreshTokenString = generateRefreshTokenString();
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });
  
  res.status(201).json({
    user,
    accessToken,
    refreshToken: refreshTokenString,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Vérifier le password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Vérifier si l'utilisateur est actif
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }
  
  // Générer les tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });
  
  const refreshTokenString = generateRefreshTokenString();
  
  // Stocker le refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    },
    accessToken,
    refreshToken: refreshTokenString,
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }
  
  // Vérifier le refresh token
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  
  if (!tokenRecord || tokenRecord.isRevoked) {
    throw new AppError('Invalid refresh token', 401);
  }
  
  if (tokenRecord.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }
  
  // Générer un nouveau access token
  const accessToken = generateAccessToken({
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
    isAdmin: tokenRecord.user.isAdmin,
  });
  
  res.json({ accessToken });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Révoquer le refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }
  
  res.json({ message: 'Logged out successfully' });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isAdmin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json(user);
});

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Vérifier le mot de passe actuel
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Hash le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);
  
  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
  
  // Révoquer tous les refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { isRevoked: true },
  });
  
  res.json({ message: 'Password changed successfully' });
});
