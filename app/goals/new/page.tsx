// app/goals/new/page.tsx
'use client';

import React, { useState } from 'react';

export default function NewGoalPage() {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<number>(120);
  const [unit, setUnit] = useState('minutes');

  return (
    <div className="p-6 max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">Create Goal</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Target</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={target} onChange={(e) => setTarget(Number(e.currentTarget.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium">Unit</label>
            <select className="mt-1 w-full rounded border px-3 py-2" value={unit} onChange={(e) => setUnit(e.currentTarget.value)}>
              <option value="minutes">minutes</option>
              <option value="materials">materials</option>
              <option value="flashcards">flashcards</option>
              <option value="sessions">sessions</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-600">Goal saving API can be wired similarly to notes when ready.</div>
      </div>
    </div>
  );
}