'use client';

import React from 'react';
import { OpportunityCard, OpportunityCardProps } from './OpportunityCard';

export type HiddenGemCardProps = Omit<OpportunityCardProps, 'variant'>;

export const HiddenGemCard: React.FC<HiddenGemCardProps> = (props) => {
  return <OpportunityCard {...props} variant="default" slot="hiddenGem" />;
};
