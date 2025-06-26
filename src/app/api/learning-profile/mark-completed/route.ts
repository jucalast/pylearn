import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserCurrentContext, updateUserProgress } from '@/lib/lesson-progress'
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

    // Calcular XP ganho (10 XP por lição)
    const xpPerLesson = 10
    const newXP = (progress.xpEarned || 0) + xpPerLesson

    // Atualizar progresso usando a função dedicada
    await updateUserProgress(userId, {
      currentModule: nextModule,
      currentLesson: nextLesson,
      completedLessons: updatedCompletedLessons,
      xpEarned: newXP
    })

    // Obter contexto atualizado para retornar dados corretos
    const updatedContext = await getUserCurrentContext(userId)
    
    if (!updatedContext) {
      return NextResponse.json(
        { error: 'Could not fetch updated context' },
        { status: 500 }
      )
    }

    console.log('✅ [MARK-COMPLETED] Lesson completed successfully:', {
      newXP,
      progressPercentage: updatedContext.progress.progressPercentage,
      nextModule,
      nextLesson,
      totalCompleted: updatedContext.progress.totalCompletedLessons
    })

    return NextResponse.json({
      success: true,
      message: 'Lesson marked as completed',
      progress: {
        currentModule: nextModule,
        currentLesson: nextLesson,
        progressPercentage: updatedContext.progress.progressPercentage,
        xpEarned: newXP,
        totalCompletedLessons: updatedContext.progress.totalCompletedLessons,
        totalLessons: updatedContext.progress.totalLessons
      }
    })
  } catch (error) {
    console.error('❌ [MARK-COMPLETED] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
