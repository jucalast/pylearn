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

    const { language } = await request.json();

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    // Finalizar qualquer sessão ativa do usuário
    await prisma.studySession.updateMany({
      where: {
        userId: user.userId,
        isActive: true
      },
      data: {
        isActive: false,
        endTime: new Date()
      }
    });

    // Criar nova sessão de estudo
    const studySession = await prisma.studySession.create({
      data: {
        userId: user.userId,
        language,
        startTime: new Date(),
        isActive: true,
        duration: 0
      }
    });

    console.log('🎯 [STUDY-SESSION] Started new session:', {
      sessionId: studySession.id,
      userId: user.userId,
      language,
      startTime: studySession.startTime
    });

    return NextResponse.json({
      success: true,
      sessionId: studySession.id,
      startTime: studySession.startTime
    });

  } catch (error) {
    console.error('❌ [STUDY-SESSION] Error starting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
