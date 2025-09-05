// app/calendar/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
] as const;

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekday(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  const total = useMemo(() => daysInMonth(year, month), [year, month]);
  const pad = useMemo(() => firstWeekday(year, month), [year, month]);
  const cells = useMemo(() => {
    const leading = Array.from({ length: pad }).map((_, i) => ({ key: `l-${i}`, day: null as number | null }));
    const days = Array.from({ length: total }).map((_, i) => ({ key: `d-${i+1}`, day: i + 1 }));
    // Pad to full weeks (42 cells)
    const all = [...leading, ...days];
    while (all.length % 7 !== 0) {
      all.push({ key: `t-${all.length}`, day: null });
    }
    return all;
  }, [pad, total]);

  function prevMonth() {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    if (month === 0) setYear((y) => y - 1);
  }

  function nextMonth() {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    if (month === 11) setYear((y) => y + 1);
  }

  function setMonthIndex(idx: number) {
    setMonth(idx);
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">«</Button>
            <Button variant="outline" onClick={prevMonth} aria-label="Previous month">‹</Button>
            <div className="px-3 py-2 rounded border text-sm">
              {MONTHS[month]} {year}
            </div>
            <Button variant="outline" onClick={nextMonth} aria-label="Next month">›</Button>
            <Button variant="outline" onClick={() => setYear((y) => y + 1)} aria-label="Next year">»</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 font-medium">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {cells.map((c) => {
              const isToday = c.day != null
                && c.day === today.getDate()
                && month === today.getMonth()
                && year === today.getFullYear();
              return (
                <div
                  key={c.key}
                  className={`rounded border py-3 text-sm ${c.day ? 'bg-white dark:bg-gray-800' : 'bg-transparent border-transparent'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {c.day ?? ''}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((m, idx) => (
              <Button key={m} size="sm" variant={idx === month ? 'default' : 'outline'} onClick={() => setMonthIndex(idx)}>
                {m.slice(0, 3)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}