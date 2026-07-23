import { UserRepository } from '../repository/user.repository';
import { FirebaseClaims } from '../types/auth.types';
import { IUser } from '../models/user.model';

export class AuthService {
  /**
   * Synchronizes the database User profile with the verified Firebase claims.
   * Creates the user profile if it does not already exist.
   */
  static async syncUser(claims: FirebaseClaims): Promise<IUser> {
    let sanitizedEmail = claims.email;
    if (!sanitizedEmail || sanitizedEmail.trim() === '' || claims.provider === 'anonymous') {
      sanitizedEmail = `anonymous_${claims.uid}@scout.guest`;
    }

    const user = await UserRepository.upsertUser(claims.uid, {
      email: sanitizedEmail,
      displayName: claims.name || 'Scout User',
      photoURL: claims.picture,
      emailVerified: claims.emailVerified,
      provider: claims.provider,
    });

    return user;
  }
}
