import { Router } from 'express';
import { auditSummary, listAuditLogs } from '../controllers/auditController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager'));
router.get('/summary', auditSummary);
router.get('/', listAuditLogs);

export default router;
