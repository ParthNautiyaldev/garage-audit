import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

// Attach req.user when the cookie is valid. A bad token means "signed out",
// not an error, so the login page can load without a 401 loop.
export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user?.active) req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return next();
    return next(err);
  }
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) return next(new HttpError(401, 'Sign in to continue'));
    return next();
  });
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Sign in to continue'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have access to that'));
    }
    next();
  };
}
