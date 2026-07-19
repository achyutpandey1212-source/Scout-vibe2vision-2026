import { Router } from 'express';
import { RecommendationController } from '../controller/recommendation.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();

router.get('/', requireAuth, RecommendationController.getRecommendations);
router.post('/regenerate', requireAuth, RecommendationController.regenerate);

export const recommendationRouter = router;
export default recommendationRouter;
