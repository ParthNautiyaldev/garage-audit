import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, publicUser } from '../models/User.js';
import { recordAudit } from '../services/auditService.js';
import { cookieOptions, env } from '../config/env.js';
import { HttpError, asyncHandler } from '../utils/http.js';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = email ? await User.findOne({ email }) : null;
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
  const allowed = Boolean(user && user.active && passwordOk);

  if (!allowed) {
    let failureReason = 'Unknown email';
    if (user && !user.active) failureReason = 'Inactive account';
    else if (user) failureReason = 'Invalid password';

    await recordAudit(req, {
      userId: user?._id || null,
      userName: user?.name || email || 'unknown',
      userRole: user?.role || null,
      action: 'AUTH_LOGIN_FAILED',
      resourceType: 'auth',
      resourceId: user?._id || null,
      status: 'failed',
      failureReason,
      // The API response stays generic so the form does not reveal which emails exist.
      // Investigators still see the specific reason in this log row.
      newValue: { email: email || null },
    });
    throw new HttpError(401, 'Invalid email or password');
  }

  await recordAudit(req, {
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'AUTH_LOGIN',
    resourceType: 'auth',
    resourceId: user._id,
    status: 'success',
  });
  res.cookie('token', signToken(user), cookieOptions);
  res.json({ user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await recordAudit(req, {
      action: 'AUTH_LOGOUT',
      resourceType: 'auth',
      resourceId: req.user._id,
      status: 'success',
    });
  }
  res.clearCookie('token', { path: '/', sameSite: 'lax', secure: cookieOptions.secure, httpOnly: true });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
