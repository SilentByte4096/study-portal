// lib/auth-utils.ts
import { NextRequest } from 'next/server';
import { prisma } from './db';
import { verify, type JwtPayload } from 'jsonwebtoken';

interface AuthJwtPayload extends JwtPayload {
  userId: string;
  email: string;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  preferences: {
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
};

/**
 * Runtime type guard to ensure a decoded JWT matches AuthJwtPayload.
 */
function isAuthJwtPayload(value: unknown): value is AuthJwtPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.userId === 'string' && typeof v.email === 'string';
}

/**
 * Extracts and verifies the auth token from the request cookies and returns a safe AuthUser shape.
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
    if (!isAuthJwtPayload(decoded)) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { preferences: true },
    });

    if (!user) return null;

    // Build a safe response object without password or sensitive fields
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
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
  } catch (err) {
    // Invalid or expired token, or DB error
    return null;
  }
}