import { defineConfig } from 'vitest/config';
import path from 'path';

// Set dummy environment variables to pass server config validation during unit tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/scout-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.FIREBASE_PROJECT_ID = 'scout-test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'scout-test@example.com';
process.env.FIREBASE_PRIVATE_KEY =
  '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7\n-----END PRIVATE KEY-----';

export default defineConfig({
  test: {
    alias: {
      '@': path.resolve(__dirname, './apps/server/src'),
    },
  },
});
