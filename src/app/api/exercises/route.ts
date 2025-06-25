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
    const { language, level, topic } = await request.json()

    // Generate exercise using AI
    let exerciseData
    try {
      exerciseData = await aiTeacher.generateExercise(language, level, topic)
    } catch (aiError) {
      console.error('AI service error in exercise generation:', aiError)
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

    // Save exercise to database
    const exercise = await prisma.exercise.create({
      data: {
        language,
        level,
        title: `${topic} - ${level}`,
        description: exerciseData,
        codeTemplate: '# Escreva seu código aqui\n',
        solution: '',
        testCases: '[]',
        hints: '[]',
        metadata: {
          topic,
          createdBy: 'ai',
          difficulty: level
        }
      }
    })

    // Return exercise without solution for user
    const { solution, ...exerciseForUser } = exercise

    return NextResponse.json({ exercise: exerciseForUser })
  } catch (error) {
    console.error('Exercise generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const level = searchParams.get('level')
    const exerciseId = searchParams.get('exerciseId')

    if (exerciseId) {
      // Get specific exercise
      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseId },
        select: {
          id: true,
          language: true,
          level: true,
          title: true,
          description: true,
          codeTemplate: true,
          testCases: true,
          hints: true,
          metadata: true
          // Exclude solution
        }
      })

      if (!exercise) {
        return NextResponse.json(
          { error: 'Exercise not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ exercise })
    }

    // Get exercises by filters
    let whereClause: any = {}
    if (language) whereClause.language = language
    if (level) whereClause.level = level

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        language: true,
        level: true,
        title: true,
        description: true,
        metadata: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Get exercises error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
