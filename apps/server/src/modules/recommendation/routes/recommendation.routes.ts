import { Router } from 'express';
import { RecommendationController } from '../controller/recommendation.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();

router.get('/', requireAuth, RecommendationController.getRecommendations);
router.post('/refresh', requireAuth, RecommendationController.refresh);

export const recommendationRouter = router;
export default recommendationRouter;
