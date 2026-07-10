import { Response, NextFunction } from 'express';
import { firebase } from '@/config';
import { AuthenticatedRequest, FirebaseClaims } from '../auth/types/auth.types';
import { UserRepository } from '../auth/repository/user.repository';

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

    // Extract Firebase verified claims
    const claims: FirebaseClaims = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      picture: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false,
      provider: decodedToken.firebase?.sign_in_provider || 'google.com',
    };

    req.auth = claims;

    // Fetch matching user from MongoDB
    const dbUser = await UserRepository.findByFirebaseUid(claims.uid);
    if (dbUser) {
      req.dbUser = dbUser;
    }

    // Protect endpoints (except identity sync endpoint) from missing DB profiles
    const isSyncRoute = req.path.endsWith('/sync') || req.originalUrl.endsWith('/sync');
    if (!dbUser && !isSyncRoute) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User does not exist in database. Please sync identity first.',
        },
      });
    }

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
