// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verify, type JwtPayload } from 'jsonwebtoken';

interface AuthJwtPayload extends JwtPayload {
  userId: string;
  email: string;
}

type PreferencesResponse = {
  id: string;
  userId: string;
  theme: string;
  studyGoalMinutes: number;
  notifications: boolean;
  emailNotifications: boolean;
  defaultView: string;
  autoSave: boolean;
  pomodoroFocus: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  createdAt: Date;
  updatedAt: Date;
} | null;

type UserResponse = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  preferences: PreferencesResponse;
};

function isAuthJwtPayload(value: unknown): value is AuthJwtPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.userId === 'string' && typeof v.email === 'string';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');

    if (!isAuthJwtPayload(decoded)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      preferences: user.preferences
        ? {
            id: user.preferences.id,
            userId: user.preferences.userId,
            theme: user.preferences.theme,
            studyGoalMinutes: user.preferences.studyGoalMinutes,
            notifications: user.preferences.notifications,
            emailNotifications: user.preferences.emailNotifications,
            defaultView: user.preferences.defaultView,
            autoSave: user.preferences.autoSave,
            pomodoroFocus: user.preferences.pomodoroFocus,
            pomodoroBreak: user.preferences.pomodoroBreak,
            pomodoroLongBreak: user.preferences.pomodoroLongBreak,
            createdAt: user.preferences.createdAt,
            updatedAt: user.preferences.updatedAt,
          }
        : null,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}