import { Router, Response } from 'express';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { discoverOpportunities } from '../orchestrator/discovery-orchestrator';

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
 * GET status: Expose metrics and live execution details
 */
router.get('/status', (req, res: Response) => {
  const state = DashboardStateInstance.getState();

  // Expose alias to not dump real credentials on API prints
  const maskedAlias = state.currentKeyAlias
    ? `key_${state.currentKeyAlias.substring(0, 4)}...`
    : 'None';

  return res.json({
    success: true,
    data: {
      ...state,
      currentKeyAlias: maskedAlias,
    },
  });
});

/**
 * POST start: Launches discovery asynchronously in background
 */
router.post('/start', (req, res: Response) => {
  const state = DashboardStateInstance.getState();
  if (state.isRunning) {
    return res.status(400).json({
      success: false,
      error: { message: 'Discovery Run is already actively running.' },
    });
  }

  // Set running state
  DashboardStateInstance.reset();
  DashboardStateInstance.updateState({
    isRunning: true,
    startedAt: new Date(),
    currentStage: 'STAGE_1_DISCOVERY',
  });

  // Run in background asynchronously
  const context: any = {
    targetAudience: 'Women Tech Professionals & Students',
    categories: ['Engineering', 'Scholarships', 'Tech Workshops'],
    country: 'India',
  };

  discoverOpportunities(context, { maxExtractions: 10 } as any)
    .then((result) => {
      console.log(
        '[Dashboard Server] Asynchronous discovery E2E run finished successfully.',
        result.runId,
      );
      DashboardStateInstance.updateState({
        isRunning: false,
        currentStage: 'IDLE',
      });
    })
    .catch((err) => {
      console.error('[Dashboard Server] Asynchronous discovery E2E run failed:', err.message);
      DashboardStateInstance.updateState({
        isRunning: false,
        currentStage: 'IDLE',
      });
    });

  return res.json({
    success: true,
    message: 'Discovery Engine started in background.',
  });
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
