import React from 'react';

interface MatchScoreProps {
  score: number;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ score }) => {
  // Colour mapping per score tier: high score gets accent (violet), lower gets secondary
  const isHighMatch = score >= 85;

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div
        className={`
          flex items-center justify-center font-sans text-xs font-semibold px-2 py-1 rounded-md
          ${
            isHighMatch
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-accent/40 text-secondary border border-border/80'
          }
        `}
      >
        {score}%
      </div>
      <span className="text-[10px] uppercase font-semibold text-secondary/60 tracking-wider">
        Match
      </span>
    </div>
  );
};
