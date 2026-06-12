const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn('⚠️  ENCRYPTION_KEY must be exactly 32 characters. Token encryption may fail.');
}

/**
 * Encrypt a string using AES-256
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted cipher text
 */
const encrypt = (text) => {
  if (!text) return null;
  const ciphertext = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return ciphertext;
};

/**
 * Decrypt an AES-256 encrypted string
 * @param {string} ciphertext - Encrypted text
 * @returns {string} - Decrypted plain text
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

module.exports = { encrypt, decrypt };
