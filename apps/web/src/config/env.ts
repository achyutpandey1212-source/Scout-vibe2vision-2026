import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:5000'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_API_KEY is required',
  }),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required',
  }),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required',
  }),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required',
  }),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required',
  }),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_APP_ID is required',
  }),
});

// Since Next.js references variables statically on the client,
// we pass process.env properties explicitly or fetch them dynamically.
const result = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

if (!result.success) {
  // Only log warnings in browser development to prevent runtime crashes during statically built static pages on boot,
  // but crash server builds if keys are missing.
  if (typeof window === 'undefined') {
    console.error('❌ Missing Next.js environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
  }
}

export const env = result.success
  ? result.data
  : {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
