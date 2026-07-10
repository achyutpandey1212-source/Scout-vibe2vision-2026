import { UserModel, IUser } from '../models/user.model';

export class UserRepository {
  static async findByFirebaseUid(uid: string): Promise<IUser | null> {
    return await UserModel.findOne({ firebaseUid: uid });
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    return await UserModel.findOne({ email });
  }

  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    return await UserModel.create(userData);
  }

  static async updateLastLogin(uid: string): Promise<IUser | null> {
    const now = new Date();
    return await UserModel.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { lastLoginAt: now, lastSeenAt: now } },
      { returnDocument: 'after' },
    );
  }

  /**
   * Performs an atomic or clean upsert of a user based on Firebase claims.
   * If user doesn't exist, they are created. Otherwise, display name, photo,
   * email verification, lastLoginAt, and lastSeenAt are updated.
   */
  static async upsertUser(uid: string, data: Partial<IUser>): Promise<IUser> {
    const now = new Date();
    const updateData = {
      displayName: data.displayName || '',
      photoURL: data.photoURL || null,
      emailVerified: data.emailVerified || false,
      lastLoginAt: now,
      lastSeenAt: now,
    };

    return (await UserModel.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $setOnInsert: {
          firebaseUid: uid,
          email: data.email,
          provider: data.provider || 'google.com',
        },
        $set: updateData,
      },
      { upsert: true, returnDocument: 'after' },
    )) as IUser;
  }
}
