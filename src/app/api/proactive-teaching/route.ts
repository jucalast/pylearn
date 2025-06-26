import { NextRequest, NextResponse } from 'next/server'
import { aiTeacher } from '@/lib/ai-teacher'
import { prisma } from '@/lib/db'
import { getUserCurrentContext } from '@/lib/lesson-progress'
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
    console.log('🚀 [PROACTIVE-API] Starting request')
    
    let userId: string
    try {
      userId = getUserFromToken(request)
      console.log('👤 [PROACTIVE-API] User ID:', userId)
    } catch (authError) {
      console.error('❌ [PROACTIVE-API] Auth error:', authError)
      return NextResponse.json({ error: 'Token inválido ou ausente' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userCode, previousCode } = body
    
    console.log('🎯 [PROACTIVE-API] Action:', action)

    // Buscar contexto completo e atualizado do banco
    console.log('🔍 [PROACTIVE-API] Getting fresh context from database...')
    const userContext = await getUserCurrentContext(userId)
    
    if (!userContext) {
      console.error('❌ [PROACTIVE-API] No valid context found for user')
      return NextResponse.json({ 
        error: 'Perfil de aprendizado não encontrado ou inválido',
        type: 'profile_not_found'
      }, { status: 404 })
    }

    const { profile, progress, context, studyPlan } = userContext
    
    console.log('✅ [PROACTIVE-API] Context loaded:', {
      module: progress.currentModule,
      lesson: progress.currentLesson,
      progress: `${progress.progressPercentage}% (${progress.totalCompletedLessons}/${progress.totalLessons})`,
      lesson_name: context.lessonName
    })

    switch (action) {
      case 'start_lesson':
        try {
          console.log('🎓 [START-LESSON] Initializing lesson:', context.lessonName)
          
          // Usar contexto da lição atual
          const fullLessonContext = {
            currentModule: progress.currentModule,
            currentLesson: progress.currentLesson,
            moduleName: context.moduleName,
            lessonName: context.lessonName,
            lessonContent: context.lessonContent,
            exercise: context.exercise,
            objectives: context.objectives,
            difficulty: context.difficulty,
            progressPercentage: progress.progressPercentage,
            totalLessons: progress.totalLessons,
            completedLessons: progress.totalCompletedLessons,
            xpEarned: progress.xpEarned,
            previousLessons: context.previousLessons,
            nextLessons: context.nextLessons,
            userLanguage: profile.language,
            userLevel: profile.knowledgeLevel
          }

          console.log('📋 [START-LESSON] Full context:', {
            moduleName: fullLessonContext.moduleName,
            lessonName: fullLessonContext.lessonName,
            objectives: fullLessonContext.objectives?.length || 0,
            hasExercise: !!fullLessonContext.exercise?.description
          })

          // Gerar mensagem proativa da IA com contexto completo
          const aiResponse = await aiTeacher.startProactiveLesson(
            studyPlan,
            progress.currentModule,
            progress.currentLesson,
            userCode,
            {
              completedLessons: progress.completedLessons || [],
              totalCompletedLessons: progress.totalCompletedLessons,
              progressPercentage: progress.progressPercentage,
              mistakeCount: 0,
              helpRequests: 0
            }
          )

          console.log('✅ [START-LESSON] AI response generated successfully')

          return NextResponse.json({
            success: true,
            type: 'lesson_start',
            data: {
              chatMessage: aiResponse.chatMessage,
              codeToSet: aiResponse.codeToSet,
              lessonContext: fullLessonContext
            }
          })

        } catch (error: any) {
          console.error('❌ [START-LESSON] AI Error:', error)
          throw error
        }

      case 'monitor_code':
        try {
          if (!userCode) {
            return NextResponse.json({ success: false, error: 'Código não fornecido' })
          }

          // Monitorar mudanças no código com contexto completo
          const currentLesson = {
            name: context.lessonName,
            objectives: context.objectives || [],
            language: profile.language,
            level: profile.knowledgeLevel,
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

        } catch (error: any) {
          console.error('❌ [MONITOR-CODE] AI Error:', error)
          throw error
        }

      case 'get_next_exercise':
        try {
          // Gerar novo exercício com contexto da lição
          const exercise = await aiTeacher.generateExercise(
            context.lessonName || 'Conceitos Básicos',
            context.difficulty || profile.knowledgeLevel,
            profile.language
          )

          return NextResponse.json({
            success: true,
            type: 'next_exercise',
            data: { exercise }
          })

        } catch (error: any) {
          console.error('❌ [GET-EXERCISE] AI Error:', error)
          throw error
        }

      case 'adaptive_feedback':
        try {
          // Feedback adaptativo com base no progresso
          const feedbackContext = {
            currentModule: progress.currentModule,
            currentLesson: progress.currentLesson,
            lessonName: context.lessonName,
            progressPercentage: progress.progressPercentage,
            userLevel: profile.knowledgeLevel,
            userLanguage: profile.language,
            userCode: userCode || 'Código em desenvolvimento',
            recentActivity: 'coding'
          }

          // Atualizar última atividade no banco - usando updatedAt que existe
          await prisma.learningProfile.update({
            where: { id: profile.id },
            data: { 
              updatedAt: new Date()
            }
          })

          // Usar provideFeedback que existe
          const feedback = await aiTeacher.provideFeedback(
            userCode || 'Código em desenvolvimento',
            context.exercise?.description || 'Exercício atual',
            profile.language
          )

          return NextResponse.json({
            success: true,
            type: 'adaptive_feedback',
            data: feedback
          })

        } catch (error: any) {
          console.error('❌ [ADAPTIVE-FEEDBACK] AI Error:', error)
          throw error
        }

      default:
        return NextResponse.json({ 
          error: 'Ação não reconhecida',
          type: 'invalid_action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ [PROACTIVE-API] Unexpected error:', error)
    
    // Propagar erros da API Gemini diretamente
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        type: 'api_error'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      type: 'server_error'
    }, { status: 500 })
  }
}
