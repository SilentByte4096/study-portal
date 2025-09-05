// app/goals/page.tsx
'use client';

import React from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Goal = {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  completed?: boolean;
  deadline?: string | Date | null;
};

function pct(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export default function GoalsPage() {
  const { goals } = useAppData();
  const goalsList = goals as Goal[];

  const active: Goal[] = goalsList.filter((g) => !g.completed);
  const completed: Goal[] = goalsList.filter((g) => !!g.completed);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals</h1>
        <Link href="/goals/new">
          <Button>Create Goal</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {active.length === 0 ? (
            <div className="text-sm text-muted-foreground">No active goals.</div>
          ) : (
            active.map((g) => {
              const percent = pct(g.current, g.target);
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{g.title}</div>
                    <div className="text-muted-foreground">{percent}%</div>
                  </div>
                  <Progress value={percent} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {g.current} / {g.target} {g.unit}
                    </span>
                    {g.deadline && (
                      <span>Due: {new Date(g.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.map((g) => (
              <div key={g.id} className="text-sm">{g.title}</div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}