import { Router } from 'express';
import { ProfileV2Controller } from '../controllers/profile.v2.controller';
import { requireAuth } from '../../middleware/auth';
import { resumeUpload } from '../middleware/upload.middleware';

const router = Router();

// Protected profile V2 routes
router.get('/', requireAuth, ProfileV2Controller.getProfile);
router.post('/', requireAuth, ProfileV2Controller.updateProfile);
router.patch('/', requireAuth, ProfileV2Controller.updateProfile);
router.post('/resume', requireAuth, resumeUpload, ProfileV2Controller.uploadResume);
router.post('/merge', requireAuth, ProfileV2Controller.mergeProfile);

export const profileV2Router = router;
export default profileV2Router;
