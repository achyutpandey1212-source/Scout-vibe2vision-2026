import express, { Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { env, db, redis, firebase } from '@/config';
import { authRouter } from './auth';
import { profileRouter } from './profile';
import { recommendationRouter } from './intelligence/recommendation';
import { opportunityRouter } from './discovery/routes/opportunity.routes';
import { bookmarkRouter } from './auth/routes/bookmark.routes';

const app = express();
const port = env.PORT;

const allowedOrigins = ['http://localhost:3000', env.CLIENT_URL, env.FRONTEND_URL].filter(
  (origin): origin is string => Boolean(origin),
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// Configure CORS + preflight handling
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

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

// Register Recommendations Router
app.use('/api/v1/recommendations', recommendationRouter);

// Register Opportunities Router
app.use('/api/v1/opportunities', opportunityRouter);

// Register Bookmarks Router
app.use('/api/v1/bookmarks', bookmarkRouter);

// Bootstrapping the services
async function bootstrap() {
  try {
    // 1. Initialize Firebase Admin
    firebase.initialize();

    // 2. Connect to MongoDB
    await db.connect();

    // 3. Connect to Redis
    redis.connect();

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
