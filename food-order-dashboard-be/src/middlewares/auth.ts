import { auth } from 'express-oauth2-jwt-bearer';
import config from '../config/config';

/**
 * Validates the Auth0 JWT on every request.
 * On success sets req.auth with the decoded token payload.
 * Returns 401 if the token is missing or invalid.
 */
export const requireAuth = auth({
  audience: config.auth0Audience,
  issuerBaseURL: `https://${config.auth0Domain}`,
});
