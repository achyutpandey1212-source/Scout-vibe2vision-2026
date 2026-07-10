export interface MockNotification {
  id: string;
  type:
    | 'MatchingOpportunity'
    | 'DeadlineApproaching'
    | 'HiddenGemDiscovered'
    | 'RecommendationImproved';
  title: string;
  message: string;
  date: string;
  read: boolean;
  opportunityId?: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'notif-1',
    type: 'MatchingOpportunity',
    title: 'High Match Found',
    message:
      'Google India just posted the Women Techmakers Scholars Program. You have a 96% match score based on your BCA profile.',
    date: '2 hours ago',
    read: false,
    opportunityId: 'opp-wtm-2026',
  },
  {
    id: 'notif-2',
    type: 'DeadlineApproaching',
    title: 'Application Closing Soon',
    message:
      'The Notion PM Fellowship application closes in 3 days. We recommend reviewing requirements and applying.',
    date: '1 day ago',
    read: false,
    opportunityId: 'opp-notion-pm',
  },
  {
    id: 'notif-3',
    type: 'HiddenGemDiscovered',
    title: 'Hidden Gem Discovered',
    message:
      'Scout found an exclusive SWE Headquarter Travel Grant. It has lower application competition indices. Check eligibility.',
    date: '2 days ago',
    read: true,
    opportunityId: 'opp-swe-grant',
  },
  {
    id: 'notif-4',
    type: 'RecommendationImproved',
    title: 'Personalized Feed Updated',
    message:
      'Scout finished parsing 413 sources and updated your recommendations list with 2 new high-match positions.',
    date: '3 days ago',
    read: true,
  },
];
