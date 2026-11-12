import { Router } from 'express';
import {
  changeStatus,
  createRepair,
  deleteRepair,
  listRepairs,
  updateRepair,
} from '../controllers/repairController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listRepairs);
router.post('/', requireRole('admin', 'manager'), createRepair);
router.put('/:id', requireRole('admin', 'manager'), updateRepair);
router.patch('/:id/status', changeStatus);
router.delete('/:id', requireRole('admin', 'manager'), deleteRepair);

export default router;
