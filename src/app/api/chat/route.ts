import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiTeacher } from '@/lib/ai-teacher'
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

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  return decoded.userId
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { message, sessionId, language, level, currentTopic, codeContext } = await request.json()

    // Get user's current learning profile for context
    const learningProfile = await prisma.learningProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Get or create chat session
    let session
    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
    } else {
      session = await prisma.chatSession.create({
        data: {
          userId,
          title: message.substring(0, 50) + '...'
        },
        include: { messages: true }
      })
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message
      }
    })

    // Prepare enhanced context with conversation history
    const studyPlan = learningProfile?.studyPlan as any
    const currentProgress = learningProfile?.currentProgress as any
    
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 8 // Últimas 8 mensagens para contexto
    })

    const conversationHistory = recentMessages.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const contextWithPlan = {
      language: language || learningProfile?.language || 'Python',
      level: level || learningProfile?.knowledgeLevel || 'beginner',
      currentTopic,
      codeContext,
      studyPlan,
      currentModule: currentProgress?.currentModule,
      currentLesson: currentProgress?.currentLesson,
      userUnderstanding: currentProgress?.userUnderstanding,
      lessonCompleted: currentProgress?.lessonCompleted,
      conversationHistory
    }

    // Get AI response with enhanced context
    console.log('Calling AI teacher with context:', contextWithPlan)
    
    let aiResponse: string
    try {
      aiResponse = await aiTeacher.chatResponse(message, contextWithPlan)
      console.log('AI teacher response type:', typeof aiResponse, 'content:', aiResponse)
    } catch (aiError) {
      console.error('AI service error:', aiError)
      
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
      } else if (errorMessage.includes('SAFETY')) {
        return NextResponse.json({
          error: 'Sua mensagem foi bloqueada por filtros de segurança. Reformule sua pergunta.',
          type: 'safety_filter'
        }, { status: 400 })
      } else {
        return NextResponse.json({
          error: 'Erro no processamento da IA: ' + errorMessage,
          type: 'api_error'
        }, { status: 500 })
      }
    }

    // Verificar se a resposta é válida
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('Invalid AI response:', aiResponse)
      return NextResponse.json(
        { error: 'Resposta inválida da IA' },
        { status: 500 }
      )
    }

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse
      }
    })

    const responseData = {
      sessionId: session.id,
      message: aiResponse,  // Mudando de 'response' para 'message' para consistência
      messageId: aiMessage.id
    }
    
    console.log('Final response being sent:', responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      // Return all sessions for user
      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      })

      return NextResponse.json({ sessions })
    }

    // Return specific session with messages
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
