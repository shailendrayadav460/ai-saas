const prisma = require('../config/database');

/**
 * User Model — repository pattern wrapper around Prisma
 */
const UserModel = {
  /**
   * Find user by ID (safe fields only)
   */
  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true,
        avatar: true, role: true, plan: true,
        isVerified: true, googleId: true, createdAt: true,
      },
    }),

  /**
   * Find user by email
   */
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }),

  /**
   * Find user by Google ID
   */
  findByGoogleId: (googleId) =>
    prisma.user.findUnique({ where: { googleId } }),

  /**
   * Create a new user
   */
  create: (data) =>
    prisma.user.create({
      data,
      select: {
        id: true, name: true, email: true,
        avatar: true, role: true, plan: true, isVerified: true,
      },
    }),

  /**
   * Update user fields
   */
  update: (id, data) =>
    prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true,
        avatar: true, role: true, plan: true,
      },
    }),

  /**
   * Upsert a Google OAuth user
   */
  upsertGoogleUser: ({ email, googleId, name, avatar }) =>
    prisma.user.upsert({
      where: { email },
      update: { googleId, avatar, name },
      create: { email, name, googleId, avatar, isVerified: true },
    }),

  /**
   * Update user plan (FREE | PRO)
   */
  updatePlan: (id, plan) =>
    prisma.user.update({ where: { id }, data: { plan } }),

  /**
   * Delete user by ID
   */
  delete: (id) =>
    prisma.user.delete({ where: { id } }),

  /**
   * Count total users (admin)
   */
  count: () => prisma.user.count(),

  /**
   * Paginate users (admin)
   */
  findMany: ({ skip = 0, take = 20 } = {}) =>
    prisma.user.findMany({
      skip, take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true,
        role: true, plan: true, createdAt: true,
      },
    }),
};

module.exports = UserModel;
