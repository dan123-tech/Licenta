/**
 * Password hashing and verification using bcrypt.
 * Used on register, set-password, and login.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password for storage.
 * @param {string} plainPassword - Raw password from user input
 * @returns {Promise<string>} Resolved with the hashed password string
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain password against a stored hash.
 * @param {string} plainPassword - User-supplied password
 * @param {string} hashedPassword - Stored hash from the database
 * @returns {Promise<boolean>} True if the password matches
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
