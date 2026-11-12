import { Router } from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '../controllers/customerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', requireRole('admin', 'manager'), createCustomer);
router.put('/:id', requireRole('admin', 'manager'), updateCustomer);
router.delete('/:id', requireRole('admin', 'manager'), deleteCustomer);

export default router;
