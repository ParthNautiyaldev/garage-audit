import { Router } from 'express';
import { changeRole, listAssignees, listUsers } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/assignees', requireRole('admin', 'manager'), listAssignees);
router.get('/', requireRole('admin'), listUsers);
router.patch('/:id/role', requireRole('admin'), changeRole);

export default router;
