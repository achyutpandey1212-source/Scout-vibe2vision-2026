import mongoose from 'mongoose';
import { env } from './env';

class DatabaseManager {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        console.log('✅ MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        this.isConnected = false;
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        console.log('⚠️ MongoDB disconnected');
      });

      await mongoose.connect(env.MONGODB_URI);
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error during MongoDB disconnect:', error);
    }
  }

  getHealth(): 'ok' | 'error' {
    return mongoose.connection.readyState === 1 ? 'ok' : 'error';
  }
}

export const db = new DatabaseManager();
