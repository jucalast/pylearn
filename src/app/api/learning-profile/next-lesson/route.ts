import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lessonProgressManager } from '@/lib/lesson-progress'
import jwt from 'jsonwebtoken'

function getUserFromToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  return decoded.userId
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserFromToken(request)

    console.log('Moving to next lesson for user:', userId)

    const success = await lessonProgressManager.moveToNextLesson(userId)

    if (success === false) {
      // Curso completo
      return NextResponse.json({
        courseCompleted: true,
        message: 'Congratulations! You have completed the entire course!'
      })
    } else if (success === true) {
      // Próxima lição disponível
      const lessonData = await lessonProgressManager.getCurrentLesson(userId)
      
      return NextResponse.json({
        courseCompleted: false,
        lesson: lessonData?.context,
        progress: lessonData?.progress,
        message: 'Moved to next lesson successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to move to next lesson' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error moving to next lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
