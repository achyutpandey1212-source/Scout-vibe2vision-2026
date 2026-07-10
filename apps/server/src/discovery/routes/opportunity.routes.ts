import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import { requireAuth } from '../../middleware/auth';
import { OpportunityModel } from '../extraction/models/opportunity.model';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 12, q, category, sortBy } = req.query;
    const query: any = { 'intelligence.expired': { $ne: true } };

    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { organization: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q as string, 'i')] } },
      ];
    }

    const sort: any = {};
    if (sortBy === 'deadline') {
      sort.deadline = 1;
    } else {
      sort.createdAt = -1;
    }

    const total = await OpportunityModel.countDocuments(query);
    const opportunities = await OpportunityModel.find(query)
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      success: true,
      data: opportunities,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasNext: total > Number(page) * Number(limit),
      },
    });
  } catch (error) {
    console.error('Opportunities list API error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to search catalog' } });
  }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const opportunity = await OpportunityModel.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, error: { message: 'Opportunity not found' } });
    }
    return res.json({ success: true, data: opportunity });
  } catch (error) {
    console.error('Opportunity details API error:', error);
    return res
      .status(500)
      .json({ success: false, error: { message: 'Failed to retrieve opportunity' } });
  }
});

export const opportunityRouter = router;
export default opportunityRouter;
