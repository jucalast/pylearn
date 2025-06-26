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

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with XP and level info
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        totalXP: true,
        level: true,
        streak: true,
        lastStudyDate: true,
        createdAt: true
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get learning profiles with progress
    const learningProfiles = await prisma.learningProfile.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        language: true,
        knowledgeLevel: true,
        xp: true,
        lessonsCompleted: true,
        totalLessons: true,
        progressPercentage: true,
        studyPlan: true
      }
    });

    // Get study sessions for analytics
    const studySessions = await prisma.studySession.findMany({
      where: { userId: user.userId },
      orderBy: { startTime: 'desc' },
      take: 30, // Last 30 sessions
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        xpEarned: true,
        language: true
      }
    });

    // Calculate total study time
    const totalStudyTime = studySessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);

    // Calculate this week's study time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekStudyTime = studySessions
      .filter(session => session.startTime >= oneWeekAgo)
      .reduce((total, session) => total + (session.duration || 0), 0);

    // Get user achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.userId },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            xpReward: true
          }
        }
      },
      orderBy: { unlockedAt: 'desc' }
    });

    // Calculate level progress with improved formula
    const baseXP = 1000; // XP needed for level 1
    const currentLevelXP = (userData.level - 1) * baseXP;
    const nextLevelXP = userData.level * baseXP;
    const xpInCurrentLevel = userData.totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const levelProgress = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
    const xpToNextLevel = Math.max(0, nextLevelXP - userData.totalXP);

    // Check if user studied today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const studiedToday = userData.lastStudyDate && userData.lastStudyDate >= today;

    // Calculate weekly XP distribution - array ordenado por dia da semana
    // [Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado]
    const weeklyXP = Array(7).fill(0);
    
    // Calcular últimos 7 dias baseado em hoje
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      const dayOfWeek = dayDate.getDay(); // 0=Domingo, 1=Segunda, etc.
      
      // Somar XP de todas as sessões neste dia
      studySessions.forEach(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        
        if (sessionDate.getTime() === dayDate.getTime()) {
          weeklyXP[dayOfWeek] += session.xpEarned || 0;
        }
      });
    }

    // Calculate total completed lessons from all profiles
    const totalCompletedLessons = learningProfiles.reduce((total, profile) => {
      return total + (profile.lessonsCompleted || 0);
    }, 0);

    // Calculate average XP per day
    const daysSinceCreated = Math.max(1, Math.floor((Date.now() - userData.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const averageXPPerDay = userData.totalXP / daysSinceCreated;

    const stats = {
      // Core user stats
      level: userData.level,
      totalXP: userData.totalXP,
      currentStreak: userData.streak,
      lastStudyDate: userData.lastStudyDate,
      studiedToday,
      
      // Level progression
      levelProgress: Math.round(levelProgress),
      xpToNextLevel,
      xpInCurrentLevel: Math.max(0, xpInCurrentLevel),
      xpNeededForNextLevel,
      
      // Study statistics
      totalStudyTime: Math.round(totalStudyTime / 60), // in minutes
      thisWeekStudyTime: Math.round(thisWeekStudyTime / 60), // in minutes
      completedLessons: totalCompletedLessons,
      averageXPPerDay: Math.round(averageXPPerDay),
      totalSessions: studySessions.length,
      
      // Weekly progress
      weeklyXP,
      
      // Learning profiles
      learningProfiles: learningProfiles.map(profile => ({
        ...profile,
        studyPlan: profile.studyPlan || null
      })),
      
      // Achievements
      achievements: userAchievements.map(ua => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt
      })),
      totalAchievements: userAchievements.length,
      
      // Recent sessions
      recentSessions: studySessions.slice(0, 10).map(session => ({
        id: session.id,
        language: session.language,
        duration: Math.round((session.duration || 0) / 60), // in minutes
        xpEarned: session.xpEarned || 0,
        startTime: session.startTime,
        endTime: session.endTime,
        createdAt: session.startTime
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}