const prisma = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * OAuthToken Model — encrypted token storage per user per provider
 */
const OAuthTokenModel = {
  /**
   * Get token record for a user+provider
   */
  findByUserAndProvider: (userId, provider = 'google') =>
    prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider } },
    }),

  /**
   * Check if user has connected a provider
   */
  isConnected: async (userId, provider = 'google') => {
    const token = await prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider } },
      select: { id: true },
    });
    return !!token;
  },

  /**
   * Upsert (create or update) encrypted OAuth tokens
   */
  upsert: (userId, provider, { accessToken, refreshToken, scope, expiresAt }) =>
    prisma.oAuthToken.upsert({
      where: { userId_provider: { userId, provider } },
      update: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        scope,
        expiresAt,
      },
      create: {
        userId,
        provider,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        scope,
        expiresAt,
      },
    }),

  /**
   * Get decrypted access token for API usage
   */
  getDecrypted: async (userId, provider = 'google') => {
    const record = await prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (!record) return null;
    return {
      accessToken: decrypt(record.accessToken),
      refreshToken: record.refreshToken ? decrypt(record.refreshToken) : null,
      scope: record.scope,
      expiresAt: record.expiresAt,
    };
  },

  /**
   * Update only the access token (after refresh)
   */
  updateAccessToken: (userId, provider, accessToken, expiresAt) =>
    prisma.oAuthToken.update({
      where: { userId_provider: { userId, provider } },
      data: { accessToken: encrypt(accessToken), expiresAt },
    }),

  /**
   * Remove all tokens for a user+provider (disconnect)
   */
  delete: (userId, provider = 'google') =>
    prisma.oAuthToken.deleteMany({ where: { userId, provider } }),
};

module.exports = OAuthTokenModel;
