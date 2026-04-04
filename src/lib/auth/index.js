/**
 * Auth module: password hashing and session management.
 */

export { hashPassword, verifyPassword } from "./password.js";
export {
  getSession,
  setSession,
  createUserSession,
  extendUserSession,
  writeSessionCookie,
  sessionPublicFields,
  clearSession,
  getSessionCookieName,
  isRequestHttps,
} from "./session.js";
