import { Router } from 'express';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from '../controllers/vehicleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listVehicles);
router.post('/', requireRole('admin', 'manager'), createVehicle);
router.put('/:id', requireRole('admin', 'manager'), updateVehicle);
router.delete('/:id', requireRole('admin', 'manager'), deleteVehicle);

export default router;
