// app/analytics/page.tsx
'use client';

import React from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const { getStats } = useAppData();
  const stats = getStats();

  // Derive only from known fields on StudyStats
  const todayHours = `${Math.floor(stats.todayStudyTime / 60)}h ${stats.todayStudyTime % 60}m`;
  const weekHours = `${Math.floor(stats.weekStudyTime / 60)}h ${stats.weekStudyTime % 60}m`;
  const dailyAvgMin = Math.round(stats.weekStudyTime / 7);
  const dailyAvg = `${Math.floor(dailyAvgMin / 60)}h ${dailyAvgMin % 60}m`;

  return (
    <div className="p-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold"
      >
        Analytics
      </motion.h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Study Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Today: {todayHours}</div>
            <div className="text-sm text-muted-foreground">This Week: {weekHours}</div>
            <div className="text-sm text-muted-foreground">Daily Avg (7d): {dailyAvg}</div>
            {/* Optional visual: show week proportion vs an arbitrary healthy target (e.g., 600 min = 10h) */}
            <div className="pt-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Weekly pacing</span>
                <span>
                  {Math.min(100, Math.round((stats.weekStudyTime / 600) * 100))}%
                </span>
              </div>
              <Progress value={Math.min(100, Math.round((stats.weekStudyTime / 600) * 100))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Materials: {stats.totalMaterials}</div>
            <div className="text-sm text-muted-foreground">Flashcards: {stats.totalFlashcards}</div>
            <div className="text-sm text-muted-foreground">Streak: {stats.studyStreak} days</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
