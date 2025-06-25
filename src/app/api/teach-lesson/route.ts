import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiTeacher } from '@/lib/ai-teacher'
import jwt from 'jsonwebtoken'

function getUserFromToken(request: NextRequest) {
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
    const userId = getUserFromToken(request)

    // Get user's current learning profile
    const learningProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!learningProfile) {
      return NextResponse.json(
        { error: 'Learning profile not found. Complete onboarding first.' },
        { status: 404 }
      )
    }

    const studyPlan = learningProfile.studyPlan as any
    const currentProgress = learningProfile.currentProgress as any
    
    const currentModule = currentProgress?.currentModule || 1
    const currentLesson = currentProgress?.currentLesson || 1

    // Get lesson content from AI teacher
    let lessonContent
    try {
      lessonContent = await aiTeacher.teachCurrentLesson(
        studyPlan,
        currentModule,
        currentLesson
      )
    } catch (aiError) {
      console.error('AI service error in teach lesson:', aiError)
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
      
      // Handle specific API key errors
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        return NextResponse.json({
          error: 'O serviço de IA não está configurado corretamente. Entre em contato com o administrador do sistema.',
          type: 'invalid_api_key'
        }, { status: 500 })
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({
          error: 'O limite diário do serviço de IA foi atingido. Tente novamente mais tarde.',
          type: 'quota_exceeded'
        }, { status: 429 })
      } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('overloaded')) {
        return NextResponse.json({
          error: 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.',
          type: 'service_unavailable'
        }, { status: 503 })
      } else {
        return NextResponse.json({
          error: 'Erro no processamento da IA: ' + errorMessage,
          type: 'api_error'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      lesson: lessonContent,
      progress: {
        currentModule,
        currentLesson,
        totalProgress: currentProgress?.totalProgress || 0
      },
      studyPlan: {
        title: studyPlan?.title || `Plano de Estudos - ${learningProfile.language}`,
        currentModuleName: studyPlan?.modules?.find((m: any) => m.id === currentModule)?.title || 'Módulo Atual',
        currentLessonName: studyPlan?.modules?.find((m: any) => m.id === currentModule)?.lessons?.find((l: any) => l.id === currentLesson)?.title || 'Lição Atual'
      }
    })
  } catch (error) {
    console.error('Teach lesson error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { completed } = await request.json()

    // Get user's current learning profile
    const learningProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!learningProfile) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      )
    }

    const studyPlan = learningProfile.studyPlan as any
    const currentProgress = learningProfile.currentProgress as any
    
    const currentModule = currentProgress?.currentModule || 1
    const currentLesson = currentProgress?.currentLesson || 1

    if (completed) {
      // Mark current lesson as completed and move to next
      let progression
      try {
        progression = await aiTeacher.progressToNextLesson(
          studyPlan,
          currentModule,
          currentLesson
        )
      } catch (aiError) {
        console.error('AI service error in progress lesson:', aiError)
        const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
        
        // Handle specific API key errors
        if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
          return NextResponse.json({
            error: 'O serviço de IA não está configurado corretamente. Entre em contato com o administrador do sistema.',
            type: 'invalid_api_key'
          }, { status: 500 })
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('QUOTA_EXCEEDED')) {
          return NextResponse.json({
            error: 'O limite diário do serviço de IA foi atingido. Tente novamente mais tarde.',
            type: 'quota_exceeded'
          }, { status: 429 })
        } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('overloaded')) {
          return NextResponse.json({
            error: 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.',
            type: 'service_unavailable'
          }, { status: 503 })
        } else {
          return NextResponse.json({
            error: 'Erro no processamento da IA: ' + errorMessage,
            type: 'api_error'
          }, { status: 500 })
        }
      }

      // Update progress in database
      const completedLessons = currentProgress?.completedLessons || []
      const lessonKey = `${currentModule}-${currentLesson}`
      
      if (!completedLessons.includes(lessonKey)) {
        completedLessons.push(lessonKey)
      }

      // Calculate total progress
      const totalLessons = studyPlan.modules?.reduce((total: number, module: any) => {
        return total + (module.lessons?.length || 0)
      }, 0) || 1

      const progressPercentage = Math.round((completedLessons.length / totalLessons) * 100)

      await prisma.learningProfile.update({
        where: { id: learningProfile.id },
        data: {
          currentProgress: {
            currentModule: progression.nextModule,
            currentLesson: progression.nextLesson,
            completedModules: currentProgress?.completedModules || [],
            completedLessons,
            totalProgress: progressPercentage,
            lastUpdated: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        progression,
        newProgress: {
          currentModule: progression.nextModule,
          currentLesson: progression.nextLesson,
          totalProgress: progressPercentage
        }
      })
    }

    return NextResponse.json({ message: 'No action taken' })
  } catch (error) {
    console.error('Progress lesson error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
