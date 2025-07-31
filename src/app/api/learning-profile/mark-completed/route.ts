import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserCurrentContext, updateUserProgress } from '@/lib/lesson-progress'
import { checkAndUnlockAchievements } from '../../achievements/route'
import jwt from 'jsonwebtoken'

function getUserFromToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('token')?.value
  
  let token = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (cookieToken) {
    token = cookieToken
  }
  
  if (!token) {
    throw new Error('No token provided')
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  return decoded.userId
}

export async function POST(request: NextRequest) {
  try {
    console.log('✅ [MARK-COMPLETED] Starting lesson completion...')
    const userId = getUserFromToken(request)
    const { module, lesson, understanding = 'good' } = await request.json()

    console.log('📋 [MARK-COMPLETED] Request data:', { 
      userId, 
      module, 
      lesson, 
      understanding 
    })

    if (!module || !lesson) {
      return NextResponse.json(
        { error: 'Module and lesson numbers are required' },
        { status: 400 }
      )
    }

    if (!['poor', 'fair', 'good', 'excellent'].includes(understanding)) {
      return NextResponse.json(
        { error: 'Invalid understanding level' },
        { status: 400 }
      )
    }

    // Obter contexto atual completo
    const userContext = await getUserCurrentContext(userId)
    
    if (!userContext) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      )
    }

    const { profile, progress, context, studyPlan } = userContext
    const existingCompletedLessons = progress.completedLessons || []

    // Verificar se a lição já foi concluída
    const isAlreadyCompleted = existingCompletedLessons.some(
      (completed: any) => completed.module === module && completed.lesson === lesson
    )

    if (isAlreadyCompleted) {
      console.log('ℹ️ [MARK-COMPLETED] Lesson already completed')
      return NextResponse.json({
        success: true,
        message: 'Lesson already completed',
        alreadyCompleted: true,
        progress: progress
      })
    }

    // Adicionar lição à lista de completadas
    const newCompletedLesson = {
      module,
      lesson,
      completedAt: new Date().toISOString(),
      understanding
    }

    const updatedCompletedLessons = [...existingCompletedLessons, newCompletedLesson]

    // Calcular próxima lição
    let nextModule = module
    let nextLesson = lesson + 1

    const currentModuleData = studyPlan.modules?.[module - 1]
    
    console.log('📊 [LESSON-LOGIC] Current module data:', {
      module,
      lesson,
      currentModuleData: currentModuleData ? {
        name: currentModuleData.name,
        totalLessons: currentModuleData.lessons?.length || 0
      } : null,
      nextLesson,
      willAdvanceModule: currentModuleData && nextLesson > (currentModuleData.lessons?.length || 0)
    })
    
    if (currentModuleData && nextLesson > (currentModuleData.lessons?.length || 0)) {
      // Passar para o próximo módulo apenas se não há mais lições no módulo atual
      nextModule = module + 1
      nextLesson = 1
      console.log('🔄 [LESSON-LOGIC] Advancing to next module:', { nextModule, nextLesson })
    } else {
      console.log('➡️ [LESSON-LOGIC] Staying in current module:', { nextModule, nextLesson })
    }

    // Calcular XP ganho baseado no nível de entendimento
    let xpPerLesson = 20; // Base XP
    
    // Bonus por nível de entendimento
    switch (understanding) {
      case 'excellent':
        xpPerLesson = 30;
        break;
      case 'good':
        xpPerLesson = 25;
        break;
      case 'fair':
        xpPerLesson = 20;
        break;
      case 'poor':
        xpPerLesson = 15;
        break;
    }

    const newLessonXP = (progress.xpEarned || 0) + xpPerLesson

    // Atualizar progresso da lição
    await updateUserProgress(userId, {
      currentModule: nextModule,
      currentLesson: nextLesson,
      completedLessons: updatedCompletedLessons,
      xpEarned: newLessonXP
    })

    // Atualizar XP total do usuário e contadores
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, level: true, streak: true, lastStudyDate: true }
    })

    if (user) {
      const newTotalXP = user.totalXP + xpPerLesson
      const newLevel = Math.floor(newTotalXP / 1000) + 1
      
      // Atualizar streak se necessário
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let newStreak = 1
      
      if (user.lastStudyDate) {
        const lastStudyDate = new Date(user.lastStudyDate)
        lastStudyDate.setHours(0, 0, 0, 0)
        
        if (lastStudyDate.getTime() === yesterday.getTime()) {
          newStreak = user.streak + 1
        } else if (lastStudyDate.getTime() === today.getTime()) {
          newStreak = user.streak
        }
      }

      // Atualizar dados do usuário
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXP: newTotalXP,
          level: newLevel,
          streak: newStreak,
          lastStudyDate: new Date()
        }
      })

      // Calcular total de lições corretamente
      const totalLessons = studyPlan.modules?.reduce((total: number, module: any) => 
        total + (module.lessons?.length || 0), 0
      ) || 0

      // Calcular progresso correto
      const correctProgress = totalLessons > 0 ? 
        Math.round((updatedCompletedLessons.length / totalLessons) * 100) : 0

      console.log('📊 [MARK-COMPLETED] Progress calculation:', {
        completedLessons: updatedCompletedLessons.length,
        totalLessons,
        progressPercentage: correctProgress,
        studyPlanTotalLessons: studyPlan.totalLessons
      })

      // Atualizar learning profile com progresso detalhado
      await prisma.learningProfile.update({
        where: { id: profile.id },
        data: {
          xp: newLessonXP,
          lessonsCompleted: updatedCompletedLessons.length,
          totalLessons: totalLessons,
          progressPercentage: correctProgress
        }
      })

      // Atualizar sessão de estudo ativa, se existir
      const activeSession = await prisma.studySession.findFirst({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          startTime: 'desc'
        }
      })

      if (activeSession) {
        const currentTime = new Date()
        const duration = Math.round((currentTime.getTime() - activeSession.startTime.getTime()) / 1000)
        
        await prisma.studySession.update({
          where: { id: activeSession.id },
          data: {
            duration,
            xpEarned: (activeSession.xpEarned || 0) + xpPerLesson,
            lessonsCompleted: (activeSession.lessonsCompleted || 0) + 1
          }
        })

        console.log('📝 [MARK-COMPLETED] Updated active study session:', {
          sessionId: activeSession.id,
          newXP: (activeSession.xpEarned || 0) + xpPerLesson,
          newLessons: (activeSession.lessonsCompleted || 0) + 1,
          duration: Math.round(duration / 60) + ' minutes'
        })
      }

      // Verificar conquistas desbloqueadas
      const newAchievements = await checkAndUnlockAchievements(userId)

      // Obter contexto atualizado
      const updatedContext = await getUserCurrentContext(userId)
      
      if (!updatedContext) {
        return NextResponse.json(
          { error: 'Could not fetch updated context' },
          { status: 500 }
        )
      }

      console.log('✅ [MARK-COMPLETED] Lesson completed successfully:', {
        xpEarned: xpPerLesson,
        totalXP: newTotalXP,
        level: newLevel,
        streak: newStreak,
        newAchievements: newAchievements.length,
        progressPercentage: updatedContext.progress.progressPercentage,
        nextModule,
        nextLesson,
        totalCompleted: updatedContext.progress.totalCompletedLessons
      })

      return NextResponse.json({
        success: true,
        message: 'Lesson marked as completed',
        gamification: {
          xpEarned: xpPerLesson,
          totalXP: newTotalXP,
          level: newLevel,
          leveledUp: newLevel > user.level,
          streak: newStreak,
          newAchievements
        },
        progress: {
          currentModule: nextModule,
          currentLesson: nextLesson,
          progressPercentage: updatedContext.progress.progressPercentage,
          xpEarned: newLessonXP,
          totalCompletedLessons: updatedContext.progress.totalCompletedLessons,
          totalLessons: updatedContext.progress.totalLessons
        }
      })
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('❌ [MARK-COMPLETED] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
