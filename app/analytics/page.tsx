// app/analytics/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface AnalyticsStats {
  totalMaterials: number;
  totalNotes: number;
  totalFlashcards: number;
  totalDecks: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalStudyTime: number;
  todayStudyTime: number;
  weekStudyTime: number;
  monthStudyTime: number;
  studyStreak: number;
  averageSessionLength: number;
  totalSessions: number;
  overallProgress: number;
  todayStudyTimeFormatted: string;
  weekStudyTimeFormatted: string;
  monthStudyTimeFormatted: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use formatted stats from API
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Study Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today</span>
                <span className="font-medium">{stats.todayStudyTimeFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-medium">{stats.weekStudyTimeFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-medium">{stats.monthStudyTimeFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Avg (7d)</span>
                <span className="font-medium">{dailyAvg}</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Weekly Goal Progress</span>
                <span>{Math.min(100, Math.round((stats.weekStudyTime / 600) * 100))}%</span>
              </div>
              <Progress value={Math.min(100, Math.round((stats.weekStudyTime / 600) * 100))} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Target: 10h per week</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Study Materials</span>
                <span className="font-medium">{stats.totalMaterials}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notes Created</span>
                <span className="font-medium">{stats.totalNotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flashcard Decks</span>
                <span className="font-medium">{stats.totalDecks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Flashcards</span>
                <span className="font-medium">{stats.totalFlashcards}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Study Sessions</span>
                <span className="font-medium">{stats.totalSessions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Study Streak</span>
                <span className="font-medium">{stats.studyStreak} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Session Length</span>
                <span className="font-medium">{stats.averageSessionLength} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Goals</span>
                <span className="font-medium">{stats.activeGoals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed Goals</span>
                <span className="font-medium">{stats.completedGoals}</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{stats.overallProgress}%</span>
              </div>
              <Progress value={stats.overallProgress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Based on active goals</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
