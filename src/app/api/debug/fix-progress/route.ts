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
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug endpoints only available in development' },
        { status: 403 }
      )
    }

    const userId = getUserFromToken(request)
    
    console.log('🔧 [FIX-PROGRESS] Starting progress fix for user:', userId)

    // Obter contexto atual
    const userContext = await getUserCurrentContext(userId)
    
    if (!userContext) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      )
    }

    const { profile, progress, context, studyPlan } = userContext
    const currentModule = progress.currentModule
    const currentLesson = progress.currentLesson
    const existingCompletedLessons = progress.completedLessons || []

    console.log('📊 [FIX-PROGRESS] Current state:', {
      currentModule,
      currentLesson,
      existingCompletedCount: existingCompletedLessons.length,
      existingCompleted: existingCompletedLessons.map((l: any) => `M${l.module}L${l.lesson}`)
    })

    // Gerar lista completa de lições que deveriam estar completadas
    const shouldBeCompleted: Array<{module: number, lesson: number, completedAt: string, understanding: string}> = []
    
    // Adicionar todas as lições dos módulos anteriores
    for (let m = 1; m < currentModule; m++) {
      const moduleData = studyPlan.modules?.[m - 1]
      if (moduleData?.lessons) {
        for (let l = 1; l <= moduleData.lessons.length; l++) {
          shouldBeCompleted.push({
            module: m,
            lesson: l,
            completedAt: new Date().toISOString(),
            understanding: 'good'
          })
        }
      }
    }

    // Adicionar lições anteriores do módulo atual
    for (let l = 1; l < currentLesson; l++) {
      shouldBeCompleted.push({
        module: currentModule,
        lesson: l,
        completedAt: new Date().toISOString(),
        understanding: 'good'
      })
    }

    console.log('🎯 [FIX-PROGRESS] Should be completed:', {
      count: shouldBeCompleted.length,
      lessons: shouldBeCompleted.map(l => `M${l.module}L${l.lesson}`)
    })

    // Mesclar com lições já existentes (manter as existentes, adicionar as faltantes)
    const mergedCompleted = [...existingCompletedLessons]
    
    for (const shouldComplete of shouldBeCompleted) {
      const exists = mergedCompleted.some(
        (existing: any) => existing.module === shouldComplete.module && existing.lesson === shouldComplete.lesson
      )
      
      if (!exists) {
        mergedCompleted.push(shouldComplete)
        console.log(`➕ [FIX-PROGRESS] Adding missing lesson: M${shouldComplete.module}L${shouldComplete.lesson}`)
      }
    }

    // Atualizar progresso no banco
    await updateUserProgress(userId, {
      completedLessons: mergedCompleted
    })

    // Obter contexto atualizado
    const updatedContext = await getUserCurrentContext(userId)
    
    console.log('✅ [FIX-PROGRESS] Progress fixed:', {
      before: existingCompletedLessons.length,
      after: mergedCompleted.length,
      newProgress: updatedContext?.progress.progressPercentage
    })

    return NextResponse.json({
      success: true,
      message: 'Progress fixed successfully',
      before: {
        completedLessons: existingCompletedLessons.length,
        progressPercentage: progress.progressPercentage
      },
      after: {
        completedLessons: mergedCompleted.length,
        progressPercentage: updatedContext?.progress.progressPercentage
      },
      addedLessons: shouldBeCompleted.filter(should => 
        !existingCompletedLessons.some((existing: any) => 
          existing.module === should.module && existing.lesson === should.lesson
        )
      )
    })

  } catch (error) {
    console.error('❌ [FIX-PROGRESS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
