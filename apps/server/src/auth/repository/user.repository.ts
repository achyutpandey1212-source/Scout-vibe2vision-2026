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

  static async updateLastVisited(uid: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ firebaseUid: uid });
    if (!user) return null;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (user.lastVisitedAt && user.lastVisitedAt > fiveMinutesAgo) {
      // Skip excessive writes if visited recently
      return user;
    }

    const now = new Date();
    return await UserModel.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { lastVisitedAt: now } },
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

    // 1. Try finding by firebaseUid first
    let user = await UserModel.findOne({ firebaseUid: uid });

    if (user) {
      // User found by UID, update details
      return (await UserModel.findOneAndUpdate(
        { firebaseUid: uid },
        { $set: updateData },
        { returnDocument: 'after' },
      )) as IUser;
    }

    // 2. If not found by UID, try finding by email to link/merge accounts (prevent dup email error)
    if (data.email && data.email.trim() !== '') {
      user = await UserModel.findOne({ email: data.email });
      if (user) {
        // Link the existing email account to this Firebase UID
        return (await UserModel.findOneAndUpdate(
          { email: data.email },
          {
            $set: {
              firebaseUid: uid,
              provider: data.provider || user.provider || 'google.com',
              ...updateData,
            },
          },
          { returnDocument: 'after' },
        )) as IUser;
      }
    }

    // 3. Neither found, perform insert/upsert
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
