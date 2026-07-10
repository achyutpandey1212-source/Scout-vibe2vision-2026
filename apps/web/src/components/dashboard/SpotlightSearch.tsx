'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, X } from 'lucide-react';
import { OrigamiDecoration, Typography } from '../ui';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, Opportunity } from '@/lib/api';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search bar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Window keyboard listener for escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced API Search
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await opportunitiesApi.list({ q: query, limit: 5 });
        if (res.data?.success) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error('Spotlight search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (id: string) => {
    router.push(ROUTES.OPPORTUNITY(id));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, transform: 'translate3d(0, 10px, 0)' }}
            animate={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
            exit={{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
          >
            {/* Search Input Area */}
            <div className="flex items-center px-4 py-3.5 border-b border-border/40 gap-3">
              <Search
                className={`w-5 h-5 text-secondary/60 shrink-0 ${loading ? 'animate-pulse text-primary' : ''}`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opportunities, companies, scholarships..."
                className="w-full bg-transparent text-sm text-foreground placeholder-secondary/50 border-0 outline-none p-0 focus:ring-0"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-full text-secondary/40 hover:bg-accent/40 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Window */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[120px]">
              {query.trim() === '' ? (
                <div className="py-10 text-center space-y-2">
                  <Typography variant="body" className="text-secondary/60 text-xs font-light">
                    Type to search through all matching Scout streams.
                  </Typography>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((opp) => (
                    <button
                      key={opp._id}
                      onClick={() => handleSelect(opp._id)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-accent/45 transition-colors duration-150 flex items-center justify-between gap-4 outline-none focus:bg-accent"
                    >
                      <div className="min-w-0">
                        <Typography
                          variant="heading-s"
                          className="text-xs md:text-sm font-medium truncate"
                        >
                          {opp.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-[10px] text-secondary/70 truncate"
                        >
                          {opp.organization} • {opp.deadline || 'Flexible'}
                        </Typography>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-full">
                        <span className="text-[10px] font-semibold text-primary">Match</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : loading ? (
                <div className="py-10 text-center space-y-2">
                  <Typography
                    variant="body"
                    className="text-secondary/60 text-xs font-light animate-pulse"
                  >
                    Scouting database catalog...
                  </Typography>
                </div>
              ) : (
                // Encouraging search empty state
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="text-secondary/30 shrink-0">
                    <OrigamiDecoration
                      name="butterfly"
                      size={48}
                      floating
                      floatingOffset={3}
                      floatingDuration={4}
                    />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="heading-s" className="text-xs font-medium text-foreground">
                      No matching records found
                    </Typography>
                    <Typography
                      variant="body"
                      className="text-secondary/70 text-xs leading-relaxed max-w-xs mx-auto"
                    >
                      We couldn&apos;t find anything matching your term. Try another keyword.
                    </Typography>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Help */}
            <div className="px-4 py-2 border-t border-border/30 bg-accent/20 flex justify-between items-center text-[10px] text-secondary/45">
              <span>
                Press <kbd className="bg-card px-1 py-0.5 border border-border/80 rounded">ESC</kbd>{' '}
                to exit
              </span>
              <span>ZenKai Ecosystem</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default SpotlightSearch;
