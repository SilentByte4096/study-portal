// components/dashboard/Dashboard.tsx
'use client';

import React from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClockIcon,
  DocumentTextIcon,
  BookOpenIcon,
  FolderIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  const { user } = useAuth();
  const { materials, notes, decks, sessions, goals, getStats } = useAppData();
  
  const stats = getStats();
  const recentMaterials = materials.slice(0, 3);
  const activeGoals = goals.filter(goal => !goal.completed).slice(0, 2);
  const recentSessions = sessions.slice(-3).reverse();

  const statCards = [
    {
      title: 'Study Time Today',
      value: `${Math.floor(stats.todayStudyTime / 60)}h ${stats.todayStudyTime % 60}m`,
      icon: ClockIcon,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Materials',
      value: stats.totalMaterials.toString(),
      icon: FolderIcon,
      color: 'bg-green-500',
      change: '+3 new',
      trend: 'up'
    },
    {
      title: 'Flashcards',
      value: stats.totalFlashcards.toString(),
      icon: BookOpenIcon,
      color: 'bg-purple-500',
      change: '+15 cards',
      trend: 'up'
    },
    {
      title: 'Study Streak',
      value: `${stats.studyStreak} days`,
      icon: FireIcon,
      color: 'bg-orange-500',
      change: stats.studyStreak > 0 ? 'Active!' : 'Start today',
      trend: stats.studyStreak > 0 ? 'up' : 'neutral'
    }
  ];

  const quickActions = [
    {
      title: 'Add Study Material',
      description: 'Upload PDFs, docs, or add links',
      href: '/materials/upload',
      icon: FolderIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Create Note',
      description: 'Write notes for your studies',
      href: '/notes/new',
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      title: 'New Flashcard Deck',
      description: 'Create flashcards for memorization',
      href: '/flashcards/new',
      icon: BookOpenIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Start Study Timer',
      description: 'Begin a focused study session',
      href: '/timer',
      icon: ClockIcon,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-0 text-white">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                {/* FIX: pass undefined instead of null to src */}
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User'} />
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-blue-100">
                  Ready to continue your learning journey?
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ClockIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">This Week</span>
                </div>
                <span className="text-2xl font-bold">{Math.floor(stats.weekStudyTime / 60)}h {stats.weekStudyTime % 60}m</span>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TrophyIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Goals</span>
                </div>
                <span className="text-2xl font-bold">{activeGoals.length}</span>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FireIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Streak</span>
                </div>
                <span className="text-2xl font-bold">{stats.studyStreak} days</span>
              </div>
            </div>
            
            {stats.studyStreak > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/20 rounded-lg p-3">
                <FireIcon className="h-5 w-5 text-orange-200" />
                <span className="text-sm font-medium">
                  {/* FIX: escape apostrophe */}
                  Amazing! You&apos;re on a {stats.studyStreak} day study streak! Keep it up!
                </span>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="flex items-center gap-1">
                  {stat.trend === 'up' && <ArrowUpIcon className="h-3 w-3 text-green-600" />}
                  <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/materials">View All →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-4">
                    <div className={`${action.color} p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Materials */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Materials
            </h2>
            <Link href="/materials" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium">
              View All →
            </Link>
          </div>
          {recentMaterials.length > 0 ? (
            <div className="space-y-3">
              {recentMaterials.map((material) => (
                <div key={material.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FolderIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {material.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.category} • {material.type.toUpperCase()}
                    </p>
                  </div>
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No materials yet</p>
              <Link href="/materials/upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Material
              </Link>
            </div>
          )}
        </div>

        {/* Study Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Goals
            </h2>
            <Link href="/goals" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium">
              View All →
            </Link>
          </div>
          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {goal.title}
                    </h3>
                    <TrophyIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active goals</p>
              <Link href="/goals" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Set Your First Goal
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentSessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Study Sessions
            </h2>
            <Link href="/analytics" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium">
              View Analytics →
            </Link>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <ClockIcon className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {session.materialTitle || 'Study Session'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{session.duration} minutes</span>
                    <span>•</span>
                    <span>{new Date(session.startTime).toLocaleDateString()}</span>
                    {session.rating && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`h-4 w-4 ${i < session.rating! ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}