// app/timer/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudyTimerPage() {
  const [seconds, setSeconds] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && intervalRef.current == null) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    if (!running && intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="p-6">
      <Card className="max-w-md">
        <CardHeader><CardTitle>Study Timer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-5xl font-semibold tabular-nums">{mm}:{ss}</div>
          <div className="flex gap-3">
            <Button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</Button>
            <Button variant="outline" onClick={() => setSeconds(0)} disabled={running}>Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}