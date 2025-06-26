import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiTeacher } from '@/lib/ai-teacher'
import { getUserCurrentContext, updateUserProgress } from '@/lib/lesson-progress'
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
    console.log('Starting learning profile creation...')
    
    const userId = getUserFromToken(request)
    console.log('User ID obtained:', userId)
    
    const body = await request.json()
    const { language, answers } = body
    console.log('Request body:', { language, answersCount: answers?.length })

    if (!language || !answers || !Array.isArray(answers)) {
      console.error('Invalid request data:', { language, answers })
      return NextResponse.json(
        { error: 'Missing or invalid language or answers' },
        { status: 400 }
      )
    }

    console.log('Starting AI assessment...')
    // Assess knowledge level using AI
    const assessment = await aiTeacher.assessKnowledgeLevel(language, answers)
    console.log('Assessment completed:', assessment)

    console.log('Creating study plan...')
    // Create study plan based on assessment
    const studyPlan = await aiTeacher.generateStudyPlan(language, assessment.level, [])
    console.log('Study plan created:', { 
      level: assessment.level, 
      modulesCount: studyPlan?.modules?.length || 0 
    })

    console.log('Saving to database...')
    // Save learning profile
    const learningProfile = await prisma.learningProfile.create({
      data: {
        userId,
        language,
        knowledgeLevel: assessment.level,
        studyPlan: studyPlan,
        currentProgress: {
          currentModule: studyPlan?.currentModule || 1,
          currentLesson: studyPlan?.currentLesson || 1,
          completedModules: [],
          completedLessons: [],
          totalProgress: 0,
          startedAt: new Date().toISOString()
        },
        preferences: {
          assessment: assessment,
          learningStyle: 'interactive',
          estimatedDuration: studyPlan?.totalEstimatedHours || 30
        }
      }
    })
    console.log('Learning profile saved successfully:', learningProfile.id)

    return NextResponse.json({
      profile: learningProfile,
      assessment,
      studyPlan
    })
  } catch (error) {
    console.error('Learning profile creation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Retornar erro original sem modificação
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      type: 'raw_error',
      fullError: error
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    
    // Primeiro, tentar buscar contexto atual completo
    const currentContext = await getUserCurrentContext(userId)
    
    // Buscar todos os perfis de linguagem do usuário
    const profiles = await prisma.learningProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        profiles: [],
        currentContext: null 
      })
    }

    // Montar progresso detalhado para cada perfil
    const result = await Promise.all(profiles.map(async (profile) => {
      const studyPlan = profile.studyPlan as any
      const currentProgress = profile.currentProgress as any
      // Calcular progresso correto
      const progressCalc = studyPlan && currentProgress
        ? require('@/lib/lesson-progress').calculateCorrectProgress(
            studyPlan,
            currentProgress.currentModule || 1,
            currentProgress.currentLesson || 1,
            currentProgress.completedLessons || []
          )
        : {
            totalLessons: 0,
            totalCompletedLessons: 0,
            progressPercentage: 0,
            currentPosition: '0 de 0',
            moduleProgress: []
          }

      return {
        id: profile.id,
        language: profile.language,
        knowledgeLevel: profile.knowledgeLevel,
        studyPlan,
        currentProgress: {
          ...currentProgress,
          ...progressCalc
        },
        preferences: profile.preferences,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    }))

    return NextResponse.json({ 
      profiles: result,
      currentContext
    })
  } catch (error) {
    console.error('❌ [LEARNING-PROFILE-API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove uma linguagem do perfil do usuário
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { language } = await request.json()
    if (!language) {
      return NextResponse.json({ error: 'Linguagem não especificada' }, { status: 400 })
    }
    const deleted = await prisma.learningProfile.deleteMany({
      where: { userId, language }
    })
    return NextResponse.json({ deleted: deleted.count })
  } catch (error) {
    console.error('❌ [LEARNING-PROFILE-API] DELETE Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const body = await request.json()
    // Permitir atualização de qualquer campo relevante do progresso
    const {
      language,
      currentModule,
      currentLesson,
      completedLessons,
      completedModules,
      xpEarned,
      lastActivity,
      lessonCompleted,
      userUnderstanding
    } = body

    if (!language) {
      return NextResponse.json({ error: 'Linguagem não especificada' }, { status: 400 })
    }

    // Buscar perfil de linguagem
    const profile = await prisma.learningProfile.findFirst({
      where: { userId, language }
    })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Atualizar progresso detalhado
    const currentProgress = profile.currentProgress as any || {}
    const updatedProgress = {
      ...currentProgress,
      ...(currentModule !== undefined ? { currentModule } : {}),
      ...(currentLesson !== undefined ? { currentLesson } : {}),
      ...(completedLessons !== undefined ? { completedLessons } : {}),
      ...(completedModules !== undefined ? { completedModules } : {}),
      ...(xpEarned !== undefined ? { xpEarned } : {}),
      ...(lastActivity !== undefined ? { lastActivity } : { lastActivity: new Date().toISOString() }),
      ...(lessonCompleted !== undefined ? { lessonCompleted } : {}),
      ...(userUnderstanding !== undefined ? { userUnderstanding } : {})
    }

    await prisma.learningProfile.update({
      where: { id: profile.id },
      data: { currentProgress: updatedProgress, updatedAt: new Date() }
    })

    // Buscar contexto atualizado
    const updatedProfile = await prisma.learningProfile.findUnique({ where: { id: profile.id } })
    const studyPlan = updatedProfile?.studyPlan as any
    const progressCalc = studyPlan && updatedProgress
      ? require('@/lib/lesson-progress').calculateCorrectProgress(
          studyPlan,
          updatedProgress.currentModule || 1,
          updatedProgress.currentLesson || 1,
          updatedProgress.completedLessons || []
        )
      : {
          totalLessons: 0,
          totalCompletedLessons: 0,
          progressPercentage: 0,
          currentPosition: '0 de 0',
          moduleProgress: []
        }

    return NextResponse.json({
      id: updatedProfile?.id,
      language: updatedProfile?.language,
      knowledgeLevel: updatedProfile?.knowledgeLevel,
      studyPlan,
      currentProgress: {
        ...updatedProgress,
        ...progressCalc
      },
      preferences: updatedProfile?.preferences,
      createdAt: updatedProfile?.createdAt,
      updatedAt: updatedProfile?.updatedAt
    })
  } catch (error) {
    console.error('❌ [LEARNING-PROFILE-UPDATE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
