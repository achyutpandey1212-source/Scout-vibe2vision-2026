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
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
