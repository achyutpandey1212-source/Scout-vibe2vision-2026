import { Router } from 'express';
import { ProfileV2Controller } from '../controllers/profile.v2.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// Protected profile V2 routes
router.get('/', requireAuth, ProfileV2Controller.getProfile);
router.post('/', requireAuth, ProfileV2Controller.updateProfile);
router.patch('/', requireAuth, ProfileV2Controller.updateProfile);
router.post('/resume', requireAuth, ProfileV2Controller.uploadResume);

export const profileV2Router = router;
export default profileV2Router;
