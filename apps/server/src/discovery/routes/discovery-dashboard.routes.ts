import { Router, Request, Response } from 'express';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { discoverOpportunities } from '../orchestrator/discovery-orchestrator';
import { sourceRegistryService } from '../sources/source-registry.service';
import { AffiliateExtractor } from '../sources/affiliate-extractor';
import { SourceDiscoveryEngine } from '../sources/source-discovery.engine';
import { SourceRegistryModel } from '../sources/source-registry.model';
import { ACTIVE_SOURCE_CATEGORIES, CANONICAL_TARGET_AUDIENCE } from '@scout/shared';
import mongoose from 'mongoose';

const router = Router();

// Development Environment Protection Check Middleware
router.use((req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return res.status(403).json({
      success: false,
      error: { message: 'Discovery Dashboard is restricted to local development mode only.' },
    });
  }
  next();
});

/**
 * GET status: Expose metrics, live execution details, and SourceRegistry stats + coverage
 */
router.get('/status', async (req, res: Response) => {
  const state = DashboardStateInstance.getState();

  // Expose alias to not dump real credentials on API prints
  const maskedAlias = state.currentKeyAlias
    ? `key_${state.currentKeyAlias.substring(0, 4)}...`
    : 'None';

  let registrySize = 0;
  let activeSources = 0;
  let affiliateQueueDepth = 0;
  let sourcesDueToday = 0;
  let sourcesCrawledToday = 0;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalCount, activeCount, queueDepth, dueCount, crawledToday] = await Promise.all([
      SourceRegistryModel.countDocuments(),
      SourceRegistryModel.countDocuments({ isActive: true }),
      AffiliateExtractor.getQueueDepth(),
      SourceRegistryModel.countDocuments({ isActive: true, nextCrawlAt: { $lte: new Date() } }),
      SourceRegistryModel.countDocuments({ isActive: true, lastCrawledAt: { $gte: todayStart } }),
    ]);

    registrySize = totalCount;
    activeSources = activeCount;
    affiliateQueueDepth = queueDepth;
    sourcesDueToday = dueCount;
    sourcesCrawledToday = crawledToday;
  } catch (err) {
    console.error('[Dashboard Route] Failed to fetch registry status metrics:', err);
  }

  return res.json({
    success: true,
    data: {
      ...state,
      currentKeyAlias: maskedAlias,
      registry: {
        registrySize,
        activeSources,
        affiliateQueueDepth,
        sourcesDueToday,
        sourcesCrawledToday,
        remainingToday: Math.max(0, sourcesDueToday - sourcesCrawledToday),
      },
    },
  });
});

/**
 * POST run-daily: Starts the Stage 1 to 5 daily discovery pipeline with custom filters (modes)
 */
router.post('/run-daily', (req, res: Response) => {
  const state = DashboardStateInstance.getState();
  if (state.isRunning) {
    return res.status(400).json({
      success: false,
      error: { message: 'Discovery Daily Run is already actively running.' },
    });
  }

  const { runMode = 'due', category, customDomains } = req.body;

  // Set running state
  DashboardStateInstance.reset();
  DashboardStateInstance.updateState({
    isRunning: true,
    startedAt: new Date(),
    currentStage: 'STAGE_1_DISCOVERY',
  });

  const context: any = {
    targetAudience: CANONICAL_TARGET_AUDIENCE,
    categories: ACTIVE_SOURCE_CATEGORIES,
    country: 'India',
    // Custom execution mode options passed to Stage 1
    runMode,
    runCategory: category,
    runCustomDomains: customDomains,
  };

  discoverOpportunities(context, { maxExtractions: 25 } as any)
    .then((result) => {
      console.log(
        '[Dashboard Server] Asynchronous daily discovery E2E run finished successfully.',
        result.runId,
      );
      DashboardStateInstance.updateState({
        isRunning: false,
        currentStage: 'IDLE',
      });
    })
    .catch((err) => {
      console.error('[Dashboard Server] Asynchronous daily discovery E2E run failed:', err.message);
      DashboardStateInstance.updateState({
        isRunning: false,
        currentStage: 'IDLE',
      });
    });

  return res.json({
    success: true,
    message: 'Daily Opportunity Discovery Engine started in background.',
  });
});

/**
 * POST run-weekly: Centralized router proxy to execute the weekly SourceDiscoveryEngine
 */
router.post('/run-weekly', (req, res: Response) => {
  const engine = new SourceDiscoveryEngine();
  const config = {
    totalBatches: req.body?.totalBatches,
    batchSize: req.body?.batchSize,
  };

  const startedAt = new Date().toISOString();
  engine
    .run(config)
    .then((report) => {
      console.log(
        `[Dashboard Server] Manual weekly source discovery run finished. ` +
          `Approved: ${report.domainsApproved}, Duration: ${report.durationMs}ms`,
      );
    })
    .catch((err) => {
      console.error(`[Dashboard Server] Manual weekly source discovery run failed: ${err.message}`);
    });

  return res.json({
    success: true,
    message: 'Weekly Source Discovery Engine started in background.',
    data: { startedAt },
  });
});

/**
 * POST run-affiliates: Runs affiliate queue evaluation manually
 */
router.post('/run-affiliates', async (req, res: Response) => {
  try {
    const engine = new SourceDiscoveryEngine();
    // Run engine with 0 Tavily batches to force only processing queued affiliates
    const startedAt = new Date().toISOString();
    engine
      .run({ totalBatches: 0, batchSize: 0 })
      .then((report) => {
        console.log(
          `[Dashboard Server] Manual affiliate evaluation finished. ` +
            `Approved: ${report.domainsApproved}, Duration: ${report.durationMs}ms`,
        );
      })
      .catch((err) => {
        console.error(`[Dashboard Server] Manual affiliate evaluation failed: ${err.message}`);
      });

    return res.json({
      success: true,
      message: 'Affiliate evaluation started in background.',
      data: { startedAt },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET metrics: Returns charts data for the dashboard
 */
router.get('/metrics', async (req, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setDate(todayStart.getDate() - 7);

    // Group active opportunities by category
    const byCategory =
      (await mongoose.connection.db
        ?.collection('opportunities')
        .aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
        .toArray()) || [];

    const topSources = await SourceRegistryModel.find({ isActive: true })
      .sort({ opportunityDensity: -1 })
      .limit(5)
      .select('domain organization trustScore opportunityDensity totalOpportunitiesFound')
      .lean();

    return res.json({
      success: true,
      data: {
        byCategory: Object.fromEntries(byCategory.map((c) => [c._id || 'UNCLASSIFIED', c.count])),
        topSources,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST stop: Interrupts run and resets state
 */
router.post('/stop', (req, res: Response) => {
  DashboardStateInstance.reset();
  return res.json({
    success: true,
    message: 'Discovery Engine stopped successfully.',
  });
});

export const discoveryDashboardRouter = router;
export default discoveryDashboardRouter;
