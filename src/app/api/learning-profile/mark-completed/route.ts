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
    const { understanding } = await request.json()

    console.log('Marking lesson completed for user:', userId, 'understanding:', understanding)

    if (!['poor', 'fair', 'good', 'excellent'].includes(understanding)) {
      return NextResponse.json(
        { error: 'Invalid understanding level' },
        { status: 400 }
      )
    }

    const success = await lessonProgressManager.markLessonCompleted(userId, understanding)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Lesson marked as completed'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to mark lesson as completed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error marking lesson completed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
