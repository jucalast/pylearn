import { NextRequest, NextResponse } from 'next/server'
import { aiTeacher } from '@/lib/ai-teacher'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Middleware to verify JWT token
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return decoded.userId
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Proactive Teaching API] Starting request')
    
    let userId: string
    try {
      userId = getUserFromToken(request)
      console.log('[Proactive Teaching API] User ID:', userId)
    } catch (authError) {
      console.error('[Proactive Teaching API] Auth error:', authError)
      return NextResponse.json({ error: 'Token inválido ou ausente' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userCode, previousCode } = body
    
    console.log('[Proactive Teaching] Action:', action)

    // Buscar perfil do usuário
    console.log('[Proactive Teaching API] Searching for user profile:', userId)
    const learningProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    console.log('[Proactive Teaching API] Found profile:', learningProfile ? 'Yes' : 'No')

    if (!learningProfile) {
      console.log('[Proactive Teaching API] No learning profile found for user:', userId)
      return NextResponse.json({ 
        error: 'Perfil de aprendizado não encontrado. Complete seu onboarding primeiro.',
        type: 'profile_not_found'
      }, { status: 404 })
    }

    const progress = learningProfile.currentProgress as any
    const studyPlan = learningProfile.studyPlan as any

    switch (action) {
      case 'start_lesson':
        try {
          // Iniciar lição proativa
          const lessonStart = await aiTeacher.startProactiveLesson(
            studyPlan,
            progress.currentModule || 1,
            progress.currentLesson || 1,
            userCode
          )

          return NextResponse.json({
            success: true,
            type: 'lesson_start',
            data: lessonStart
          })
        } catch (aiError) {
          console.error('AI service error in start_lesson:', aiError)
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

      case 'monitor_code':
        try {
          // Monitorar código em tempo real
          if (!userCode) {
            return NextResponse.json({ error: 'User code required for monitoring' }, { status: 400 })
          }

          const currentLesson = {
            name: studyPlan?.modules?.[progress.currentModule - 1]?.lessons?.[progress.currentLesson - 1]?.name || 'Lição Atual',
            objectives: studyPlan?.modules?.[progress.currentModule - 1]?.lessons?.[progress.currentLesson - 1]?.objectives || [],
            language: learningProfile.language,
            level: learningProfile.knowledgeLevel,
            moduleNumber: progress.currentModule,
            lessonNumber: progress.currentLesson
          }

          const monitoring = await aiTeacher.monitorUserCode(
            userCode,
            currentLesson,
            previousCode
          )

          return NextResponse.json({
            success: true,
            type: 'code_monitoring',
            data: monitoring
          })
        } catch (aiError) {
          console.error('AI service error in monitor_code:', aiError)
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

      case 'get_next_exercise':
        try {
          // Gerar próximo exercício automaticamente
          const nextExercise = await aiTeacher.generateExercise(
            studyPlan?.modules?.[progress.currentModule - 1]?.name || 'Conceitos Básicos',
            learningProfile.knowledgeLevel,
            learningProfile.language
          )

          return NextResponse.json({
            success: true,
            type: 'next_exercise',
            data: {
              exercise: nextExercise,
              lessonState: 'exercise'
            }
          })
        } catch (aiError) {
          console.error('AI service error in get_next_exercise:', aiError)
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

      case 'evaluate_understanding':
        try {
          // Avaliar compreensão do usuário
          const concepts = studyPlan?.modules?.[progress.currentModule - 1]?.lessons?.[progress.currentLesson - 1]?.objectives || ['conceitos básicos']
          
          const understanding = await aiTeacher.assessUnderstanding(
            userCode || 'Código em desenvolvimento',
            concepts
          )

          // Atualizar progresso no banco
          await prisma.learningProfile.update({
            where: { id: learningProfile.id },
            data: {
              currentProgress: {
                ...progress,
                lastUnderstanding: understanding,
                lastActivity: new Date().toISOString()
              }
            }
          })

          return NextResponse.json({
            success: true,
            type: 'understanding_evaluation',
            data: {
              understanding,
              shouldAdvance: understanding === 'good' || understanding === 'excellent',
              feedback: understanding === 'excellent' ? 'Excelente compreensão! Pronto para avançar.' :
                       understanding === 'good' ? 'Boa compreensão! Continue praticando.' :
                       understanding === 'fair' ? 'Compreensão básica. Pratique mais um pouco.' :
                       'Precisa de mais prática. Não desista!'
            }
          })
        } catch (aiError) {
          console.error('AI service error in evaluate_understanding:', aiError)
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

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[Proactive Teaching API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
