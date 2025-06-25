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
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Detectar tipos específicos de erro da API Gemini
    if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
      return NextResponse.json({
        error: 'A chave da API do Google Gemini AI é inválida. Por favor, configure uma chave válida.',
        type: 'api_key_invalid'
      }, { status: 401 })
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
      return NextResponse.json({
        error: 'Cota da API Google Gemini AI esgotada. Tente novamente mais tarde.',
        type: 'quota_exceeded'
      }, { status: 429 })
    }
    
    if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('overloaded')) {
      return NextResponse.json({
        error: 'O serviço Google Gemini AI está temporariamente indisponível. Tente novamente em alguns minutos.',
        type: 'service_unavailable'
      }, { status: 503 })
    }
      if (errorMessage.includes('GoogleGenerativeAI') || errorMessage.includes('generativelanguage.googleapis.com')) {
      return NextResponse.json({
        error: 'Erro na comunicação com o serviço Google Gemini AI. Verifique sua conexão de internet e tente novamente.',
        type: 'api_error'
      }, { status: 502 })
    }
    
    // Default error for any other cases
    return NextResponse.json({
      error: 'A IA está gerando uma resposta muito extensa. Isso pode acontecer ocasionalmente. Tente novamente - geralmente funciona na segunda tentativa.',
      type: 'internal_error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    let whereClause: any = { userId }
    if (language) {
      whereClause.language = language
    }

    const profiles = await prisma.learningProfile.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Get learning profiles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { currentModule, currentLesson, completedLessons, completedModules } = await request.json()

    // Find existing learning profile
    const existingProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Learning profile not found' },
        { status: 404 }
      )
    }

    // Calculate progress percentage
    const studyPlan = existingProfile.studyPlan as any
    const currentProgress = existingProfile.currentProgress as any
    const totalLessons = studyPlan.modules?.reduce((total: number, module: any) => {
      return total + (module.lessons?.length || 0)
    }, 0) || 1

    const completedCount = completedLessons?.length || 0
    const progressPercentage = Math.round((completedCount / totalLessons) * 100)

    // Update progress
    const updatedProfile = await prisma.learningProfile.update({
      where: { id: existingProfile.id },
      data: {
        currentProgress: {
          currentModule: currentModule || currentProgress?.currentModule || 1,
          currentLesson: currentLesson || currentProgress?.currentLesson || 1,
          completedModules: completedModules || currentProgress?.completedModules || [],
          completedLessons: completedLessons || currentProgress?.completedLessons || [],
          totalProgress: progressPercentage,
          lastUpdated: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      profile: updatedProfile,
      progress: progressPercentage
    })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
