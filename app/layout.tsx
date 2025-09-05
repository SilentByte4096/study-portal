// app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import AppLayout from '@/components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Study Portal - Organize Your Learning Journey',
  description: 'A comprehensive study management platform to organize materials, create notes, manage flashcards, and track your learning progress.',
}; [2]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppDataProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}