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
    const { exerciseId, code, timeSpent } = await request.json()

    // Get exercise with solution
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Get AI feedback
    let feedback
    try {
      feedback = await aiTeacher.provideFeedback(code, exercise.description, exercise.language)
    } catch (aiError) {
      console.error('AI service error in code submission:', aiError)
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

    // Since provideFeedback returns a string, we need to create a feedback object
    // For now, we'll create a basic assessment based on code content
    const isCorrect = code.trim().length > 10 && !code.includes('TODO') && !code.includes('...')
    const score = isCorrect ? 85 : 65
    
    const feedbackObj = {
      feedback: feedback,
      suggestions: isCorrect ? 
        ['Bom trabalho! Continue praticando.'] : 
        ['Tente completar a implementação.', 'Revise os conceitos básicos.'],
      isCorrect: isCorrect,
      score: score
    }

    // Check if user has previous attempts
    const previousSubmissions = await prisma.codeSubmission.findMany({
      where: {
        userId,
        exerciseId
      }
    })

    const attempts = previousSubmissions.length + 1

    // Save submission
    const submission = await prisma.codeSubmission.create({
      data: {
        userId,
        exerciseId,
        code,
        isCorrect: feedbackObj.isCorrect,
        feedback: feedbackObj.feedback,
        score: feedbackObj.score,
        timeSpent,
        attempts
      }
    })

    return NextResponse.json({
      submission: {
        id: submission.id,
        isCorrect: submission.isCorrect,
        score: submission.score,
        attempts: submission.attempts
      },
      feedback: {
        feedback: feedbackObj.feedback,
        suggestions: feedbackObj.suggestions,
        isCorrect: feedbackObj.isCorrect,
        score: feedbackObj.score
      }
    })
  } catch (error) {
    console.error('Code submission error:', error)
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
    const exerciseId = searchParams.get('exerciseId')

    let whereClause: any = { userId }
    if (exerciseId) {
      whereClause.exerciseId = exerciseId
    }

    const submissions = await prisma.codeSubmission.findMany({
      where: whereClause,
      include: {
        exercise: {
          select: {
            title: true,
            language: true,
            level: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
