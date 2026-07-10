import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Protected profile routes
router.get('/', requireAuth, ProfileController.getProfile);
router.post('/', requireAuth, ProfileController.updateProfile);
router.patch('/', requireAuth, ProfileController.updateProfile);
router.post('/onboarding/complete', requireAuth, ProfileController.completeOnboarding);

export const profileRouter = router;
export default profileRouter;
