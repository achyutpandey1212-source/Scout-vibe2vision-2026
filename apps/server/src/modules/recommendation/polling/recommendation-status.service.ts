import { RecommendationRepository } from '../repository/recommendation.repository';

export class RecommendationStatusService {
  /**
   * Translates the pack's internal progressPhase into client-friendly messages.
   */
  static getProgressMessage(phase: string | undefined): string {
    switch (phase) {
      case 'RETRIEVING':
        return 'Preparing your recommendations...';
      case 'FILTERING':
        return 'Analyzing eligibility constraints...';
      case 'SCORING':
        return 'Matching your profile...';
      case 'DIVERSIFYING':
        return 'Finding hidden opportunities...';
      case 'PERSONALIZING':
        return "Building today's mission...";
      case 'BUILDING_PACK':
        return 'Almost ready...';
      case 'COMPLETED':
        return 'Ready.';
      default:
        return 'Starting...';
    }
  }

  /**
   * Retrieves the current generation status, progress message, and estimated completion.
   */
  static async getProgress(userId: string): Promise<{
    status: 'READY' | 'GENERATING' | 'FAILED' | 'NO_PACK' | 'EXPIRED';
    progressPhase?: string;
    message: string;
  }> {
    const latestPack = await RecommendationRepository.findLatestByUser(userId);

    if (!latestPack) {
      return { status: 'NO_PACK', message: 'No recommendations generated yet.' };
    }

    const message = this.getProgressMessage(latestPack.progressPhase);

    return {
      status: latestPack.status,
      progressPhase: latestPack.progressPhase,
      message,
    };
  }
}
