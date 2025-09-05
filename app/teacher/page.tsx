// app/teacher/page.tsx
'use client';

import React from 'react';
import Dashboard from '@/components/dashboard/Dashboard';

export default function TeacherDashboardPage() {
  return (
    <div className="p-0">
      {/* Optionally, you can add a small banner if desired, otherwise reuse Dashboard */}
      <Dashboard />
    </div>
  );
}