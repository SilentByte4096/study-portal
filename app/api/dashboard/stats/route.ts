// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all stats in parallel
    const [
      totalMaterials,
      totalNotes,
      totalFlashcards,
      totalDecks,
      studySessions,
      goals
    ] = await Promise.all([
      // Materials count
      prisma.studyMaterial.count({
        where: { userId: user.id }
      }),
      // Notes count
      prisma.note.count({
        where: { userId: user.id }
      }),
      // Flashcards count
      prisma.flashcard.count({
        where: { 
          deck: { userId: user.id } 
        }
      }),
      // Decks count
      prisma.flashcardDeck.count({
        where: { userId: user.id }
      }),
      // Study sessions for time calculations
      prisma.studySession.findMany({
        where: { 
          userId: user.id,
          completed: true 
        },
        select: {
          duration: true,
          startedAt: true
        }
      }),
      // Goals
      prisma.goal.findMany({
        where: { userId: user.id },
        select: {
          completed: true,
          target: true,
          current: true
        }
      })
    ]);

    // Calculate study time statistics
    const totalStudyTime = studySessions.reduce((sum, session) => sum + session.duration, 0);
    
    const todayStudyTime = studySessions
      .filter(session => new Date(session.startedAt) >= today)
      .reduce((sum, session) => sum + session.duration, 0);
    
    const weekStudyTime = studySessions
      .filter(session => new Date(session.startedAt) >= weekAgo)
      .reduce((sum, session) => sum + session.duration, 0);
    
    const monthStudyTime = studySessions
      .filter(session => new Date(session.startedAt) >= monthAgo)
      .reduce((sum, session) => sum + session.duration, 0);

    // Calculate study streak (consecutive days with sessions)
    // First, create a set of unique study dates for efficient lookup
    const studyDates = new Set(
      studySessions.map(session => {
        const sessionDate = new Date(session.startedAt);
        // Convert to YYYY-MM-DD format for consistent comparison
        return sessionDate.toISOString().split('T')[0];
      })
    );
    
    let studyStreak = 0;
    const todayString = today.toISOString().split('T')[0];
    let checkDate = new Date(today);
    let isFirstDay = true;
    
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      const hasStudySession = studyDates.has(dateString);
      
      if (hasStudySession) {
        studyStreak++;
      } else {
        // If it's today (first iteration) and no session, don't break streak yet
        // This gives users the benefit of the doubt for the current day
        if (isFirstDay && dateString === todayString) {
          // Continue to yesterday
        } else {
          // Break the streak on first day without study session (excluding today)
          break;
        }
      }
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
      isFirstDay = false;
      
      // Prevent infinite loop (max 2 years of streak)
      if (studyStreak > 730) break;
    }

    // Calculate average session length
    const averageSessionLength = studySessions.length > 0 
      ? Math.round(totalStudyTime / studySessions.length) 
      : 0;

    // Active goals count
    const activeGoals = goals.filter(goal => !goal.completed).length;
    const completedGoals = goals.filter(goal => goal.completed).length;

    // Calculate overall progress percentage
    const overallProgress = goals.length > 0 
      ? Math.round(goals.reduce((sum, goal) => {
          const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
          return sum + Math.min(progress, 100);
        }, 0) / goals.length)
      : 0;

    const stats = {
      // Current counts
      totalMaterials,
      totalNotes,
      totalFlashcards,
      totalDecks,
      totalGoals: goals.length,
      activeGoals,
      completedGoals,
      
      // Study time (in minutes)
      totalStudyTime,
      todayStudyTime,
      weekStudyTime,
      monthStudyTime,
      
      // Other metrics
      studyStreak,
      averageSessionLength,
      totalSessions: studySessions.length,
      overallProgress,
      
      // Formatted display values
      todayStudyTimeFormatted: `${Math.floor(todayStudyTime / 60)}h ${todayStudyTime % 60}m`,
      weekStudyTimeFormatted: `${Math.floor(weekStudyTime / 60)}h ${weekStudyTime % 60}m`,
      monthStudyTimeFormatted: `${Math.floor(monthStudyTime / 60)}h ${monthStudyTime % 60}m`,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
