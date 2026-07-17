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
            ecosystemType: { $in: ['STARTUP', 'INCUBATOR', 'VC_PORTFOLIO'] },
          },
        ],
      }),
    );
  });
});
