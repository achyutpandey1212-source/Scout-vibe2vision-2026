'use client';

import React from 'react';
import { Mail, ShieldCheck, MapPin, Award } from 'lucide-react';
import { Card, Typography, Stack, Grid, Chip } from '../ui';

interface ProfileCardProps {
  name: string;
  email: string;
  picture?: string;
  location?: string;
  stage?: string;
  skills?: string[];
  goals?: string[];
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  picture,
  location = 'Not specified',
  stage = 'Not specified',
  skills = [],
  goals = [],
}) => {
  return (
    <Card className="border border-border/80">
      <div className="p-6 md:p-8 space-y-6">
        {/* User identification */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b border-border/40 pb-6 text-center sm:text-left">
          {picture ? (
            <img
              src={picture}
              alt={name}
              className="w-16 h-16 rounded-full border-2 border-primary/20 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-normal text-2xl border-2 border-primary/20 select-none">
              {name.charAt(0)}
            </div>
          )}
          <div className="space-y-1">
            <Typography variant="heading-m" className="font-medium">
              {name}
            </Typography>
            <div className="flex items-center gap-2 text-xs text-secondary/70">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </div>
          </div>
        </div>

        {/* User Metadata Grid */}
        <Grid cols={1} colsSm={2} gap="lg">
          <Stack gap="xs">
            <div className="flex items-center gap-2 text-secondary/65 select-none">
              <MapPin className="w-4 h-4 text-primary" />
              <Typography variant="label" className="text-[10px]">
                Location
              </Typography>
            </div>
            <Typography variant="body" className="font-normal pl-6">
              {location}
            </Typography>
          </Stack>

          <Stack gap="xs">
            <div className="flex items-center gap-2 text-secondary/65 select-none">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <Typography variant="label" className="text-[10px]">
                Career Stage
              </Typography>
            </div>
            <Typography variant="body" className="font-normal pl-6">
              {stage}
            </Typography>
          </Stack>
        </Grid>

        {/* Skills list */}
        <Stack gap="sm" className="pt-2 border-t border-border/40">
          <Typography variant="label" className="text-[10px] text-secondary/60">
            Skills Profile
          </Typography>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Chip key={skill} label={skill} selected />
              ))}
            </div>
          ) : (
            <Typography variant="caption" className="text-secondary/50 italic">
              No skills added yet
            </Typography>
          )}
        </Stack>

        {/* Goals profile */}
        <Stack gap="sm" className="pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-secondary/65 select-none">
            <Award className="w-4 h-4 text-primary" />
            <Typography variant="label" className="text-[10px]">
              Aspirations & Goals
            </Typography>
          </div>
          {goals.length > 0 ? (
            <ul className="space-y-1.5 pl-5 list-disc text-sm font-light text-foreground/80">
              {goals.map((goal, idx) => (
                <li key={idx} className="leading-relaxed">
                  {goal}
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="caption" className="text-secondary/50 italic pl-5">
              No aspirations specified
            </Typography>
          )}
        </Stack>
      </div>
    </Card>
  );
};
