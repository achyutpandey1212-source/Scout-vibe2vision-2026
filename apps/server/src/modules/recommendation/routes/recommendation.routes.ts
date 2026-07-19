import { Router } from 'express';
import { RecommendationController } from '../controller/recommendation.controller';
import { requireAuth } from '../../../middleware/auth';
import { verifyAdminSession } from '../../../discovery/routes/admin.routes';

const router = Router();

// User endpoints
router.get('/', requireAuth, RecommendationController.getRecommendations);
router.post('/refresh', requireAuth, RecommendationController.refresh);

// Admin endpoints
router.get('/admin/health', verifyAdminSession, RecommendationController.getHealth);
router.get('/admin/config', verifyAdminSession, RecommendationController.getConfig);
router.post('/admin/config', verifyAdminSession, RecommendationController.updateConfig);
router.get('/admin/mode', verifyAdminSession, RecommendationController.getMode);
router.post('/admin/mode', verifyAdminSession, RecommendationController.updateMode);
router.get('/admin/explain', verifyAdminSession, RecommendationController.getExplain);
router.post('/admin/generate', verifyAdminSession, RecommendationController.generate);
router.get('/admin/logs', verifyAdminSession, RecommendationController.getLogs);

export const recommendationRouter = router;
export default recommendationRouter;
