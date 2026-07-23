import { Response } from 'express';
import { AdminUserService } from '../services/admin-user.service';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';

export class AdminUserController {
  /**
   * GET /api/v1/admin/users
   * Returns list of all registered users with search, filters, and sorting.
   */
  static async listUsers(req: any, res: Response) {
    try {
      const { search, authProvider, recStatus, profileCompletion, role, sortBy } = req.query;
      const users = await AdminUserService.listUsers({
        search: search as string,
        authProvider: authProvider as string,
        recStatus: recStatus as string,
        profileCompletion: profileCompletion as string,
        role: role as string,
        sortBy: sortBy as string,
      });

      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (err: any) {
      console.error('[AdminUserController] List users failed:', err.message);
      return res.status(500).json({
        success: false,
        error: { message: err.message || 'Failed to list users' },
      });
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   * Returns deep user details for the side drawer view.
   */
  static async getUserDetails(req: any, res: Response) {
    try {
      const userId = req.params.id;
      const details = await AdminUserService.getUserDetails(userId);
      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err: any) {
      console.error('[AdminUserController] Get user details failed:', err.message);
      return res.status(404).json({
        success: false,
        error: { message: err.message || 'User details not found' },
      });
    }
  }

  /**
   * DELETE /api/v1/admin/users/:id
   * Executes cascading deletion of the target user account.
   */
  static async deleteUser(req: any, res: Response) {
    try {
      const targetUserId = req.params.id;
      const currentAdminEmailOrId = req.dbUser ? req.dbUser._id.toString() : undefined;

      const result = await DeleteUserUseCase.execute(targetUserId, currentAdminEmailOrId);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
        data: result,
      });
    } catch (err: any) {
      console.error('[AdminUserController] Delete user failed:', err.message);
      return res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to delete user' },
      });
    }
  }
}
