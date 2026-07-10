import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { requireAuth } from '../../middleware/auth';
import { BookmarkModel } from '../models/bookmark.model';
import { OpportunityModel } from '../../discovery/extraction/models/opportunity.model';
import mongoose from 'mongoose';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.dbUser?._id;
    const bookmarks = await BookmarkModel.find({ userId }).populate({
      path: 'opportunityId',
      model: OpportunityModel,
    });
    const opportunities = bookmarks.map((b) => b.opportunityId).filter(Boolean);
    return res.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('List bookmarks error:', error);
    return res
      .status(500)
      .json({ success: false, error: { message: 'Failed to retrieve bookmarks' } });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.dbUser?._id;
    const { opportunityId } = req.body;
    await BookmarkModel.findOneAndUpdate(
      { userId, opportunityId: new mongoose.Types.ObjectId(opportunityId) },
      { userId, opportunityId: new mongoose.Types.ObjectId(opportunityId) },
      { upsert: true },
    );
    return res.json({ success: true, message: 'Bookmark saved' });
  } catch (error) {
    console.error('Add bookmark error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to save bookmark' } });
  }
});

router.delete('/:opportunityId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.dbUser?._id;
    await BookmarkModel.deleteOne({
      userId,
      opportunityId: new mongoose.Types.ObjectId(req.params.opportunityId),
    });
    return res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return res
      .status(500)
      .json({ success: false, error: { message: 'Failed to remove bookmark' } });
  }
});

export const bookmarkRouter = router;
export default bookmarkRouter;
