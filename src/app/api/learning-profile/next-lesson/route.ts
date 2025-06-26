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
    console.log('🎯 [NEXT-LESSON] Getting next lesson...')
    const userId = getUserFromToken(request)

    // Obter contexto atual completo
    const userContext = await getUserCurrentContext(userId)

    if (!userContext) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      )
    }

    const { profile, progress, context, studyPlan } = userContext

    if (!studyPlan?.modules) {
      return NextResponse.json(
        { error: 'Invalid study plan' },
        { status: 400 }
      )
    }

    const currentModule = progress.currentModule
    const currentLesson = progress.currentLesson

    // Calcular próxima lição
    let nextModule = currentModule
    let nextLesson = currentLesson + 1

    const currentModuleData = studyPlan.modules[currentModule - 1]
    if (currentModuleData && nextLesson > currentModuleData.lessons?.length) {
      // Passar para o próximo módulo
      nextModule = currentModule + 1
      nextLesson = 1

      // Verificar se o curso foi completado
      if (nextModule > studyPlan.modules.length) {
        console.log('🎉 [NEXT-LESSON] Course completed!')
        return NextResponse.json({
          courseCompleted: true,
          message: 'Parabéns! Você completou todo o curso!'
        })
      }
    }

    // Verificar se a próxima lição existe
    const nextModuleData = studyPlan.modules[nextModule - 1]
    if (!nextModuleData || !nextModuleData.lessons || nextLesson > nextModuleData.lessons.length) {
      console.log('🎉 [NEXT-LESSON] No more lessons available')
      return NextResponse.json({
        courseCompleted: true,
        message: 'Parabéns! Você completou todo o curso!'
      })
    }

    // Atualizar progresso para a próxima lição
    await updateUserProgress(userId, {
      currentModule: nextModule,
      currentLesson: nextLesson,
      completedLessons: progress.completedLessons,
      xpEarned: progress.xpEarned
    })

    // Obter contexto atualizado
    const updatedContext = await getUserCurrentContext(userId)
    
    if (!updatedContext) {
      return NextResponse.json(
        { error: 'Could not fetch updated context' },
        { status: 500 }
      )
    }

    const nextLessonData = nextModuleData.lessons[nextLesson - 1]

    console.log('✅ [NEXT-LESSON] Moved to next lesson:', {
      nextModule,
      nextLesson,
      lessonName: nextLessonData?.name
    })

    return NextResponse.json({
      courseCompleted: false,
      lesson: {
        module: nextModule,
        lesson: nextLesson,
        moduleName: nextModuleData.name,
        lessonName: nextLessonData?.name,
        lessonContent: nextLessonData?.content,
        objectives: nextLessonData?.objectives,
        exercise: nextLessonData?.exercise
      },
      progress: {
        currentModule: nextModule,
        currentLesson: nextLesson,
        progressPercentage: updatedContext.progress.progressPercentage,
        totalCompletedLessons: updatedContext.progress.totalCompletedLessons,
        totalLessons: updatedContext.progress.totalLessons
      },
      message: 'Moved to next lesson successfully'
    })
  } catch (error) {
    console.error('❌ [NEXT-LESSON] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
