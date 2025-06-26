import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { checkAndUnlockAchievements } from '../achievements/route';

interface JWTPayload {
  userId: string;
  email: string;
}

function getUserFromToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Calculate XP based on study session duration
function calculateSessionXP(duration: number, language: string): number {
  const baseDurationMinutes = Math.floor(duration / 60); // Convert to minutes
  
  let baseXP = 0;
  
  // Base XP calculation
  if (baseDurationMinutes >= 5) {
    baseXP = Math.min(baseDurationMinutes * 5, 100); // Max 100 XP per session
  } else {
    baseXP = baseDurationMinutes * 2; // Less XP for very short sessions
  }
  
  // Language-specific bonus (optional)
  let multiplier = 1.0;
  
  // Could add language-specific multipliers here
  
  return Math.round(baseXP * multiplier);
}

// Update user streak
async function updateUserStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastStudyDate: true, streak: true }
  });
  
  if (!user) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let newStreak = 1;
  
  if (user.lastStudyDate) {
    const lastStudyDate = new Date(user.lastStudyDate);
    lastStudyDate.setHours(0, 0, 0, 0);
    
    if (lastStudyDate.getTime() === yesterday.getTime()) {
      // Studied yesterday, continue streak
      newStreak = user.streak + 1;
    } else if (lastStudyDate.getTime() === today.getTime()) {
      // Already studied today, keep current streak
      newStreak = user.streak;
    } else {
      // Gap in studying, reset streak
      newStreak = 1;
    }
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastStudyDate: new Date(),
      streak: newStreak
    }
  });
  
  return newStreak;
}

// POST: Start a new study session
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    // Create new study session
    const studySession = await prisma.studySession.create({
      data: {
        userId: user.userId,
        language,
        duration: 0, // Will be calculated when session ends
        startTime: new Date(),
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: studySession.id,
      message: 'Sessão de estudo iniciada!'
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: End a study session
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, completed = true } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Find the active session
    const session = await prisma.studySession.findFirst({
      where: {
        id: sessionId,
        userId: user.userId,
        isActive: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Active session not found' }, { status: 404 });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000); // Duration in seconds

    // Calculate XP earned
    const xpEarned = completed ? calculateSessionXP(duration, session.language) : 0;

    // Update the session
    await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration,
        xpEarned,
        isActive: false
      }
    });

    if (completed && xpEarned > 0) {
      // Award XP to user
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          totalXP: { increment: xpEarned }
        }
      });

      // Update user level
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.userId }
      });

      if (updatedUser) {
        const newLevel = Math.floor(updatedUser.totalXP / 1000) + 1;
        if (newLevel > updatedUser.level) {
          await prisma.user.update({
            where: { id: user.userId },
            data: { level: newLevel }
          });
        }
      }

      // Update streak
      const newStreak = await updateUserStreak(user.userId);

      // Check for new achievements
      const newAchievements = await checkAndUnlockAchievements(user.userId);

      return NextResponse.json({
        success: true,
        xpEarned,
        duration: Math.round(duration / 60), // Return duration in minutes
        newStreak,
        newAchievements,
        message: `Sessão concluída! +${xpEarned} XP${newAchievements.length > 0 ? ` | ${newAchievements.length} nova(s) conquista(s)!` : ''}`
      });
    } else {
      return NextResponse.json({
        success: true,
        xpEarned: 0,
        duration: Math.round(duration / 60),
        message: 'Sessão encerrada.'
      });
    }
  } catch (error) {
    console.error('Error ending study session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get user's study sessions
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const language = url.searchParams.get('language');

    const where: any = { userId: user.userId };
    if (language) {
      where.language = language;
    }

    const sessions = await prisma.studySession.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      select: {
        id: true,
        language: true,
        startTime: true,
        endTime: true,
        duration: true,
        xpEarned: true,
        isActive: true
      }
    });

    // Calculate some statistics
    const totalSessions = sessions.length;
    const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageSession = totalSessions > 0 ? totalTime / totalSessions : 0;

    return NextResponse.json({
      sessions: sessions.map(session => ({
        ...session,
        duration: session.duration ? Math.round(session.duration / 60) : null // Convert to minutes
      })),
      stats: {
        totalSessions,
        totalXP,
        totalTimeMinutes: Math.round(totalTime / 60),
        averageSessionMinutes: Math.round(averageSession / 60)
      }
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}