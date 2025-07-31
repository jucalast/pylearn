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

// Check if user qualifies for any new achievements
export async function checkAndUnlockAchievements(userId: string) {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        learningProfiles: true,
        studySessions: true,
        achievements: {
          include: { achievement: true }
        }
      }
    });

    if (!user) return [];

    // Get all available achievements that user hasn't unlocked yet
    const unlockedAchievementIds = user.achievements.map(ua => ua.achievementId);
    const availableAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        id: { notIn: unlockedAchievementIds }
      }
    });

    const newlyUnlocked = [];

    for (const achievement of availableAchievements) {
      let qualifies = false;

      // Parse achievement conditions
      const conditions = achievement.condition as any;

      switch (achievement.category) {
        case 'xp_milestone':
          qualifies = user.totalXP >= conditions.xpRequired;
          break;

        case 'xp':
          // Conquistas baseadas em XP total
          qualifies = user.totalXP >= conditions.value;
          break;

        case 'level':
          // Conquistas baseadas no nível
          qualifies = user.level >= conditions.value;
          break;

        case 'lesson_completion':
          const totalLessonsCompleted = user.learningProfiles.reduce(
            (sum, profile) => sum + profile.lessonsCompleted, 0
          );
          qualifies = totalLessonsCompleted >= conditions.lessonsRequired;
          break;

        case 'milestone':
          // Conquistas de marco/milestone
          if (conditions.type === 'lessons_completed') {
            const totalLessonsCompleted = user.learningProfiles.reduce(
              (sum, profile) => sum + profile.lessonsCompleted, 0
            );
            qualifies = totalLessonsCompleted >= conditions.value;
          } else if (conditions.type === 'modules_completed') {
            // Verificar módulos completados (quando currentLesson > total de lições do módulo)
            const modulesCompleted = user.learningProfiles.reduce((sum, profile) => {
              // Para simplicidade, assumir que um módulo tem ~3 lições
              return sum + Math.floor(profile.lessonsCompleted / 3);
            }, 0);
            qualifies = modulesCompleted >= conditions.value;
          }
          break;

        case 'streak':
          if (conditions.type === 'streak') {
            qualifies = user.streak >= conditions.value;
          } else if (conditions.type === 'perfect_week') {
            // Verificar se realmente teve uma semana perfeita (7 dias consecutivos)
            qualifies = user.streak >= 7;
          } else {
            qualifies = user.streak >= (conditions.streakRequired || conditions.value);
          }
          break;

        case 'language':
          // Conquistas específicas de linguagem
          if (conditions.type === 'language_lessons') {
            const languageProfile = user.learningProfiles.find(
              p => p.language === conditions.language
            );
            qualifies = !!(languageProfile && languageProfile.lessonsCompleted >= conditions.value);
          }
          break;

        case 'time':
          // Conquistas baseadas em tempo de estudo
          const totalStudyTime = user.studySessions.reduce(
            (sum, session) => sum + (session.duration || 0), 0
          );
          if (conditions.type === 'study_time_minutes') {
            const minutesStudied = totalStudyTime / 60; // Convert to minutes
            qualifies = minutesStudied >= conditions.value;
          } else if (conditions.type === 'daily_minutes') {
            // Verificar se teve um dia com X minutos de estudo
            const sessionsToday = user.studySessions.filter(s => {
              const today = new Date();
              const sessionDate = new Date(s.startTime);
              return sessionDate.toDateString() === today.toDateString();
            });
            const todayMinutes = sessionsToday.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
            qualifies = todayMinutes >= conditions.value;
          }
          break;

        case 'special':
          // Conquistas especiais
          if (conditions.type === 'excellent_lesson') {
            // Verificar se teve pelo menos uma lição com compreensão excelente
            // Por simplicidade, verificar se completou pelo menos uma lição
            qualifies = user.learningProfiles.some(p => p.lessonsCompleted > 0);
          } else if (conditions.type === 'early_study') {
            // Madrugador: verificar se estudou antes das 8:00
            qualifies = user.studySessions.some(session => {
              const hour = new Date(session.startTime).getHours();
              return hour < 8;
            });
          } else if (conditions.type === 'late_study') {
            // Coruja Noturna: verificar se estudou depois das 22:00
            qualifies = user.studySessions.some(session => {
              const hour = new Date(session.startTime).getHours();
              return hour >= 22;
            });
          }
          break;

        case 'language_mastery':
          const languageProfileMastery = user.learningProfiles.find(
            p => p.language === conditions.language
          );
          qualifies = !!(languageProfileMastery && 
                        languageProfileMastery.progressPercentage >= conditions.progressRequired);
          break;

        case 'study_time':
          const totalStudyTimeHours = user.studySessions.reduce(
            (sum, session) => sum + (session.duration || 0), 0
          );
          const hoursStudied = totalStudyTimeHours / 3600; // Convert to hours
          qualifies = hoursStudied >= conditions.hoursRequired;
          break;

        case 'speed_learner':
          // Check if user completed lessons quickly
          const recentSessions = user.studySessions
            .filter(s => s.startTime >= new Date(Date.now() - 24 * 60 * 60 * 1000))
            .length;
          qualifies = recentSessions >= conditions.sessionsInDay;
          break;

        default:
          qualifies = false;
      }

      if (qualifies) {
        // Unlock achievement
        await prisma.userAchievement.create({
          data: {
            userId: userId,
            achievementId: achievement.id,
            unlockedAt: new Date()
          }
        });

        // Award XP
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalXP: { increment: achievement.xpReward }
          }
        });

        newlyUnlocked.push(achievement);
      }
    }

    // Update user level based on new XP
    if (newlyUnlocked.length > 0) {
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (updatedUser) {
        const newLevel = Math.floor(updatedUser.totalXP / 1000) + 1;
        if (newLevel > updatedUser.level) {
          await prisma.user.update({
            where: { id: userId },
            data: { level: newLevel }
          });
        }
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

// GET: Get all achievements and user's progress
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.userId },
      include: { achievement: true }
    });

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null
    }));

    return NextResponse.json({
      achievements,
      totalUnlocked: userAchievements.length,
      totalAvailable: allAchievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Manually trigger achievement check (for testing or after lesson completion)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newAchievements = await checkAndUnlockAchievements(user.userId);

    return NextResponse.json({
      success: true,
      newAchievements,
      message: newAchievements.length > 0 
        ? `Parabéns! Você desbloqueou ${newAchievements.length} nova(s) conquista(s)!`
        : 'Nenhuma nova conquista desbloqueada no momento.'
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}