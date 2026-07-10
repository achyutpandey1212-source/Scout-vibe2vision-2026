import { Request, Response, NextFunction } from 'express';
import { firebase } from '@/config';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization token provided',
      },
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const auth = firebase.getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Firebase auth verification failed:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authorization token',
      },
    });
  }
}
