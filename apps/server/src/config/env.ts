import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string({
    required_error: 'MONGODB_URI is required for database connection',
  }),
  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required for caching',
  }),
  FIREBASE_PROJECT_ID: z.string({
    required_error: 'FIREBASE_PROJECT_ID is required for auth validation',
  }),
  FIREBASE_CLIENT_EMAIL: z.string({
    required_error: 'FIREBASE_CLIENT_EMAIL is required for Firebase Admin SDK',
  }),
  FIREBASE_PRIVATE_KEY: z.string({
    required_error: 'FIREBASE_PRIVATE_KEY is required for Firebase Admin SDK API access',
  }),
  TAVILY_API_KEY: z.string({
    required_error: 'TAVILY_API_KEY is required for opportunity searches',
  }),
  FIRECRAWL_API_KEY: z.string({
    required_error: 'FIRECRAWL_API_KEY is required for page scraping',
  }),
  FRONTEND_URL: z.string().optional(),
  CLIENT_URL: z.string().optional(),

  // AI Layer - Primary configurations
  DISCOVERY_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
  DISCOVERY_MODEL: z.string().default('gemini-1.5-pro'),
  DISCOVERY_API_KEY: z.string({
    required_error: 'DISCOVERY_API_KEY is required for Discovery Engine',
  }),

  PERSONALIZATION_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
  PERSONALIZATION_MODEL: z.string().default('gemini-1.5-flash'),
  PERSONALIZATION_API_KEY: z.string({
    required_error: 'PERSONALIZATION_API_KEY is required for Personalization Engine',
  }),

  // AI Layer - Optional Fallback configurations
  GROQ_API_KEY: z.string().optional(),

  DISCOVERY_FALLBACK_PROVIDER: z.enum(['gemini', 'groq']).optional(),
  DISCOVERY_FALLBACK_MODEL: z.string().optional(),
  DISCOVERY_FALLBACK_API_KEY: z.string().optional(),

  PERSONALIZATION_FALLBACK_PROVIDER: z.enum(['gemini', 'groq']).optional(),
  PERSONALIZATION_FALLBACK_MODEL: z.string().optional(),
  PERSONALIZATION_FALLBACK_API_KEY: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
