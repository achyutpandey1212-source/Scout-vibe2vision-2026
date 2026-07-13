import { Router, Request, Response } from 'express';
import { sourceRegistryService } from '../sources/source-registry.service';
import { SourceDiscoveryEngine } from '../sources/source-discovery.engine';
import { AffiliateExtractor } from '../sources/affiliate-extractor';
import {
  SourceCategory,
  SourcePriority,
  SourceType,
  ISourceRegistryEntry,
} from '../sources/source-registry.types';

const router = Router();

// ─── Dev-only protection ─────────────────────────────────────────────────────
router.use((_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: { message: 'Source Registry management is restricted in production.' },
    });
  }
  next();
});

// ─── GET /api/discovery/sources/stats ─────────────────────────────────────────
/**
 * Returns aggregated registry analytics: counts by category, priority,
 * sourceType, average opportunityDensity, and top-performing sources.
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await sourceRegistryService.getRegistryStats();
    return res.json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── GET /api/discovery/sources ───────────────────────────────────────────────
/**
 * Returns paginated list of sources with optional filters.
 * Query params: category, priority, sourceType, isActive, page, limit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      priority,
      sourceType,
      isActive,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const result = await sourceRegistryService.listSources({
      category: category as SourceCategory | undefined,
      priority: priority as SourcePriority | undefined,
      sourceType: sourceType as SourceType | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.json({
      success: true,
      data: {
        sources: result.sources,
        total: result.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── GET /api/discovery/sources/:domain ───────────────────────────────────────
/**
 * Returns a single source entry by domain.
 */
router.get('/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const result = await sourceRegistryService.listSources({
      page: 1,
      limit: 1,
    });

    // Fetch single by domain directly
    const { SourceRegistryModel } = await import('../sources/source-registry.model');
    const source = await SourceRegistryModel.findOne({ domain: domain.toLowerCase() }).lean();

    if (!source) {
      return res.status(404).json({
        success: false,
        error: { message: `Source not found: ${domain}` },
      });
    }

    return res.json({ success: true, data: source });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── POST /api/discovery/sources ──────────────────────────────────────────────
/**
 * Manually adds a new source to the registry.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const entry: Partial<ISourceRegistryEntry> = {
      ...req.body,
      discoveredBy: 'manual',
    };

    if (!entry.domain || !entry.organization || !entry.homepage) {
      return res.status(400).json({
        success: false,
        error: { message: 'Required fields: domain, organization, homepage' },
      });
    }

    const result = await sourceRegistryService.upsertSource(entry);

    return res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: { isNew: result.isNew, domain: entry.domain },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── PUT /api/discovery/sources/:domain ───────────────────────────────────────
/**
 * Updates specific fields of a source (e.g., trustScore, isActive, crawlFrequency).
 */
router.put('/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const updates: Partial<ISourceRegistryEntry> = req.body;

    // Never allow domain change via update
    delete (updates as any).domain;

    await sourceRegistryService.upsertSource({ domain, ...updates });
    return res.json({ success: true, data: { domain, updated: true } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── DELETE /api/discovery/sources/:domain ────────────────────────────────────
/**
 * Soft-deactivates a source (sets isActive: false). Never hard-deletes.
 */
router.delete('/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    await sourceRegistryService.upsertSource({ domain, isActive: false });
    return res.json({
      success: true,
      data: { domain, deactivated: true },
      message: `Source ${domain} has been deactivated.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── POST /api/discovery/sources/discover ─────────────────────────────────────
/**
 * Triggers the weekly Source Discovery Engine manually.
 * Runs in the background — returns immediately with a run ID.
 */
router.post('/discover', (req: Request, res: Response) => {
  const engine = new SourceDiscoveryEngine();

  const config = {
    totalBatches: req.body?.totalBatches,
    batchSize: req.body?.batchSize,
  };

  // Run asynchronously in background
  const startedAt = new Date().toISOString();
  engine
    .run(config)
    .then((report) => {
      console.log(
        `[Source Registry Routes] Weekly discovery run finished. ` +
          `Approved: ${report.domainsApproved}, Duration: ${report.durationMs}ms`,
      );
    })
    .catch((err) => {
      console.error(`[Source Registry Routes] Weekly discovery run failed: ${err.message}`);
    });

  return res.json({
    success: true,
    message: 'Source Discovery Engine started in background.',
    data: { startedAt },
  });
});

// ─── GET /api/discovery/sources/queue/depth ───────────────────────────────────
/**
 * Returns the current depth of the affiliate queue in Redis.
 */
router.get('/queue/depth', async (_req: Request, res: Response) => {
  try {
    const depth = await AffiliateExtractor.getQueueDepth();
    return res.json({ success: true, data: { affiliateQueueDepth: depth } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export const sourceRegistryRouter = router;
export default sourceRegistryRouter;
