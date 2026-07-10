import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SCOUT_SHARED_VERSION } from '@scout/shared';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Main status endpoint as requested
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Scout API',
    status: 'running',
    version: 'v1',
  });
});

// A simple health check API endpoint to verify monorepo compilation/module resolution
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sharedVersion: SCOUT_SHARED_VERSION,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Scout Server is running on port ${port}`);
});
