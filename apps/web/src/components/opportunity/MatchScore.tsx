import React from 'react';

interface MatchScoreProps {
  score?: number | null;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ score }) => {
  if (score === undefined || score === null || isNaN(Number(score)) || Number(score) <= 0) {
    return (
      <div className="inline-flex items-center gap-1.5 select-none">
        <div className="flex items-center justify-center font-sans text-xs font-medium px-2.5 py-1 rounded-md bg-secondary/30 text-secondary-foreground/70 border border-border/60">
          Match Pending
        </div>
      </div>
    );
  }

  const numericScore = Math.round(Number(score));
  const isHighMatch = numericScore >= 85;

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
        {numericScore}%
      </div>
      <span className="text-[10px] uppercase font-semibold text-secondary/60 tracking-wider">
        Match
      </span>
    </div>
  );
};
