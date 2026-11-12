import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', optionalAuth, logout);
router.get('/me', requireAuth, me);

export default router;
