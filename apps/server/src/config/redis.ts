import Redis from 'ioredis';
import { env } from './env';

class RedisManager {
  private client: Redis | null = null;
  private isConnected = false;

  connect(): void {
    if (this.client) {
      return;
    }

    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        console.error('❌ Redis connection error:', err);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        console.log('⚠️ Redis connection ended');
      });
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      this.connect();
    }
    return this.client!;
  }

  async getHealth(): Promise<'ok' | 'error'> {
    if (!this.client || !this.isConnected) {
      return 'error';
    }
    try {
      const ping = await this.client.ping();
      return ping === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error during Redis disconnect:', error);
    }
  }
}

export const redis = new RedisManager();
