import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // ─── Infrastructure ──────────────────────────────────────────────────────────
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI is required for database connection',
  }),
  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required for caching',
  }),

  // ─── Firebase Auth ───────────────────────────────────────────────────────────
  FIREBASE_PROJECT_ID: z.string({
    required_error: 'FIREBASE_PROJECT_ID is required for auth validation',
  }),
  FIREBASE_CLIENT_EMAIL: z.string({
    required_error: 'FIREBASE_CLIENT_EMAIL is required for Firebase Admin SDK',
  }),
  FIREBASE_PRIVATE_KEY: z.string({
    required_error: 'FIREBASE_PRIVATE_KEY is required for Firebase Admin SDK API access',
  }),

  // ─── Frontend ────────────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().optional(),
  CLIENT_URL: z.string().optional(),

  // ─── Discovery Engine — Provider Selection ────────────────────────────────────
  DISCOVERY_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
  DISCOVERY_MODEL: z.string().default('gemini-2.5-flash'),
  DISCOVERY_FALLBACK_PROVIDER: z.enum(['gemini', 'groq']).optional(),
  DISCOVERY_FALLBACK_MODEL: z.string().optional(),

  // ─── Discovery Engine — API Key Pools ────────────────────────────────────────
  // Comma-separated. e.g. DISCOVERY_GEMINI_API_KEYS=key1,key2,key3
  DISCOVERY_GEMINI_API_KEYS: z.string().optional(),
  DISCOVERY_GROQ_API_KEYS: z.string().optional(),
  DISCOVERY_FIRECRAWL_API_KEYS: z.string().optional(),
  DISCOVERY_TAVILY_API_KEYS: z.string().optional(),

  // ─── Recommendation Engine — Provider Selection ───────────────────────────────
  RECOMMENDATION_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
  RECOMMENDATION_MODEL: z.string().default('gemini-1.5-flash'),
  RECOMMENDATION_FALLBACK_PROVIDER: z.enum(['gemini', 'groq']).optional(),
  RECOMMENDATION_FALLBACK_MODEL: z.string().optional(),

  // ─── Recommendation Engine — API Key Pools ────────────────────────────────────
  // Comma-separated. e.g. RECOMMENDATION_GEMINI_API_KEYS=key1,key2
  RECOMMENDATION_GEMINI_API_KEYS: z.string().optional(),
  RECOMMENDATION_GROQ_API_KEYS: z.string().optional(),

  // ─── Admin ───────────────────────────────────────────────────────────────────
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_SESSION_SECRET: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
