'use client';

import React from 'react';
import { OpportunityCard, OpportunityCardProps } from './OpportunityCard';

export type FeaturedOpportunityCardProps = Omit<OpportunityCardProps, 'variant'>;

export const FeaturedOpportunityCard: React.FC<FeaturedOpportunityCardProps> = (props) => {
  return <OpportunityCard {...props} variant="featured" slot="perfectMatch" />;
};
