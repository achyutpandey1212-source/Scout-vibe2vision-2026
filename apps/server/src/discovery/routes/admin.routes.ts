import { Router, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { DiscoveryRunModel } from '../persistence/discovery-run.model';
import { discoverOpportunities } from '../orchestrator/discovery-orchestrator';
import { ProviderKeyPool } from '../../lib/providers/provider-key-pool';
import { CANONICAL_TARGET_AUDIENCE, ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'scout_admin_operations_secret';

const getSessionSignature = () => {
  return crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update('authenticated_admin')
    .digest('hex');
};

/**
 * Admin Session Validation middleware
 */
export const verifyAdminSession = (req: any, res: Response, next: any) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie: string) => {
    const parts = cookie.split('=');
    cookies[parts.shift()!.trim()] = decodeURI(parts.join('='));
  });

  const sessionCookie = cookies['scout_admin_session'];
  const expected = getSessionSignature();

  if (sessionCookie === expected) {
    return next();
  }
  return res
    .status(401)
    .json({ success: false, error: { message: 'Unauthorized administrative access.' } });
};

/**
 * POST login
 */
router.post('/login', (req, res: Response) => {
  const { password } = req.body;
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res
      .status(401)
      .json({ success: false, error: { message: 'Incorrect secure operations password.' } });
  }
  const signature = getSessionSignature();
  res.cookie('scout_admin_session', signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000 * 24,
    path: '/',
  });
  return res.json({ success: true });
});

/**
 * POST logout
 */
router.post('/logout', (req, res: Response) => {
  res.clearCookie('scout_admin_session', { path: '/' });
  return res.json({ success: true });
});

/**
 * GET status: Platforms status health aggregator
 */
router.get('/status', verifyAdminSession, async (req, res: Response) => {
  try {
    const dbHealth = db.getHealth();
    const redisHealth = await redis.getHealth();

    // Counts
    const counts: Record<string, number> = {
      users: 0,
      opportunities: 0,
      runs: 0,
      rawpages: 0,
    };

    const collections = [
      { key: 'users', name: 'users' },
      { key: 'opportunities', name: 'opportunities' },
      { key: 'runs', name: 'discoveryruns' },
      { key: 'rawpages', name: 'rawpages' },
    ];

    if (mongoose.connection.db) {
      for (const col of collections) {
        try {
          counts[col.key] = await mongoose.connection.db.collection(col.name).countDocuments();
        } catch {
          counts[col.key] = 0;
        }
      }
    }

    // Runs history
    const runs = await DiscoveryRunModel.find().sort({ startedAt: -1 }).limit(10);

    // Provider pool telemetry — flat array, frontend groups by system
    // getAllPools() returns all pools that have been instantiated at runtime
    const pools = ProviderKeyPool.getAllPools().map((pool) => pool.getTelemetry());

    return res.json({
      success: true,
      data: {
        health: {
          server: 'ok',
          database: dbHealth,
          redis: redisHealth,
          scheduler: 'healthy',
        },
        counts,
        runs,
        pools,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * POST jobs: Manually triggers backend scheduler jobs
 */
router.post('/jobs/trigger', verifyAdminSession, (req, res: Response) => {
  const { jobName } = req.body;

  if (jobName === 'discovery') {
    const context = {
      targetAudience: CANONICAL_TARGET_AUDIENCE,
      categories: ACTIVE_SOURCE_CATEGORIES,
      country: 'India',
    };
    discoverOpportunities(context, { maxExtractions: 10 } as any);
  }

  return res.json({
    success: true,
    message: `Scheduled background job: "${jobName}" started successfully.`,
  });
});

/**
 * Admin User Management Routes
 */
import { AdminUserController } from '../../modules/admin/controllers/admin-user.controller';

router.get('/users', verifyAdminSession, AdminUserController.listUsers);
router.get('/users/:id', verifyAdminSession, AdminUserController.getUserDetails);
router.delete('/users/:id', verifyAdminSession, AdminUserController.deleteUser);

export const adminRouter = router;
export default adminRouter;
