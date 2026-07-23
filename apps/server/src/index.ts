import './discovery/utils/logger-capture';
import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { env, db, redis, firebase } from '@/config';
import { authRouter } from './auth';
import { profileRouter, profileV2Router } from './profile';
import { recommendationRouter } from './modules/recommendation';
import { opportunityRouter } from './discovery/routes/opportunity.routes';
import { bookmarkRouter } from './auth/routes/bookmark.routes';
import { sourceRegistryService } from './discovery/sources/source-registry.service';

const app = express();
const port = env.PORT;

// Avoid advertising the framework in response headers.
app.disable('x-powered-by');

const allowedOrigins = ['http://localhost:3000', env.CLIENT_URL, env.FRONTEND_URL].filter(
  (origin): origin is string => Boolean(origin),
);

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel production & preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) return true;
  return false;
};

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS request rejected'));
  },
  credentials: true,
};

// Configure CORS + preflight handling
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight Backend Readiness Endpoint (Cold Start Detection)
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.status(200).json({
    status: 'ok',
    service: 'Scout Backend',
  });
});

// Main status endpoint (Phase 1)
app.get('/', (req, res) => {
  res.json({
    name: 'Scout API',
    status: 'running',
    version: 'v1',
  });
});

// Enhanced Service Health Endpoint
app.get('/api/v1/health', async (req, res) => {
  const dbHealth = db.getHealth();
  const redisHealth = await redis.getHealth();
  const firebaseHealth = firebase.isInitialized() ? 'configured' : 'error';

  const isHealthy = dbHealth === 'ok' && redisHealth === 'ok' && firebaseHealth === 'configured';

  res.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    services: {
      api: 'ok',
      mongodb: dbHealth,
      redis: redisHealth,
      firebase: firebaseHealth,
    },
    timestamp: new Date().toISOString(),
  });
});

// Register Auth Router
app.use('/api/v1/auth', authRouter);

// Register Profile / User Intelligence Router
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/profile/v2', profileV2Router);

// Register Recommendations Router
app.use('/api/v1/recommendations', recommendationRouter);

// Register Opportunities Router
app.use('/api/v1/opportunities', opportunityRouter);

// Register Discovery Dashboard Router
import { discoveryDashboardRouter } from './discovery/routes/discovery-dashboard.routes';
app.use('/api/v1/discovery/dashboard', discoveryDashboardRouter);

// Register Source Registry Router
import { sourceRegistryRouter } from './discovery/routes/source-registry.routes';
app.use('/api/v1/discovery/sources', sourceRegistryRouter);

// Register Administrative Operations Router
import { adminRouter } from './discovery/routes/admin.routes';
app.use('/api/v1/admin', adminRouter);

// Register Bookmarks Router
app.use('/api/v1/bookmarks', bookmarkRouter);

// Keep internal exceptions, driver errors, and framework stacks out of API responses.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API] Unhandled request error.');
  if (res.headersSent) return;
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
});

// Bootstrapping the services
async function bootstrap() {
  try {
    // 1. Initialize Firebase Admin
    firebase.initialize();

    // 2. Connect to MongoDB
    await db.connect();

    // 3. Connect to Redis
    redis.connect();

    // 4. Seed SourceRegistry from TRUSTED_SOURCES if empty (one-time, idempotent)
    const seeded = await sourceRegistryService.seedIfEmpty();
    if (seeded > 0) {
      console.log(`[Bootstrap] Seeded ${seeded} pre-vetted sources into SourceRegistry.`);
    }

    // Start Server
    app.listen(port, () => {
      console.log(`Scout Backend Server started on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap the Scout Backend application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  await db.disconnect();
  await redis.disconnect();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

bootstrap();
