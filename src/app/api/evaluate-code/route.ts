import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AITeacher } from '@/lib/ai-teacher'
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
    const { code, lessonId, chatHistory } = await request.json()

    console.log('Evaluate-code request:', { userId, lessonId: lessonId || 'NOT_PROVIDED', hasCode: !!code, historyLength: chatHistory?.length || 0 })

    if (!lessonId) {
      return NextResponse.json({ 
        error: 'ID da lição é obrigatório' 
      }, { status: 400 })
    }

    // Buscar perfil de aprendizado do usuário
    const learningProfile = await prisma.learningProfile.findFirst({
      where: { userId }
    })

    if (!learningProfile || !learningProfile.studyPlan) {
      return NextResponse.json({ 
        error: 'Perfil de aprendizado não encontrado' 
      }, { status: 404 })
    }

    const studyPlan = learningProfile.studyPlan as any
    
    // Verificar se o studyPlan tem a estrutura esperada
    if (!studyPlan || !studyPlan.lessons || !Array.isArray(studyPlan.lessons)) {
      console.error('StudyPlan structure:', studyPlan)
      return NextResponse.json({ 
        error: 'Plano de estudos mal formado. Por favor, refaça o onboarding.' 
      }, { status: 400 })
    }
    
    const lesson = studyPlan.lessons.find((l: any) => l.id === lessonId)

    if (!lesson) {
      console.error('Lesson not found. LessonId:', lessonId)
      console.error('Available lessons:', studyPlan.lessons.map((l: any) => ({ id: l.id, name: l.name })))
      
      // Tentar usar a primeira lição como fallback
      const firstLesson = studyPlan.lessons[0]
      if (firstLesson) {
        console.log('Using first lesson as fallback:', firstLesson.name || firstLesson.id)
        // Usar a primeira lição disponível
        const lesson = firstLesson
      } else {
        return NextResponse.json({ 
          error: 'Nenhuma lição encontrada no plano de estudos' 
        }, { status: 404 })
      }
    }

    const finalLesson = lesson || studyPlan.lessons[0]
    console.log('Using lesson:', finalLesson.name || finalLesson.id)

    const aiTeacher = new AITeacher()
    
    try {
      // Usar a nova função de avaliação conversacional
      const response = await aiTeacher.evaluateCodeConversational(
        code || '', 
        finalLesson, 
        learningProfile.knowledgeLevel, 
        studyPlan.language,
        chatHistory || []
      )
      
      // Salvar submissão no banco se há código para avaliar
      if (code && code.trim().length > 0) {
        await prisma.codeSubmission.create({
          data: {
            userId,
            exerciseId: lessonId, // Usando lessonId como exerciseId temporariamente
            code,
            isCorrect: response.score >= 70,
            feedback: response.message,
            score: response.score,
            timeSpent: 0, // Pode ser melhorado posteriormente
            attempts: 1
          }
        })
      }

      return NextResponse.json({ 
        success: true, 
        data: { 
          message: response.message,
          shouldAdvance: response.shouldAdvance,
          score: response.score 
        } 
      })
    } catch (aiError: any) {
      console.error('Erro na avaliação conversacional com IA:', aiError)
      
      // Retornar erro específico da IA para o frontend
      if (aiError.message?.includes('API key')) {
        return NextResponse.json({ 
          error: 'Serviço de IA indisponível: chave de API inválida. Por favor, tente novamente mais tarde.' 
        }, { status: 503 })
      } else if (aiError.message?.includes('quota')) {
        return NextResponse.json({ 
          error: 'Serviço de IA temporariamente indisponível: limite de uso excedido. Tente novamente em alguns minutos.' 
        }, { status: 503 })
      } else if (aiError.message?.includes('UNAVAILABLE')) {
        return NextResponse.json({ 
          error: 'Serviço de IA temporariamente indisponível. Por favor, tente novamente em alguns instantes.' 
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: 'Erro interno do servidor. Nossa equipe foi notificada e está trabalhando para resolver o problema.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro na avaliação conversacional:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
