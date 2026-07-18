import { DeadEndDetection, HopGraph, HopNode, MissionPipelineInput } from './hop.types';
import { HopValidator } from './hop-validator';
import {
  classifyUrl,
  getAllowedTransitions,
  getHopPriority,
  getMissionPipeline,
} from './hop-registry';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class HopEngine {
  private readonly validator: HopValidator;
  private readonly visitedUrls: Map<
    string,
    { hopType: HopType; mission: string; depth: number; lastSeen: string; status: string }
  >;

  constructor(validator?: HopValidator) {
    this.validator = validator ?? new HopValidator();
    this.visitedUrls = new Map();
  }

  loadVisitedUrls(
    visited: Map<
      string,
      { hopType: HopType; mission: string; depth: number; lastSeen: string; status: string }
    >,
  ): void {
    this.visitedUrls.clear();
    for (const [key, value] of visited) {
      this.visitedUrls.set(key.toLowerCase(), value);
    }
  }

  getVisitedUrls(): Map<
    string,
    { hopType: HopType; mission: string; depth: number; lastSeen: string; status: string }
  > {
    return this.visitedUrls;
  }

  buildGraph(input: MissionPipelineInput): HopGraph {
    const config = getMissionPipeline(input.mission);
    const pipeline = config?.pipeline ?? ['SEARCH', 'COMPANY', 'CAREERS', 'ATS', 'OPPORTUNITY'];
    const maxDepth = input.maxDepth > 0 ? input.maxDepth : (config?.maxDepth ?? 4);
    const priorityThreshold =
      input.priorityThreshold > 0 ? input.priorityThreshold : (config?.priorityThreshold ?? 70);

    return {
      mission: input.mission,
      start: pipeline[0] ?? 'SEARCH',
      transitions: pipeline.slice(0, -1).map((from, i) => ({
        from,
        to: pipeline[i + 1],
        allowed: true,
      })),
      maxDepth,
      priorityThreshold,
    };
  }

  run(input: MissionPipelineInput): {
    root: HopNode | null;
    stats: Record<string, number>;
    graphJson: Record<string, unknown>;
  } {
    const graph = this.buildGraph(input);
    const stats: Record<string, number> = { queries: input.queries.length };
    const children: HopNode[] = [];

    for (const query of input.queries) {
      const node = this.traverse({
        source: query,
        targetType: graph.start,
        depth: 0,
        discoveredBy: 'SEARCH',
        priority: getHopPriority('SEARCH'),
        reason: `Query: ${query}`,
        confidence: 100,
        graph,
        input,
        stats,
      });
      if (node) children.push(node);
    }

    for (const companyUrl of input.companyUrls) {
      const hopType =
        companyUrl.type === 'ATS' ? 'ATS' : companyUrl.type === 'CAREERS' ? 'CAREERS' : 'COMPANY';
      const existing = this.visitedUrls.get(companyUrl.url.toLowerCase());
      if (existing && existing.status === 'visited') continue;

      const node: HopNode = {
        id: generateId(),
        source: companyUrl.company,
        target: companyUrl.url,
        depth: 1,
        priority: companyUrl.priority,
        reason: `Company-derived ${hopType}`,
        confidence: 90,
        url: companyUrl.url,
        status: existing ? (existing.status as HopNode['status']) : 'pending',
        visitedAt: existing?.lastSeen,
        metadata: { ats: companyUrl.ats, ecosystem: companyUrl.ecosystem },
        children: [],
      };
      children.push(node);
      stats[hopType.toLowerCase() + 's'] = (stats[hopType.toLowerCase() + 's'] ?? 0) + 1;
      this.visitedUrls.set(companyUrl.url.toLowerCase(), {
        hopType,
        mission: input.mission,
        depth: node.depth,
        lastSeen: new Date().toISOString(),
        status: node.status,
      });
    }

    for (const candidate of input.ecosystemCandidates) {
      const classification = classifyUrl(candidate.url, []);
      if (!classification) continue;
      const hopType = classification.hopType;
      const existing = this.visitedUrls.get(candidate.url.toLowerCase());
      if (existing && existing.status === 'visited') continue;

      const node: HopNode = {
        id: generateId(),
        source: candidate.ecosystem ?? 'ECOSYSTEM',
        target: candidate.url,
        depth: 1,
        priority: candidate.priority,
        reason: `Ecosystem candidate`,
        confidence: classification.confidence,
        url: candidate.url,
        status: existing ? (existing.status as HopNode['status']) : 'pending',
        visitedAt: existing?.lastSeen,
        children: [],
      };
      children.push(node);
      stats[hopType.toLowerCase() + 's'] = (stats[hopType.toLowerCase() + 's'] ?? 0) + 1;
      this.visitedUrls.set(candidate.url.toLowerCase(), {
        hopType,
        mission: input.mission,
        depth: node.depth,
        lastSeen: new Date().toISOString(),
        status: node.status,
      });
    }

    const root: HopNode | null =
      children.length > 0
        ? {
            id: generateId(),
            source: input.mission,
            target: graph.start,
            depth: 0,
            priority: getHopPriority(graph.start),
            reason: `Mission root: ${input.mission}`,
            confidence: 100,
            children,
            status: 'visited',
            visitedAt: new Date().toISOString(),
          }
        : null;

    return {
      root,
      stats,
      graphJson: this.toJson(root),
    };
  }

  private traverse(params: {
    source: string;
    targetType: HopType;
    depth: number;
    discoveredBy: string;
    priority: number;
    reason: string;
    confidence: number;
    graph: HopGraph;
    input: MissionPipelineInput;
    stats: Record<string, number>;
  }): HopNode | null {
    const {
      source,
      targetType,
      depth,
      discoveredBy,
      priority,
      reason,
      confidence,
      graph,
      input,
      stats,
    } = params;

    if (depth > graph.maxDepth) return null;
    if (priority < graph.priorityThreshold) {
      stats.skipped = (stats.skipped ?? 0) + 1;
      return {
        id: generateId(),
        source,
        target: targetType,
        depth,
        priority,
        reason: `Priority ${priority} below threshold ${graph.priorityThreshold}`,
        confidence,
        status: 'skipped',
        children: [],
      };
    }

    const key = source.toLowerCase();
    const existing = this.visitedUrls.get(key);
    if (existing && existing.status === 'visited') {
      return {
        id: generateId(),
        source,
        target: targetType,
        depth,
        priority,
        reason,
        confidence,
        status: 'visited',
        visitedAt: existing.lastSeen,
        children: [],
      };
    }

    const deadEnd = this.detectDeadEnd(source, input);
    if (deadEnd.isDeadEnd) {
      stats.deadEnds = (stats.deadEnds ?? 0) + 1;
      this.visitedUrls.set(key, {
        hopType: targetType,
        mission: input.mission,
        depth,
        lastSeen: new Date().toISOString(),
        status: 'dead_end',
      });
      return {
        id: generateId(),
        source,
        target: targetType,
        depth,
        priority,
        reason: deadEnd.reason ?? 'Dead end detected',
        confidence,
        status: 'dead_end',
        children: [],
      };
    }

    this.visitedUrls.set(key, {
      hopType: targetType,
      mission: input.mission,
      depth,
      lastSeen: new Date().toISOString(),
      status: 'visited',
    });

    const node: HopNode = {
      id: generateId(),
      source,
      target: targetType,
      depth,
      priority,
      reason,
      confidence,
      url: source,
      status: 'visited',
      visitedAt: new Date().toISOString(),
      children: [],
    };

    if (targetType === 'OPPORTUNITY') {
      node.status = 'accepted';
      stats.acceptedOpportunities = (stats.acceptedOpportunities ?? 0) + 1;
    }

    const allowedNext = getAllowedTransitions(targetType);
    const discoveredChildren: HopNode[] = [];

    if (targetType === 'PORTFOLIO' || targetType === 'DIRECTORY') {
      const branchSize = Math.min(input.branchExpansionLimit, 50);
      for (let i = 0; i < branchSize; i++) {
        const nextType = allowedNext[0];
        if (!nextType) break;
        const child = this.traverse({
          source: `${source}/branch-${i}`,
          targetType: nextType,
          depth: depth + 1,
          discoveredBy: targetType,
          priority: Math.max(0, priority - 5 - i),
          reason: `Branch expansion from ${targetType}`,
          confidence: Math.max(0, confidence - 2 - i),
          graph,
          input,
          stats,
        });
        if (child) discoveredChildren.push(child);
      }
    }

    const pipeline =
      getMissionPipeline(input.mission)?.pipeline ?? graph.transitions.map((t) => t.to);
    const currentIndex = pipeline.indexOf(targetType);
    if (currentIndex >= 0 && currentIndex + 1 < pipeline.length) {
      const nextType = pipeline[currentIndex + 1];
      if (allowedNext.includes(nextType)) {
        const child = this.traverse({
          source,
          targetType: nextType,
          depth: depth + 1,
          discoveredBy: targetType,
          priority: Math.max(0, priority - 3),
          reason: `Pipeline step: ${nextType}`,
          confidence: Math.max(0, confidence - 1),
          graph,
          input,
          stats,
        });
        if (child) discoveredChildren.push(child);
      }
    }

    node.children = discoveredChildren;
    const typeKey = targetType.toLowerCase() + 's';
    stats[typeKey] = (stats[typeKey] ?? 0) + 1;
    if (node.status === 'visited' && targetType !== 'OPPORTUNITY') {
      stats.visited = (stats.visited ?? 0) + 1;
    }

    return node;
  }

  detectDeadEnd(url: string, input: MissionPipelineInput): DeadEndDetection {
    const lower = url.toLowerCase();
    const deadEndPatterns = getMissionPipeline(input.mission)?.deadEndPatterns ?? [
      '/login',
      '/signin',
      '/auth',
      '/403',
      '/404',
    ];
    for (const pattern of deadEndPatterns) {
      if (lower.includes(pattern)) {
        if (pattern.includes('login') || pattern.includes('signin') || pattern.includes('auth')) {
          return { isDeadEnd: true, reason: 'login_page' };
        }
        if (pattern.includes('404')) return { isDeadEnd: true, reason: '404' };
        if (pattern.includes('403')) return { isDeadEnd: true, reason: 'blocked_robots' };
      }
    }
    return { isDeadEnd: false, reason: null };
  }

  toJson(node: HopNode | null, depth = 0): Record<string, unknown> {
    if (!node) return {};
    const result: Record<string, unknown> = {
      id: node.id,
      source: node.source,
      target: node.target,
      depth: node.depth,
      priority: node.priority,
      reason: node.reason,
      confidence: node.confidence,
      status: node.status,
      url: node.url,
    };
    if (node.children.length > 0) {
      result.children = node.children.map((child) => this.toJson(child, depth + 1));
    }
    return result;
  }
}
