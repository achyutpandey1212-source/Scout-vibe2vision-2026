import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import { requireAuth } from '../../middleware/auth';
import { OpportunityModel } from '../extraction/models/opportunity.model';
import { PlatformRegistry } from '@scout/shared';

const CATEGORY_VARIANTS: Record<string, string[]> = {
  INTERNSHIPS: ['INTERNSHIPS', 'INTERNSHIP'],
  STARTUP_INTERNSHIPS: ['STARTUP_INTERNSHIPS', 'STARTUP_INTERNSHIP'],
  GOVERNMENT_INTERNSHIP: ['GOVERNMENT_INTERNSHIP'],
  RESEARCH_INTERNSHIP: ['RESEARCH_INTERNSHIP'],
  HACKATHONS: ['HACKATHONS', 'HACKATHON'],
  SCHOLARSHIPS: ['SCHOLARSHIPS', 'SCHOLARSHIP'],
  FELLOWSHIPS: ['FELLOWSHIPS', 'FELLOWSHIP'],
  OPEN_SOURCE_PROGRAM: ['OPEN_SOURCE_PROGRAM'],
  CAMPUS_AMBASSADOR: ['CAMPUS_AMBASSADOR'],
  SUMMER_SCHOOL: ['SUMMER_SCHOOL'],
  BOOTCAMP: ['BOOTCAMP'],
  WOMEN_IN_TECH: ['WOMEN_IN_TECH'],
  JOB: ['JOB'],
  EVENT: ['EVENT'],
};

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      q,
      category,
      opportunityType,
      sortBy,
      platform,
      new: showNewOnly,
    } = req.query;
    const query: any = {
      'intelligence.expired': { $ne: true },
      status: 'ACTIVE',
      visibility: 'PUBLIC',
    };

    if (showNewOnly === 'true' && req.dbUser?.lastVisitedAt) {
      query.createdAt = { $gt: new Date(req.dbUser.lastVisitedAt) };
    }

    if (platform && platform !== 'ALL') {
      const domains = Object.keys(PlatformRegistry).filter(
        (domain) => PlatformRegistry[domain].id === platform,
      );
      if (domains.length > 0) {
        const domainRegex = new RegExp(domains.join('|').replace(/\./g, '\\.'), 'i');
        query.sourceDomain = { $regex: domainRegex };
      }
    }

    if (opportunityType && opportunityType !== 'ALL') {
      query.opportunityType = opportunityType;
    } else if (category && category !== 'ALL') {
      if (category === 'HACKATHONS') {
        query.$or = [
          { category: { $in: CATEGORY_VARIANTS['HACKATHONS'] } },
          { opportunityType: { $in: ['HACKATHON', 'COMPETITION'] } },
        ];
      } else {
        const catKey = String(category);
        const variants = CATEGORY_VARIANTS[catKey] || [catKey];
        query.category = { $in: variants };
      }
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

router.get('/counts', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const baseQuery: any = { 'intelligence.expired': { $ne: true } };

    const { platform } = _req.query;
    if (platform && platform !== 'ALL') {
      const domains = Object.keys(PlatformRegistry).filter(
        (domain) => PlatformRegistry[domain].id === platform,
      );
      if (domains.length > 0) {
        const domainRegex = new RegExp(domains.join('|').replace(/\./g, '\\.'), 'i');
        baseQuery.sourceDomain = { $regex: domainRegex };
      }
    }

    const total = await OpportunityModel.countDocuments(baseQuery);

    const counts: Record<string, number> = { ALL: total };

    for (const [key, variants] of Object.entries(CATEGORY_VARIANTS)) {
      const count = await OpportunityModel.countDocuments({
        ...baseQuery,
        category: { $in: variants },
      });
      counts[key] = count;
    }

    return res.json({ success: true, data: counts });
  } catch (error) {
    console.error('Opportunity counts API error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch counts' } });
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

router.get('/new-opportunities', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const lastVisitedAt = req.dbUser.lastVisitedAt;
    if (!lastVisitedAt) {
      return res.json({
        success: true,
        data: {
          count: null,
          lastVisitedAt: null,
          latestOpportunityAt: null,
        },
      });
    }

    const query = {
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      'intelligence.expired': { $ne: true },
      archived: { $ne: true },
      createdAt: { $gt: new Date(lastVisitedAt) },
    };

    const count = await OpportunityModel.countDocuments(query);
    const latestOpp = await OpportunityModel.findOne({
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      'intelligence.expired': { $ne: true },
      archived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    return res.json({
      success: true,
      data: {
        count,
        lastVisitedAt,
        latestOpportunityAt: latestOpp ? latestOpp.createdAt : null,
      },
    });
  } catch (error) {
    console.error('New opportunities count API error:', error);
    return res
      .status(500)
      .json({ success: false, error: { message: 'Failed to retrieve new opportunities count' } });
  }
});

export const opportunityRouter = router;
export default opportunityRouter;
