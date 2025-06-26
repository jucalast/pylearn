import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, xpEarned = 0, lessonsCompleted = 0, exercisesCompleted = 0 } = await request.json();

    // Buscar sessão ativa
    let studySession;
    
    if (sessionId) {
      studySession = await prisma.studySession.findFirst({
        where: {
          id: sessionId,
          userId: user.userId,
          isActive: true
        }
      });
    } else {
      // Se não houver sessionId, buscar a sessão ativa mais recente
      studySession = await prisma.studySession.findFirst({
        where: {
          userId: user.userId,
          isActive: true
        },
        orderBy: {
          startTime: 'desc'
        }
      });
    }

    if (!studySession) {
      return NextResponse.json({ error: 'No active study session found' }, { status: 404 });
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - studySession.startTime.getTime()) / 1000); // Duration in seconds

    // Atualizar sessão
    const updatedSession = await prisma.studySession.update({
      where: { id: studySession.id },
      data: {
        endTime,
        duration,
        isActive: false,
        xpEarned,
        lessonsCompleted,
        exercisesCompleted
      }
    });

    console.log('🏁 [STUDY-SESSION] Ended session:', {
      sessionId: studySession.id,
      duration: `${Math.round(duration / 60)} minutes`,
      xpEarned,
      lessonsCompleted,
      exercisesCompleted
    });

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        duration: updatedSession.duration,
        xpEarned: updatedSession.xpEarned,
        lessonsCompleted: updatedSession.lessonsCompleted,
        exercisesCompleted: updatedSession.exercisesCompleted,
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime
      }
    });

  } catch (error) {
    console.error('❌ [STUDY-SESSION] Error ending session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
