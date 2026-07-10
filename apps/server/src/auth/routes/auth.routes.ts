import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Public routes
router.get('/health', AuthController.getHealth);

// Protected routes (require authorization token)
router.get('/me', requireAuth, AuthController.getCurrentUser);
router.post('/sync', requireAuth, AuthController.syncUser);
router.post('/logout', requireAuth, AuthController.logout);

export const authRouter = router;
export default authRouter;
