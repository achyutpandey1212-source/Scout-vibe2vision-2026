import crypto from 'crypto';

export class ScoringExperimentsService {
  /**
   * Stably and deterministically maps a user to an A/B test group using their userId.
   * Modulo division of the hashed userId determines Group A vs Group B.
   */
  static assignGroup(userId: string): 'A' | 'B' {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const integerRepresentation = parseInt(hash.substring(0, 8), 16);
    return integerRepresentation % 2 === 0 ? 'A' : 'B';
  }
}
