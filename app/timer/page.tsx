// app/timer/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Clock, BookOpen, Star } from 'lucide-react';

interface StudySession {
  id: string;
  name: string;
  subject: string;
  targetMinutes: number;
  elapsedSeconds: number;
  isActive: boolean;
  completed: boolean;
  notes: string;
  focusRating?: number;
}

interface Material {
  id: string;
  title: string;
  type: string;
}

interface Goal {
  id: string;
  title: string;
  type: string;
  completed: boolean;
}

export default function StudyTimerPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const intervalRef = useRef<number | null>(null);
  
  // New session form state
  const [newSession, setNewSession] = useState({
    name: '',
    subject: '',
    targetMinutes: 25,
    notes: '',
    materialId: '',
    goalId: ''
  });
  
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const isRunning = activeSession?.isActive || false;
  
  useEffect(() => {
    loadMaterials();
    loadGoals();
  }, []);
  
  useEffect(() => {
    if (isRunning && intervalRef.current == null) {
      intervalRef.current = window.setInterval(() => {
        setSessions(prev => prev.map(session => 
          session.id === activeSessionId && session.isActive
            ? { ...session, elapsedSeconds: session.elapsedSeconds + 1 }
            : session
        ));
      }, 1000);
    }
    if (!isRunning && intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, activeSessionId]);
  
  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };
  
  const loadGoals = async () => {
    try {
      const response = await fetch('/api/goals', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };
  
  const createSession = () => {
    if (!newSession.name.trim() || !newSession.subject.trim()) {
      toast.error('Please fill in session name and subject');
      return;
    }
    
    const session: StudySession = {
      id: Date.now().toString(),
      name: newSession.name,
      subject: newSession.subject,
      targetMinutes: newSession.targetMinutes,
      elapsedSeconds: 0,
      isActive: false,
      completed: false,
      notes: newSession.notes
    };
    
    setSessions(prev => [...prev, session]);
    setActiveSessionId(session.id);
    setShowNewSessionForm(false);
    setNewSession({ name: '', subject: '', targetMinutes: 25, notes: '', materialId: '', goalId: '' });
    toast.success(`Session "${session.name}" created!`);
  };
  
  const startSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? { ...session, isActive: true }
        : { ...session, isActive: false }
    ));
    setActiveSessionId(sessionId);
  };
  
  const pauseSession = () => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId
        ? { ...session, isActive: false }
        : session
    ));
  };
  
  const stopSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const elapsedMinutes = Math.floor(session.elapsedSeconds / 60);
    
    if (elapsedMinutes > 0) {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'custom',
            duration: elapsedMinutes,
            plannedDuration: session.targetMinutes,
            notes: `${session.name} - ${session.subject}${session.notes ? ': ' + session.notes : ''}`,
            tags: [session.subject],
            goalId: newSession.goalId || undefined,
            materialIds: newSession.materialId ? [newSession.materialId] : []
          })
        });
        
        toast.success(`Session saved! ${elapsedMinutes} minutes of study time recorded.`);
      } catch (error) {
        console.error('Error saving session:', error);
        toast.error('Failed to save session');
      }
    }
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };
  
  const resetSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? { ...session, elapsedSeconds: 0, isActive: false }
        : session
    ));
  };
  
  const rateSession = (sessionId: string, rating: number) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? { ...session, focusRating: rating }
        : session
    ));
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getProgressPercentage = (session: StudySession) => {
    return Math.min(100, (session.elapsedSeconds / (session.targetMinutes * 60)) * 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Study Timer
        </motion.h1>
        <Button onClick={() => setShowNewSessionForm(true)}>
          + New Session
        </Button>
      </div>

      {/* New Session Form */}
      {showNewSessionForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowNewSessionForm(false)}
        >
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Study Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g., Math Chapter 5"
                  value={newSession.name}
                  onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-minutes">Target Duration (minutes)</Label>
                <Input
                  id="target-minutes"
                  type="number"
                  min="1"
                  max="480"
                  value={newSession.targetMinutes}
                  onChange={(e) => setNewSession({ ...newSession, targetMinutes: parseInt(e.target.value) || 25 })}
                />
              </div>
              
              {materials.length > 0 && (
                <div className="space-y-2">
                  <Label>Related Material (optional)</Label>
                  <Select value={newSession.materialId} onValueChange={(value) => setNewSession({ ...newSession, materialId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a study material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {goals.length > 0 && (
                <div className="space-y-2">
                  <Label>Related Goal (optional)</Label>
                  <Select value={newSession.goalId} onValueChange={(value) => setNewSession({ ...newSession, goalId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.filter(g => !g.completed).map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={createSession} className="flex-1">Create Session</Button>
                <Button variant="outline" onClick={() => setShowNewSessionForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Sessions */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-600 mb-4">Create your first study session to get started!</p>
            <Button onClick={() => setShowNewSessionForm(true)}>
              + Create Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${session.id === activeSessionId ? 'ring-2 ring-blue-500' : ''}`}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {session.subject}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timer Display */}
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-primary">
                      {formatTime(session.elapsedSeconds)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Target: {session.targetMinutes} min
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage(session))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getProgressPercentage(session) >= 100
                            ? 'bg-green-500'
                            : session.isActive
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${getProgressPercentage(session)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex gap-2">
                    {session.isActive ? (
                      <Button onClick={pauseSession} size="sm" className="flex-1">
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={() => startSession(session.id)} size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    <Button
                      onClick={() => resetSession(session.id)}
                      variant="outline"
                      size="sm"
                      disabled={session.isActive}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => stopSession(session.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Focus Rating */}
                  {session.elapsedSeconds > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Focus Rating</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => rateSession(session.id, rating)}
                            className={`p-1 rounded transition-colors ${
                              session.focusRating && session.focusRating >= rating
                                ? 'text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Session Notes */}
                  {session.notes && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {session.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
