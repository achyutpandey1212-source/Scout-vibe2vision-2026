import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stage1Discovery } from './stage1';
import { DiscoveryContext } from '../types/query.types';

// Mock model
const mockLean = vi.fn().mockResolvedValue([
  {
    domain: 'wellfound.com',
    organization: 'Wellfound Startups',
    homepage: 'https://wellfound.com',
    strategy: 'search',
    defaultTags: ['startup', 'tech'],
    trustScore: 80,
    priority: 'medium',
    nextCrawlAt: new Date(),
  },
]);

const mockSort = vi.fn().mockReturnValue({
  lean: mockLean,
});

const mockFind = vi.fn().mockReturnValue({
  sort: mockSort,
});

vi.mock('../sources/source-registry.model', () => {
  return {
    SourceRegistryModel: {
      find: mockFind,
    },
  };
});

vi.mock('../search/tavily.client', () => {
  return {
    TavilyClient: class {
      search = vi.fn().mockResolvedValue({
        results: [
          {
            url: 'https://wellfound.com/jobs/1',
            title: 'Mock Job',
            content: 'Mock Job details',
          },
        ],
      });
    },
  };
});

vi.mock('../sources/scheduler-cursor.model', () => {
  return {
    SchedulerCursorModel: {
      findOne: vi.fn().mockResolvedValue({ cursorIndex: 0 }),
      updateOne: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock('../query-engine/opportunity-query-planner', () => {
  return {
    OpportunityQueryPlanner: {
      plan: vi.fn().mockResolvedValue({
        queries: [{ query: 'wellfound summer intern' }],
        tier: 'Tier-1',
      }),
    },
  };
});

describe('Stage1Discovery category routing', () => {
  const stage1 = new Stage1Discovery();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries startup ecosystems when STARTUP_INTERNSHIPS runCategory is selected', async () => {
    const context: any = {
      runMode: 'category',
      runCategory: 'STARTUP_INTERNSHIPS',
      categories: ['STARTUP_INTERNSHIPS'],
    };

    await stage1.execute(context, { skipSearch: true });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { category: 'STARTUP_INTERNSHIPS' },
          {
            category: 'INTERNSHIPS',
            ecosystemType: { $in: ['STARTUP', 'INCUBATOR'] },
          },
        ],
      }),
    );
  });

  it('resolves exactly one seed candidate URL per domain in custom runMode', async () => {
    const context: any = {
      runMode: 'custom',
      runCustomDomains: ['devfolio.co', 'internshala.com'],
    };

    const candidates = await stage1.execute(context);
    expect(candidates.length).toBe(2);
    expect(candidates[0].url).toBe('https://devfolio.co');
    expect(candidates[1].url).toBe('https://internshala.com');
  });
});
