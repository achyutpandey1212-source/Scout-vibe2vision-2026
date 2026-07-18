import { HopTransition, HopType } from './hop.types';
import { canHop } from './hop-rules';

export class HopValidator {
  validateTransition(from: HopType, to: HopType): HopTransition {
    const allowed = canHop(from, to);
    return {
      from,
      to,
      allowed,
      reason: allowed ? undefined : `Illegal transition from ${from} to ${to}`,
    };
  }

  validateGraph(transitions: HopTransition[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const t of transitions) {
      if (!t.allowed) {
        errors.push(`Illegal transition: ${t.from} -> ${t.to}${t.reason ? ` (${t.reason})` : ''}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  validateDepth(depth: number, maxDepth: number): boolean {
    return depth <= maxDepth;
  }

  validatePriority(priority: number, threshold: number): boolean {
    return priority >= threshold;
  }
}
