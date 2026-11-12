import { User, publicUser } from '../models/User.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../services/auditService.js';
import { HttpError, asyncHandler } from '../utils/http.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json({ users: users.map(publicUser) });
});

// Staff names are needed to assign a repair. This list has no emails.
export const listAssignees = asyncHandler(async (_req, res) => {
  const users = await User.find({ active: true, role: { $in: ['technician', 'manager', 'admin'] } })
    .select('name role')
    .sort({ name: 1 });
  res.json({
    users: users.map((user) => ({ id: user._id, name: user.name, role: user.role })),
  });
});

export const changeRole = asyncHandler(async (req, res) => {
  const nextRole = String(req.body.role || '');
  if (!ROLES.includes(nextRole)) throw new HttpError(400, 'Unknown role');

  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');

  if (String(user._id) === String(req.user._id)) {
    await recordAudit(req, {
      action: 'USER_ROLE_CHANGE',
      resourceType: 'user',
      resourceId: user._id,
      status: 'failed',
      failureReason: 'An admin tried to change their own role',
      oldValue: { role: user.role, name: user.name },
      newValue: { role: nextRole },
    });
    throw new HttpError(400, 'You cannot change your own role');
  }

  if (user.role === 'admin' && nextRole !== 'admin') {
    const admins = await User.countDocuments({ role: 'admin', active: true });
    if (admins <= 1) {
      await recordAudit(req, {
        action: 'USER_ROLE_CHANGE',
        resourceType: 'user',
        resourceId: user._id,
        status: 'failed',
        failureReason: 'Refused to remove the last admin',
        oldValue: { role: user.role, name: user.name },
        newValue: { role: nextRole },
      });
      throw new HttpError(400, 'The shop must keep at least one admin');
    }
  }

  if (user.role === nextRole) {
    return res.json({ user: publicUser(user) });
  }

  const previous = user.role;
  user.role = nextRole;
  await user.save();
  await recordAudit(req, {
    action: 'USER_ROLE_CHANGE',
    resourceType: 'user',
    resourceId: user._id,
    status: 'success',
    oldValue: { role: previous, name: user.name },
    newValue: { role: nextRole, name: user.name },
  });
  res.json({ user: publicUser(user) });
});
